import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export const youtubeV2Module = {
    /**
     * Faz o download direto do áudio usando o yt-dlp mascarado com Deno e Stream
     * @param {string} songLink - URL do vídeo do YouTube
     */
    download: async (songLink) => {
        return new Promise((resolve) => {
            try {
                // Pega os cookies direto da raiz do seu bot
                const caminhoCookies = path.resolve('./youtube-cookies.txt');
                const userAgentCelular = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

                // Monta os argumentos separados para o spawn. IMPORTANTE: Adicionado o Deno aqui!
                const args = [
                    '--no-warnings',
                    '--js-runtimes', 'deno', // Ativa o motor JS que você instalou na VPS
                    '-f', 'bestaudio',
                    '--extract-audio',
                    '--audio-format', 'mp3',
                    '--audio-quality', '128K',
                    '--user-agent', userAgentCelular,
                    '-o', '-', // O hífen joga o áudio direto pra memória RAM, sem salvar arquivo no disco
                    songLink
                ];

                // Se o arquivo de cookies realmente existir na raiz, injeta ele na lista de argumentos
                if (fs.existsSync(caminhoCookies)) {
                    console.log(`[yt-dlp v2] Cookies localizados em: ${caminhoCookies}. Injetando no comando.`);
                    args.splice(1, 0, '--cookies', caminhoCookies);
                } else {
                    console.log(`[yt-dlp v2] AVISO: O arquivo youtube-cookies.txt NÃO foi encontrado na raiz.`);
                }

                console.log(`[yt-dlp v2] Iniciando extração via Stream com Deno para: ${songLink}`);

                // Usamos o spawn para não estourar o buffer do exec e permitir o uso do Deno estável
                const processo = spawn('yt-dlp', args);
                const chunks = [];

                // Captura os pedaços do áudio que o yt-dlp vai jogando na memória
                processo.stdout.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                // Captura possíveis erros que apareçam na saída do terminal
                processo.stderr.on('data', (data) => {
                    const msgErro = data.toString();
                    // Ignora avisos comuns, foca só se for erro crítico
                    if (msgErro.includes('ERROR:')) {
                        console.error('[yt-dlp v2 stderr]:', msgErro.trim());
                    }
                });

                processo.on('close', (code) => {
                    if (code !== 0 && chunks.length === 0) {
                        console.error(`[yt-dlp v2] O processo fechou com erro de código: ${code}`);
                        return resolve({ ok: false, msg: 'O YouTube bloqueou o servidor. Verifique ou renove seus cookies.' });
                    }

                    console.log(`[yt-dlp v2] Buffer de áudio gerado com sucesso pelo Stream!`);
                    const buffer = Buffer.concat(chunks);
                    
                    resolve({
                        ok: true,
                        buffer: buffer
                    });
                });

                processo.on('error', (err) => {
                    console.error('[yt-dlp v2] Erro fatal ao rodar o spawn:', err.message);
                    resolve({ ok: false, msg: 'Erro interno ao iniciar o motor de download.' });
                });

            } catch (error) {
                console.error('Erro geral no módulo youtube_v2:', error.message);
                resolve({ ok: false, msg: 'Erro interno no sistema de download.' });
            }
        });
    }
};
