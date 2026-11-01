import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Filter, 
  Table, 
  LayoutGrid, 
  Globe, 
  Phone, 
  ExternalLink, 
  CheckSquare, 
  Square, 
  Download, 
  BookmarkPlus, 
  Building2, 
  AlertCircle,
  Loader2,
  Share2,
  Plus,
  ArrowRight,
  Info
} from 'lucide-react';
import { Company, GroundingSource } from '../types';
import { INITIAL_NICHES, INITIAL_SERVICES, storageService } from '../services/storageService';
import { apiService } from '../services/apiService';

interface SearchBusinessesViewProps {
  currentRegion: string;
  onSelectCompany: (company: Company) => void;
  onOpenManualModal: () => void;
  onOpenCsvModal: () => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SearchBusinessesView: React.FC<SearchBusinessesViewProps> = ({
  currentRegion,
  onSelectCompany,
  onOpenManualModal,
  onOpenCsvModal,
  onToast,
}) => {
  const [region, setRegion] = useState(currentRegion);
  const [niche, setNiche] = useState(INITIAL_NICHES[0]);
  const [customNiche, setCustomNiche] = useState('');
  const [isAddingNiche, setIsAddingNiche] = useState(false);
  const [allNiches, setAllNiches] = useState<string[]>(INITIAL_NICHES);
  const [keyword, setKeyword] = useState('');
  const [targetService, setTargetService] = useState(INITIAL_SERVICES[0]);

  // Search execution state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [searchSources, setSearchSources] = useState<GroundingSource[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  // View & Filter states
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [filterNoWebsite, setFilterNoWebsite] = useState(false);
  const [filterHasPhone, setFilterHasPhone] = useState(false);
  const [filterMinScore, setFilterMinScore] = useState<number>(0);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());

  // Add custom niche
  const handleAddNewNiche = () => {
    if (!customNiche.trim()) return;
    const trimmed = customNiche.trim();
    if (!allNiches.includes(trimmed)) {
      const updated = [trimmed, ...allNiches];
      setAllNiches(updated);
      setNiche(trimmed);
      const settings = storageService.getSettings();
      settings.customNiches = Array.from(new Set([...settings.customNiches, trimmed]));
      storageService.saveSettings(settings);
    }
    setCustomNiche('');
    setIsAddingNiche(false);
    onToast(`Nicho "${trimmed}" adicionado às opções!`, 'success');
  };

  // Run Search with Gemini & Google Search Grounding
  const handleRunSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setSearchError('');
    setSelectedCompanyIds(new Set());

