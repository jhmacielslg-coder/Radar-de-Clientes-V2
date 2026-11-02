import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ai, getApiKey } from './_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = getApiKey();
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

    const confidence: 'baixo' | 'medio' | 'alto' =
      company.phone && company.address ? 'alto' : company.phone || company.website ? 'medio' : 'baixo';

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
}

