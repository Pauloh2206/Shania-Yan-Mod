import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Define a pasta temporária para downloads dentro do diretório de trabalho atual
const TEMP_FOLDER = path.join(process.cwd(), 'temp_downloads');

// Garante que a pasta temporária existe
if (!fs.existsSync(TEMP_FOLDER)) {
 fs.mkdirSync(TEMP_FOLDER, { recursive: true });
}

/**
* Busca e retorna metadados (título, autor, thumbnail, duração, views) do primeiro resultado do YouTube.
* Usa o comando yt-dlp --dump-json.
* @param {string} query O termo de busca ou URL do YouTube.
* @returns {Promise<object>} Um objeto contendo os metadados do vídeo.
*/
export async function getVideoMetadata(query) {
 // Comando para buscar (ytsearch1) e obter JSON dos metadados
 const command = `yt-dlp --dump-json "ytsearch1:${query}" --no-playlist --restrict-filenames`;

 try {
  // Aumentamos o maxBuffer para 10MB (1024 * 10000) para evitar o erro RangeError
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

/**
* Procura um áudio no YouTube, baixa e converte para MP3 em qualidade 96K.
*
* @param {string} videoId O ID do vídeo a ser baixado (para precisão).
* @param {string} title O título do vídeo para nomear o arquivo.
* @returns {Promise<string>} O caminho completo para o arquivo MP3 gerado.
*/
export async function downloadYoutubeMp3(videoId, title) {
 try {
  // Usamos o timestamp para garantir que o nome de arquivo gerado pelo yt-dlp
  // seja único e facilmente identificável no diretório após a conversão.
  const timestamp = Date.now();
  const outputTemplate = path.join(TEMP_FOLDER, `${timestamp}_%(title)s.%(ext)s`);

  // COMANDO CORRIGIDO: Removemos --print filename para garantir que o yt-dlp
  // conclua a conversão para MP3 antes de continuarmos. Qualidade é 96K.
  const command = `yt-dlp ${videoId} -x --audio-format mp3 --audio-quality 96K --output "${outputTemplate}" --restrict-filenames`;

  // Executa o download e a conversão.
  await execPromise(command);

  // --- LÓGICA ROBUSTA DE BUSCA RESTAURADA ---
  // Após a conversão, buscamos o arquivo que começa com o nosso timestamp e termina com .mp3
  const files = fs.readdirSync(TEMP_FOLDER);
  const downloadedFile = files.find(file => file.startsWith(`${timestamp}_`) && file.endsWith('.mp3'));

  if (!downloadedFile) {
   // Se não encontrar, geralmente é porque o FFmpeg não está instalado (pois a conversão falhou)
   throw new Error('Arquivo MP3 não encontrado após a conversão. Verifique se a ferramenta FFmpeg está instalada e configurada corretamente.');
  }

  return path.join(TEMP_FOLDER, downloadedFile);

 } catch (error) {
  console.error("Erro no download de MP3:", error);
  throw new Error('Falha ao baixar e converter a música.');
 }
}