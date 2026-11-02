import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createAiClient, resolveApiKey } from './_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { region, nichesStats, apiKey: clientApiKey } = req.body;
    const apiKey = resolveApiKey(clientApiKey);
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada. Acesse Configurações e insira sua chave API.' });
    }

    const ai = createAiClient(apiKey);

    if (!region || !Array.isArray(nichesStats) || nichesStats.length === 0) {
      return res.status(400).json({ error: 'Informe a região e a lista de nichos para comparar.' });
    }

    const prompt = `
Você é um estrategista de negócios locais e vendas de serviços de tecnologia no Brasil.
Analise os seguintes nichos de mercado na região de "${region}" com base nos dados coletados:
${JSON.stringify(nichesStats, null, 2)}

Com base nesses dados e no perfil econômico de cidades como ${region}:
1. Escolha os 3 NICHOS PRIORITÁRIOS para prospecção comercial.
2. Para cada um dos 3 nichos, explique:
   - Por que é prioritário (oportunidade de mercado vs facilidade de fechamento).
   - Qual serviço digital oferecer primeiro (Site, Cardápio Digital, Agente de IA para WhatsApp, Sistema de Agendamento, Automação).
   - Qual problema comercial crítico abordar na primeira conversa.
   - Como iniciar a prospecção de forma prática e rápida.
3. Diferencie com clareza o que são dados observados e o que são hipóteses estratégicas recomendadas.

Retorne EXCLUSIVAMENTE em formato JSON:
{
  "topNiches": [
    {
      "niche": "Nome do nicho 1",
      "priorityRank": 1,
      "whyInteresting": "Explicação fundamentada do porquê focar aqui primeiro",
      "recommendedService": "Serviço prioritário a oferecer",
      "painPointToAddress": "Problema comercial real do setor",
      "howToStart": "Roteiro prático para os primeiros 3 dias de prospecção"
    },
    {
      "niche": "Nome do nicho 2",
      "priorityRank": 2,
      "whyInteresting": "Explicação fundamentada...",
      "recommendedService": "Serviço prioritário...",
      "painPointToAddress": "Problema comercial...",
      "howToStart": "Como abordar..."
    },
    {
      "niche": "Nome do nicho 3",
      "priorityRank": 3,
      "whyInteresting": "Explicação fundamentada...",
      "recommendedService": "Serviço prioritário...",
      "painPointToAddress": "Problema comercial...",
      "howToStart": "Como abordar..."
    }
  ],
  "strategicSummary": "Síntese executiva de 2 parágrafos com a melhor estratégia para o vendedor nesta cidade."
}
`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
    } catch (modelErr: any) {
      console.warn('Fallback para gemini-2.5-flash-lite em compare-niches:', modelErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
      });
    }

    const responseText = response.text || '';
    let diagnosis: any = null;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        diagnosis = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.warn('Erro ao parsear JSON do radar:', err);
    }

    if (!diagnosis) {
      return res.status(500).json({ error: 'Não foi possível gerar o comparativo de nichos.' });
    }

    return res.json(diagnosis);
  } catch (err: any) {
    console.error('Erro em /api/compare-niches:', err);
    return res.status(500).json({
      error: err.message || 'Falha ao comparar nichos no Gemini.',
    });
  }
}
