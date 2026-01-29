import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);
const TEMP_FOLDER = path.join(process.cwd(), 'temp_downloads');

if (!fs.existsSync(TEMP_FOLDER)) {
    fs.mkdirSync(TEMP_FOLDER, { recursive: true });
}

export async function downloadYoutubeM4A_Fast(videoUrl) {
    try {
        const timestamp = Date.now();
        const fileName = path.join(TEMP_FOLDER, `${timestamp}_audio.m4a`);

        /**
         * AJUSTE DEFINITIVO:
         * 1. --remote-components ejs:github -> Baixa scripts para resolver o erro de "Signature solving failed".
         * 2. --js-runtimes node -> Usa o Node v22 para processar os desafios.
         * 3. Mudamos o player_client para usar 'tv' e 'web_embedded', que são os que MENOS pedem PO-Token.
         */
        const command = `yt-dlp \
            --js-runtimes node \
            --remote-components ejs:github \
            --extractor-args "youtube:player_client=tv,web_embedded;player_skip=web,android,ios,mweb" \
            -f "ba[ext=m4a]/ba" \
            --output "${fileName}" \
            --restrict-filenames \
            "${videoUrl}"`;

        await execPromise(command, { maxBuffer: 1024 * 1024 * 50 });

        if (!fs.existsSync(fileName)) {
            throw new Error('Arquivo não encontrado.');
        }

        return fileName;
    } catch (error) {
        console.error("Erro no utilitário de áudio:", error.message);
        throw error;
    }
}