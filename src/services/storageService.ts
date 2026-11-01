import { Company, AppSettings, SellerProfile, ScoringWeights } from '../types';

const STORAGE_KEYS = {
  LEADS: 'radar_leads_v1',
  SETTINGS: 'radar_settings_v1',
  SEARCH_CACHE: 'radar_search_cache_v1',
};

export const INITIAL_NICHES: string[] = [
  'Oficinas mecânicas',
  'Clínicas odontológicas',
  'Clínicas médicas',
  'Fisioterapeutas',
  'Salões de beleza',
  'Centros de estética',
  'Restaurantes',
  'Hamburguerias',
  'Pizzarias',
  'Academias',
  'Escolas e cursos',
  'Imobiliárias',
  'Empresas de reformas',
  'Clínicas veterinárias',
  'Autoescolas',
  'Óticas',
  'Escritórios de contabilidade',
  'Escritórios de advocacia',
];

export const INITIAL_SERVICES: string[] = [
  'Criação de sites institucionais e landing pages',
  'Cardápios digitais para restaurantes, hamburguerias e pizzarias',
  'Agentes de IA para atendimento no WhatsApp',
  'Sistemas de agendamento on-line',
  'Automação de atendimento e processos comerciais',
];

export const DEFAULT_WEIGHTS: ScoringWeights = {
  noOwnWebsite: 30,
  missingCommercialInfo: 15,
  contactDifficulty: 15,
  noBookingOrOrder: 15,
  digitalPresentation: 15,
  activeBusinessBonus: 10,
};

export const DEFAULT_SELLER_PROFILE: SellerProfile = {
  name: 'Seu Nome ou Agência',
  city: 'Formosa, Goiás, Brasil',
  servicesOffered: [
    'Criação de sites institucionais e landing pages',
    'Cardápios digitais para restaurantes, hamburguerias e pizzarias',
    'Agentes de IA para atendimento no WhatsApp',
    'Sistemas de agendamento on-line',
  ],
  differentials: 'Atendimento presencial e suporte dedicado na região de Formosa e Entorno do DF',
  experienceYears: 4,
  preferredTone: 'consultivo',
  priceRange: 'R$ 800 a R$ 3.500',
  preferredCta: 'Agendar um bate-papo presencial ou vídeo rápida de 15 minutos',
};

export const DEFAULT_SETTINGS: AppSettings = {
  sellerProfile: DEFAULT_SELLER_PROFILE,
  weights: DEFAULT_WEIGHTS,
  defaultRegion: 'Formosa, Goiás, Brasil',
  favoriteNiches: [
    'Hamburguerias',
    'Clínicas odontológicas',
    'Oficinas mecânicas',
    'Salões de beleza',
    'Pizzarias',
  ],
  customNiches: [],
  operationsCount: 0,
};

