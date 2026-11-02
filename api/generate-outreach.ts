import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createAiClient, resolveApiKey } from './_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { company, sellerProfile, analysis, tone, apiKey: clientApiKey } = req.body;
    const apiKey = resolveApiKey(clientApiKey);
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada. Acesse Configurações e insira sua chave API.' });
    }

    const ai = createAiClient(apiKey);

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
      model: 'gemini-4-argon',
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
}
