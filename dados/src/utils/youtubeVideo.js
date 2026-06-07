import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);
const TEMP_FOLDER = path.join(process.cwd(), 'temp_downloads');
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
        console.error("[Utilitário de Vídeo] Erro ao formatar cookies:", e.message);
    }
}

export async function downloadYoutubeMp4_Fast(videoUrl) {
    try {
        const timestamp = Date.now();
        const fileName = path.join(TEMP_FOLDER, `${timestamp}_fast.mp4`);

        let cookiesParam = '';
        if (fs.existsSync(COOKIES_FILE)) {
            fixCookiesFormat(COOKIES_FILE);
            cookiesParam = `--cookies "${COOKIES_FILE}"`;
        }

        /**
         * MOTOR DE VÍDEO BLINDADO PARA VPS (AWS/UBUNTU)
         * - extractor-args sincronizado idêntico ao de áudio para manter consistência na AWS
         * - Limite de 720p para garantir velocidade de download e envio estável no WhatsApp
         */
        const command = `yt-dlp \
            ${cookiesParam} \
            --no-warnings \
            --js-runtimes "node:${process.execPath}" \
            --remote-components ejs:github \
            --extractor-args "youtube:player_client=android_embedded,web" \
            -f "best[height<=720][ext=mp4]/best[ext=mp4]/best" \
            --output "${fileName}" \
            --restrict-filenames \
            "${videoUrl}"`;

        await execPromise(command, { 
            maxBuffer: 1024 * 1024 * 100, 
            timeout: 90000 
        }); 

        if (!fs.existsSync(fileName)) {
            throw new Error("Erro: Arquivo MP4 não foi encontrado após download.");
        }

        return fileName;
    } catch (error) {
        console.error("ERRO NO UTILITÁRIO FAST (VÍDEO):", error.message);
        throw error;
    }
}
