import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Instagram, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  MinusCircle, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  Send, 
  MessageSquare, 
  Mail, 
  PhoneCall, 
  AlertTriangle, 
  ShieldAlert, 
  Edit3, 
  Save, 
  Plus, 
  ArrowLeft,
  Loader2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Company, LeadStatus, ChecklistItem, ContactLogEntry } from '../types';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';

interface BusinessProfileViewProps {
  company: Company;
  onBack: () => void;
  onUpdateCompany: (updated: Company) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const BusinessProfileView: React.FC<BusinessProfileViewProps> = ({
  company,
  onBack,
  onUpdateCompany,
  onToast,
}) => {
  // Local editable company state
  const [currentCompany, setCurrentCompany] = useState<Company>(company);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [activeOutreachTab, setActiveOutreachTab] = useState<'phone' | 'whatsapp' | 'email'>('whatsapp');
  const [selectedTone, setSelectedTone] = useState<'consultivo' | 'direto' | 'amigavel'>('consultivo');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Next action form
  const [nextActionDate, setNextActionDate] = useState(company.nextActionDate || '');
  const [nextActionDesc, setNextActionDesc] = useState(company.nextActionDescription || '');

  // Notes
  const [personalNotes, setPersonalNotes] = useState(company.notes || '');

  // New contact log entry
  const [logChannel, setLogChannel] = useState<'telefone' | 'whatsapp' | 'email' | 'presencial' | 'outro'>('whatsapp');
  const [logNotes, setLogNotes] = useState('');
  const [isAddingLog, setIsAddingLog] = useState(false);

  // Status transitions
  const leadStatuses: Array<{ id: LeadStatus; label: string; color: string }> = [
    { id: 'novo', label: 'Novo', color: 'bg-slate-100 text-slate-700' },
    { id: 'analisado', label: 'Analisado', color: 'bg-blue-100 text-blue-800' },
    { id: 'contatado', label: 'Contatado', color: 'bg-amber-100 text-amber-800' },
    { id: 'respondeu', label: 'Respondeu', color: 'bg-purple-100 text-purple-800' },
    { id: 'reuniao', label: 'Reunião', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'cliente', label: 'Cliente Fechado', color: 'bg-emerald-100 text-emerald-800' },
    { id: 'descartado', label: 'Descartado', color: 'bg-rose-100 text-rose-800' },
  ];

  const handleStatusChange = (newStatus: LeadStatus) => {
    const updated = {
      ...currentCompany,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    setCurrentCompany(updated);
    storageService.updateLead(updated);
    onUpdateCompany(updated);
    onToast(`Status alterado para "${newStatus.toUpperCase()}".`, 'info');
  };

  // Save Next Action & Notes
  const handleSaveCadastralUpdates = () => {
    const updated = {
      ...currentCompany,
      nextActionDate: nextActionDate || null,
      nextActionDescription: nextActionDesc || null,
      notes: personalNotes,
      updatedAt: new Date().toISOString(),
    };
    setCurrentCompany(updated);
    storageService.updateLead(updated);
    onUpdateCompany(updated);
    onToast('Dados do lead atualizados com sucesso!', 'success');
  };

  // Add Contact Log
  const handleAddContactLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logNotes.trim()) return;

    const newEntry: ContactLogEntry = {
      id: `log_${Date.now()}`,
      date: new Date().toISOString(),
      channel: logChannel,
      notes: logNotes.trim(),
    };

    const updated = {
      ...currentCompany,
      contactHistory: [newEntry, ...(currentCompany.contactHistory || [])],
      status: currentCompany.status === 'novo' ? 'contatado' : currentCompany.status,
      updatedAt: new Date().toISOString(),
    };

    setCurrentCompany(updated);
    storageService.updateLead(updated);
    onUpdateCompany(updated);
    setLogNotes('');
    setIsAddingLog(false);
    onToast('Interação registrada no histórico comercial!', 'success');
  };

  // Run Gemini Analysis (14 items + score)
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const settings = storageService.getSettings();
      const res = await apiService.analyzeBusiness(currentCompany, settings.weights);

      const updated: Company = {
        ...currentCompany,
        analysis: res.analysis,
        opportunityScore: res.opportunityScore,
        scoreConfidence: res.scoreConfidence,
        scoreDetails: res.scoreDetails,
        lastAnalysisDate: new Date().toISOString(),
        status: currentCompany.status === 'novo' ? 'analisado' : currentCompany.status,
        updatedAt: new Date().toISOString(),
      };

      setCurrentCompany(updated);
      storageService.updateLead(updated);
      onUpdateCompany(updated);
      onToast('Diagnóstico comercial concluído com sucesso pelo Gemini!', 'success');

