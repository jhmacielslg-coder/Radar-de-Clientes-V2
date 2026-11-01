# Radar de Clientes Local — MVP com Gemini API

Aplicação web profissional para prospecção comercial e venda de serviços digitais (sites, cardápios digitais, agentes WhatsApp, agendamento on-line e automações) para empresas locais, com foco inicial em Formosa (Goiás, Brasil) e suporte a qualquer região.

> [!IMPORTANT]
> **Decisões Críticas de Arquitetura e Restrições Técnicas:**
> - **Zero Exposição de Chaves:** A chave da API Gemini permanece 100% segura no backend Node.js/Express (`server.ts`). Nenhuma chave ou chamada direta ao SDK `@google/genai` é feita pelo navegador.
> - **Sem Dependências Pagas / Google Cloud Console Adicional:** Não utiliza Google Maps Platform, Places API nem PageSpeed Insights API. A pesquisa de empresas é conduzida via **Google Search Grounding** nativo do Gemini ou via **Importação de CSV / Cadastro Manual**.
> - **Anti-Alucinação e Honestidade de Dados:** Sem notas simuladas de Lighthouse ou auditorias falsas. Toda análise é qualitativa, identificando explicitamente dados ausentes como "Não verificado" ou "Não identificado", com grau de confiança associado.
> - **Prospecção Responsável:** Rascunhos para contato individual direto, sem envio automático de mensagens em massa (anti-spam).

---

## 1. Visão Geral e Conceito do Produto

