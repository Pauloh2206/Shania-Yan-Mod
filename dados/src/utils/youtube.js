import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const TEMP_FOLDER = path.join(process.cwd(), 'temp_downloads');
// Força o caminho absoluto completo para o processo do PM2 não se perder na VPS
const COOKIES_FILE = path.resolve(process.cwd(), 'youtube-cookies.txt');

if (!fs.existsSync(TEMP_FOLDER)) {
    fs.mkdirSync(TEMP_FOLDER, { recursive: true });
}

function fixCookiesFormat(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let lines = content.split(/\r?\n/);
        let fixedLines = lines.map(line => {
            if (!line.trim() || line.startsWith('#')) return line;
            return line.replace(/\s+/g, '\t');
        });
        let newContent = fixedLines.join('\n');
        if (!newContent.startsWith('# Netscape HTTP Cookie File')) {
            newContent = '# Netscape HTTP Cookie File\n' + newContent;
        }
        fs.writeFileSync(filePath, newContent, 'utf8');
    } catch (e) {
        console.error("[Utilitário de Áudio] Erro ao formatar cookies:", e.message);
    }
}

export async function downloadYoutubeM4A_Fast(videoUrl) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const outputPath = path.join(TEMP_FOLDER, `${timestamp}_audio.mp3`);

        let cookiesParam = '';
        if (fs.existsSync(COOKIES_FILE)) {
            fixCookiesFormat(COOKIES_FILE);
            cookiesParam = `--cookies "${COOKIES_FILE}"`;
        }

        /**
         * MOTOR DE ÁUDIO BLINDADO PARA VPS (AWS/UBUNTU)
         * - extractor-args modificado para android_embedded,web (bula a trava de IP da VPS)
         * - js-runtimes amarrado ao process.execPath (evita erro de falta de runtime JS)
         */
        const command = `yt-dlp ${cookiesParam} --no-playlist --no-check-certificate --js-runtimes "node:${process.execPath}" --remote-components ejs:github --extractor-args "youtube:player_client=android_embedded,web" -f "ba" -o - "${videoUrl}" | ffmpeg -i pipe:0 -vn -acodec libmp3lame -ab 128k -preset ultrafast -threads 0 -f mp3 "${outputPath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`[Utilitário de Áudio ERRO]: ${stderr}`);
                return reject(error);
            }

            if (!fs.existsSync(outputPath)) {
                return reject(new Error('Arquivo mp3 não foi gerado pelo FFmpeg.'));
            }

            resolve(outputPath);
        });
    });
}
