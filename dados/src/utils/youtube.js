import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);
const TEMP_FOLDER = path.join(process.cwd(), 'temp_downloads');

if (!fs.existsSync(TEMP_FOLDER)) {
    fs.mkdirSync(TEMP_FOLDER, { recursive: true });
}

/**
 * BUSCA DE METADADOS (Original que você enviou)
 * Garante que a busca seja precisa e retorne a música correta.
 */
export async function getVideoMetadata(query) {
    const command = `yt-dlp --dump-json "ytsearch1:${query}" --no-playlist --restrict-filenames`;

    try {
        const { stdout } = await execPromise(command, { encoding: 'utf8', maxBuffer: 1024 * 10000 });
        const metadata = JSON.parse(stdout);

        return {
            title: metadata.title,
            author: metadata.channel,
            views: metadata.view_count ? metadata.view_count.toLocaleString('pt-BR') : 'N/A',
            duration: metadata.duration_string || 'N/A',
            url: metadata.webpage_url,
            thumbnail: metadata.thumbnail,
            seconds: metadata.duration,
            id: metadata.id
        };
    } catch (error) {
        if (error.code === 127 || String(error).includes('yt-dlp')) {
            throw new Error(`❌ yt-dlp não encontrado.`);
        }
        throw new Error(`Falha ao buscar informações da música.`);
    }
}

/**
 * DOWNLOAD ULTRA RÁPIDO (Sem conversão FFmpeg)
 * Baixa o áudio nativo M4A, evitando que o bot trave ou demore convertendo.
 */
export async function downloadYoutubeM4A_Fast(videoUrl) {
    try {
        const timestamp = Date.now();
        const fileName = path.join(TEMP_FOLDER, `${timestamp}_audio.m4a`);

        // Baixa o melhor áudio disponível em formato M4A pronto para envio
        const command = `yt-dlp -f "bestaudio[ext=m4a]" --output "${fileName}" --restrict-filenames "${videoUrl}"`;

        await execPromise(command);

        if (!fs.existsSync(fileName)) {
            throw new Error('Arquivo não encontrado após o download.');
        }

        return fileName;
    } catch (error) {
        console.error("Erro no download de áudio:", error);
        throw new Error('Falha ao baixar a música no modo rápido.');
    }
}