import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  MapPin, 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Phone, 
  Globe, 
  ArrowRight,
  Loader2,
  HelpCircle,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Company, TopNicheRecommendation, NicheComparisonResult } from '../types';
import { INITIAL_NICHES, storageService } from '../services/storageService';
import { apiService } from '../services/apiService';

interface NicheRadarViewProps {
  currentRegion: string;
  leads: Company[];
  onNavigateToSearchWithNiche: (niche: string) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const NicheRadarView: React.FC<NicheRadarViewProps> = ({
  currentRegion,
  leads,
  onNavigateToSearchWithNiche,
  onToast,
}) => {
  const [region, setRegion] = useState(currentRegion);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([
    'Hamburguerias',
    'Clínicas odontológicas',
    'Oficinas mecânicas',
    'Salões de beleza',
    'Pizzarias',
    'Academias',
  ]);

  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<NicheComparisonResult | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Compute local stats from stored leads
  const nicheStatsList = useMemo(() => {
    return selectedNiches.map((n) => {
      const matchLeads = leads.filter(
        (l) => l.segment.toLowerCase().trim() === n.toLowerCase().trim()
      );
      const total = matchLeads.length;
      const withoutWebsite = matchLeads.filter((l) => !l.hasOwnWebsite).length;
      const withWebsite = matchLeads.filter((l) => l.hasOwnWebsite).length;
      const withPhone = matchLeads.filter((l) => Boolean(l.phone && l.phone.length > 5)).length;
      const pctWithoutWebsite = total > 0 ? Math.round((withoutWebsite / total) * 100) : 0;

      // Recommended default service for niche
      let recommended = 'Criação de Site Institucional';
      if (n.includes('Hamburgueria') || n.includes('Pizzaria') || n.includes('Restaurante')) {
        recommended = 'Cardápios Digitais & Automação WhatsApp';
      } else if (n.includes('Clínica') || n.includes('Odont') || n.includes('Estética') || n.includes('Salão')) {
        recommended = 'Agendamento On-line & Agente WhatsApp';
      } else if (n.includes('Oficina') || n.includes('Autoescola')) {
        recommended = 'Landing Page Local & Orçamentos no WhatsApp';
      }

      return {
        niche: n,
        totalFound: total,
        withoutWebsite,
        withWebsite,
        withPhone,
        pctWithoutWebsite,
        recommendedService: recommended,
      };
    });
  }, [selectedNiches, leads]);

  const toggleNicheSelection = (n: string) => {
    if (selectedNiches.includes(n)) {
      if (selectedNiches.length <= 2) {
        onToast('Selecione pelo menos 2 nichos para comparar.', 'info');
        return;
      }
      setSelectedNiches(selectedNiches.filter((item) => item !== n));
    } else {
      setSelectedNiches([...selectedNiches, n]);
    }
  };

  const handleStartAnalysis = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmAndRunAnalysis = async () => {
    setShowConfirmModal(false);
    setIsComparing(true);
    try {
      const res = await apiService.compareNiches(region, nicheStatsList);
      setComparisonResult({
        ...res,
        analyzedAt: new Date().toISOString(),
      });
      onToast('Diagnóstico estratégico de nichos concluído com sucesso!', 'success');
    } catch (err: any) {
      console.error(err);
      onToast(err.message || 'Falha ao processar comparativo.', 'error');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-emerald-700 tracking-wide">
              Inteligência de Mercado Local
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Radar de Nichos em {region.split(',')[0]}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare a maturidade digital de diferentes setores para priorizar onde prospectar primeiro.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isComparing}
              onClick={handleStartAnalysis}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isComparing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Diagnosticando com Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Interpretar Oportunidades com IA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Niche Selector Chips */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Selecione os nichos para comparar ({selectedNiches.length} selecionados):
            </span>
            <span className="text-slate-400">
              Mínimo 2 nichos recomendados
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {INITIAL_NICHES.map((n) => {
              const isSelected = selectedNiches.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleNicheSelection(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-800 text-white shadow-2xs font-semibold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Métricas por Segmento ({region})
          </h3>
          <span className="text-xs text-slate-400">
            Amostra de {leads.length} empresas cadastradas localmente
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nicheStatsList.map((stat) => (
            <div
              key={stat.niche}
              className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                    {stat.niche}
                  </h4>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 tabular-nums">
                    {stat.totalFound} empresas
                  </span>
                </div>

                <div className="space-y-2 text-xs py-2 border-y border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Sem site próprio identificado:</span>
                    <span className="font-bold text-rose-700 font-mono">
                      {stat.withoutWebsite} ({stat.pctWithoutWebsite}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Com site oficial cadastrado:</span>
                    <span className="font-semibold text-emerald-800 font-mono">
                      {stat.withWebsite}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Com telefone publicado:</span>
                    <span className="font-semibold text-slate-700 font-mono">
                      {stat.withPhone}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Serviço mais aderente:
                  </span>
                  <div className="text-xs font-semibold text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100">
                    {stat.recommendedService}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Amostra das fontes locais
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateToSearchWithNiche(stat.niche)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                >
                  <span>Ver empresas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Data Limitation Warning */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-500">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            <b>Atenção metodológica:</b> Estes dados representam a amostra mapeada no seu aplicativo. Eles não devem ser tratados como o total absoluto de empresas na cidade.
          </span>
        </div>
      </div>

      {/* AI Diagnostic Top 3 Recommendation Card */}
      {comparisonResult && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-emerald-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Os 3 Nichos Prioritários Recomendados pelo Gemini
              </h3>
              <p className="text-xs text-slate-500">
                Estratégia de ataque comercial baseada nas dores e facilidade de fechamento
              </p>
            </div>
          </div>

          {/* Strategic Executive Summary */}
          {comparisonResult.strategicSummary && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-slate-800 leading-relaxed font-medium">
              {comparisonResult.strategicSummary}
            </div>
          )}

          {/* 3 Top Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {comparisonResult.topNiches.map((rec) => (
              <div
                key={rec.niche}
                className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white font-mono">
                      #{rec.priorityRank} Prioridade
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {region.split(',')[0]}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900">
                    {rec.niche}
                  </h4>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Por que é interessante:
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {rec.whyInteresting}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Serviço a oferecer primeiro:
                    </span>
                    <p className="text-xs font-semibold text-emerald-800 bg-white p-2 rounded-lg border border-slate-200">
                      {rec.recommendedService}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Dor comercial a abordar:
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{rec.painPointToAddress}"
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Como iniciar a prospecção:
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {rec.howToStart}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateToSearchWithNiche(rec.niche)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Prospectar {rec.niche}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal Before Multi-Niche Gemini Run */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirmar Diagnóstico com IA</h3>
                <p className="text-xs text-slate-500">Estimativa transparente de consulta</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Esta ação enviará os dados comparativos de <b>{selectedNiches.length} nichos</b> na região de <b>{region}</b> para análise estruturada com o modelo <b>Gemini 3.8 Flash</b>.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Total de consultas Gemini estimadas:</span>
                <b className="font-mono text-slate-900">1 requisição</b>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Nichos a sintetizar:</span>
                <b className="font-mono text-slate-900">{selectedNiches.length}</b>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAndRunAnalysis}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirmar e Analisar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
