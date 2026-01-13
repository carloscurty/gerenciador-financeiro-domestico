
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const summary = transactions.reduce((acc, t) => {
    const key = `${t.type}_${t.category}`;
    acc[key] = (acc[key] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const prompt = `
    Como um consultor financeiro especialista, analise estes dados de gastos e ganhos mensais de uma família:
    ${JSON.stringify(summary)}
    
    Por favor, forneça:
    1. Uma análise curta do perfil de gastos.
    2. Três dicas práticas para economizar ou investir melhor com base nesses dados.
    3. Uma mensagem de encorajamento.
    
    Responda em Português do Brasil de forma amigável e concisa. Use formatação Markdown (negrito, listas).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Houve um erro ao consultar o assistente de IA. Tente novamente mais tarde.";
  }
};
