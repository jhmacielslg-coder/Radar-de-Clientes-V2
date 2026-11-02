import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Sliders, 
  MapPin, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Save, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { AppSettings, SellerProfile, ScoringWeights } from '../types';
import { storageService, INITIAL_SERVICES, INITIAL_NICHES } from '../services/storageService';
import { getStoredApiKey, setStoredApiKey, removeStoredApiKey } from '../services/apiService';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onRefreshAllData: () => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onRefreshAllData,
  onToast,
}) => {
  const [profile, setProfile] = useState<SellerProfile>(settings.sellerProfile);
  const [weights, setWeights] = useState<ScoringWeights>(settings.weights);
  const [defaultRegion, setDefaultRegion] = useState(settings.defaultRegion);
  const [backupFileInput, setBackupFileInput] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // API Key state
  const [apiKeyInput, setApiKeyInput] = useState<string>(getStoredApiKey());
  const [showApiKey, setShowApiKey] = useState(false);
  const isApiKeyConfigured = Boolean(getStoredApiKey());

  // Toggle service selection
  const handleToggleService = (service: string) => {
    const current = profile.servicesOffered || [];
    if (current.includes(service)) {
      if (current.length <= 1) {
        onToast('Mantenha pelo menos um serviço cadastrado.', 'info');
        return;
      }
      setProfile({ ...profile, servicesOffered: current.filter((s) => s !== service) });
    } else {
      setProfile({ ...profile, servicesOffered: [...current, service] });
    }
  };

  // Save Settings
  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      ...settings,
      sellerProfile: profile,
      weights,
      defaultRegion: defaultRegion.trim() || 'Formosa, Goiás, Brasil',
    };
    storageService.saveSettings(updated);
    onUpdateSettings(updated);
    onToast('Configurações salvas com sucesso!', 'success');
  };

  // Backup Export JSON
  const handleDownloadBackup = () => {
    const jsonStr = storageService.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `backup_radar_clientes_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('Arquivo de backup JSON baixado com sucesso!', 'success');
  };

  // Backup Restore JSON
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = storageService.importBackupJson(content);
      if (res.success) {
        onToast(res.message, 'success');
        onRefreshAllData();
      } else {
        onToast(res.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  // Clear All Local Data
  const handleConfirmClearAll = () => {
    storageService.clearAllData();
    onRefreshAllData();
    setShowClearConfirm(false);
    onToast('Dados locais apagados com sucesso.', 'info');
  };

  // Calculate sum of weights
  const totalWeight = Object.values(weights).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* SECTION 0: CHAVE API GEMINI */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isApiKeyConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            <Key className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Chave API Gemini
              {isApiKeyConfigured ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  ● Configurada
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  ● Não configurada
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Insira sua chave da API Gemini para ativar os serviços de IA (pesquisa, análise, abordagens e diagnóstico de nichos).
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              GEMINI_API_KEY
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Cole sua API Key aqui (ex: AQ.Ab8RN...)"
                className="w-full pl-9 pr-20 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showApiKey ? 'Ocultar chave' : 'Mostrar chave'}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sua chave fica armazenada com segurança apenas no seu navegador (localStorage). Nunca é compartilhada ou enviada para terceiros.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!apiKeyInput.trim()) {
                  onToast('Insira uma chave API válida antes de salvar.', 'error');
                  return;
                }
                setStoredApiKey(apiKeyInput);
                onToast('Chave API Gemini salva com sucesso! Os serviços de IA estão ativados.', 'success');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Chave API</span>
            </button>

            {isApiKeyConfigured && (
              <button
                type="button"
                onClick={() => {
                  removeStoredApiKey();
                  setApiKeyInput('');
                  onToast('Chave API removida. Os serviços de IA ficarão inativos.', 'info');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover Chave</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <b className="text-slate-700">Como obter sua chave:</b> Acesse{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-800 underline font-semibold">
              aistudio.google.com/apikey
            </a>
            {' '}e crie ou copie uma chave existente. O modelo utilizado é o <b>Gemini 4 Argon</b>.
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* SECTION 1: PERFIL DO VENDEDOR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Perfil do Vendedor & Prospecção</h3>
              <p className="text-xs text-slate-500">
                Estes dados são utilizados pelo Gemini para hiperpersonalizar seus roteiros comerciais
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seu Nome ou Nome da Agência *
              </label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sua Cidade / Região Base *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Serviços que Você Vende (Selecione todos os aplicáveis):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INITIAL_SERVICES.map((srv) => {
                const isSelected = profile.servicesOffered?.includes(srv);
                return (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => handleToggleService(srv)}
                    className={`p-3 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-semibold shadow-2xs'
                        : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{srv}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tom Padrão das Abordagens
              </label>
              <select
                value={profile.preferredTone}
                onChange={(e) => setProfile({ ...profile, preferredTone: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              >
                <option value="consultivo">Consultivo (focado em valor e diagnóstico)</option>
                <option value="direto">Direto (rápido, prático e objetivo)</option>
                <option value="amigavel">Amigável (empático e informal respeitoso)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anos de Experiência
              </label>
              <input
                type="number"
                min={0}
                max={40}
                value={profile.experienceYears}
                onChange={(e) => setProfile({ ...profile, experienceYears: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Faixa de Preço Opcional
              </label>
              <input
                type="text"
                placeholder="Ex: R$ 800 a R$ 2.500"
                value={profile.priceRange || ''}
                onChange={(e) => setProfile({ ...profile, priceRange: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Diferenciais do seu Atendimento
            </label>
            <input
              type="text"
              placeholder="Ex: Atendimento presencial em Formosa, suporte rápido e sem complicação..."
              value={profile.differentials}
              onChange={(e) => setProfile({ ...profile, differentials: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chamada para Ação (CTA) Preferida
            </label>
            <input
              type="text"
              placeholder="Ex: Agendar um bate-papo de 15 minutos sem compromisso"
              value={profile.preferredCta}
              onChange={(e) => setProfile({ ...profile, preferredCta: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>
        </div>

        {/* SECTION 2: PESOS DA PONTUAÇÃO DE OPORTUNIDADE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pesos da Pontuação de Oportunidade</h3>
                <p className="text-xs text-slate-500">
                  Calibre como os 100 pontos são distribuídos entre os critérios observáveis
                </p>
              </div>
            </div>

            <div className={`text-xs font-mono font-bold px-3 py-1 rounded-full tabular-nums ${
              totalWeight === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              Soma: {totalWeight}/100
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Ausência de site próprio</span>
                <span className="font-mono text-emerald-800">{weights.noOwnWebsite} pts</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={weights.noOwnWebsite}
                onChange={(e) => setWeights({ ...weights, noOwnWebsite: Number(e.target.value) })}
                className="w-full accent-emerald-700"
              />
              <span className="text-[10px] text-slate-400 block">Máximo sugerido: 30 pts</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Falta de info comercial</span>
                <span className="font-mono text-emerald-800">{weights.missingCommercialInfo} pts</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={weights.missingCommercialInfo}
                onChange={(e) => setWeights({ ...weights, missingCommercialInfo: Number(e.target.value) })}
                className="w-full accent-emerald-700"
              />
              <span className="text-[10px] text-slate-400 block">Máximo sugerido: 15 pts</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Dificuldade de contato</span>
                <span className="font-mono text-emerald-800">{weights.contactDifficulty} pts</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={weights.contactDifficulty}
                onChange={(e) => setWeights({ ...weights, contactDifficulty: Number(e.target.value) })}
                className="w-full accent-emerald-700"
              />
              <span className="text-[10px] text-slate-400 block">Máximo sugerido: 15 pts</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Sem agendamento / pedido</span>
                <span className="font-mono text-emerald-800">{weights.noBookingOrOrder} pts</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={weights.noBookingOrOrder}
                onChange={(e) => setWeights({ ...weights, noBookingOrOrder: Number(e.target.value) })}
                className="w-full accent-emerald-700"
              />
              <span className="text-[10px] text-slate-400 block">Máximo sugerido: 15 pts</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Apresentação digital frágil</span>
                <span className="font-mono text-emerald-800">{weights.digitalPresentation} pts</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={weights.digitalPresentation}
                onChange={(e) => setWeights({ ...weights, digitalPresentation: Number(e.target.value) })}
                className="w-full accent-emerald-700"
              />
              <span className="text-[10px] text-slate-400 block">Máximo sugerido: 15 pts</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Bônus de atividade real</span>
                <span className="font-mono text-emerald-800">{weights.activeBusinessBonus} pts</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={weights.activeBusinessBonus}
                onChange={(e) => setWeights({ ...weights, activeBusinessBonus: Number(e.target.value) })}
                className="w-full accent-emerald-700"
              />
              <span className="text-[10px] text-slate-400 block">Máximo sugerido: 10 pts</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: REGIÃO PADRÃO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Região Padrão da Aplicação</h3>
              <p className="text-xs text-slate-500">
                Define a localidade pré-carregada nas telas de busca e comparativos
              </p>
            </div>
          </div>

          <div className="max-w-md">
            <input
              type="text"
              required
              value={defaultRegion}
              onChange={(e) => setDefaultRegion(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Padrão inicial: Formosa, Goiás, Brasil. Altere para qualquer município ou bairro.
            </p>
          </div>
        </div>

        {/* SAVE BUTTON BAR */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Todas as Configurações</span>
          </button>
        </div>
      </form>

      {/* SECTION 4: BACKUP, RESTAURAÇÃO & DADOS LOCAIS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Armazenamento Local & Backup</h3>
            <p className="text-xs text-slate-500">
              Seus dados ficam armazenados com segurança no navegador (localStorage). Faça backups regulares.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export card */}
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Exportar Backup Completo (JSON)</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Baixe um arquivo contendo todos os seus leads, anotações, análises estruturadas e preferências.
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
            >
              Baixar Backup JSON
            </button>
          </div>

          {/* Import card */}
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-purple-700" />
              <span>Restaurar Backup (JSON)</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Carregue um arquivo JSON gerado anteriormente para recuperar seus dados salvos.
            </p>
            <label className="inline-block px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs">
              Selecionar Arquivo JSON
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Danger zone: Clear data */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-rose-700">Limpar Dados Locais</h4>
            <p className="text-[11px] text-slate-400">
              Apaga todos os leads e configurações do navegador.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer"
          >
            Limpar Dados
          </button>
        </div>
      </div>

      {/* SECTION 5: OPERAÇÕES ESTIMADAS DA API */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <span className="font-bold text-slate-800 block">Monitor de Operações Locais</span>
            <span className="text-[11px] text-slate-500">
              Estimativa de requisições de IA disparadas nesta sessão / navegador.
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
            {settings.operationsCount || 0}
          </span>
          <span className="text-[10px] text-slate-400 block">operações registradas</span>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Limpar Todos os Dados?</h3>
                <p className="text-xs text-slate-500">Ação irreversível</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja apagar todos os leads e configurações salvas neste navegador? Recomendamos baixar um backup JSON antes de prosseguir.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sim, Apagar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
