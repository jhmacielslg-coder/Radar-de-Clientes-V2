import React from 'react';
import { 
  Search, 
  Building2, 
  BarChart3, 
  KanbanSquare, 
  Settings, 
  MapPin, 
  Compass, 
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';

export type NavTab = 'search' | 'profile' | 'niche' | 'leads' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  leadsCount: number;
  currentRegion: string;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  leadsCount,
  currentRegion,
  isOpenMobile,
  onCloseMobile,
}) => {
  const menuItems: Array<{
    id: NavTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'search',
      label: 'Pesquisar Empresas',
      description: 'Buscar com IA & Google Search',
      icon: Search,
    },
    {
      id: 'profile',
      label: 'Perfil & Análise',
      description: 'Diagnóstico e scripts de venda',
      icon: Building2,
    },
    {
      id: 'niche',
      label: 'Radar de Nichos',
      description: 'Comparativo de mercado local',
      icon: BarChart3,
    },
    {
      id: 'leads',
      label: 'Meus Leads (CRM)',
      description: 'Quadro Kanban e funil comercial',
      icon: KanbanSquare,
      badge: leadsCount,
    },
    {
      id: 'settings',
      label: 'Configurações',
      description: 'Perfil do vendedor e pesos',
      icon: Settings,
    },
  ];

  const handleSelectTab = (tab: NavTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                Radar de Clientes
              </h1>
              <span className="text-xs font-medium text-emerald-700 tracking-wide">
                Inteligência Comercial Local
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Region Chip Indicator */}
        <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate font-medium" title={currentRegion}>
              {currentRegion}
            </span>
          </div>
          <button
            onClick={() => handleSelectTab('settings')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold shrink-0 cursor-pointer"
          >
            Alterar
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50/80 text-emerald-900 border border-emerald-200/80 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm tracking-tight truncate">{item.label}</div>
                    <div className="text-[11px] text-slate-400 truncate font-normal">
                      {item.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {typeof item.badge === 'number' && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono tabular-nums font-semibold ${
                        isActive
                          ? 'bg-emerald-200/80 text-emerald-950'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-emerald-700" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom System Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium text-slate-700">API Gemini 4 Argon</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Pesquisa assistida via Google Search & chave API configurável nas Configurações.
          </p>
        </div>
      </aside>
    </>
  );
};
