import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export const youtubeV2Module = {
    /**
     * Faz o download direto do áudio usando o yt-dlp mascarado
     * @param {string} songLink - URL do vídeo do YouTube
     */
    download: async (songLink) => {
        return new Promise((resolve) => {
            try {
                const idUnico = Date.now();
                const tempPath = path.resolve(`./${idUnico}.mp3`);
                const caminhoCookies = path.resolve('./youtube-cookies.txt');

                // User-Agent de navegador móvel recente para passar pelos bloqueios da AWS
                const userAgentCelular = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

                // Comando focado em baixar o melhor áudio e converter direto para MP3 128k padrão
                let comando = `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 128K `;

                // Injeta os cookies se o arquivo existir na raiz
                if (fs.existsSync(caminhoCookies)) {
                    comando += `--cookies "${caminhoCookies}" `;
                }

                // Finaliza a montagem com o disfarce e o link
                comando += `--user-agent "${userAgentCelular}" -o "${tempPath}" "${songLink}"`;

                console.log(`[yt-dlp v2] Baixando áudio direto: ${songLink}`);

                exec(comando, (error, stdout, stderr) => {
                    if (error) {
                        console.error('[yt-dlp v2 Error]:', error.message);
                        return resolve({ ok: false, msg: 'O YouTube barrou o download do servidor.' });
                    }

                    if (fs.existsSync(tempPath)) {
                        const buffer = fs.readFileSync(tempPath);
                        
                        // Limpeza do arquivo temporário da máquina
                        fs.unlinkSync(tempPath);

                        resolve({
                            ok: true,
                            buffer: buffer
                        });
                    } else {
                        resolve({ ok: false, msg: 'Erro ao gerar o arquivo final de áudio.' });
                    }
                });

            } catch (error) {
                console.error('Erro geral no módulo youtube_v2:', error.message);
                resolve({ ok: false, msg: 'Erro interno no sistema de download.' });
            }
        });
    }
};