import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ai, getApiKey, classifyWebsiteUrl } from './_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
    }

    const { region, niche, keyword, targetService } = req.body;
    if (!region || !niche) {
      return res.status(400).json({ error: 'Região e nicho são obrigatórios.' });
    }

    const queryDescription = `empresas e comércios locais do segmento "${niche}" em ${region} ${keyword ? `com foco em "${keyword}"` : ''}`;

    const prompt = `
Você é um pesquisador de mercado local no Brasil.
Pesquise na web utilizando a ferramenta Google Search sobre negócios e empresas REAIS do segmento "${niche}" localizadas em "${region}" (Brasil)${keyword ? ` com termo adicional "${keyword}"` : ''}.

REGRAS ESTRITAS DE VERACIDADE:
1. Retorne APENAS negócios reais existentes encontrados nas fontes públicas da web para ${region}.
2. Se não encontrar o telefone ou site oficial em fontes públicas, defina o campo como null. NUNCA invente telefones, e-mails ou endereços fictícios.
3. Se o único endereço digital encontrado for Instagram, Facebook, Linktree ou diretório comercial, coloque esse link no campo "socialUrl" e deixe "website" como null.
4. Identifique as fontes reais de onde obteve as informações.
5. Procure extrair entre 4 e 8 empresas reais representativas desse segmento na região.

Retorne EXCLUSIVAMENTE um bloco JSON válido sem markdown adicional no seguinte formato:
{
  "companies": [
    {
      "name": "Nome comercial da empresa",
      "segment": "${niche}",
      "city": "${region}",
      "address": "Endereço ou bairro quando encontrado, ou null",
      "phone": "Telefone com DDD quando encontrado (ex: (61) 99999-9999), ou null",
      "website": "Site oficial próprio com domínio próprio (ex: https://empresa.com.br), ou null se não tiver",
      "socialUrl": "Link público do Instagram, Facebook ou WhatsApp encontrado, ou null",
      "notes": "Breve observação factual encontrada na web (ex: 'Possui perfil ativo no Instagram com 1.2k seguidores, sem cardápio digital oficial')",
      "source": "Nome do diretório ou fonte web onde foi encontrada"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const responseText = response.text || '';

    // Extract grounding sources
    const rawChunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks || [];
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
    const companies = rawCompanies.map((c, idx) => {
      const websiteClassification = classifyWebsiteUrl(c.website);
      const hasPhone = Boolean(c.phone && c.phone.trim().length > 5);
      const hasSocial = Boolean(c.socialUrl && c.socialUrl.trim().length > 5);

      // Calculate provisional score
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
        sourceUrl: sources.length > 0 ? sources[0].uri : null,
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
    });
  } catch (err: any) {
    console.error('Erro em /api/search-businesses:', err);
    return res.status(500).json({
      error: err.message || 'Falha ao pesquisar empresas com a API Gemini.',
    });
  }
}

