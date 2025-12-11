import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Definição da constante TEMP_FOLDER
const TEMP_FOLDER = path.join(process.cwd(), 'temp_downloads');

// Criação da pasta (Garante que o diretório existe)
if (!fs.existsSync(TEMP_FOLDER)) {
 fs.mkdirSync(TEMP_FOLDER, { recursive: true });
}

export async function downloadYoutubeMp4_480p(videoId, title) {
 try {
 
  const timestamp = Date.now();
  const outputTemplate = path.join(TEMP_FOLDER, `${timestamp}_%(title)s.%(ext)s`);

  // COMANDO CORRIGIDO:
  // Usa "bestvideo[height<=480]+bestaudio/best" e adiciona postprocessor-args
  // para forçar a codificação H.264 (libx264) no FFmpeg, que é mais compatível.
  const command = `yt-dlp -f "bestvideo[height<=480]+bestaudio/best" ${videoId} --merge-output-format mp4 --postprocessor-args "-vcodec libx264" --output "${outputTemplate}" --restrict-filenames`;

  // Executa o comando e captura stderr
  const { stderr } = await execPromise(command, { maxBuffer: 1024 * 1024 * 10 });

  // Encontra o arquivo baixado
  const files = fs.readdirSync(TEMP_FOLDER);
  const downloadedFile = files.find(file => file.startsWith(`${timestamp}_`) && file.endsWith('.mp4'));

  if (!downloadedFile) {
   const details = stderr ? `Detalhes do erro: ${stderr.trim().substring(0, 500)}` : 'O arquivo final não foi gerado. Verifique a instalação do FFmpeg.';
   throw new Error(`Arquivo MP4 480p não encontrado. ${details}`);
  }

  return path.join(TEMP_FOLDER, downloadedFile);

 } catch (error) {
  // --- LANÇA O ERRO DETALHADO ---
  console.error("ERRO COMPLETO DE EXECUÇÃO DO YTDL (480P):", error);
  
  const details = error.stderr || error.message; 
  
  if (details.includes('ffmpeg') || details.includes('FFmpeg') || details.includes('avconv') || details.includes('libx264')) {
      // Se houver erro relacionado ao codec ou FFmpeg, informa ao usuário
      throw new Error(`Falha no yt-dlp. Possível erro de codec (libx264 não suportado) ou FFmpeg. Instale com: pkg install ffmpeg`);
  }
  
  throw new Error(`Falha ao baixar e converter o vídeo em 480p. Erro detalhado: ${details.substring(0, 250)}`);
 }
}