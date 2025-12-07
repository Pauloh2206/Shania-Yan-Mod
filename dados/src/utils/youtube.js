import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

const TEMP_FOLDER = path.join(process.cwd(), 'temp_downloads');

if (!fs.existsSync(TEMP_FOLDER)) {
 fs.mkdirSync(TEMP_FOLDER, { recursive: true });
}

export async function getVideoMetadata(query) {
 // Comando para buscar (ytsearch1) e obter JSON dos metadados
 const command = `yt-dlp --dump-json "ytsearch1:${query}" --no-playlist --restrict-filenames`;

 try {
 
  const { stdout } = await execPromise(command, { encoding: 'utf8', maxBuffer: 1024 * 10000 });
  const metadata = JSON.parse(stdout);

  return {
   title: metadata.title,
   author: metadata.channel,
   views: metadata.view_count ? metadata.view_count.toLocaleString('pt-BR') : 'N/A',
   duration: metadata.duration_string || 'N/A',
   url: metadata.webpage_url,
   thumbnail: metadata.thumbnail,
   seconds: metadata.duration,
   id: metadata.id
  };
 } catch (error) {
  // Trata o erro de ferramenta não encontrada
  if (error.code === 127 || String(error).includes('yt-dlp')) {
   throw new Error(`❌ Ferramenta 'yt-dlp' não encontrada. Instale no Termux.`);
  }
  console.error("Erro ao buscar metadados do YouTube:", error);
  // Lançamos um erro mais genérico
  throw new Error(`Falha ao buscar informações da música. Verifique se o termo de busca está correto.`);
 }
}

export async function downloadYoutubeMp3(videoId, title) {
 try {
 
  const timestamp = Date.now();
  const outputTemplate = path.join(TEMP_FOLDER, `${timestamp}_%(title)s.%(ext)s`);

  const command = `yt-dlp ${videoId} -x --audio-format mp3 --audio-quality 96K --output "${outputTemplate}" --restrict-filenames`;

  await execPromise(command);

  const files = fs.readdirSync(TEMP_FOLDER);
  const downloadedFile = files.find(file => file.startsWith(`${timestamp}_`) && file.endsWith('.mp3'));

  if (!downloadedFile) {
 
   throw new Error('Arquivo MP3 não encontrado após a conversão. Verifique se a ferramenta FFmpeg está instalada e configurada corretamente.');
  }

  return path.join(TEMP_FOLDER, downloadedFile);

 } catch (error) {
  console.error("Erro no download de MP3:", error);
  throw new Error('Falha ao baixar e converter a música.');
 }
}