O **Radar de Clientes Local** é um cockpit de inteligência comercial para freelancers e agências digitais. Ele automatiza a identificação de gaps digitais em negócios de bairro e da cidade, calcula o potencial de oportunidade de cada empresa e elabora abordagens comerciais altamente personalizadas e éticas.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RADAR DE CLIENTES LOCAL                         │
├───────────────┬────────────────────────────────────────────────────────┤
│ MENU LATERAL  │ ÁREA PRINCIPAL                                         │
│               │                                                        │
│ 🔍 Pesquisar  │ • Busca Assistida (Gemini Search Grounding) + Fontes   │
│ 🏢 Perfil &   │ • Importação CSV / Cadastro Manual                     │
│    Análise    │ • Análise Qualitativa (Checklist 14 pontos)            │
│ 📊 Radar de   │ • Score de Oportunidade 0-100 (Transparente e Ajustável│
│    Nichos     │ • Abordagens Comerciais (Telefone 30s, WhatsApp, Email)│
│ 📋 Meus Leads │ • CRM Visual (Tabela & Kanban 7 estágios com métricas) │
│ ⚙️ Ajustes    │ • Perfil do Vendedor, Backup JSON e Pesos de Pontuação │
└───────────────┴────────────────────────────────────────────────────────┘
```

---

## 2. Experiência do Usuário e Design Visual

- **Paleta de Cores e Estética:** Fundo claro limpo (`bg-slate-50` / `bg-white`), tipografia cinza-escura de alto contraste (`text-slate-800`/`900`), acentos em **verde-escuro institucional / esmeralda** (`emerald-700` / `emerald-800`) para transmitir credibilidade comercial e prosperidade, com toques de âmbar (`amber-600`) para status intermediários e vermelho suave (`rose-600`) para pontos de atenção. Zero degradês roxos saturados ou elementos genéricos estilo IA.
- **Tipografia:** Tipografia sans-serif limpa e contemporânea (`Plus Jakarta Sans` / `Outfit` no display e títulos, `DM Sans` / `Inter` para leitura fluida), e números tabulares (`font-mono` / `tabular-nums`) para indicadores, métricas do funil e scores.
- **Disciplina Visual Anti-Slop:**
  - Sem tags ou "pílulas" estáticas decorativas para metadados simples; uso de separadores tipográficos discretos (`·`, `/`).
  - Botões de filtro funcionais com estados ativos segmentados claros.
  - Cards de negócio com bordas sutis de 1px (`border-slate-200`) e hierarquia imediata: nome da empresa, segmento e cidade em primeiro plano.
- **Feedback Interativo:** Estados de carregamento com esqueletos dimensionados, barras de progresso para análises em lote, feedback instantâneo ao copiar abordagens e confirmações em modais para ações destrutivas.

---

## 3. Arquitetura da Aplicação & Tecnologias

### Arquitetura do Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                    NAVEGADOR (React 19 SPA)                  │
│                                                              │
│  [Views: Pesquisa | Perfil | Radar Nichos | Leads | Config]   │
│                             │                                │
│                             ▼                                │
│        [Camada de Serviços do Cliente: apiService.ts]        │
│                             │                                │
│      [Armazenamento Local: storageService.ts (localStorage)]  │
└─────────────────────────────┬────────────────────────────────┘
                              │ Chamadas HTTP REST (/api/*)
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  SERVIDOR BACKEND (Express / tsx)            │
│                         server.ts                            │
│                                                              │
│  Rotas de API Seguras:                                       │
│  • POST /api/search-businesses (Gemini + Google Search)      │
│  • POST /api/analyze-business  (Gemini Análise Estruturada)  │
│  • POST /api/generate-outreach (Gemini Redação Comercial)   │
│  • POST /api/compare-niches    (Gemini Síntese de Mercado)   │
│                             │                                │
│                             ▼                                │
│    SDK @google/genai com GEMINI_API_KEY (Server Environment) │
│    Headers: 'User-Agent': 'aistudio-build'                   │
│    Modelos: gemini-3.8-flash                                 │
└──────────────────────────────────────────────────────────────┘
```

### Tecnologias Utilizadas
1. **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React (ícones), Motion (microtransições).
2. **Backend:** Node.js, Express, tsx (`"dev": "tsx server.ts"` montando `vite.middlewares` no ambiente de desenvolvimento).
3. **IA & Grounding:** `@google/genai` (v2.4.0) no backend com ferramentas nativas `googleSearch: {}` e `urlContext: {}`.
4. **Persistência Local:** `localStorage` com repositório estruturado, isolado e pronto para migração futura para Firestore/Firebase.

---

## 4. Telas e Funcionalidades Detalhadas

### 4.1. Tela 1: Pesquisar Empresas
- **Campos de Busca:**
  - Região (Padrão: "Formosa, Goiás, Brasil", editável para qualquer cidade/estado/bairro).
  - Nicho de mercado (seletor com 17 nichos iniciais pré-cadastrados + opção de adicionar nichos customizados).
  - Palavra-chave adicional (ex: "centro", "delivery", "urgência").
  - Serviço digital pretendido (Site/Landing Page, Cardápio Digital, Agente WhatsApp, Agendamento Online, Automações).
- **Mecanismos de Alimentação:**
  - **Opção A - Pesquisa Assistida por IA (Google Search Grounding):** Chama `/api/search-businesses`. O Gemini pesquisa fontes públicas da web para a região especificada e extrai dados de negócios reais, acompanhados das URLs originais de origem (`groundingChunks`).
  - **Opção B - Importação CSV & Cadastro Manual:** Upload ou colagem de CSV (com modelo de exemplo pronto para download) com campos Nome, Segmento, Cidade, Endereço, Telefone, Site, Rede Social, Fonte e Observações. Modal de cadastro manual para inclusão pontual rápida.
- **Visualização dos Resultados:**
  - Alternância entre Tabela de Alta Densidade e Grid de Cartões.
  - Indicadores claros: Etiqueta "Sem site identificado" quando houver apenas redes sociais/Linktree/agregadores; telefone com link direto para WhatsApp/chamada; pontuação provisória de oportunidade.
  - Filtros rápidos: "Apenas sem site", "Com telefone", "Por nicho", "Nota mínima".
  - Ações em lote: Selecionar múltiplos negócios para "Salvar em Meus Leads", "Analisar Selecionados" e "Exportar para CSV".

### 4.2. Tela 2: Perfil e Análise do Negócio
- **Ficha Cadastral:** Nome fantasia, segmento, cidade, endereço completo, telefone com atalho direto, link do site ou indicação clara de ausência, links de redes sociais, fonte da informação e histórico de anotações.
- **Controle de Pipeline:** Status atual, data da última análise, agendamento de data e descrição da próxima ação.
- **Análise Qualitativa com Gemini (14 Itens Estruturados):**
  1. Resumo da atividade em 2 frases.
  2. Público-alvo provável (marcado como inferência).
  3. Clareza das informações comerciais.
  4. Facilidade aparente de contato.
  5. Presença de chamada para ação (CTA).
  6. Presença de botão de WhatsApp.
  7. Presença de agendamento/reserva on-line.
  8. Presença de formulário de contato.
  9. Sinais de problemas de UX/usabilidade.
  10. Problemas comerciais observáveis.
  11. De 3 a 5 oportunidades de melhoria específicas.
  12. Serviço digital recomendado para ofertar primeiro.
  13. Justificativa comercial da recomendação.
  14. Próxima ação comercial prática sugerida.
  *Estados dos itens:* `Identificado`, `Não identificado`, `Não verificado`, `Não aplicável`.
- **Tratamento de Negócios sem Site:** Não inventa auditoria de site inexistente. Foca na oportunidade de presença digital própria (criação de site institucional, cardápio digital ou catálogo integrado ao WhatsApp).
- **Pontuação de Oportunidade (0 a 100):** Cálculo transparente com visualização de subpontos, justificativa por critério, dados ausentes e indicador de grau de confiança (baixo/médio/alto).
- **Gerador de Abordagens Comerciais Personalizadas:**
  - **Roteiro de Ligação:** ~30 segundos, natural, focado em dor real sem pressão apelativa.
  - **WhatsApp:** Mensagem curta, individual e direta para início de diálogo.
  - **E-mail:** Assunto atraente e proposta pontual de melhoria.
  - Botões de ação: "Copiar texto", "Gerar novamente", "Alterar tom" e "Marcar como utilizado".
  - Aviso de boas práticas presente: "Rascunhos para contato individual. Não envie mensagens comerciais em massa sem consentimento."

### 4.3. Tela 3: Radar de Nichos
- **Comparativo de Segmentos:** Permite selecionar uma cidade e comparar de 2 a 6 nichos simultaneamente.
- **Métricas por Nicho:** Total de empresas encontradas na amostra, total e % sem site identificado, quantidade com telefone cadastrado, serviço mais aderente e avisos sobre limitações amostrais.
- **Diagnóstico com Gemini:** Interpreta os dados locais e sugere os 3 nichos prioritários para prospecção, fundamentando o porquê, qual serviço ofertar, qual dor abordar e como abordar.
- **Confirmação Prévia:** Mostra o número estimado de chamadas ao Gemini antes de iniciar a pesquisa comparativa.
- **Ação Direta:** Botão "Ver empresas deste nicho" para filtrar diretamente na busca/leads.

### 4.4. Tela 4: Meus Leads (CRM Comercial)
- **Modos de Exibição:** Tabela de Dados e Quadro Kanban com arrastar/mover entre estágios.
- **7 Estágios do Funil:**
  1. *Novo* (importado/pesquisado)
  2. *Analisado* (com diagnóstico Gemini e score)
  3. *Contatado* (mensagem ou ligação enviada)
  4. *Respondeu* (abriu conversa comercial)
  5. *Reunião* (demonstração ou diagnóstico agendado)
  6. *Cliente* (contrato fechado / serviço vendido)
  7. *Descartado* (sem interesse ou perfil incompatível)
- **Indicadores no Topo:** Total de leads, leads sem site, leads analisados, contatados, reuniões agendadas e clientes conquistados.
- **Histórico Comercial:** Registro manual de interações (data, canal utilizado, notas da conversa).
- **Ferramentas:** Busca em tempo real por nome/segmento, filtros por status, ordenação por pontuação ou data da próxima ação, exportação e importação de planilha CSV.

### 4.5. Tela 5: Configurações & Preferências
- **Perfil do Vendedor:** Nome, cidade, serviços oferecidos com descrição, diferenciais de atendimento, anos de experiência, tom padrão (direto, consultivo, amigável) e chamada para ação (CTA) preferida.
- **Ajuste de Pesos do Score:** Permite calibrar os pontos máximos atribuídos a cada critério da pontuação (0 a 100).
- **Preferências Padrão:** Região padrão da busca (ex: Formosa, GO) e seleção de nichos favoritos.
- **Gerenciamento de Dados:** Backup completo (download de arquivo `.json`), restauração de backup com validação de esquema e limpeza de dados locais com confirmação dupla.
- **Monitor de Operações:** Registro de chamadas realizadas no cliente (estimativa transparente de operações locais) e tratamento amigável de erros de cota (429/403).

---

## 5. Como a API Gemini Será Utilizada

1. **Pesquisa com Search Grounding (`/api/search-businesses`):**
   - Modelo: `gemini-3.8-flash`
   - Configuração: `tools: [{ googleSearch: {} }]`
   - Prompt: Busca negócios reais no nicho e região, estruturando nome, endereço, telefone, links e canais públicos, sem inventar informações.
   - Extração de fontes: Extrai URLs de `groundingMetadata.groundingChunks` para visualização auditável pelo usuário.
2. **Análise Qualitativa de Negócio (`/api/analyze-business`):**
   - Modelo: `gemini-3.8-flash`
   - Configuração: `tools: [{ urlContext: {} }]` quando houver site informado, ou análise baseada nos dados cadastrais fornecidos.
   - Schema JSON estruturado com os 14 quesitos padronizados.
3. **Geração de Abordagens Comerciais (`/api/generate-outreach`):**
   - Modelo: `gemini-3.8-flash`
   - Prompt calibrado com o Perfil do Vendedor (tom, serviço oferecido) e o Perfil da Empresa (problemas reais identificados), gerando os 3 formatos (ligação, WhatsApp, e-mail) sem clichês ou promessas irreais.
4. **Comparativo do Radar de Nichos (`/api/compare-niches`):**
   - Modelo: `gemini-3.8-flash`
   - Síntese estruturada das amostras para eleger 3 nichos prioritários com justificativas e plano de ação.

---

## 6. Estratégia de Armazenamento Local

- **Isolamento de Camada:** Módulo `src/services/storageService.ts` encapsulando operações do `localStorage`.
- **Chaves de Armazenamento:**
  - `radar_leads`: Lista completa de empresas/leads e históricos.
  - `radar_settings`: Perfil do vendedor, pesos de pontuação e preferências.
  - `radar_search_cache`: Cache de buscas recentes com expiração de 24h para evitar consultas redundantes à API.
  - `radar_custom_niches`: Nichos customizados cadastrados pelo usuário.
- **Preparação para Nuvem:** Todas as entidades possuem `id` (UUID), `createdAt` e `updatedAt` no padrão compatível com migração direta para Firestore/Firebase.
- **Backup e Restauração:** Exporta todo o estado em arquivo JSON estruturado e permite restauração completa a qualquer momento.

---

## 7. Método de Pesquisa de Empresas sem Places API

Como a aplicação não depende da Google Maps Platform / Places API, a busca é resolvida por duas vias complementares:
1. **Google Search Grounding no Gemini 3.8 Flash:** A IA executa consultas na web sobre estabelecimentos locais, diretórios públicos e redes sociais da região informada, capturando dados reais e retornando os links de onde as informações foram extraídas.
2. **Importação CSV e Cadastro Manual:** Para quando o usuário já possuir listas de contatos, associações comerciais ou desejar prospectar empresas que acabou de visitar pessoalmente.

---

## 8. Limitações Conhecidas e Alternativas Adotadas

| Limitação | Impacto | Alternativa / Tratamento no Radar |
|---|---|---|
| **Sem Places API** | Não há garantia de listagem 100% exaustiva de todas as empresas da cidade. | Informar expressamente ao usuário que a busca exibe uma amostra baseada em fontes web acessíveis; disponibilizar importação CSV e cadastro manual. |
| **Sem PageSpeed Insights** | Não há medições de milissegundos de FCP/LCP ou scores Lighthouse técnicos. | Proibição de scores técnicos fictícios. Toda análise é qualitativa (clareza, contato, CTA, mobile-friendly aparente, ausência de site próprio). |
| **Sites inacessíveis ou bloqueados** | O Gemini pode não conseguir carregar sites com bloqueios anti-bot ou fora do ar. | Classificar o item como "Não verificado" em vez de assumir que o site não funciona; permitir inclusão de observações manuais pelo usuário. |
| **Dados em localStorage** | Os dados ficam salvos no navegador do usuário. | Aviso transparente na interface com botão fácil de "Exportar Backup JSON" para segurança dos dados. |

---

## 9. Modelo de Dados (TypeScript Interfaces)

```typescript
export type LeadStatus =
  | 'novo'
  | 'analisado'
  | 'contatado'
  | 'respondeu'
  | 'reuniao'
  | 'cliente'
  | 'descartado';

export interface Company {
  id: string;
  name: string;
  segment: string;
  city: string;
  address?: string;
  phone?: string;
  website?: string;
  socialUrl?: string;
  sourceUrl?: string;
  hasOwnWebsite: boolean; // false se sem site ou se link for rede social/agregador
  websiteStatus: 'proprio' | 'sem_site' | 'apenas_redes' | 'nao_verificado';
  opportunityScore: number;
  scoreConfidence: 'baixo' | 'medio' | 'alto';
  scoreDetails?: ScoreBreakdown;
  status: LeadStatus;
  notes?: string;
  contactHistory: ContactLogEntry[];
  nextActionDate?: string;
  nextActionDescription?: string;
  lastAnalysisDate?: string;
  analysis?: CompanyAnalysis;
  outreachDrafts?: OutreachDrafts;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreBreakdown {
  noOwnWebsiteScore: number;       // até 30
  missingCommercialInfoScore: number; // até 15
  contactDifficultyScore: number;     // até 15
  noBookingOrOrderScore: number;      // até 15
  digitalPresentationScore: number;   // até 15
  activeBusinessBonus: number;        // até 10
  total: number;
  missingData: string[];
  justification: Record<string, string>;
}

export interface ChecklistItem {
  id: string;
  label: string;
  status: 'identificado' | 'nao_identificado' | 'nao_verificado' | 'nao_aplicavel';
  details?: string;
}

export interface CompanyAnalysis {
  summary: string;
  targetAudience: string;
  isAudienceInference: boolean;
  checklist: ChecklistItem[];
  uxIssues: string[];
  commercialIssues: string[];
  opportunities: string[];
  recommendedService: string;
  recommendationJustification: string;
  suggestedNextStep: string;
  analyzedAt: string;
}

export interface OutreachDrafts {
  phoneScript: string;
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
  generatedAt: string;
  tone: 'direto' | 'consultivo' | 'amigavel';
  usedFormats: { phone: boolean; whatsapp: boolean; email: boolean };
}

export interface ContactLogEntry {
  id: string;
  date: string;
  channel: 'telefone' | 'whatsapp' | 'email' | 'presencial' | 'outro';
  notes: string;
}

export interface SellerProfile {
  name: string;
  city: string;
  servicesOffered: string[];
  differentials: string;
  experienceYears: number;
  preferredTone: 'direto' | 'consultivo' | 'amigavel';
  priceRange?: string;
  preferredCta: string;
}

export interface ScoringWeights {
  noOwnWebsite: number;        // padrão: 30
  missingCommercialInfo: number; // padrão: 15
  contactDifficulty: number;     // padrão: 15
  noBookingOrOrder: number;      // padrão: 15
  digitalPresentation: number;   // padrão: 15
  activeBusinessBonus: number;   // padrão: 10
}
```

---

## 10. Ordem de Implementação e Verificação

### Fase 1: Setup Full-Stack, Layout Base e Navegação
- Configuração do servidor Express (`server.ts`) com proxy para `/api/*` e integração de `@google/genai`.
- Atualização do `metadata.json` e `index.html` com os metadados do Radar de Clientes Local.
- Criação do Sidebar de navegação responsivo (5 telas), cabeçalho com contexto de região e breadcrumbs, e estrutura de layout profissional em Tailwind v4.

### Fase 2: Camada de Armazenamento, Cadastro Manual e Importação CSV
- Implementação de `storageService.ts` com validação de esquema, inicialização com dados padrão de exemplo identificados claramente, e persistência em `localStorage`.
- Formulário modal de cadastro manual de empresa com validação.
- Módulo de importação CSV (com parse local robusto e botão para baixar modelo CSV pré-formatado) e exportação para CSV.

### Fase 3: Pesquisa Assistida por IA (Google Search Grounding)
- Criação da rota backend `/api/search-businesses` com `gemini-3.8-flash` e ferramenta `googleSearch: {}`.
- Classificação automática de domínios oficiais vs redes sociais/agregadores ("Sem site próprio identificado").
- Exibição de resultados em tabela/cartões, lista de links de fontes originais auditáveis, filtros e seleção múltipla.

### Fase 4: Perfil do Negócio, Análise com Gemini e Cálculo do Score
- Rota backend `/api/analyze-business` com retorno JSON dos 14 itens padronizados e oportunidades de melhoria.
- Motor de cálculo de oportunidade (0 a 100) com decomposição por critério, exibição de dados ausentes e indicador de confiança.
- Visualização completa na tela "Perfil do Negócio".

### Fase 5: Gerador de Abordagens Comerciais (Scripts)
- Rota backend `/api/generate-outreach` integrando Perfil do Vendedor com o Perfil da Empresa.
- Geração dos 3 formatos: Ligação (30s), WhatsApp e E-mail.
- Botões de cópia rápida, regeneração, troca de tom e marcação de uso com aviso de contato individual.

### Fase 6: Gestão de Leads (CRM Tabela & Kanban)
- Tela "Meus Leads" com alternância Tabela / Kanban de 7 estágios.
- Métricas em tempo real no topo do funil (taxa de conversão, reuniões agendadas, clientes).
- Histórico manual de contatos e agendamento da próxima ação com filtros de busca.

### Fase 7: Radar de Nichos
- Rota backend `/api/compare-niches` para diagnóstico simultâneo de segmentos em uma cidade.
- Indicador de consultas Gemini com confirmação prévia do usuário.
- Painel comparativo com as 3 principais oportunidades sugeridas pela IA e atalho para prospecção.

### Fase 8: Configurações, Backup, Polimento e Compilação
- Edição do Perfil do Vendedor, preferências de região e personalização dos pesos da pontuação de 0 a 100.
- Exportação e restauração de backup JSON completo.
- Verificação rigorosa com `compile_applet` e testes de responsividade desktop/mobile.
