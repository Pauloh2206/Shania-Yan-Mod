import { GoogleGenAI } from '@google/genai';

/**
 * Busca uma pergunta completa na Gemini 2.5 Flash
 */
export async function getQuizIA(apiKey) {
    try {
        const GEMINI_API_KEY = apiKey || process.env.GEMINI_API_KEY;
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY }); 

        const prompt = `Gere uma pergunta de conhecimentos gerais sobre o Brasil para quiz nível médio.
        REGRAS:
        1. Gere 4 alternativas (A, B, C, D).
        2. Retorne APENAS um JSON puro neste formato:
        {
          "pergunta": "Texto da pergunta?",
          "opcoes": ["A) Opção 1", "B) Opção 2", "C) Opção 3", "D) Opção 4"],
          "correta": "LETRA"
        }`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        
        const texto = response.text;
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