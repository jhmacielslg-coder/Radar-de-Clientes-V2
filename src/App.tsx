import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { SearchBusinessesView } from './views/SearchBusinessesView';
import { BusinessProfileView } from './views/BusinessProfileView';
import { NicheRadarView } from './views/NicheRadarView';
import { LeadsKanbanView } from './views/LeadsKanbanView';
import { SettingsView } from './views/SettingsView';
import { ManualLeadModal } from './components/ManualLeadModal';
import { CsvImportModal } from './components/CsvImportModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Company, AppSettings } from './types';
import { storageService, DEFAULT_SETTINGS } from './services/storageService';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('leads');
  const [leads, setLeads] = useState<Company[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Modals & Navigation
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load initial data from storage
  useEffect(() => {
    refreshAllData();
  }, []);

  const refreshAllData = () => {
    const loadedLeads = storageService.getLeads();
    const loadedSettings = storageService.getSettings();
    setLeads(loadedLeads);
    setSettings(loadedSettings);

    // If no company selected or selected company updated, sync it
    if (loadedLeads.length > 0 && !selectedCompany) {
      setSelectedCompany(loadedLeads[0]);
    } else if (selectedCompany) {
      const fresh = loadedLeads.find((l) => l.id === selectedCompany.id);
      if (fresh) setSelectedCompany(fresh);
    }
  };

  // Select company and navigate to Profile view
  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setActiveTab('profile');
  };

  // Update existing company
  const handleUpdateCompany = (updated: Company) => {
    setSelectedCompany(updated);
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  // Navigate to Search with preselected niche
  const handleNavigateToSearchWithNiche = (nicheName: string) => {
    setActiveTab('search');
    // Toast to guide the user
    addToast(`Segmento "${nicheName}" selecionado para pesquisa em ${settings.defaultRegion.split(',')[0]}.`, 'info');
  };

  // Manual Lead Save
  const handleSaveManualLead = (newLead: Company) => {
    storageService.addLead(newLead);
    refreshAllData();
    handleSelectCompany(newLead);
    addToast(`Empresa "${newLead.name}" cadastrada com sucesso!`, 'success');
  };

  // CSV Import Complete
  const handleCsvImportComplete = (count: number) => {
    refreshAllData();
    setActiveTab('leads');
    addToast(`${count} empresas importadas com sucesso para Meus Leads!`, 'success');
  };

  // Export current leads
  const handleExportAllCsv = () => {
    if (leads.length === 0) {
      addToast('Nenhum lead cadastrado para exportação.', 'info');
      return;
    }
    const csvContent = storageService.exportLeadsToCsv(leads);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_radar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`${leads.length} leads exportados com sucesso!`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          // If moving to profile without a selected company, pick the first one
          if (tab === 'profile' && !selectedCompany && leads.length > 0) {
            setSelectedCompany(leads[0]);
          }
        }}
        leadsCount={leads.length}
        currentRegion={settings.defaultRegion}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          activeTab={activeTab}
          currentRegion={settings.defaultRegion}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenManualModal={() => setIsManualModalOpen(true)}
          onOpenCsvModal={() => setIsCsvModalOpen(true)}
          onExportCsv={handleExportAllCsv}
          leadsCount={leads.length}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'search' && (
            <SearchBusinessesView
              currentRegion={settings.defaultRegion}
              onSelectCompany={handleSelectCompany}
              onOpenManualModal={() => setIsManualModalOpen(true)}
              onOpenCsvModal={() => setIsCsvModalOpen(true)}
              onToast={addToast}
              onRefreshLeads={refreshAllData}
            />
          )}

          {activeTab === 'profile' && (
            selectedCompany ? (
              <BusinessProfileView
                company={selectedCompany}
                onBack={() => setActiveTab('leads')}
                onUpdateCompany={handleUpdateCompany}
                onToast={addToast}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
                <h3 className="text-base font-bold text-slate-800">Nenhuma empresa selecionada</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Selecione uma empresa na tela de pesquisa ou na lista de leads para ver a análise completa.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('leads')}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 cursor-pointer"
                >
                  Ir para Meus Leads
                </button>
              </div>
            )
          )}

          {activeTab === 'niche' && (
            <NicheRadarView
              currentRegion={settings.defaultRegion}
              leads={leads}
              onNavigateToSearchWithNiche={handleNavigateToSearchWithNiche}
              onToast={addToast}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsKanbanView
              leads={leads}
              onSelectCompany={handleSelectCompany}
              onRefreshLeads={refreshAllData}
              onOpenManualModal={() => setIsManualModalOpen(true)}
              onOpenCsvModal={() => setIsCsvModalOpen(true)}
              onToast={addToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={(newSettings) => {
                setSettings(newSettings);
                refreshAllData();
              }}
              onRefreshAllData={refreshAllData}
              onToast={addToast}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ManualLeadModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSaveLead={handleSaveManualLead}
        defaultRegion={settings.defaultRegion}
      />

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportComplete={handleCsvImportComplete}
        defaultRegion={settings.defaultRegion}
      />

      {/* Floating Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
