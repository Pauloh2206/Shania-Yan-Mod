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
 * DOWNLOAD ULTRA RÁPIDO (Apenas Áudio)
 * Baixa o áudio nativo M4A. É o formato que o WhatsApp mais gosta.
 */
export async function downloadYoutubeM4A_Fast(videoUrl) {
    try {
        const timestamp = Date.now();
        const fileName = path.join(TEMP_FOLDER, `${timestamp}_audio.m4a`);

        // 'bestaudio[ext=m4a]' garante que não haverá conversão pesada de CPU, 
        // ele apenas baixa o fluxo de áudio já pronto do YouTube.
        const command = `yt-dlp -f "bestaudio[ext=m4a]/bestaudio" --output "${fileName}" --restrict-filenames "${videoUrl}"`;

        await execPromise(command, { maxBuffer: 1024 * 1024 * 50 }); // Buffer de 50MB

        if (!fs.existsSync(fileName)) {
            throw new Error('Arquivo não encontrado após o download.');
        }

        return fileName;
    } catch (error) {
        console.error("Erro no utilitário de áudio:", error);
        throw error;
    }
}