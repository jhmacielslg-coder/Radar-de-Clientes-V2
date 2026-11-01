import React, { useState, useMemo } from 'react';
import { 
  KanbanSquare, 
  Table, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Trash2, 
  Phone, 
  Globe, 
  Calendar, 
  ArrowRight, 
  ArrowUpDown, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  MoreVertical,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Company, LeadStatus } from '../types';
import { storageService } from '../services/storageService';

interface LeadsKanbanViewProps {
  leads: Company[];
  onSelectCompany: (company: Company) => void;
  onRefreshLeads: () => void;
  onOpenManualModal: () => void;
  onOpenCsvModal: () => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const LeadsKanbanView: React.FC<LeadsKanbanViewProps> = ({
  leads,
  onSelectCompany,
  onRefreshLeads,
  onOpenManualModal,
  onOpenCsvModal,
  onToast,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'nextAction' | 'name'>('score');
  const [leadToDelete, setLeadToDelete] = useState<Company | null>(null);

  const KANBAN_COLUMNS: Array<{ id: LeadStatus; label: string; color: string; badgeColor: string }> = [
    { id: 'novo', label: 'Novo', color: 'border-slate-300 bg-slate-50/50', badgeColor: 'bg-slate-200 text-slate-800' },
    { id: 'analisado', label: 'Analisado', color: 'border-blue-300 bg-blue-50/30', badgeColor: 'bg-blue-100 text-blue-800' },
    { id: 'contatado', label: 'Contatado', color: 'border-amber-300 bg-amber-50/30', badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'respondeu', label: 'Respondeu', color: 'border-purple-300 bg-purple-50/30', badgeColor: 'bg-purple-100 text-purple-800' },
    { id: 'reuniao', label: 'Reunião', color: 'border-indigo-300 bg-indigo-50/30', badgeColor: 'bg-indigo-100 text-indigo-800' },
    { id: 'cliente', label: 'Cliente', color: 'border-emerald-300 bg-emerald-50/30', badgeColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'descartado', label: 'Descartado', color: 'border-rose-300 bg-rose-50/30', badgeColor: 'bg-rose-100 text-rose-800' },
  ];

  // Distinct segments present in leads
  const distinctSegments = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.segment))).sort();
  }, [leads]);

  // Real-time calculated funnel KPI indicators
  const kpis = useMemo(() => {
    const total = leads.length;
    const noWebsite = leads.filter((l) => !l.hasOwnWebsite).length;
    const analyzed = leads.filter((l) => Boolean(l.analysis) || l.status !== 'novo').length;
    const contacted = leads.filter((l) => ['contatado', 'respondeu', 'reuniao', 'cliente'].includes(l.status)).length;
    const meetings = leads.filter((l) => l.status === 'reuniao' || Boolean(l.nextActionDate)).length;
    const clients = leads.filter((l) => l.status === 'cliente').length;

    return { total, noWebsite, analyzed, contacted, meetings, clients };
  }, [leads]);

  // Filter & sort leads
  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchName = lead.name.toLowerCase().includes(term);
          const matchCity = lead.city.toLowerCase().includes(term);
          const matchNotes = (lead.notes || '').toLowerCase().includes(term);
          if (!matchName && !matchCity && !matchNotes) return false;
        }

        if (filterSegment !== 'all' && lead.segment !== filterSegment) {
          return false;
        }

        if (filterStatus !== 'all' && lead.status !== filterStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          return b.opportunityScore - a.opportunityScore;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'nextAction') {
          if (!a.nextActionDate) return 1;
          if (!b.nextActionDate) return -1;
          return a.nextActionDate.localeCompare(b.nextActionDate);
        }
        return 0;
      });
  }, [leads, searchTerm, filterSegment, filterStatus, sortBy]);

  // Move lead status quickly
  const handleMoveStatus = (lead: Company, newStatus: LeadStatus) => {
    const updated = {
      ...lead,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    storageService.updateLead(updated);
    onRefreshLeads();
    onToast(`Lead movido para "${newStatus.toUpperCase()}".`, 'info');
  };

  // Delete lead
  const handleConfirmDelete = () => {
    if (!leadToDelete) return;
    storageService.deleteLead(leadToDelete.id);
    onRefreshLeads();
    onToast(`Lead "${leadToDelete.name}" removido com sucesso.`, 'info');
    setLeadToDelete(null);
  };

  // Export CSV
  const handleExportCsv = () => {
    const csv = storageService.exportLeadsToCsv(filteredLeads);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'meus_leads_radar.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast(`${filteredLeads.length} lead(s) exportado(s) para CSV!`, 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* KPI Funnel Row (Cards with real calculated numbers) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Cadastrado
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
            {kpis.total}
          </div>
          <span className="text-[10px] text-slate-400">empresas no CRM</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
            Sem Site Próprio
          </span>
          <div className="text-2xl font-black font-mono text-rose-700 mt-1 tabular-nums">
            {kpis.noWebsite}
          </div>
          <span className="text-[10px] text-slate-400">oportunidade de site</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
            Analisados
          </span>
          <div className="text-2xl font-black font-mono text-blue-700 mt-1 tabular-nums">
            {kpis.analyzed}
          </div>
          <span className="text-[10px] text-slate-400">com diagnóstico IA</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            Contatados
          </span>
          <div className="text-2xl font-black font-mono text-amber-700 mt-1 tabular-nums">
            {kpis.contacted}
          </div>
          <span className="text-[10px] text-slate-400">prospecção iniciada</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">
            Reuniões Previstas
          </span>
          <div className="text-2xl font-black font-mono text-indigo-700 mt-1 tabular-nums">
            {kpis.meetings}
          </div>
          <span className="text-[10px] text-slate-400">em negociação ativa</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
            Clientes Fechados
          </span>
          <div className="text-2xl font-black font-mono text-emerald-800 mt-1 tabular-nums">
            {kpis.clients}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">vendas realizadas 🎉</span>
        </div>
      </div>

      {/* Control Bar: Filters, Search, Sorting & View Toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterSegment}
            onChange={(e) => setFilterSegment(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="all">Todos os Nichos ({distinctSegments.length})</option>
            {distinctSegments.map((seg) => (
              <option key={seg} value={seg}>{seg}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            {KANBAN_COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>{col.label}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="score">Maior Pontuação</option>
            <option value="nextAction">Próxima Ação</option>
            <option value="name">Ordem Alfabética</option>
          </select>
        </div>

        {/* View Mode Toggle & CSV Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
            title="Exportar leads filtrados para CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Visualização Kanban"
            >
              <KanbanSquare className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Visualização Tabela"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main CRM View: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {KANBAN_COLUMNS.map((column) => {
            const columnLeads = filteredLeads.filter((l) => l.status === column.id);
            return (
              <div
                key={column.id}
                className="w-72 shrink-0 bg-slate-100/70 border border-slate-200 rounded-2xl flex flex-col max-h-[75vh]"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{column.label}</span>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${column.badgeColor} tabular-nums`}>
                      {columnLeads.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards Container */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                  {columnLeads.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      Nenhum lead nesta etapa
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:shadow-xs hover:border-emerald-600/60 transition-all space-y-2.5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5 mb-1">
                            <h4
                              onClick={() => onSelectCompany(lead)}
                              className="text-xs font-bold text-slate-900 hover:text-emerald-800 cursor-pointer tracking-tight leading-snug line-clamp-2"
                            >
                              {lead.name}
                            </h4>
                            <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 tabular-nums">
                              {lead.opportunityScore}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-500 block truncate">
                            {lead.segment} · {lead.city.split(',')[0]}
                          </span>

                          <div className="flex items-center gap-2 mt-2 text-[11px]">
                            {lead.hasOwnWebsite ? (
                              <span className="text-emerald-700 font-medium truncate">Site cadastrado</span>
                            ) : (
                              <span className="text-rose-700 font-medium">Sem site próprio</span>
                            )}
                          </div>

                          {lead.nextActionDate && (
                            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-indigo-700 bg-indigo-50/70 p-1.5 rounded-lg font-medium">
                              <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span className="truncate">
                                {new Date(lead.nextActionDate).toLocaleDateString('pt-BR')}: {lead.nextActionDescription || 'Ação programada'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Actions: Quick Status Changer & Open Profile */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <select
                            value={lead.status}
                            onChange={(e) => handleMoveStatus(lead, e.target.value as any)}
                            className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-600 focus:outline-none cursor-pointer"
                          >
                            {KANBAN_COLUMNS.map((c) => (
                              <option key={c.id} value={c.id}>Mover p/ {c.label}</option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => onSelectCompany(lead)}
                            className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Abrir</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Empresa & Segmento</th>
                  <th className="p-3">Cidade</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3">Presença Digital</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Score</th>
                  <th className="p-3">Próxima Ação</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => onSelectCompany(lead)}
                        className="text-left font-bold text-slate-900 hover:text-emerald-800 cursor-pointer block"
                      >
                        {lead.name}
                      </button>
                      <span className="text-[11px] text-slate-500 font-normal">
                        {lead.segment}
                      </span>
                    </td>

                    <td className="p-3 text-slate-600">
                      {lead.city.split(',')[0]}
                    </td>

                    <td className="p-3 font-mono text-[11px] text-slate-700">
                      {lead.phone || <span className="text-slate-400 italic">Não informado</span>}
                    </td>

                    <td className="p-3">
                      {lead.hasOwnWebsite ? (
                        <span className="text-emerald-700 font-medium">Site próprio</span>
                      ) : (
                        <span className="text-rose-700 font-medium">Sem site próprio</span>
                      )}
                    </td>

                    <td className="p-3">
                      <select
                        value={lead.status}
                        onChange={(e) => handleMoveStatus(lead, e.target.value as any)}
                        className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer"
                      >
                        {KANBAN_COLUMNS.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </td>

                    <td className="p-3 text-center font-mono font-bold text-slate-900 tabular-nums">
                      {lead.opportunityScore}
                    </td>

                    <td className="p-3 text-slate-600 text-[11px]">
                      {lead.nextActionDate ? (
                        <span className="text-indigo-700 font-medium block">
                          {new Date(lead.nextActionDate).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-slate-400">Pendente</span>
                      )}
                    </td>

                    <td className="p-3 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => onSelectCompany(lead)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg cursor-pointer"
                      >
                        Ver Perfil
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeadToDelete(lead)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Excluir lead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir Lead</h3>
                <p className="text-xs text-slate-500">Confirmação obrigatória</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja realmente remover <b>{leadToDelete.name}</b> da sua base de prospecção? Esta ação não pode ser desfeita.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
