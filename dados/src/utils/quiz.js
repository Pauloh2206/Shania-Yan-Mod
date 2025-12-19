import axios from 'axios';

/**
 * Função para limpar caracteres estranhos que vêm da API (HTML Entities)
 */
function limparTexto(text) {
    return text
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&deg;/g, "°");
}

/**
 * Traduz o texto usando a API livre do Google
 */
async function traduzirSimples(text) {
    try {
        const url = 'https://translate.googleapis.com/translate_a/single';
        const response = await axios.get(url, {
            params: { client: 'gtx', sl: 'en', tl: 'pt', dt: 't', q: text }
        });
        return limparTexto(response.data[0][0][0]);
    } catch (e) {
        return limparTexto(text); // Se falhar a tradução, retorna o original limpo
    }
}

/**
 * Busca uma pergunta na Open Trivia DB e traduz para PT-BR
 */
export async function getQuizIA() {
    try {
        // Busca pergunta de conhecimentos gerais (Fácil/Médio) na API gringa
        const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple&difficulty=easy');
        const data = response.data;
        
        if (data.response_code !== 0) return null;

        const raw = data.results[0];
        
        // Organiza as opções e sorteia a posição (Shuffling)
        const incorretas = raw.incorrect_answers;
        const corretaOriginal = raw.correct_answer;
        const todasOpcoes = [...incorretas, corretaOriginal].sort(() => Math.random() - 0.5);

        // Traduz a Pergunta
        const perguntaPt = await traduzirSimples(raw.question);
        
        // Traduz cada opção individualmente
        const opcoesPt = [];
        const letras = ['A', 'B', 'C', 'D'];
        let letraCorreta = 'A';

        for (let i = 0; i < todasOpcoes.length; i++) {
            const traduzida = await traduzirSimples(todasOpcoes[i]);
            const opcaoFormatada = `${letras[i]}) ${traduzida}`;
            opcoesPt.push(opcaoFormatada);
            
            // Verifica qual letra ficou com a resposta certa
            if (todasOpcoes[i] === corretaOriginal) {
                letraCorreta = letras[i];
            }
        }

        return {
            pergunta: perguntaPt,
            opcoes: opcoesPt,
            correta: letraCorreta
        };

    } catch (e) {
        console.error("Erro no processamento do Quiz:", e);
        return null;
    }
}