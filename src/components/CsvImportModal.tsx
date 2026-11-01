import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { Company } from '../types';
import { storageService } from '../services/storageService';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (count: number) => void;
  defaultRegion: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  defaultRegion,
}) => {
  const [csvText, setCsvText] = useState('');
  const [parsedCompanies, setParsedCompanies] = useState<Company[]>([]);
  const [previewError, setPreviewError] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('paste');

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateContent = [
      'Nome,Segmento,Cidade,Endereco,Telefone,Site,Rede_Social,Fonte,Observacoes',
      '"Oficina Mecânica São José","Oficinas mecânicas","Formosa, Goiás, Brasil","Rua 10, Centro","(61) 98888-1111","","https://instagram.com/oficinasaojose","Guia Local","Sem site próprio, apenas Instagram"',
      '"Sorveteria Tropical Gelados","Restaurantes","Formosa, Goiás, Brasil","Praça Anísio Lobo","(61) 3631-2222","https://sorveteriatropical.com.br","","Indicação","Site antigo sem cardápio atualizado"',
      '"Studio Glamour Estética","Centros de estética","Formosa, Goiás, Brasil","Av. Brasília, Formosinha","(61) 99777-3333","","https://instagram.com/studioglamour","Pesquisa de rua","Agendamentos manuais via WhatsApp"',
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_prospeccao_empresas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const handleParse = (textToParse: string) => {
    setPreviewError('');
    try {
      const companies = storageService.parseCsvToCompanies(textToParse, defaultRegion);
      if (companies.length === 0) {
        setPreviewError('Nenhuma empresa válida encontrada no CSV. Verifique se o cabeçalho possui ao menos a coluna "Nome".');
        setParsedCompanies([]);
      } else {
        setParsedCompanies(companies);
      }
    } catch (err: any) {
      setPreviewError(`Falha ao processar arquivo: ${err.message}`);
      setParsedCompanies([]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedCompanies.length === 0) return;
    const added = storageService.batchAddLeads(parsedCompanies);
    onImportComplete(added);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setCsvText('');
    setParsedCompanies([]);
    setPreviewError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Importar Empresas via CSV</h3>
              <p className="text-xs text-slate-500">Adicione listas de prospecção existentes em lote</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Action bar: Template download & mode toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'paste' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Copiar e Colar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Arquivo .CSV
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Modelo CSV de Exemplo
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-emerald-600 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <label className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer block mb-1">
                Clique aqui para selecionar seu arquivo CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400">
                Formatos aceitos: arquivos .csv separados por vírgula com cabeçalho.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cole o conteúdo do CSV (com cabeçalho na primeira linha):
              </label>
              <textarea
                rows={6}
                placeholder="Nome,Segmento,Cidade,Endereco,Telefone,Site,Rede_Social&#10;Oficina Mecânica Alpha,Oficinas mecânicas,Formosa,Rua 1,(61) 99999-0000,,https://instagram.com/oficinaalpha"
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  handleParse(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
            </div>
          )}

          {previewError && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{previewError}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedCompanies.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  {parsedCompanies.length} empresas identificadas para importação
                </span>
                <span className="text-[11px] text-slate-500">
                  Região padrão: {defaultRegion.split(',')[0]}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-2.5">Nome</th>
                      <th className="p-2.5">Nicho</th>
                      <th className="p-2.5">Telefone</th>
                      <th className="p-2.5">Presença Web</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedCompanies.slice(0, 15).map((comp, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-medium text-slate-900 truncate max-w-[140px]">{comp.name}</td>
                        <td className="p-2.5 text-slate-600">{comp.segment}</td>
                        <td className="p-2.5 text-slate-600 font-mono text-[11px]">{comp.phone || 'Sem telefone'}</td>
                        <td className="p-2.5">
                          {comp.hasOwnWebsite ? (
                            <span className="text-emerald-700 font-medium">Site próprio</span>
                          ) : comp.socialUrl ? (
                            <span className="text-amber-700 font-medium">Apenas redes</span>
                          ) : (
                            <span className="text-slate-400">Sem site</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedCompanies.length > 15 && (
                <p className="text-[11px] text-slate-400 text-right">
                  + {parsedCompanies.length - 15} outras empresas...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={parsedCompanies.length === 0}
            onClick={handleConfirmImport}
            className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              parsedCompanies.length > 0
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Importar {parsedCompanies.length > 0 ? `${parsedCompanies.length} Empresas` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
