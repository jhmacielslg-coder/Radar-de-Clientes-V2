import React, { useState } from 'react';
import { X, Building2, Phone, Globe, Instagram, MapPin, Tag, FileText } from 'lucide-react';
import { Company } from '../types';
import { INITIAL_NICHES, INITIAL_SERVICES } from '../services/storageService';

interface ManualLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLead: (lead: Company) => void;
  defaultRegion: string;
}

export const ManualLeadModal: React.FC<ManualLeadModalProps> = ({
  isOpen,
  onClose,
  onSaveLead,
  defaultRegion,
}) => {
  const [name, setName] = useState('');
  const [segment, setSegment] = useState(INITIAL_NICHES[0]);
  const [customSegment, setCustomSegment] = useState('');
  const [isCustomSegment, setIsCustomSegment] = useState(false);
  const [city, setCity] = useState(defaultRegion);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [targetService, setTargetService] = useState(INITIAL_SERVICES[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome comercial da empresa.');
      return;
    }

    const finalSegment = isCustomSegment ? (customSegment.trim() || 'Geral') : segment;
    const cleanWebsite = website.trim();
    const isSocialAsWebsite = cleanWebsite.toLowerCase().includes('instagram.com') ||
                              cleanWebsite.toLowerCase().includes('facebook.com') ||
                              cleanWebsite.toLowerCase().includes('linktr.ee');
    
    const hasOwnWebsite = Boolean(cleanWebsite && cleanWebsite.length > 4 && !isSocialAsWebsite);
    const finalSocialUrl = socialUrl.trim() || (isSocialAsWebsite ? cleanWebsite : null);
    const finalWebsite = hasOwnWebsite ? cleanWebsite : null;

    // Calcular pontuação de oportunidade provisória
    let score = 0;
    if (!hasOwnWebsite) score += 30;
    if (!phone.trim()) score += 15;
    if (finalSocialUrl && !hasOwnWebsite) score += 15;
    score += 15; // Oportunidade padrão

    const newCompany: Company = {
      id: `manual_lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      segment: finalSegment,
      city: city.trim() || defaultRegion,
      address: address.trim() || null,
      phone: phone.trim() || null,
      website: finalWebsite,
      socialUrl: finalSocialUrl,
      sourceUrl: 'Cadastro manual',
      hasOwnWebsite,
      websiteStatus: hasOwnWebsite ? 'proprio' : (finalSocialUrl ? 'apenas_redes' : 'sem_site'),
      opportunityScore: Math.min(100, Math.max(0, score)),
      scoreConfidence: (phone.trim() && address.trim()) ? 'alto' : (phone.trim() ? 'medio' : 'baixo'),
      status: 'novo',
      notes: notes.trim() || 'Cadastrado manualmente pelo usuário.',
      targetService,
      contactHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveLead(newCompany);
    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    setName('');
    setAddress('');
    setPhone('');
    setWebsite('');
    setSocialUrl('');
    setNotes('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cadastrar Empresa Manualmente</h3>
              <p className="text-xs text-slate-500">Adicione um novo lead para prospectar e analisar</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome Comercial da Empresa *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Oficina Mecânica Planalto, Hamburgueria Grill..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nicho / Segmento
              </label>
              {!isCustomSegment ? (
                <div className="space-y-1.5">
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
                  >
                    {INITIAL_NICHES.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCustomSegment(true)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
                  >
                    + Digitar outro nicho
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Digite o segmento..."
                    value={customSegment}
                    onChange={(e) => setCustomSegment(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomSegment(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Voltar para lista padrão
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cidade e Região
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp Comercial
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="(61) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Endereço ou Bairro
              </label>
              <input
                type="text"
                placeholder="Ex: Av. Valeriano de Castro, Centro"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Site Oficial Próprio
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="https://empresa.com.br (ou vazio se não tiver)"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Se tiver apenas Instagram ou Linktree, preencha no campo abaixo.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rede Social (Instagram, Facebook)
              </label>
              <div className="relative">
                <Instagram className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="https://instagram.com/empresa"
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Serviço Digital Que Desejo Vender
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Iniciais
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Estabelecimento tradicional no centro, sem catálogo de produtos online..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleResetAndClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Salvar Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