      // Auto-generate outreach if none exists yet
      if (!updated.outreachDrafts) {
        handleGenerateOutreach(updated);
      }
    } catch (err: any) {
      console.error(err);
      onToast(err.message || 'Falha ao analisar empresa.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run Outreach Generator
  const handleGenerateOutreach = async (targetCompany?: Company, toneOverride?: string) => {
    setIsGeneratingOutreach(true);
    try {
      const comp = targetCompany || currentCompany;
      const settings = storageService.getSettings();
      const tone = toneOverride || selectedTone || settings.sellerProfile.preferredTone;

      const res = await apiService.generateOutreach(
        comp,
        settings.sellerProfile,
        comp.analysis,
        tone
      );

      const updated: Company = {
        ...comp,
        outreachDrafts: res.outreachDrafts,
        updatedAt: new Date().toISOString(),
      };

      setCurrentCompany(updated);
      storageService.updateLead(updated);
      onUpdateCompany(updated);
      onToast('Novas abordagens personalizadas geradas!', 'success');
    } catch (err: any) {
      console.error(err);
      onToast(err.message || 'Falha ao gerar roteiros de contato.', 'error');
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  // Copy text helper
  const handleCopyText = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    onToast('Texto copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  // Helper status badge for checklist
  const renderChecklistBadge = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'identificado':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Identificado
          </span>
        );
      case 'nao_identificado':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Não identificado
          </span>
        );
      case 'nao_verificado':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Não verificado
          </span>
        );
      case 'nao_aplicavel':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
            Não aplicável
          </span>
        );
    }
  };

  // WhatsApp formatted link
  const cleanPhoneDigits = currentCompany.phone ? currentCompany.phone.replace(/\D/g, '') : '';
  const waLink = cleanPhoneDigits.length >= 8
    ? `https://wa.me/55${cleanPhoneDigits}?text=${encodeURIComponent(
        currentCompany.outreachDrafts?.whatsappMessage || `Olá, falo com o responsável pela ${currentCompany.name}?`
      )}`
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista</span>
        </button>

        <div className="flex items-center gap-2">
          {currentCompany.isDemoData && (
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
              Dados de Exemplo Inicial
            </span>
          )}
          <span className="text-xs text-slate-400">
            Última atualização: {new Date(currentCompany.updatedAt).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Identity info */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {currentCompany.name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80">
                {currentCompany.segment}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{currentCompany.city}</span>
                {currentCompany.address && <span>· {currentCompany.address}</span>}
              </div>

              {currentCompany.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${currentCompany.phone}`} className="font-mono text-emerald-800 hover:underline">
                    {currentCompany.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Direct Digital Presence Links */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {currentCompany.hasOwnWebsite && currentCompany.website ? (
                <a
                  href={currentCompany.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Site Oficial</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  <Globe className="w-3.5 h-3.5 text-rose-500" />
                  Sem site próprio identificado
                </span>
              )}

              {currentCompany.socialUrl && (
                <a
                  href={currentCompany.socialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  <span>Rede Social</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Abrir no WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Opportunity Score Block */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:w-72 shrink-0 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Score de Oportunidade
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Confiança: <b className="capitalize text-slate-700">{currentCompany.scoreConfidence}</b>
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900 tabular-nums">
                {currentCompany.opportunityScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
              <span
                className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-md ${
                  currentCompany.opportunityScore >= 75
                    ? 'bg-emerald-100 text-emerald-900'
                    : currentCompany.opportunityScore >= 50
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-rose-100 text-rose-900'
                }`}
              >
                {currentCompany.opportunityScore >= 75
                  ? 'Alta Oportunidade'
                  : currentCompany.opportunityScore >= 50
                  ? 'Média Prioridade'
                  : 'Baixa Prioridade'}
              </span>
            </div>

            {/* Score progress bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-500 ${
                  currentCompany.opportunityScore >= 75
                    ? 'bg-emerald-600'
                    : currentCompany.opportunityScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, currentCompany.opportunityScore)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Baseado na ausência de canais próprios, facilidade de contato e gaps de atendimento observáveis.
            </p>
          </div>
        </div>

        {/* Pipeline Status Selector Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-700 mr-1">Status Comercial:</span>
            {leadStatuses.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleStatusChange(st.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentCompany.status === st.id
                    ? `${st.color} ring-2 ring-emerald-600/20 font-bold shadow-2xs`
                    : 'text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={isAnalyzing}
            onClick={handleRunAnalysis}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analisando com Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{currentCompany.analysis ? 'Reanalisar Negócio' : 'Analisar Negócio com Gemini'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: 2 Columns (Left: 14-point Analysis & Gaps, Right: Outreach Scripts & History) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Checklist & Qualitative Analysis (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Analysis Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Diagnóstico Qualitativo (14 Quesitos)</h3>
                  <p className="text-[11px] text-slate-500">Avaliação honesta de presença e gaps comerciais</p>
                </div>
              </div>

              {currentCompany.lastAnalysisDate && (
                <span className="text-[11px] text-slate-400">
                  {new Date(currentCompany.lastAnalysisDate).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>

            {!currentCompany.analysis ? (
              <div className="py-10 text-center">
                <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Nenhuma análise estruturada gerada ainda</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Clique no botão "Analisar Negócio com Gemini" acima para produzir o diagnóstico de 14 itens e o checklist comercial.
                </p>
                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 cursor-pointer"
                >
                  Gerar Análise Agora
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* 1. Summary & 2. Audience */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      1. Resumo da Atividade Comercial
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {currentCompany.analysis.summary}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        2. Público-Alvo Provável
                      </h4>
                      {currentCompany.analysis.isAudienceInference && (
                        <span className="text-[10px] text-slate-400 italic">
                          (inferência qualitativa)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {currentCompany.analysis.targetAudience}
                    </p>
                  </div>
                </div>

                {/* Checklist (Items 3 to 10) */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2.5">
                    Checklist de Verificação de Canais
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {currentCompany.analysis.checklist.map((item) => (
                      <div key={item.id} className="p-3 flex items-start justify-between gap-3 bg-white hover:bg-slate-50/50">
                        <div>
                          <div className="text-xs font-medium text-slate-800">{item.label}</div>
                          {item.details && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{item.details}</p>
                          )}
                        </div>
                        <div className="shrink-0">{renderChecklistBadge(item.status)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 11. Improvement Opportunities */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2">
                    Oportunidades de Melhoria Identificadas (3 a 5 pontos)
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {currentCompany.analysis.opportunities.map((opp, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-emerald-50/50 border border-emerald-100/80 p-2.5 rounded-lg">
                        <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold text-[11px] shrink-0 font-mono">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 12. Recommended Service & 13. Justification */}
                <div className="bg-emerald-800 text-white rounded-xl p-4.5 shadow-2xs space-y-2">
                  <div className="text-[11px] text-emerald-200 font-semibold uppercase tracking-wider">
                    Serviço Recomendado para Oferecer Primeiro
                  </div>
                  <div className="text-sm font-bold tracking-tight">
                    {currentCompany.analysis.recommendedService}
                  </div>
                  <p className="text-xs text-emerald-100 leading-relaxed">
                    <b>Por que oferecer:</b> {currentCompany.analysis.recommendationJustification}
                  </p>
                  <div className="pt-2 border-t border-emerald-700/60 text-xs text-emerald-200">
                    <b>Próxima ação comercial sugerida:</b> {currentCompany.analysis.suggestedNextStep}
                  </div>
                </div>

                {/* Score Breakdown Transparency */}
                {currentCompany.scoreDetails && (
                  <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
                    <h4 className="font-bold text-slate-800">
                      Transparência da Pontuação ({currentCompany.scoreDetails.total}/100)
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-500 block">Sem site próprio:</span>
                        <b className="text-slate-800 font-mono">+{currentCompany.scoreDetails.noOwnWebsiteScore} pts</b>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-500 block">Dificuldade de contato:</span>
                        <b className="text-slate-800 font-mono">+{currentCompany.scoreDetails.contactDifficultyScore} pts</b>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-500 block">Sem agendamento/pedido:</span>
                        <b className="text-slate-800 font-mono">+{currentCompany.scoreDetails.noBookingOrOrderScore} pts</b>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-500 block">Apresentação digital:</span>
                        <b className="text-slate-800 font-mono">+{currentCompany.scoreDetails.digitalPresentationScore} pts</b>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Outreach Scripts, Next Action & Contact History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Commercial Outreach Drafts Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Primeiro Contato com o Cliente</h3>
                <p className="text-[11px] text-slate-500">Roteiros personalizados com a API Gemini</p>
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  value={selectedTone}
                  onChange={(e) => {
                    const newTone = e.target.value as any;
                    setSelectedTone(newTone);
                    handleGenerateOutreach(currentCompany, newTone);
                  }}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:outline-none"
                >
                  <option value="consultivo">Consultivo</option>
                  <option value="direto">Direto</option>
                  <option value="amigavel">Amigável</option>
                </select>

                <button
                  type="button"
                  disabled={isGeneratingOutreach}
                  onClick={() => handleGenerateOutreach()}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Regenerar mensagens"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingOutreach ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Outreach Tabs */}
            <div className="flex border-b border-slate-100 mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveOutreachTab('whatsapp')}
                className={`flex-1 py-2 text-center border-b-2 cursor-pointer transition-colors ${
                  activeOutreachTab === 'whatsapp'
                    ? 'border-emerald-700 text-emerald-800 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setActiveOutreachTab('phone')}
                className={`flex-1 py-2 text-center border-b-2 cursor-pointer transition-colors ${
                  activeOutreachTab === 'phone'
                    ? 'border-emerald-700 text-emerald-800 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Ligação (30s)
              </button>
              <button
                type="button"
                onClick={() => setActiveOutreachTab('email')}
                className={`flex-1 py-2 text-center border-b-2 cursor-pointer transition-colors ${
                  activeOutreachTab === 'email'
                    ? 'border-emerald-700 text-emerald-800 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                E-mail
              </button>
            </div>

            {/* Draft Content */}
            {!currentCompany.outreachDrafts ? (
              <div className="py-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-3">
                  Nenhum roteiro gerado ainda para esta empresa.
                </p>
                <button
                  type="button"
                  onClick={() => handleGenerateOutreach()}
                  disabled={isGeneratingOutreach}
                  className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 cursor-pointer"
                >
                  {isGeneratingOutreach ? 'Gerando...' : 'Gerar Roteiros Comerciais'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOutreachTab === 'whatsapp' && (
                  <div className="space-y-2.5">
                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                      {currentCompany.outreachDrafts.whatsappMessage}
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleCopyText(currentCompany.outreachDrafts!.whatsappMessage, 'whatsapp')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                      >
                        {copiedFormat === 'whatsapp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedFormat === 'whatsapp' ? 'Copiado!' : 'Copiar WhatsApp'}</span>
                      </button>

                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer shadow-2xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Enviar no WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {activeOutreachTab === 'phone' && (
                  <div className="space-y-2.5">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-sans">
                      {currentCompany.outreachDrafts.phoneScript}
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleCopyText(currentCompany.outreachDrafts!.phoneScript, 'phone')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                      >
                        {copiedFormat === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedFormat === 'phone' ? 'Copiado!' : 'Copiar Roteiro'}</span>
                      </button>

                      {currentCompany.phone && (
                        <a
                          href={`tel:${currentCompany.phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg cursor-pointer"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Ligar Agora</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {activeOutreachTab === 'email' && (
                  <div className="space-y-2.5">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500 font-semibold block">Assunto:</span>
                        <div className="font-bold text-slate-900">{currentCompany.outreachDrafts.emailSubject}</div>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 text-slate-800 whitespace-pre-line leading-relaxed">
                        {currentCompany.outreachDrafts.emailBody}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(`${currentCompany.outreachDrafts!.emailSubject}\n\n${currentCompany.outreachDrafts!.emailBody}`, 'email')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      {copiedFormat === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFormat === 'email' ? 'Copiado!' : 'Copiar E-mail Completo'}</span>
                    </button>
                  </div>
                )}

                {/* Mandatory anti-spam notice */}
                <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2 text-[11px] text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Rascunhos para contato individual. Não envie mensagens comerciais em massa sem consentimento.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Next Action Scheduling & Notes Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              Próxima Ação & Anotações
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data da Próxima Ação
                </label>
                <input
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  O que Fazer?
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ligar para confirmar proposta..."
                  value={nextActionDesc}
                  onChange={(e) => setNextActionDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anotações Pessoais
              </label>
              <textarea
                rows={3}
                placeholder="Detalhes da conversa, preferências do proprietário..."
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveCadastralUpdates}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </button>
          </div>

          {/* Contact History Logger Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Histórico de Contatos</h3>
              <button
                type="button"
                onClick={() => setIsAddingLog(!isAddingLog)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                {isAddingLog ? 'Cancelar' : '+ Registrar Contato'}
              </button>
            </div>

            {isAddingLog && (
              <form onSubmit={handleAddContactLog} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Canal Utilizado:</label>
                  <select
                    value={logChannel}
                    onChange={(e) => setLogChannel(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telefone">Ligação Telefônica</option>
                    <option value="email">E-mail</option>
                    <option value="presencial">Visita Presencial</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">O que foi falado:</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Ex: Conversei com o dono, ele se interessou pelo cardápio digital..."
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Salvar Registro
                </button>
              </form>
            )}

            {currentCompany.contactHistory && currentCompany.contactHistory.length > 0 ? (
              <div className="space-y-2.5 max-h-56 overflow-y-auto">
                {currentCompany.contactHistory.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="capitalize font-semibold text-slate-700">{item.channel}</span>
                      <span>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-slate-700">{item.notes}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Nenhuma interação registrada ainda. Use o botão acima após ligar ou enviar mensagem.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
