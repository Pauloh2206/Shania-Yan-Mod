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
 * MODO ULTRA FAST: Otimizado para arquivos grandes e conexões instáveis.
 * Evita resoluções exageradas que causariam queda de rede.
 */
export async function downloadYoutubeMp4_Fast(videoUrl) {
    try {
        const timestamp = Date.now();
        const fileName = path.join(TEMP_FOLDER, `${timestamp}_fast.mp4`);

        // Explicação do comando:
        // 'best[height<=720][ext=mp4]' -> Garante que o vídeo não passe de 720p (HD),
        // mantendo o tamanho do arquivo equilibrado para o seu limite de 100MB.
        const command = `yt-dlp -f "best[height<=720][ext=mp4]/best[ext=mp4]/best" --output "${fileName}" --restrict-filenames "${videoUrl}"`;

        await execPromise(command, { maxBuffer: 1024 * 1024 * 100 }); // Buffer de 100MB para o processo

        if (!fs.existsSync(fileName)) throw new Error("Erro: Arquivo não encontrado após download.");

        return fileName;
    } catch (error) {
        console.error("ERRO NO UTILITÁRIO FAST:", error);
        throw error;
    }
}