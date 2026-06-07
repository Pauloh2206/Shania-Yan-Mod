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
 * DOWNLOAD DE VÍDEO BLINDADO
 * Otimizado para VPS e Termux, ignorando bloqueios 403.
 */
export async function downloadYoutubeMp4_Fast(videoUrl) {
    try {
        const timestamp = Date.now();
        const fileName = path.join(TEMP_FOLDER, `${timestamp}_fast.mp4`);

        // A MÁGICA ESTÁ AQUI:
        // 1. --js-runtimes node: Resolve a assinatura JS.
        // 2. --remote-components ejs:github: Baixa o decifrador de algoritmos.
        // 3. player_client=tv: O único que não pede PO-Token (GVS) na VPS.
        const command = `yt-dlp \
            --js-runtimes node \
            --remote-components ejs:github \
            --extractor-args "youtube:player_client=tv,web_embedded;player_skip=web,android,ios,mweb" \
            -f "best[height<=720][ext=mp4]/best[ext=mp4]/best" \
            --output "${fileName}" \
            --restrict-filenames \
            "${videoUrl}"`;

        await execPromise(command, { maxBuffer: 1024 * 1024 * 100 }); 

        if (!fs.existsSync(fileName)) throw new Error("Erro: Arquivo não encontrado após download.");

        return fileName;
    } catch (error) {
        console.error("ERRO NO UTILITÁRIO FAST (VÍDEO):", error.message);
        throw error;
    }
}