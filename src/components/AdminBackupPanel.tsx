import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HardDrive, 
  ShieldCheck, 
  FileJson, 
  Trash2, 
  RotateCcw,
  Sparkles,
  Cloud,
  Check,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DatabaseBackup } from '../types';
import { formatBytes, validateBackupJSON } from '../utils/backupManager';

export const AdminBackupPanel: React.FC = () => {
  const { 
    backups, 
    autoBackupConfig, 
    updateAutoBackupConfig, 
    createBackup, 
    downloadBackupJSON, 
    restoreFromBackup, 
    deleteBackup, 
    isBackingUp, 
    lastAutoBackupTime,
    syncStatus,
    syncWithCloud,
    importJSONBackup,
    clearStockTransfersHistory,
    clearCashClosuresHistory,
    clearExpensesHistory,
    clearCommissionPaymentsHistory,
    clearPaymentsHistory
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<DatabaseBackup | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [previewFileBackup, setPreviewFileBackup] = useState<{
    fileContent: string;
    totalRecords: number;
    summary: any;
  } | null>(null);

  const showNotification = (msg: string, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setActionSuccess(null);
      setTimeout(() => setActionError(null), 6000);
    } else {
      setActionSuccess(msg);
      setActionError(null);
      setTimeout(() => setActionSuccess(null), 5000);
    }
  };

  const handleManualBackup = async () => {
    try {
      const backup = await createBackup('manual', `Cópia Manual do Administrador`);
      showNotification(`Cópia de segurança criada com sucesso no Firestore! (${backup.totalRecords} registos salvaguardados)`);
    } catch (err: any) {
      showNotification(`Erro ao criar cópia no Firestore: ${err?.message || 'Tente novamente'}`, true);
    }
  };

  const handleDownloadLiveJSON = () => {
    try {
      downloadBackupJSON();
      showNotification('Ficheiro de backup JSON gerado e descarregado com sucesso!');
    } catch (err: any) {
      showNotification('Erro ao gerar ficheiro de backup JSON.', true);
    }
  };

  const handleDownloadSpecificBackup = (backup: DatabaseBackup) => {
    try {
      downloadBackupJSON(backup.id);
      showNotification(`Ficheiro de backup "${backup.name}" descarregado com sucesso!`);
    } catch (err: any) {
      showNotification('Erro ao descarregar ficheiro.', true);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;
    setIsRestoring(true);
    try {
      const success = await restoreFromBackup(selectedBackupForRestore);
      if (success) {
        showNotification(`Backup "${selectedBackupForRestore.name}" restaurado com sucesso!`);
        setSelectedBackupForRestore(null);
      } else {
        showNotification('Não foi possível restaurar os dados do backup selecionado.', true);
      }
    } catch (err: any) {
      showNotification(`Erro ao restaurar: ${err?.message || 'Falha na operação'}`, true);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = validateBackupJSON(content);

      if (!validation.valid) {
        showNotification(validation.error || 'Ficheiro de backup JSON inválido.', true);
        return;
      }

      setPreviewFileBackup({
        fileContent: content,
        totalRecords: validation.totalRecords || 0,
        summary: validation.summary,
      });
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmFileRestore = () => {
    if (!previewFileBackup) return;
    try {
      const success = importJSONBackup(previewFileBackup.fileContent);
      if (success) {
        showNotification(`Ficheiro de backup restaurado com sucesso! (${previewFileBackup.totalRecords} registos atualizados).`);
        setPreviewFileBackup(null);
      } else {
        showNotification('Erro ao processar e salvar os registos do ficheiro.', true);
      }
    } catch (err: any) {
      showNotification(`Erro ao restaurar ficheiro: ${err?.message || 'Erro inesperado'}`, true);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (window.confirm('Tem a certeza de que deseja eliminar este registo de backup?')) {
      await deleteBackup(backupId);
      showNotification('Cópia de segurança eliminada.');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Pendente / Não executado';
    try {
      return new Date(dateStr).toLocaleString('pt-MZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alerts */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center space-x-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-semibold flex items-center space-x-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Cloud & Auto-Backup Status Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Backup Automático do Firestore Ativo
                  </span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded border border-slate-700">
                    Google Cloud
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                  Segurança & Cópia de Segurança do Banco de Dados
                </h3>
              </div>
            </div>

            {/* Cloud Status Tag & Manual Sync */}
            <div className="flex items-center space-x-2 self-start sm:self-auto flex-wrap gap-y-2">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${
                syncStatus === 'online'
                  ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                  : 'bg-amber-950/70 border-amber-700 text-amber-300'
              }`}>
                <Cloud className="w-3.5 h-3.5" />
                <span>{syncStatus === 'online' ? 'Nuvem Conectada' : 'A sincronizar...'}</span>
              </span>
              <button
                onClick={async () => {
                  showNotification('A sincronizar com a base de dados em tempo real...');
                  await syncWithCloud();
                  showNotification('Sincronização com o Firestore concluída com sucesso!');
                }}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Sincronizar dados e verificar atualizações do sistema"
              >
                <RefreshCw className="w-3 h-3 text-sky-400" />
                <span>Sincronizar Agora</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Último Backup Automático</span>
              <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatDate(lastAutoBackupTime || autoBackupConfig.lastBackupAt)}</span>
              </p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Frequência Programada</span>
              <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                <span>A cada {autoBackupConfig.frequencyHours} Horas (Automático)</span>
              </p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Cópias no Firestore</span>
              <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                <span>{backups.length} cópias disponíveis para restauro</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Download Live JSON Backup */}
        <button
          type="button"
          onClick={handleDownloadLiveJSON}
          className="flex items-start space-x-3.5 p-4 sm:p-5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-2xl shadow-md transition-all text-left group"
        >
          <div className="p-3 bg-white/20 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-black tracking-tight">Descarregar Backup Completo (.JSON)</span>
              <span className="px-2 py-0.5 bg-emerald-700/80 text-[10px] font-bold uppercase rounded">Garantido</span>
            </div>
            <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
              Transfere imediatamente para o computador ou telemóvel um ficheiro .json com todos os clientes, produtos, encomendas, pagamentos e armazéns.
            </p>
          </div>
        </button>

        {/* Trigger Manual Firestore Snapshot */}
        <button
          type="button"
          disabled={isBackingUp}
          onClick={handleManualBackup}
          className="flex items-start space-x-3.5 p-4 sm:p-5 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 text-white rounded-2xl border border-slate-800 shadow-md transition-all text-left group"
        >
          <div className="p-3 bg-slate-800 text-purple-400 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
            {isBackingUp ? (
              <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
            ) : (
              <Database className="w-6 h-6" />
            )}
          </div>
          <div>
            <span className="text-sm font-black tracking-tight">Criar Nova Cópia no Firestore Agora</span>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {isBackingUp 
                ? 'A capturar e salvar registos na nuvem...' 
                : 'Salva um ponto de restauro imediato na base de dados do Firestore sem precisar aguardar o intervalo.'}
            </p>
          </div>
        </button>
      </div>

      {/* Auto Backup Configuration Card */}
      <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-600" />
              Configuração da Rotina de Backup Automático
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina com que frequência o sistema deve criar e arquivar automaticamente os registos no Firestore
            </p>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-700">Backup Automático:</span>
            <input
              type="checkbox"
              checked={autoBackupConfig.enabled}
              onChange={(e) => updateAutoBackupConfig({ enabled: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className={`text-xs font-bold ${autoBackupConfig.enabled ? 'text-emerald-700' : 'text-slate-500'}`}>
              {autoBackupConfig.enabled ? 'Ligado' : 'Desligado'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {[
            { hours: 6, label: 'A cada 6 Horas', desc: 'Recomendado para negócios com vendas frequentes' },
            { hours: 12, label: 'A cada 12 Horas', desc: 'Ideal para duas vezes ao dia (início e fecho)' },
            { hours: 24, label: 'Diário (24 Horas)', desc: 'Uma cópia automática por dia' },
          ].map((opt) => {
            const isSelected = autoBackupConfig.frequencyHours === opt.hours;
            return (
              <button
                key={opt.hours}
                type="button"
                onClick={() => updateAutoBackupConfig({ frequencyHours: opt.hours })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-200 text-purple-950 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70 font-medium'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-purple-600" />}
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-1 leading-snug">
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cloud Backups History Table */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-slate-700" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Histórico de Cópias de Segurança no Firestore ({backups.length})
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            Guarda até {autoBackupConfig.maxStoredBackups || 15} pontos de restauro mais recentes
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <Database className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">
              Nenhuma cópia de segurança armazenada ainda. Clique em "Criar Nova Cópia no Firestore Agora" ou aguarde a primeira rotina automática.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {backups.map((b) => {
              const isAuto = b.type === 'automatic';
              return (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-xs gap-3 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isAuto ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      <FileJson className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{b.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAuto ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {isAuto ? 'Automático' : 'Manual'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(b.createdAt)}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">
                          {b.totalRecords} registos salvos
                        </span>
                        <span>•</span>
                        <span>{formatBytes(b.sizeBytes)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownloadSpecificBackup(b)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                      title="Descarregar este ficheiro JSON para o seu dispositivo"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Descarregar JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedBackupForRestore(b)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 rounded-lg font-semibold text-xs transition-colors"
                      title="Restaurar este ponto de cópia de segurança"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>Restaurar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBackup(b.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar este registo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* External JSON File Restore */}
      <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-slate-700" />
            Restaurar a Partir de Ficheiro Externo (.JSON)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Se tem um ficheiro de backup descarregado de outro computador ou telemóvel, pode carregá-lo aqui para sincronizar com o Firestore
          </p>
        </div>

        <label className="flex items-center justify-center space-x-2 p-3 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold cursor-pointer border border-dashed border-slate-300 transition-colors">
          <Upload className="w-4 h-4 text-purple-600" />
          <span>Selecionar Ficheiro .JSON do Computador ou Telemóvel</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* SECÇÃO: LIMPEZA DE HISTÓRICOS OPERACIONAIS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Limpeza e Reset Seletivo de Históricos</h3>
            <p className="text-xs text-slate-500">
              Permite aos administradores expurgar ou limpar logs e históricos acumulados no sistema
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {/* 1. Transferências de Stock */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Transferências de Stock</span>
              <span className="text-[11px] text-slate-500 block">
                Limpa todos os registos do histórico de transferências entre armazéns
              </span>
            </div>
            <button
              onClick={() => {
                if (confirm('Atenção: Tem a certeza que deseja limpar todo o histórico de transferências de stock? Esta ação é definitiva.')) {
                  clearStockTransfersHistory();
                  showNotification('Histórico de transferências de stock limpo com sucesso.');
                }
              }}
              className="w-full py-1.5 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Transferências</span>
            </button>
          </div>

          {/* 2. Fechos de Caixa */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Fechos de Caixa Diários</span>
              <span className="text-[11px] text-slate-500 block">
                Limpa os registos e balancetes arquivados de encerramento de caixa
              </span>
            </div>
            <button
              onClick={() => {
                if (confirm('Atenção: Tem a certeza que deseja limpar todo o histórico de fechos de caixa?')) {
                  clearCashClosuresHistory();
                  showNotification('Histórico de fechos de caixa limpo com sucesso.');
                }
              }}
              className="w-full py-1.5 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Fechos de Caixa</span>
            </button>
          </div>

          {/* 3. Comissões Pagas */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Pagamentos de Comissões</span>
              <span className="text-[11px] text-slate-500 block">
                Limpa os comprovativos e histórico de quitação de comissões
              </span>
            </div>
            <button
              onClick={() => {
                if (confirm('Atenção: Tem a certeza que deseja limpar todo o histórico de pagamentos de comissão?')) {
                  clearCommissionPaymentsHistory();
                  showNotification('Histórico de comissões limpo com sucesso.');
                }
              }}
              className="w-full py-1.5 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Comissões</span>
            </button>
          </div>

          {/* 4. Despesas Liquidadas */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Despesas Liquidadas (Pagas)</span>
              <span className="text-[11px] text-slate-500 block">
                Remove do sistema apenas as despesas operacionais já pagas, mantendo pendentes
              </span>
            </div>
            <button
              onClick={() => {
                if (confirm('Deseja limpar do sistema todas as despesas que já se encontram pagas/liquidadas?')) {
                  clearExpensesHistory('paid');
                  showNotification('Despesas pagas limpas do sistema com sucesso.');
                }
              }}
              className="w-full py-1.5 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Despesas Pagas</span>
            </button>
          </div>

          {/* 5. Histórico de Pagamentos de Encomendas */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Histórico de Pagamentos Recebidos</span>
              <span className="text-[11px] text-slate-500 block">
                Limpa todos os registos detalhados de pagamentos de clientes
              </span>
            </div>
            <button
              onClick={() => {
                if (confirm('Atenção: Tem a certeza que deseja limpar todo o registo de histórico de pagamentos de clientes?')) {
                  clearPaymentsHistory();
                  showNotification('Histórico de pagamentos limpo com sucesso.');
                }
              }}
              className="w-full py-1.5 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Histórico Pagamentos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Specific Backup Restore */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Restaurar Cópia de Segurança?</h3>
                <p className="text-xs text-slate-500">Ponto de restauro: {selectedBackupForRestore.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Esta ação substituirá os registos atuais pelos <strong>{selectedBackupForRestore.totalRecords} registos</strong> presentes nesta cópia de segurança ({formatDate(selectedBackupForRestore.createdAt)}). A alteração será sincronizada imediatamente em tempo real com o Firestore.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setSelectedBackupForRestore(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
              >
                {isRestoring ? 'A restaurar...' : 'Sim, Restaurar Dados'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for File Upload Restore */}
      {previewFileBackup && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-emerald-600">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirmar Restauro de Ficheiro</h3>
                <p className="text-xs text-slate-500">{previewFileBackup.totalRecords} registos detectados</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O ficheiro selecionado é válido e contém <strong>{previewFileBackup.totalRecords} registos</strong>. Deseja restaurar e atualizar o banco de dados agora?
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setPreviewFileBackup(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmFileRestore}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Confirmar e Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
