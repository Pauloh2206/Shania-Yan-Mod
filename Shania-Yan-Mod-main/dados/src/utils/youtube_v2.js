import { exec } from 'child_process';
import fs from 'fs';

export async function downloadMp3V2(url, outputPath, bitrate) {
    return new Promise((resolve, reject) => {
        // Explicação das novas flags de velocidade:
        // --no-playlist: Ignora processamento de listas (ganha 1-2 segundos)
        // --no-check-certificate: Pula verificações de segurança (ganha tempo de conexão)
        // -f "ba": Escolhe o melhor áudio disponível instantaneamente
        // -acodec libmp3lame: Codec ultra-otimizado
        const command = `yt-dlp --no-playlist --no-check-certificate -f "ba" -o - "${url}" | ffmpeg -i pipe:0 -vn -acodec libmp3lame -ab ${bitrate} -preset ultrafast -threads 0 -f mp3 "${outputPath}"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`[ERRO]: ${stderr}`);
                return reject(error);
            }
            resolve(outputPath);
        });
    });
}