import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);
const TEMP_FOLDER = path.join(process.cwd(), 'temp_downloads');
const COOKIES_FILE = path.join(process.cwd(), 'youtube-cookies.txt');

if (!fs.existsSync(TEMP_FOLDER)) {
    fs.mkdirSync(TEMP_FOLDER, { recursive: true });
}

// Função auxiliar para garantir a formatação correta dos cookies no Termux/VPS
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
        console.error("[Utilitário de Vídeo] Falha ao corrigir formato dos cookies:", e.message);
    }
}

/**
 * DOWNLOAD DE VÍDEO BLINDADO E AUTENTICADO
 * Otimizado para VPS e Termux, usando cookies para evitar bloqueios "Sign in".
 */
export async function downloadYoutubeMp4_Fast(videoUrl) {
    try {
        const timestamp = Date.now();
        const fileName = path.join(TEMP_FOLDER, `${timestamp}_fast.mp4`);

        // Detecta e injeta os cookies automaticamente se o arquivo existir
        let cookiesParam = '';
        if (fs.existsSync(COOKIES_FILE)) {
            fixCookiesFormat(COOKIES_FILE);
            cookiesParam = `--cookies "${COOKIES_FILE}"`;
            console.log("[Utilitário de Vídeo] Cookies do YouTube injetados com sucesso.");
        } else {
            console.warn("[Utilitário de Vídeo] Aviso: youtube-cookies.txt não encontrado. Tentando sem cookies...");
        }

        /**
         * ESTRATÉGIA ATUALIZADA:
         * 1. Usa os cookies logados para passar pelo bloqueio de robô.
         * 2. Mantém o decifrador de algoritmos JS ativo (--js-runtimes node).
         * 3. Limita a qualidade em até 720p para o download ser rápido e não sobrecarregar o WhatsApp.
         */
        const command = `yt-dlp \
            ${cookiesParam} \
            --no-warnings \
            --js-runtimes node \
            --remote-components ejs:github \
            -f "best[height<=720][ext=mp4]/best[ext=mp4]/best" \
            --output "${fileName}" \
            --restrict-filenames \
            "${videoUrl}"`;

        // Timeout de 90 segundos para vídeos maiores não travarem o bot em conexões oscilantes
        await execPromise(command, { 
            maxBuffer: 1024 * 1024 * 100, // 100MB de buffer para aguentar o download de vídeos grandes
            timeout: 90000 
        }); 

        if (!fs.existsSync(fileName)) {
            throw new Error("Erro: Arquivo MP4 não foi gerado após o download.");
        }

        // Exibe no terminal o tamanho do vídeo baixado
        const stats = fs.statSync(fileName);
        console.log(`[Utilitário de Vídeo] Download concluído! Tamanho: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

        return fileName;
    } catch (error) {
        console.error("ERRO NO UTILITÁRIO FAST (VÍDEO):", error.message);
        throw error;
    }
}
