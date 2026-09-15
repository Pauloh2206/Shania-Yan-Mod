import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

function findDownloader() {
    const candidates = [
        { command: 'yt-dlp', prefix: [] },
        { command: 'python', prefix: ['-m', 'yt_dlp'] },
        { command: 'python3', prefix: ['-m', 'yt_dlp'] }
    ];

    for (const candidate of candidates) {
        try {
            const result = spawnSync(candidate.command, [...candidate.prefix, '--version'], {
                stdio: 'ignore',
                timeout: 5000
            });
            if (result.status === 0) return candidate;
        } catch {
            // Tenta o próximo executável.
        }
    }

    return null;
}

function safeFileName(value) {
    return String(value || 'audio')
        .replace(/[\\/:*?"<>|\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100) || 'audio';
}

export const youtubeV2Module = {
    /**
     * Baixa áudio do YouTube sem cookies, sem Deno e sem playlist.
     * Requer yt-dlp e ffmpeg. No Termux:
     * pkg install python ffmpeg
     * pip install -U yt-dlp
     */
    download: async (songLink, title = 'audio') => {
        const downloader = findDownloader();
        if (!downloader) {
            return {
                ok: false,
                msg: 'yt-dlp não está instalado. No Termux, execute: pkg install python ffmpeg && pip install -U yt-dlp'
            };
        }

        const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'shania-youtube-'));
        const outputPath = path.join(tempDir, `${safeFileName(title)}.%(ext)s`);
        const args = [
            ...downloader.prefix,
            '--no-playlist',
            '--no-cache-dir',
            '--no-check-certificates',
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '128K',
            '--no-progress',
            '--newline',
            '-o', outputPath,
            songLink
        ];

        return new Promise((resolve) => {
            let settled = false;
            let stderr = '';
            const finish = async (result) => {
                if (settled) return;
                settled = true;
                try {
                    const files = await fsp.readdir(tempDir);
                    const audioFile = files.find(file => /\.(mp3|m4a|webm|opus|ogg)$/i.test(file));
                    if (result.ok && audioFile) {
                        const buffer = await fsp.readFile(path.join(tempDir, audioFile));
                        resolve({ ok: true, buffer });
                    } else {
                        resolve(result);
                    }
                } catch (error) {
                    resolve({ ok: false, msg: `Não consegui ler o áudio baixado: ${error.message}` });
                } finally {
                    await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
                }
            };

            let processo;
            try {
                console.log(`[yt-dlp] Baixando sem cookies: ${songLink}`);
                processo = spawn(downloader.command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
            } catch (error) {
                finish({ ok: false, msg: `Não consegui iniciar o yt-dlp: ${error.message}` });
                return;
            }

            processo.stderr.on('data', (data) => {
                stderr += data.toString();
                if (stderr.length > 4000) stderr = stderr.slice(-4000);
            });

            processo.once('error', (error) => {
                const detail = error.code === 'ENOENT'
                    ? 'yt-dlp não foi encontrado. Instale com: pkg install python ffmpeg && pip install -U yt-dlp'
                    : `Falha ao iniciar o download: ${error.message}`;
                finish({ ok: false, msg: detail });
            });

            processo.once('close', (code) => {
                if (code === 0) {
                    finish({ ok: true });
                } else {
                    const lower = stderr.toLowerCase();
                    const reason = lower.includes('sign in') || lower.includes('bot')
                        ? 'O YouTube recusou esta solicitação sem login.'
                        : 'O yt-dlp não conseguiu baixar este vídeo.';
                    console.error(`[yt-dlp] código ${code}: ${stderr.trim()}`);
                    finish({ ok: false, msg: `${reason} Tente outro vídeo.` });
                }
            });
        });
    }
};