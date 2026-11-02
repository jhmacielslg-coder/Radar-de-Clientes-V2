import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createAiClient, resolveApiKey, classifyWebsiteUrl } from './_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { region, niche, keyword, targetService, apiKey: clientApiKey } = req.body;
    const apiKey = resolveApiKey(clientApiKey);
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada. Acesse Configurações e insira sua chave API.' });
    }

    const ai = createAiClient(apiKey);

    if (!region || !niche) {
      return res.status(400).json({ error: 'Região e nicho são obrigatórios.' });
    }

    const queryDescription = `empresas e comércios locais do segmento "${niche}" em ${region} ${keyword ? `com foco em "${keyword}"` : ''}`;

    const prompt = `
Você é um pesquisador e especialista em prospecção de mercado local no Brasil.
Liste negócios e comércios reais conhecidos ou típicos do segmento "${niche}" localizados em "${region}" (Brasil)${keyword ? ` com foco em "${keyword}"` : ''}.

DIRETRIZES:
1. Retorne entre 4 e 8 empresas/estabelecimentos representativos desse nicho em ${region}.
2. Se souber informações públicas reais (telefone aproximado com DDD da região, rua/bairro, presença no Instagram), inclua-as. Se não tiver certeza absoluta de um dado específico como telefone ou site, defina o campo como null. NUNCA invente números de telefone aleatórios.
3. Se o único canal for redes sociais (Instagram/Facebook/WhatsApp), preencha o link em "socialUrl" e deixe "website" como null.

Retorne EXCLUSIVAMENTE um bloco JSON válido sem markdown adicional no seguinte formato:
{
  "companies": [
    {
      "name": "Nome da empresa",
      "segment": "${niche}",
      "city": "${region}",
      "address": "Bairro ou rua conhecida, ou null",
      "phone": "Telefone comercial com DDD se conhecido, ou null",
      "website": "Site oficial próprio (ex: https://empresa.com.br), ou null",
      "socialUrl": "Link do Instagram, Facebook ou WhatsApp, ou null",
      "notes": "Breve nota sobre perfil ou canal de atendimento",
      "source": "Base de conhecimento local"
    }
  ]
}
`;

    let response: any;
    let usedSearchGrounding = false;

    // Tentativa 1: Busca em tempo real com Google Search grounding
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      usedSearchGrounding = true;
    } catch (searchErr: any) {
      console.warn('Google Search Grounding indisponível ou cota esgotada (429). Tentando geração direta com Gemini 2.5 Flash:', searchErr?.message);
      // Tentativa 2: Fallback direto sem a tool de search grounding (evita o erro 429 de cota de pesquisa)
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
      } catch (directErr: any) {
        // Tentativa 3: Fallback para gemini-2.5-flash-lite
        console.warn('Tentando fallback para gemini-2.5-flash-lite:', directErr?.message);
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents: prompt,
        });
      }
    }

    const responseText = response.text || '';

    // Extrair fontes de grounding caso a busca tenha sido usada
    const rawChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: Array<{ title: string; uri: string }> = [];
    for (const chunk of rawChunks) {
      if (chunk.web?.uri) {
        sources.push({
          title: chunk.web.title || chunk.web.uri,
          uri: chunk.web.uri,
        });
      }
    }

    // Parse JSON from model output
    let parsedData: { companies?: any[] } = { companies: [] };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.warn('Erro ao parsear JSON da busca:', parseErr);
    }

    const rawCompanies = Array.isArray(parsedData.companies) ? parsedData.companies : [];

    // Normalize companies with classification
    const companies = rawCompanies.map((c: any, idx: number) => {
      const websiteClassification = classifyWebsiteUrl(c.website);
      const hasPhone = Boolean(c.phone && String(c.phone).trim().length > 5);
      const hasSocial = Boolean(c.socialUrl && String(c.socialUrl).trim().length > 5);

      let provScore = 0;
      if (!websiteClassification.hasOwnWebsite) provScore += 30;
      if (!hasPhone) provScore += 15;
      if (hasSocial && !websiteClassification.hasOwnWebsite) provScore += 15;
      provScore += 20;

      const scoreConfidence: 'baixo' | 'medio' | 'alto' =
        c.name && (c.phone || c.website || c.socialUrl) ? 'medio' : 'baixo';

      return {
        id: `lead_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
        name: c.name || `Empresa em ${region}`,
        segment: c.segment || niche,
        city: c.city || region,
        address: c.address || null,
        phone: c.phone || null,
        website: websiteClassification.hasOwnWebsite ? c.website : null,
        socialUrl: c.socialUrl || (!websiteClassification.hasOwnWebsite && c.website ? c.website : null),
        sourceUrl: sources.length > 0 ? sources[0].uri : (usedSearchGrounding ? null : 'Inteligência Gemini'),
        hasOwnWebsite: websiteClassification.hasOwnWebsite,
        websiteStatus: websiteClassification.websiteStatus,
        opportunityScore: Math.min(100, Math.max(0, provScore)),
        scoreConfidence,
        status: 'novo',
        notes: c.notes || 'Identificado via pesquisa assistida Gemini.',
        contactHistory: [],
        targetService: targetService || 'Site Institucional e Presença Digital',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    return res.json({
      companies,
      sources,
      totalFound: companies.length,
      searchedQuery: queryDescription,
      grounded: usedSearchGrounding,
    });
  } catch (err: any) {
    console.error('Erro em /api/search-businesses:', err);
    return res.status(500).json({
      error: err.message || 'Falha ao pesquisar empresas com a API Gemini.',
    });
  }
}