    const cacheKey = `${region}_${niche}_${keyword}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cached = storageService.getSearchCache(cacheKey);

    if (cached && cached.length > 0) {
      setSearchResults(cached);
      setSearchSources([]);
      setHasSearched(true);
      setIsSearching(false);
      onToast(`${cached.length} empresas recuperadas do histórico recente local.`, 'info');
      return;
    }

    try {
      const res = await apiService.searchBusinesses(region, niche, keyword, targetService);
      setSearchResults(res.companies);
      setSearchSources(res.sources);
      setHasSearched(true);

      if (res.companies.length > 0) {
        storageService.setSearchCache(cacheKey, res.companies);
        onToast(`${res.companies.length} empresas identificadas na região!`, 'success');
      } else {
        onToast('Nenhum resultado com fontes públicas suficientes encontrado.', 'info');
      }
    } catch (err: any) {
      console.error(err);
      setSearchError(err.message || 'Falha ao buscar empresas com a API Gemini.');
      onToast(err.message || 'Erro na pesquisa.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Filtered results
  const filteredResults = searchResults.filter((comp) => {
    if (filterNoWebsite && comp.hasOwnWebsite) return false;
    if (filterHasPhone && (!comp.phone || comp.phone.trim().length < 5)) return false;
    if (filterMinScore > 0 && comp.opportunityScore < filterMinScore) return false;
    return true;
  });

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedCompanyIds.size === filteredResults.length) {
      setSelectedCompanyIds(new Set());
    } else {
      setSelectedCompanyIds(new Set(filteredResults.map((c) => c.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const updated = new Set(selectedCompanyIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedCompanyIds(updated);
  };

  // Batch action: Save to Leads
  const handleSaveSelectedToLeads = () => {
    const toSave = searchResults.filter((c) => selectedCompanyIds.has(c.id));
    if (toSave.length === 0) return;
    const addedCount = storageService.batchAddLeads(toSave);
    onToast(`${addedCount} empresa(s) salva(s) com sucesso em Meus Leads!`, 'success');
    setSelectedCompanyIds(new Set());
  };

  // Batch action: Export selected to CSV
  const handleExportSelectedCsv = () => {
    const toExport = searchResults.filter((c) => selectedCompanyIds.has(c.id));
    if (toExport.length === 0) return;
    const csvContent = storageService.exportLeadsToCsv(toExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pesquisa_${niche.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast(`${toExport.length} empresa(s) exportada(s) para CSV!`, 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Search Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-emerald-700 tracking-wide">
              Modo 1: Prospecção Assistida por IA
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Encontrar Oportunidades Comerciais
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              O Gemini pesquisa fontes públicas locais com Google Search e mapeia gaps digitais.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCsvModal}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Importar Planilha CSV
            </button>
            <button
              type="button"
              onClick={onOpenManualModal}
              className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
            >
              + Cadastro Manual
            </button>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleRunSearch} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Region Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cidade, Bairro ou Região *
              </label>
              <input
                type="text"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Ex: Formosa, Goiás, Brasil"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
            </div>

            {/* Niche Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nicho de Mercado *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNiche(!isAddingNiche)}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  {isAddingNiche ? 'Cancelar' : '+ Novo Nicho'}
                </button>
              </div>

              {!isAddingNiche ? (
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
                >
                  {allNiches.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Nome do nicho..."
                    value={customNiche}
                    onChange={(e) => setCustomNiche(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewNiche}
                    className="px-3 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 cursor-pointer shrink-0"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>

            {/* Keyword Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Palavra-chave Adicional (opcional)
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Ex: Centro, delivery, urgência..."
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
            </div>

            {/* Target Service */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Serviço que Desejo Vender
              </label>
              <select
                value={targetService}
                onChange={(e) => setTargetService(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
              >
                {INITIAL_SERVICES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                A pesquisa identifica negócios com base em fontes públicas da web. Links e fontes originais serão auditáveis.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Pesquisando no Gemini...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Pesquisar Empresas</span>
                </>
              )}
            </button>
          </div>
        </form>

        {searchError && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Sources Card (if any grounded sources found) */}
      {searchSources.length > 0 && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
            <Share2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Fontes auditáveis identificadas pelo Google Search Grounding:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchSources.slice(0, 8).map((src, idx) => (
              <a
                key={idx}
                href={src.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-white text-slate-700 border border-slate-200 rounded-lg hover:border-emerald-500 hover:text-emerald-800 transition-colors"
              >
                <span className="truncate max-w-[200px]">{src.title}</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left: Counts & Selection */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                {selectedCompanyIds.size > 0 && selectedCompanyIds.size === filteredResults.length ? (
                  <CheckSquare className="w-4 h-4 text-emerald-700" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>
                  {selectedCompanyIds.size > 0
                    ? `${selectedCompanyIds.size} selecionada(s)`
                    : 'Selecionar todos'}
                </span>
              </button>

              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-600 font-medium">
                {filteredResults.length} de {searchResults.length} empresas
              </span>
            </div>

            {/* Center: Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterNoWebsite(!filterNoWebsite)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  filterNoWebsite
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Sem site identificado
              </button>

              <button
                type="button"
                onClick={() => setFilterHasPhone(!filterHasPhone)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  filterHasPhone
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Com telefone
              </button>

              <select
                value={filterMinScore}
                onChange={(e) => setFilterMinScore(Number(e.target.value))}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none"
              >
                <option value={0}>Todas as notas</option>
                <option value={50}>Nota &ge; 50</option>
                <option value={70}>Nota &ge; 70 (Alta Oportunidade)</option>
                <option value={85}>Nota &ge; 85 (Urgente)</option>
              </select>
            </div>

            {/* Right: View Mode & Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {selectedCompanyIds.size > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleSaveSelectedToLeads}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    Salvar nos Leads ({selectedCompanyIds.size})
                  </button>

                  <button
                    type="button"
                    onClick={handleExportSelectedCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    CSV
                  </button>
                </>
              )}

              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="Visualização em tabela"
                >
                  <Table className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="Visualização em cartões"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Render: Table or Cards */}
          {filteredResults.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Nenhuma empresa encontrada com os filtros atuais</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Tente desmarcar filtros ou alterar os termos da pesquisa para ampliar os resultados.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            /* Table View */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <span className="sr-only">Seleção</span>
                      </th>
                      <th className="p-3">Empresa & Segmento</th>
                      <th className="p-3">Cidade / Endereço</th>
                      <th className="p-3">Contato</th>
                      <th className="p-3">Presença Digital</th>
                      <th className="p-3 text-center">Score Provisório</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredResults.map((company) => {
                      const isSelected = selectedCompanyIds.has(company.id);
                      return (
                        <tr
                          key={company.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isSelected ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(company.id)}
                              className="rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>

                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => onSelectCompany(company)}
                              className="text-left font-semibold text-slate-900 hover:text-emerald-800 cursor-pointer block"
                            >
                              {company.name}
                            </button>
                            <span className="text-[11px] text-slate-500 font-normal">
                              {company.segment}
                            </span>
                          </td>

                          <td className="p-3 text-slate-600">
                            <div>{company.city}</div>
                            {company.address && (
                              <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={company.address}>
                                {company.address}
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-slate-600">
                            {company.phone ? (
                              <a
                                href={`tel:${company.phone}`}
                                className="font-mono text-emerald-800 hover:underline inline-flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-slate-400" />
                                {company.phone}
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">Não identificado</span>
                            )}
                          </td>

                          <td className="p-3">
                            {company.hasOwnWebsite && company.website ? (
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 hover:underline inline-flex items-center gap-1 font-medium truncate max-w-[150px]"
                              >
                                <Globe className="w-3 h-3 shrink-0" />
                                <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                              </a>
                            ) : company.socialUrl ? (
                              <a
                                href={company.socialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-700 hover:underline inline-flex items-center gap-1 font-medium"
                              >
                                <Globe className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>Apenas redes sociais</span>
                              </a>
                            ) : (
                              <span className="text-rose-600 font-medium inline-flex items-center gap-1">
                                Sem site próprio
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-bold text-xs bg-slate-100 text-slate-800 tabular-nums">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  company.opportunityScore >= 75
                                    ? 'bg-emerald-600'
                                    : company.opportunityScore >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                              {company.opportunityScore}/100
                            </div>
                          </td>

                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => onSelectCompany(company)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <span>Ver Perfil</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResults.map((company) => {
                const isSelected = selectedCompanyIds.has(company.id);
                return (
                  <div
                    key={company.id}
                    className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all hover:shadow-xs ${
                      isSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-600/10'
                        : 'border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(company.id)}
                            className="mt-1 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <h3
                              onClick={() => onSelectCompany(company)}
                              className="text-sm font-bold text-slate-900 hover:text-emerald-800 cursor-pointer tracking-tight"
                            >
                              {company.name}
                            </h3>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <span>{company.segment}</span>
                              <span>·</span>
                              <span>{company.city.split(',')[0]}</span>
                            </div>
                          </div>
                        </div>

                        {/* Score Pill */}
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 font-mono font-bold text-xs tabular-nums text-slate-800">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              company.opportunityScore >= 75
                                ? 'bg-emerald-600'
                                : company.opportunityScore >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          {company.opportunityScore}
                        </div>
                      </div>

                      {/* Contact & Address */}
                      <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {company.phone ? (
                            <span className="font-mono">{company.phone}</span>
                          ) : (
                            <span className="text-slate-400 italic">Sem telefone publicado</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-slate-600">
                          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {company.hasOwnWebsite && company.website ? (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:underline truncate"
                            >
                              {company.website.replace(/^https?:\/\//, '')}
                            </a>
                          ) : company.socialUrl ? (
                            <span className="text-amber-700 font-medium">Apenas perfil social</span>
                          ) : (
                            <span className="text-rose-600 font-medium">Sem site próprio</span>
                          )}
                        </div>
                      </div>

                      {/* Notes / Observation */}
                      {company.notes && (
                        <p className="mt-3 text-xs text-slate-500 line-clamp-2 italic">
                          "{company.notes}"
                        </p>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Confiança: {company.scoreConfidence}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectCompany(company)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                      >
                        <span>Analisar Negócio</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
