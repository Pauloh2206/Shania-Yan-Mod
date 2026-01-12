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
 * DOWNLOAD COM SISTEMA DE FALLBACK E ANTI-BLOQUEIO
 */
export async function downloadYoutubeM4A_Fast(videoUrl) {
    const timestamp = Date.now();
    const baseFileName = path.join(TEMP_FOLDER, `${timestamp}_audio`);
    
    // Lista de formatos para tentar (mesma lógica que funcionou no seu Replit)
    const formats = [
        { format: 'bestaudio[ext=m4a]', ext: '.m4a' },
        { format: 'bestaudio[ext=mp4]', ext: '.mp4' },
        { format: 'bestaudio', ext: '.m4a' },
        { format: 'best', ext: '.m4a' }
    ];

    for (const { format, ext } of formats) {
        try {
            const fileName = `${baseFileName}${ext}`;
            
            // ADICIONADO: --extractor-args para fingir ser Android (burla o erro de "Sign in")
            // ADICIONADO: --js-runtimes node para usar o Node como motor JS
            const command = `yt-dlp -f "${format}" \
                --extractor-args "youtube:player_client=android,web" \
                --js-runtimes node \
                --output "${fileName}" \
                --restrict-filenames "${videoUrl}"`;

            console.log(`Tentando baixar formato: ${format}...`);
            await execPromise(command, { maxBuffer: 1024 * 1024 * 50 });

            if (fs.existsSync(fileName)) {
                console.log(`✅ Sucesso com formato: ${format}`);
                return fileName;
            }
        } catch (error) {
            console.warn(`⚠️ Falha no formato ${format}, tentando próximo...`);
            // Continua para a próxima tentativa do loop
        }
    }

    console.error("❌ Todos os formatos falharam.");
    throw new Error('Não foi possível baixar o áudio. O YouTube pode ter bloqueado este servidor temporariamente.');
}