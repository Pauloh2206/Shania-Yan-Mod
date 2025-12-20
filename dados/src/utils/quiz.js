import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Busca uma pergunta completa na Gemini 2.5 Flash usando a biblioteca oficial
 */
export async function getQuizIA(apiKey) {
    try {
        const GEMINI_API_KEY = apiKey || process.env.GEMINI_API_KEY;
        
        // Inicialização padrão da biblioteca @google/generative-ai
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY); 

        const prompt = `Gere uma pergunta de conhecimentos gerais especificamente sobre o BRASIL para quiz nível médio.
        REGRAS:
        1. Gere 4 alternativas (A, B, C, D).
        2. Retorne APENAS um JSON puro neste formato:
        {
          "pergunta": "Texto da pergunta?",
          "opcoes": ["A) Opção 1", "B) Opção 2", "C) Opção 3", "D) Opção 4"],
          "correta": "LETRA"
        }`;

        // Definindo o modelo 2.5 Flash
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const texto = response.text(); // Na biblioteca oficial, usa-se o método text()
        
        const jsonMatch = texto.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const res = JSON.parse(jsonMatch[0]);
            return {
                pergunta: res.pergunta,
                opcoes: res.opcoes,
                correta: res.correta.toUpperCase().trim()
            };
        }
    } catch (e) {
        console.error("Erro crítico no Quiz Gemini:", e.message);
        return null;
    }
}