import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize Google GenAI Server Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Helper to test if domain is purely social media or directory
  function classifyWebsiteUrl(url?: string): { hasOwnWebsite: boolean; websiteStatus: 'proprio' | 'sem_site' | 'apenas_redes' | 'nao_verificado' } {
    if (!url || url.trim() === '' || url.toLowerCase() === 'sem site' || url.toLowerCase() === 'não encontrado') {
      return { hasOwnWebsite: false, websiteStatus: 'sem_site' };
    }
    const cleanUrl = url.toLowerCase().trim();
    const socialOrDirectories = [
      'instagram.com',
      'facebook.com',
      'fb.com',
      'linktr.ee',
      'linktree.com',
      'wa.me',
      'whatsapp.com',
      'guiamais.com.br',
      'telelistas.net',
      'apontador.com.br',
      'ifood.com.br',
      'maps.google.com',
      'google.com/maps',
      'yelp.com',
      'linkedin.com',
      'tiktok.com',
      'bio.site',
      'beacons.ai'
    ];

    const isSocialOrDir = socialOrDirectories.some(domain => cleanUrl.includes(domain));
    if (isSocialOrDir) {
      return { hasOwnWebsite: false, websiteStatus: 'apenas_redes' };
    }

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.includes('.com') || cleanUrl.includes('.com.br')) {
      return { hasOwnWebsite: true, websiteStatus: 'proprio' };
    }

    return { hasOwnWebsite: false, websiteStatus: 'nao_verificado' };
  }

  // --- API 1: PESQUISAR EMPRESAS COM GOOGLE SEARCH GROUNDING ---
  app.post('/api/search-businesses', async (req: Request, res: Response) => {
    try {
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
      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
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
        if (!websiteClassification.hasOwnWebsite) provScore += 30; // sem site
        if (!hasPhone) provScore += 15; // dificuldade contato
        if (hasSocial && !websiteClassification.hasOwnWebsite) provScore += 15; // ativo em redes mas sem canal proprio
        provScore += 20; // oportunidade padrao para prospeccao comercial

        const scoreConfidence: 'baixo' | 'medio' | 'alto' = (c.name && (c.phone || c.website || c.socialUrl)) ? 'medio' : 'baixo';

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
  });

  // --- API 2: ANALISAR NEGÓCIO E GERAR CHECKLIST DE 14 ITENS + SCORE ---
  app.post('/api/analyze-business', async (req: Request, res: Response) => {
    try {
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
      }

      const { company, weights } = req.body;
      if (!company || !company.name) {
        return res.status(400).json({ error: 'Dados da empresa incompletos para análise.' });
      }

      const hasWebsite = Boolean(company.hasOwnWebsite && company.website);

      const prompt = `
Você é um consultor sênior de transformação digital e vendas de soluções web para pequenos e médios negócios no Brasil.
Analise a seguinte empresa local:
- Nome Comercial: "${company.name}"
- Segmento: "${company.segment}"
- Cidade/Região: "${company.city}"
- Endereço: "${company.address || 'Não informado'}"
- Telefone: "${company.phone || 'Não informado'}"
- Site Próprio: "${hasWebsite ? company.website : 'NENHUM SITE PRÓPRIO IDENTIFICADO'}"
- Presença em Redes: "${company.socialUrl || 'Não identificada'}"
- Observações prévias: "${company.notes || 'Nenhuma'}"

REGRAS ESTRITAS DE VERACIDADE:
1. NÃO invente notas Lighthouse, métricas de PageSpeed ou dados técnicos inexistentes. Esta é uma análise qualitativa comercial.
2. Se a empresa NÃO possui site próprio, marque itens relativos ao site como "Não identificado" ou "Não aplicável", e aponte que a principal oportunidade é a criação de um canal digital próprio (site/landing page, cardápio digital ou catálogo integrado).
3. Para cada um dos 8 itens de verificação técnica/comercial, use SOMENTE um dos estados:
   "identificado", "nao_identificado", "nao_verificado", "nao_aplicavel".
4. Forneça de 3 a 5 oportunidades comerciais reais e práticas de melhoria digital.
5. Recomende o serviço digital prioritário que o profissional deve oferecer primeiro e a justificativa clara.

Responda ESTRITAMENTE em formato JSON com esta estrutura:
{
  "summary": "Resumo de exatamente duas frases sobre a atividade e perfil aparente da empresa.",
  "targetAudience": "Público-alvo provável atendido pelo negócio.",
  "isAudienceInference": true,
  "checklist": [
    {
      "id": "clareza_comercial",
      "label": "Clareza das informações comerciais e proposta de valor",
      "status": "identificado",
      "details": "Justificativa factual do status"
    },
    {
      "id": "facilidade_contato",
      "label": "Facilidade aparente de contato imediato",
      "status": "identificado",
      "details": "Justificativa factual do status"
    },
    {
      "id": "chamada_acao",
      "label": "Presença de chamada para ação clara (CTA)",
      "status": "nao_identificado",
      "details": "Justificativa factual do status"
    },
    {
      "id": "botao_whatsapp",
      "label": "Presença de botão ou link direto para WhatsApp",
      "status": "nao_identificado",
      "details": "Justificativa factual do status"
    },
    {
      "id": "agendamento_online",
      "label": "Presença de agendamento ou reserva on-line",
      "status": "nao_identificado",
      "details": "Justificativa factual do status"
    },
    {
      "id": "formulario_contato",
      "label": "Presença de formulário estruturado de contato ou orçamento",
      "status": "nao_identificado",
      "details": "Justificativa factual do status"
    },
    {
      "id": "site_proprio",
      "label": "Presença de domínio próprio oficial e profissional",
      "status": "${hasWebsite ? 'identificado' : 'nao_identificado'}",
      "details": "${hasWebsite ? 'Possui endereço web identificado' : 'Depende exclusivamente de redes sociais ou diretórios terceiros'}"
    },
    {
      "id": "seguranca_confianca",
      "label": "Sinais aparentes de credibilidade e depoimentos de clientes",
      "status": "nao_verificado",
      "details": "Justificativa factual do status"
    }
  ],
  "uxIssues": [
    "Sinal de problema de experiência do usuário observado ou 'Ausência de página estruturada para navegação mobile rápida'"
  ],
  "commercialIssues": [
    "Problema comercial observável (ex: 'Risco de perder clientes fora do horário comercial sem auto-atendimento')"
  ],
  "opportunities": [
    "Oportunidade 1 específica para este segmento",
    "Oportunidade 2 específica para este segmento",
    "Oportunidade 3 específica para este segmento"
  ],
  "recommendedService": "Nome do serviço digital a oferecer primeiro (ex: 'Criação de Landing Page com Botão de WhatsApp' ou 'Agente de IA para WhatsApp')",
  "recommendationJustification": "Por que este serviço resolve a principal dor comercial identificada no momento.",
  "suggestedNextStep": "Ação prática recomendada para o primeiro contato comercial.",
  "scoreBreakdown": {
    "noOwnWebsiteScore": ${hasWebsite ? 0 : (weights?.noOwnWebsite || 30)},
    "missingCommercialInfoScore": 10,
    "contactDifficultyScore": 10,
    "noBookingOrOrderScore": 10,
    "digitalPresentationScore": 10,
    "activeBusinessBonus": 8,
    "missingData": ["Horário detalhado de pico", "Volume de pedidos mensais"],
    "justification": {
      "site": "${hasWebsite ? 'Possui site cadastrado' : 'Sem site próprio identificado, alta oportunidade de desenvolvimento'}",
      "contato": "Canais avaliados com base nos registros públicos",
      "apresentacao": "Avaliação qualitativa dos canais digitais disponíveis"
    }
  }
}
`;

      const geminiConfig: any = {};
      // Se houver site próprio e for url válida, habilita urlContext
      if (hasWebsite && company.website.startsWith('http')) {
        geminiConfig.tools = [{ urlContext: {} }];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: geminiConfig,
      });

      const responseText = response.text || '';
      let analysisResult: any = null;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.warn('Erro ao parsear JSON da análise:', err);
      }

      if (!analysisResult) {
        return res.status(500).json({ error: 'Não foi possível gerar análise estruturada.' });
      }

      // Calculate total score based on weights or analysis
      const wNoWebsite = weights?.noOwnWebsite ?? 30;
      const wMissingInfo = weights?.missingCommercialInfo ?? 15;
      const wContact = weights?.contactDifficulty ?? 15;
      const wBooking = weights?.noBookingOrOrder ?? 15;
      const wPresentation = weights?.digitalPresentation ?? 15;
      const wActiveBonus = weights?.activeBusinessBonus ?? 10;

      const noWebsitePts = hasWebsite ? 0 : wNoWebsite;
      const missingInfoPts = Math.min(wMissingInfo, analysisResult.scoreBreakdown?.missingCommercialInfoScore ?? 10);
      const contactPts = Math.min(wContact, analysisResult.scoreBreakdown?.contactDifficultyScore ?? 10);
      const bookingPts = Math.min(wBooking, analysisResult.scoreBreakdown?.noBookingOrOrderScore ?? 10);
      const presPts = Math.min(wPresentation, analysisResult.scoreBreakdown?.digitalPresentationScore ?? 10);
      const activePts = Math.min(wActiveBonus, analysisResult.scoreBreakdown?.activeBusinessBonus ?? 8);

      const totalScore = Math.min(100, Math.max(0, noWebsitePts + missingInfoPts + contactPts + bookingPts + presPts + activePts));

      const detailedBreakdown = {
        noOwnWebsiteScore: noWebsitePts,
        missingCommercialInfoScore: missingInfoPts,
        contactDifficultyScore: contactPts,
        noBookingOrOrderScore: bookingPts,
        digitalPresentationScore: presPts,
        activeBusinessBonus: activePts,
        total: totalScore,
        missingData: analysisResult.scoreBreakdown?.missingData || [],
        justification: analysisResult.scoreBreakdown?.justification || {},
      };

      const confidence: 'baixo' | 'medio' | 'alto' = (company.phone && company.address) ? 'alto' : (company.phone || company.website ? 'medio' : 'baixo');

      analysisResult.analyzedAt = new Date().toISOString();

      return res.json({
        analysis: analysisResult,
        opportunityScore: totalScore,
        scoreConfidence: confidence,
        scoreDetails: detailedBreakdown,
      });
    } catch (err: any) {
      console.error('Erro em /api/analyze-business:', err);
      return res.status(500).json({
        error: err.message || 'Falha ao analisar empresa com Gemini.',
      });
    }
  });

  // --- API 3: GERAR ABORDAGENS COMERCIAIS (LIGAÇÃO, WHATSAPP, EMAIL) ---
  app.post('/api/generate-outreach', async (req: Request, res: Response) => {
    try {
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
      }

      const { company, sellerProfile, analysis, tone } = req.body;
      if (!company || !company.name) {
        return res.status(400).json({ error: 'Dados da empresa incompletos para gerar abordagem.' });
      }

      const sellerName = sellerProfile?.name || 'Consultor Especialista em Soluções Digitais';
      const sellerCity = sellerProfile?.city || company.city || 'Formosa, GO';
      const sellerServices = sellerProfile?.servicesOffered?.join(', ') || 'Criação de sites, cardápios digitais, agentes de IA para WhatsApp e agendamentos';
      const sellerTone = tone || sellerProfile?.preferredTone || 'consultivo';
      const targetService = analysis?.recommendedService || 'Criação de Site Institucional e Canal de Atendimento';
      const mainPain = analysis?.commercialIssues?.[0] || 'Centralização de contatos e facilidade de visualização para novos clientes';

      const prompt = `
Você é um especialista em vendas B2B e prospecção ativa de clientes locais no Brasil.
Elabore 3 abordagens comerciais hiperpersonalizadas para um profissional autônomo entrar em contato com um cliente em potencial.

DADOS DO VENDEDOR:
- Nome: ${sellerName}
- Cidade: ${sellerCity}
- Serviços oferecidos: ${sellerServices}
- Tom de voz desejado: ${sellerTone} (direto, respeitoso, consultivo, focado em ajudar e gerar valor real)

DADOS DO CLIENTE EM POTENCIAL:
- Nome da Empresa: "${company.name}"
- Segmento: "${company.segment}"
- Cidade: "${company.city}"
- Telefone: "${company.phone || 'Telefone comercial'}"
- Tem site próprio: ${company.hasOwnWebsite ? 'Sim' : 'NÃO POSSUI SITE PRÓPRIO IDENTIFICADO'}
- Serviço digital prioritário: "${targetService}"
- Oportunidade observada: "${mainPain}"

REGRAS ESSENCIAIS:
1. ROTEIRO DE LIGAÇÃO: Deve durar aproximadamente 30 segundos, natural, conversacional, sem jargões complexos e sem parecer telemarketing robótico.
2. WHATSAPP: Mensagem curta (2 a 4 parágrafos pequenos), amigável, citando o nome da empresa e propondo uma pergunta aberta sobre como recebem clientes hoje.
3. E-MAIL: Assunto curto e direto, corpo profissional identificando uma oportunidade de melhoria pontual e convidando para uma breve conversa sem compromisso.
4. PROIBIDO: Prometer faturamento garantido, fingir auditoria técnica inexistente, usar clichês apelativos ("você está perdendo milhares de reais"), ou fingir que já eram parceiros.

Retorne EXCLUSIVAMENTE em formato JSON:
{
  "phoneScript": "Texto completo do roteiro de ligação com pausas indicadas...",
  "whatsappMessage": "Texto completo da mensagem de WhatsApp formatada com quebras de linha...",
  "emailSubject": "Assunto do e-mail",
  "emailBody": "Corpo completo do e-mail com saudação e assinatura..."
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      let outreachDrafts: any = null;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          outreachDrafts = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.warn('Erro ao parsear JSON de outreach:', err);
      }

      if (!outreachDrafts) {
        return res.status(500).json({ error: 'Não foi possível gerar as abordagens comerciais.' });
      }

      return res.json({
        outreachDrafts: {
          phoneScript: outreachDrafts.phoneScript || '',
          whatsappMessage: outreachDrafts.whatsappMessage || '',
          emailSubject: outreachDrafts.emailSubject || '',
          emailBody: outreachDrafts.emailBody || '',
          generatedAt: new Date().toISOString(),
          tone: sellerTone,
          usedFormats: { phone: false, whatsapp: false, email: false },
        },
      });
    } catch (err: any) {
      console.error('Erro em /api/generate-outreach:', err);
      return res.status(500).json({
        error: err.message || 'Falha ao gerar mensagens de abordagem com Gemini.',
      });
    }
  });

  // --- API 4: COMPARATIVO DO RADAR DE NICHOS ---
  app.post('/api/compare-niches', async (req: Request, res: Response) => {
    try {
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
      }

      const { region, nichesStats } = req.body;
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

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
  });

  // --- Vite / Static Handling ---
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Radar de Clientes Local] Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
