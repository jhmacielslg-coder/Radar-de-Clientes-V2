import React from 'react';
import { Menu, Plus, Upload, Download, MapPin } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
  currentRegion: string;
  onOpenMobileSidebar: () => void;
  onOpenManualModal: () => void;
  onOpenCsvModal: () => void;
  onExportCsv: () => void;
  leadsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  currentRegion,
  onOpenMobileSidebar,
  onOpenManualModal,
  onOpenCsvModal,
  onExportCsv,
  leadsCount,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    search: {
      title: 'Pesquisar Empresas',
      subtitle: 'Encontre negócios locais com Gemini + Google Search ou importe suas planilhas',
    },
    profile: {
      title: 'Perfil & Análise do Negócio',
      subtitle: 'Diagnóstico comercial qualitativo de 14 pontos e roteiros de contato sob medida',
    },
    niche: {
      title: 'Radar de Nichos',
      subtitle: 'Compare segmentos de mercado e descubra onde estão as maiores oportunidades locais',
    },
    leads: {
      title: 'Meus Leads (CRM)',
      subtitle: 'Gerencie seu funil comercial, histórico de contatos e próximas ações programadas',
    },
    settings: {
      title: 'Configurações',
      subtitle: 'Personalize o perfil do vendedor, pesos do score de oportunidade e dados',
    },
  };

  const current = titles[activeTab];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {current.title}
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              <MapPin className="w-3 h-3 text-emerald-600" />
              {currentRegion.split(',')[0]}
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden md:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={onOpenCsvModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          title="Importar empresas via arquivo CSV"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Importar</span> CSV
        </button>

        {leadsCount > 0 && (
          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Exportar todos os leads cadastrados para planilha CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar</span> CSV
          </button>
        )}

        <button
          onClick={onOpenManualModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Empresa</span>
        </button>
      </div>
    </header>
  );
};
