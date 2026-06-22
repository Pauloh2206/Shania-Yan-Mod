import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * Função para interagir com a API de Download de Música (YouTube)
 * @param {string} queryOrUrl - O link do YouTube ou o nome da música enviado pelo usuário
 * @returns {Promise<{success: boolean, audioBuffer?: Buffer, filename?: string, msg?: string}>}
 */
export async function downloadMusic(queryOrUrl) {
  try {
    const baseUrl = process.env.MUSIC_API_URL;
    const apiKey = process.env.MUSIC_API_KEY;

    // Detecta se o usuário enviou um link real ou apenas texto de busca
    const isUrl = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/playlist\?list=)/.test(queryOrUrl);
    
    // Define a rota certa e o corpo do JSON baseado no que o usuário digitou
    let apiUrl, requestBody;

    if (isUrl) {
      // Se for um link direto, usa a rota tradicional de URL
      apiUrl = `${baseUrl.replace(/\/$/, '')}/api/youtube/download/mp3?format=file`;
      requestBody = { url: queryOrUrl };
    } else {
      // Se for texto puro (ex: "vmz suzume"), usa a nossa nova rota inteligente de busca
      apiUrl = `${baseUrl.replace(/\/$/, '')}/api/youtube/search-download?format=file`;
      requestBody = { query: queryOrUrl };
    }

    console.log(`[Bot-API] Solicitando download para a API via rota específica: "${queryOrUrl}"`);

    // Requisição configurada para não corromper o binário
    const response = await axios.post(
      apiUrl,
      requestBody,
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer', // Crucial: diz ao Axios para tratar como dados binários brutos
      }
    );

    // Extração segura do nome do arquivo enviado pela API
    const contentDisposition = response.headers['content-disposition'];
    let filename = `audio_${Date.now()}.mp3`;

    if (contentDisposition) {
      const match = contentDisposition.match(/filename=["']?([^"'\n;]+)/);
      if (match && match[1]) {
        filename = path.basename(match[1].trim());
      }
    }

    // Criação do Buffer sem perdas
    const audioBuffer = Buffer.from(response.data);

    if (!audioBuffer || audioBuffer.length < 1000) {
      throw new Error('O arquivo retornado é muito pequeno ou inválido.');
    }

    return {
      success: true,
      audioBuffer: audioBuffer,
      filename: filename,
    };

  } catch (error) {
    console.error('[Bot-API] Erro ao conectar com a API de música:', error.message);
    
    // Se a API mandou um JSON de erro disfarçado de arquivo, tentamos ler
    if (error.response && error.response.data) {
      try {
        const textError = Buffer.from(error.response.data).toString('utf-8');
        console.error('[Bot-API] Detalhes do servidor:', textError);
      } catch (e) {}
    }

    return {
      success: false,
      msg: 'Não foi possível baixar a música no momento. Verifique os parâmetros ou se o link é válido.',
    };
  }
}