// Dados demonstrativos iniciais em Formosa - GO (claramente marcados com isDemoData: true)
export const INITIAL_SEED_LEADS: Company[] = [
  {
    id: 'demo_lead_1',
    name: 'Auto Mecânica Planalto Formosa',
    segment: 'Oficinas mecânicas',
    city: 'Formosa, Goiás, Brasil',
    address: 'Av. Maestro João Luiz do Espírito Santo, Centro',
    phone: '(61) 98412-3040',
    website: null,
    socialUrl: 'https://instagram.com/mecanicaplanalto_formosa',
    sourceUrl: 'https://instagram.com',
    hasOwnWebsite: false,
    websiteStatus: 'apenas_redes',
    opportunityScore: 82,
    scoreConfidence: 'alto',
    status: 'novo',
    notes: 'Possui oficina estruturada, boa reputação local, mas os clientes agendam apenas por ligação direta e perdem contatos fora do expediente.',
    targetService: 'Criação de sites institucionais e landing pages',
    contactHistory: [],
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    isDemoData: true,
  },
  {
    id: 'demo_lead_2',
    name: 'Burger & Brasa Formosa',
    segment: 'Hamburguerias',
    city: 'Formosa, Goiás, Brasil',
    address: 'Rua Emílio Póvoa, Bairro Formosinha',
    phone: '(61) 99123-4567',
    website: null,
    socialUrl: 'https://instagram.com/burgerbrasafsa',
    sourceUrl: 'https://instagram.com',
    hasOwnWebsite: false,
    websiteStatus: 'apenas_redes',
    opportunityScore: 88,
    scoreConfidence: 'alto',
    status: 'analisado',
    notes: 'Recebe pedidos apenas por direct do Instagram e PDF no WhatsApp. Sofrem com taxa de cancelamento e demora no atendimento em noites de sexta.',
    targetService: 'Cardápios digitais para restaurantes, hamburguerias e pizzarias',
    contactHistory: [],
    lastAnalysisDate: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    analysis: {
      summary: 'Hamburgueria artesanal com grande apelo visual em fotos no Instagram, mas sem canal transacional próprio para pedidos ágeis.',
      targetAudience: 'Jovens e famílias em Formosa que buscam hambúrguer artesanal para delivery no fim de semana.',
      isAudienceInference: true,
      checklist: [
        { id: 'c1', label: 'Clareza das informações comerciais', status: 'identificado', details: 'Cardápio em imagem nos destaques do Instagram' },
        { id: 'c2', label: 'Facilidade aparente de contato imediato', status: 'identificado', details: 'Link wa.me na biografia' },
        { id: 'c3', label: 'Presença de chamada para ação clara (CTA)', status: 'nao_identificado', details: 'Apenas link genérico de WhatsApp sem direcionamento para pedido' },
        { id: 'c4', label: 'Presença de botão ou canal direto do WhatsApp', status: 'identificado', details: 'Possui número de WhatsApp publicado' },
        { id: 'c5', label: 'Presença de agendamento ou pedido on-line estruturado', status: 'nao_identificado', details: 'Depende de envio manual de foto de cardápio' },
        { id: 'c6', label: 'Presença de formulário de contato', status: 'nao_aplicavel', details: 'Não aplicável para fast food rápido' },
        { id: 'c7', label: 'Presença de domínio próprio oficial e profissional', status: 'nao_identificado', details: 'Sem site próprio identificado' },
        { id: 'c8', label: 'Sinais aparentes de credibilidade e depoimentos', status: 'identificado', details: 'Destaques com fotos de clientes' },
      ],
      uxIssues: ['Cliente precisa rolar fotos para encontrar preços e sabores', 'Falta cálculo automático de frete por bairro em Formosa'],
      commercialIssues: ['Atendimento lento no WhatsApp durante horário de pico', 'Dependência de comissões em agregadores terceiros'],
      opportunities: [
        'Implantar cardápio digital próprio interativo com carrinho e envio automático para o WhatsApp',
        'Configurar agente de resposta automática no WhatsApp para responder cardápio em menos de 5 segundos',
        'Criar programa de fidelidade local simples integrado ao cardápio'
      ],
      recommendedService: 'Cardápios digitais para restaurantes, hamburguerias e pizzarias',
      recommendationJustification: 'Reduz o tempo de espera do cliente de 15 minutos para 1 minuto e automatiza o fechamento da conta.',
      suggestedNextStep: 'Enviar mensagem no WhatsApp apresentando uma demonstração de 1 minuto do cardápio digital já pré-montado com as fotos públicas deles.',
      analyzedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    },
    outreachDrafts: {
      phoneScript: 'Olá! Aqui é da consultoria digital de Formosa. Vi que a Burger & Brasa tem fotos incríveis dos lanches, mas notei que nos fins de semana a fila de mensagens no WhatsApp deve ser puxada para fechar pedidos um a um. Montei uma demonstração rápida de cardápio digital onde o cliente já escolhe e manda o pedido somado certinho no seu zap. Teria 3 minutos para dar uma olhada sem compromisso?',
      whatsappMessage: 'Olá pessoal da Burger & Brasa! Tudo bem? Acompanho o trabalho de vocês aqui em Formosa e acho os lanches sensacionais. Percebi que vocês usam o WhatsApp para anotar pedidos na mão. Eu criei um modelo de cardápio digital interativo onde o cliente clica, monta o combo e você recebe a comanda pronta no WhatsApp. Se fizer sentido, posso te mandar o link de teste para você ver como funciona?',
      emailSubject: 'Ideia para agilizar os pedidos da Burger & Brasa em Formosa',
      emailBody: 'Olá equipe Burger & Brasa,\n\nSou consultor de soluções digitais aqui em Formosa. Analisando a presença online da hamburgueria, notei a ótima aceitação dos clientes, porém a ausência de um sistema próprio de pedidos pelo WhatsApp pode estar sobrecarregando o atendimento nos horários de pico.\n\nDesenvolvi um cardápio digital sob medida que acelera o pedido em 70% sem cobrar comissão por lanche vendido. Gostaria de apresentar uma demonstração rápida de 5 minutos nesta semana?\n\nUm abraço,\nConsultor Digital Local',
      generatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      tone: 'consultivo',
      usedFormats: { phone: false, whatsapp: false, email: false },
    },
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    isDemoData: true,
  },
  {
    id: 'demo_lead_3',
    name: 'Clínica OdontoVida Formosa',
    segment: 'Clínicas odontológicas',
    city: 'Formosa, Goiás, Brasil',
    address: 'Av. Valeriano de Castro, Setor Bosque',
    phone: '(61) 3631-9080',
    website: 'https://odontovidaformosa.com.br',
    socialUrl: 'https://instagram.com/odontovida_fsa',
    sourceUrl: 'https://odontovidaformosa.com.br',
    hasOwnWebsite: true,
    websiteStatus: 'proprio',
    opportunityScore: 58,
    scoreConfidence: 'alto',
    status: 'contatado',
    notes: 'Possui site institucional simples, mas sem agendamento online e sem automação de lembretes no WhatsApp.',
    targetService: 'Sistemas de agendamento on-line',
    contactHistory: [
      {
        id: 'hist_1',
        date: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
        channel: 'whatsapp',
        notes: 'Enviada mensagem inicial para a secretária apresentando sistema de agendamento 24h.',
      },
    ],
    nextActionDate: new Date(Date.now() + 3600000 * 24 * 1).toISOString().split('T')[0],
    nextActionDescription: 'Fazer follow-up pelo telefone para confirmar se a Dra. Paula viu a proposta de agendamento.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    isDemoData: true,
  },
  {
    id: 'demo_lead_4',
    name: 'Espaço Bella Estética e Spa',
    segment: 'Centros de estética',
    city: 'Formosa, Goiás, Brasil',
    address: 'Rua Olimpio de Melo, Parque Prazeres',
    phone: '(61) 98765-4321',
    website: null,
    socialUrl: 'https://instagram.com/espacobellaestetica',
    sourceUrl: 'https://instagram.com',
    hasOwnWebsite: false,
    websiteStatus: 'apenas_redes',
    opportunityScore: 79,
    scoreConfidence: 'medio',
    status: 'reuniao',
    notes: 'Reunião marcada para quinta-feira às 14h para demonstrar agente de IA para WhatsApp que tira dúvidas de procedimentos e faz pré-agendamento.',
    targetService: 'Agentes de IA para atendimento no WhatsApp',
    contactHistory: [
      {
        id: 'hist_2',
        date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        channel: 'telefone',
        notes: 'Conversado com a proprietária Marcela. Ela gasta 3 horas por dia respondendo preços no WhatsApp.',
      },
    ],
    nextActionDate: new Date(Date.now() + 3600000 * 24 * 2).toISOString().split('T')[0],
    nextActionDescription: 'Apresentar demonstração do Agente de IA rodando no WhatsApp.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    isDemoData: true,
  },
  {
    id: 'demo_lead_5',
    name: 'Pizzaria Bella Fornada',
    segment: 'Pizzarias',
    city: 'Formosa, Goiás, Brasil',
    address: 'Rua Visconde de Porto Seguro, Centro',
    phone: '(61) 98555-1234',
    website: null,
    socialUrl: 'https://facebook.com/bellafornadaformosa',
    sourceUrl: 'https://facebook.com',
    hasOwnWebsite: false,
    websiteStatus: 'apenas_redes',
    opportunityScore: 91,
    scoreConfidence: 'alto',
    status: 'cliente',
    notes: 'Cliente fechado! Venda de cardápio digital + integração com impressora térmica. Valor: R$ 1.500 setup + R$ 150/mês de manutenção.',
    targetService: 'Cardápios digitais para restaurantes, hamburguerias e pizzarias',
    contactHistory: [
      {
        id: 'hist_3',
        date: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
        channel: 'presencial',
        notes: 'Visita na pizzaria. Proprietário aprovou o teste.',
      },
      {
        id: 'hist_4',
        date: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
        channel: 'whatsapp',
        notes: 'Contrato assinado e sinal de 50% pago.',
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    isDemoData: true,
  },
];

export const storageService = {
  // --- LEADS CRUD ---
  getLeads(): Company[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEADS);
      if (!data) {
        // Inicializa com dados demonstrativos iniciais
        this.saveLeads(INITIAL_SEED_LEADS);
        return INITIAL_SEED_LEADS;
      }
      return JSON.parse(data);
    } catch (err) {
      console.error('Erro ao ler leads do localStorage:', err);
      return [];
    }
  },

  saveLeads(leads: Company[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
    } catch (err) {
      console.error('Erro ao salvar leads no localStorage:', err);
    }
  },

  addLead(lead: Company): void {
    const leads = this.getLeads();
    const existingIndex = leads.findIndex(l => l.id === lead.id);
    if (existingIndex >= 0) {
      leads[existingIndex] = { ...lead, updatedAt: new Date().toISOString() };
    } else {
      leads.unshift({ ...lead, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.saveLeads(leads);
  },

  updateLead(updatedLead: Company): void {
    const leads = this.getLeads();
    const index = leads.findIndex(l => l.id === updatedLead.id);
    if (index >= 0) {
      leads[index] = { ...updatedLead, updatedAt: new Date().toISOString() };
      this.saveLeads(leads);
    }
  },

  deleteLead(id: string): void {
    const leads = this.getLeads();
    const filtered = leads.filter(l => l.id !== id);
    this.saveLeads(filtered);
  },

  batchAddLeads(newLeads: Company[]): number {
    const currentLeads = this.getLeads();
    const existingNames = new Set(currentLeads.map(l => l.name.toLowerCase().trim()));
    let addedCount = 0;

    for (const lead of newLeads) {
      if (!existingNames.has(lead.name.toLowerCase().trim())) {
        currentLeads.unshift(lead);
        existingNames.add(lead.name.toLowerCase().trim());
        addedCount++;
      }
    }

    this.saveLeads(currentLeads);
    return addedCount;
  },

  // --- CONFIGURAÇÕES ---
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (err) {
      console.error('Erro ao ler configurações:', err);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
    }
  },

  incrementOperationsCount(): void {
    const settings = this.getSettings();
    settings.operationsCount = (settings.operationsCount || 0) + 1;
    this.saveSettings(settings);
  },

  // --- CACHE DE PESQUISAS (com TTL de 24 horas) ---
  getSearchCache(queryKey: string): Company[] | null {
    try {
      const cacheStr = localStorage.getItem(`${STORAGE_KEYS.SEARCH_CACHE}_${queryKey}`);
      if (!cacheStr) return null;
      const parsed = JSON.parse(cacheStr);
      // TTL de 24h
      if (Date.now() - parsed.timestamp > 3600000 * 24) {
        localStorage.removeItem(`${STORAGE_KEYS.SEARCH_CACHE}_${queryKey}`);
        return null;
      }
      return parsed.companies;
    } catch {
      return null;
    }
  },

  setSearchCache(queryKey: string, companies: Company[]): void {
    try {
      const payload = {
        timestamp: Date.now(),
        companies,
      };
      localStorage.setItem(`${STORAGE_KEYS.SEARCH_CACHE}_${queryKey}`, JSON.stringify(payload));
    } catch (err) {
      console.warn('Falha ao gravar cache de pesquisa:', err);
    }
  },

  // --- BACKUP & RESTAURAÇÃO (JSON) ---
  exportBackupJson(): string {
    const leads = this.getLeads();
    const settings = this.getSettings();
    const backup = {
      app: 'Radar de Clientes Local',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      leads,
      settings,
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackupJson(jsonString: string): { success: boolean; message: string; leadsCount?: number } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.leads || !Array.isArray(data.leads)) {
        return { success: false, message: 'Arquivo de backup inválido: lista de leads ausente.' };
      }
      this.saveLeads(data.leads);
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      return {
        success: true,
        message: 'Backup restaurado com sucesso!',
        leadsCount: data.leads.length,
      };
    } catch (err: any) {
      return { success: false, message: `Erro ao importar JSON: ${err.message}` };
    }
  },

  // --- EXPORTAÇÃO CSV ---
  exportLeadsToCsv(leads: Company[]): string {
    const headers = [
      'Nome',
      'Segmento',
      'Cidade',
      'Endereco',
      'Telefone',
      'Site',
      'Tem_Site_Proprio',
      'Rede_Social',
      'Status_Comercial',
      'Pontuacao_Oportunidade',
      'Confianca_Score',
      'Servico_Sugerido',
      'Proxima_Acao_Data',
      'Proxima_Acao_Descricao',
      'Fonte_Informacao',
      'Notas',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = leads.map(l => [
      escapeCsv(l.name),
      escapeCsv(l.segment),
      escapeCsv(l.city),
      escapeCsv(l.address || ''),
      escapeCsv(l.phone || ''),
      escapeCsv(l.website || ''),
      escapeCsv(l.hasOwnWebsite ? 'Sim' : 'Não'),
      escapeCsv(l.socialUrl || ''),
      escapeCsv(l.status),
      escapeCsv(l.opportunityScore),
      escapeCsv(l.scoreConfidence),
      escapeCsv(l.targetService || l.analysis?.recommendedService || ''),
      escapeCsv(l.nextActionDate || ''),
      escapeCsv(l.nextActionDescription || ''),
      escapeCsv(l.sourceUrl || ''),
      escapeCsv(l.notes || ''),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  // --- IMPORTAÇÃO CSV ---
  parseCsvToCompanies(csvContent: string, defaultCity: string = 'Formosa, Goiás, Brasil'): Company[] {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    // Simple robust CSV parser handling quoted values
    function parseCsvLine(line: string): string[] {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    }

    const header = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const nameIdx = header.findIndex(h => h.includes('nome') || h.includes('empresa') || h.includes('name'));
    const segmentIdx = header.findIndex(h => h.includes('segmento') || h.includes('nicho') || h.includes('categoria'));
    const cityIdx = header.findIndex(h => h.includes('cidade') || h.includes('city') || h.includes('regiao'));
    const addrIdx = header.findIndex(h => h.includes('endereco') || h.includes('address') || h.includes('rua'));
    const phoneIdx = header.findIndex(h => h.includes('telefone') || h.includes('phone') || h.includes('whatsapp') || h.includes('celular'));
    const siteIdx = header.findIndex(h => h.includes('site') || h.includes('website') || h.includes('url'));
    const socialIdx = header.findIndex(h => h.includes('social') || h.includes('instagram') || h.includes('facebook'));
    const notesIdx = header.findIndex(h => h.includes('nota') || h.includes('observacao') || h.includes('obs'));

    const parsedCompanies: Company[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const name = nameIdx >= 0 ? cols[nameIdx] : cols[0];
      if (!name || name.trim() === '') continue;

      const segment = (segmentIdx >= 0 && cols[segmentIdx]) ? cols[segmentIdx] : 'Geral';
      const city = (cityIdx >= 0 && cols[cityIdx]) ? cols[cityIdx] : defaultCity;
      const address = addrIdx >= 0 ? cols[addrIdx] : undefined;
      const phone = phoneIdx >= 0 ? cols[phoneIdx] : undefined;
      const siteRaw = siteIdx >= 0 ? cols[siteIdx] : undefined;
      const socialUrl = socialIdx >= 0 ? cols[socialIdx] : undefined;
      const notes = notesIdx >= 0 ? cols[notesIdx] : undefined;

      const hasWebsite = Boolean(siteRaw && siteRaw.trim().length > 3 && !siteRaw.toLowerCase().includes('instagram') && !siteRaw.toLowerCase().includes('facebook'));

      parsedCompanies.push({
        id: `csv_lead_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        segment: segment.trim(),
        city: city.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        website: hasWebsite ? siteRaw?.trim() : null,
        socialUrl: socialUrl?.trim() || (!hasWebsite && siteRaw ? siteRaw.trim() : null),
        sourceUrl: 'Importação CSV',
        hasOwnWebsite: hasWebsite,
        websiteStatus: hasWebsite ? 'proprio' : 'sem_site',
        opportunityScore: hasWebsite ? 55 : 80,
        scoreConfidence: phone ? 'medio' : 'baixo',
        status: 'novo',
        notes: notes?.trim() || 'Importado via planilha CSV.',
        contactHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return parsedCompanies;
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.LEADS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    // Limpa caches
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_KEYS.SEARCH_CACHE)) {
        localStorage.removeItem(key);
      }
    });
  },
};
