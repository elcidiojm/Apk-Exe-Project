import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  Laptop, 
  Smartphone, 
  HardDrive, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  Sparkles,
  Info,
  Layers,
  Archive,
  RefreshCw,
  Zap,
  FolderArchive,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatMT } from '../utils/formatters';
import { 
  downloadWindowsZipPackage, 
  downloadWindowsBatInstaller, 
  downloadWindowsUrlShortcut 
} from '../utils/desktopLauncher';

interface DownloadsCenterViewProps {
  onOpenInstallPwa?: () => void;
}

export const DownloadsCenterView: React.FC<DownloadsCenterViewProps> = ({
  onOpenInstallPwa,
}) => {
  const { exportExcel, clients, orders, payments, products } = useApp();
  const { permissions } = useAuth();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleInAppUpdate = async () => {
    setIsUpdating(true);
    setUpdateStatus('A limpar cache local e a procurar novos ficheiros...');

    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
        }
      }

      setUpdateStatus('✓ Atualização concluída com sucesso! A recarregar o sistema...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.warn('Erro ao atualizar cache:', err);
      setUpdateStatus('A recarregar página para obter a versão mais recente...');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  const handleExportJsonBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      system: 'Gestao_Vendas_Clientes_Mozambique',
      data: {
        clients,
        products,
        orders,
        payments,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_Seguranca_Gestao_Vendas_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-slate-700/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Centro de Instalação, Downloads & Atualização
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Escolha a melhor opção para o seu computador: Versão Portátil (sem instalação), Atualizador Rápido ou Instalador Completo.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Versão Atual: v2.4</span>
            </span>
          </div>
        </div>
      </div>

      {/* Instant In-App Update Banner (No Download Needed!) */}
      <div className="bg-gradient-to-r from-sky-900/90 via-indigo-900/90 to-slate-900/90 rounded-2xl p-5 border border-sky-500/30 shadow-md text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-400/30 shrink-0 mt-0.5">
              <Zap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">
                  Atualizar Sistema Online (Sem Precisar de Baixar Novo Setup)
                </h2>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/30">
                  Instantâneo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Se já está a usar a aplicação no computador ou navegador, clique aqui para descarregar diretamente os ficheiros mais recentes para a memória. 
                <strong className="text-white"> Todas as suas contas correntes, dívidas, clientes e vendas permanecem 100% intactos e seguros.</strong>
              </p>
              {updateStatus && (
                <div className="mt-2 text-xs font-semibold text-emerald-300 flex items-center space-x-1.5 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{updateStatus}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleInAppUpdate}
            disabled={isUpdating}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-98 shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'A Atualizar...' : 'Atualizar Sistema Agora (1-Clique)'}</span>
          </button>
        </div>
      </div>

      {/* Main Download Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* OPTION 1: SETUP PORTATIL (ZIP) - HIGHLIGHTED */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border-2 border-emerald-400/80 flex flex-col justify-between relative hover:shadow-md transition-all">
          <div className="absolute -top-3 right-4">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs uppercase tracking-wide">
              ⭐ Mais Seguro (Sem Erros)
            </span>
          </div>

          <div>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <FolderArchive className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Portátil (.ZIP)
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-base font-bold text-slate-900">
                Versão Portátil (Sem Instalação)
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                100% Silencioso e Offline! Não precisa de passar pelo assistente de instalação, não abre tela de CMD e não requer Conta Google.
              </p>
            </div>

            {/* Specifications Box */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Como usar:</span>
                <span className="font-medium text-slate-900">Extrair e clicar em ABRIR_PROGRAMA.vbs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Tela preta (CMD):</span>
                <span className="font-mono text-emerald-700 font-bold">ZERO (100% Invisível)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Conta Google:</span>
                <span className="text-emerald-700 font-bold">NÃO precisa (100% Offline)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Pen USB / Disco:</span>
                <span className="text-emerald-700 font-medium">✓ Roda direto da Pen Drive</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Erros de permissão:</span>
                <span className="text-emerald-700 font-medium">✓ Zero erros de bloqueio</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <a
              href="/Gestao_Clientes_Vendas_PORTATIL.zip"
              download="Gestao_Clientes_Vendas_PORTATIL.zip"
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descarregar Versão Portátil (.ZIP)</span>
            </a>
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Basta extrair e abrir</span>
              <a 
                href="/app_icon.ico" 
                download="app_icon.ico" 
                className="text-emerald-700 hover:underline font-semibold flex items-center space-x-1"
                title="Descarregar ficheiro de ícone Windows individual"
              >
                <span>Baixar Ícone (.ico)</span>
              </a>
            </div>
          </div>
        </div>

        {/* OPTION 2: PACOTE DE UPDATE RAPIDO (ZIP LEVE) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border-2 border-indigo-300 flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
                <RefreshCw className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase">
                Apenas Atualização
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-base font-bold text-slate-900">
                Pacote de Update Rápido (ZIP Leve)
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Já tem o programa no computador? Baixe apenas os ficheiros novos com o ícone oficial. Não precisa de desinstalar nada.
              </p>
            </div>

            {/* Specifications Box */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Tamanho do pacote:</span>
                <span className="font-medium text-emerald-700 font-bold">&lt; 10 KB (Super leve)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Inclui script:</span>
                <span className="font-mono text-indigo-700 font-bold">ATUALIZAR_AGORA.bat</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Tempo de execução:</span>
                <span className="text-slate-900 font-medium">2 segundos (Automático)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Garante dados:</span>
                <span className="text-emerald-700 font-medium">✓ Mantém histórico e dívidas</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <a
              href="/Gestao_Clientes_Vendas_UPDATE.zip"
              download="Gestao_Clientes_Vendas_UPDATE.zip"
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-sm transition-all active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Descarregar Pacote de Update (.ZIP)</span>
            </a>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Extraia e execute o ficheiro <strong>ATUALIZAR_AGORA.bat</strong>.
            </p>
          </div>
        </div>

        {/* OPTION 3: INSTALADOR AUTOMATICO WINDOWS COM ICONE */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                <Laptop className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 uppercase">
                Instalador Windows
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-base font-bold text-slate-900">
                Instalador Setup Executável (.EXE)
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Instalador direto e 100% silencioso! Instala o sistema, cria o atalho oficial com ícone no Ambiente de Trabalho sem abrir tela preta de CMD e sem pedir Conta Google.
              </p>
            </div>

            {/* Specifications Box */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Tipo de arquivo:</span>
                <span className="font-mono text-emerald-700 font-bold">Instalador Setup (.EXE)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Tela preta (CMD):</span>
                <span className="font-medium text-emerald-700 font-bold">ZERO (100% Silencioso)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Conta Google:</span>
                <span className="text-emerald-700 font-bold">NÃO precisa (100% Offline)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Atalho com Ícone:</span>
                <span className="text-slate-900 font-medium">✓ No Ambiente de Trabalho</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <a
              href="/Instalador_Gestao_Clientes_Vendas_OFFLINE_Setup.exe"
              download="Instalador_Gestao_Clientes_Vendas_OFFLINE_Setup.exe"
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descarregar Instalador Setup (.EXE)</span>
            </a>
            
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <button
                onClick={downloadWindowsUrlShortcut}
                className="text-indigo-600 hover:underline font-semibold"
              >
                Baixar Atalho .url Direto
              </button>
              <button
                onClick={onOpenInstallPwa}
                className="text-emerald-600 hover:underline font-bold"
              >
                Instalar como App PWA
              </button>
            </div>
          </div>
        </div>

        {/* OPTION 4: EXCEL COMPLETE REPORT (.XLSX) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between hover:border-teal-300 transition-colors">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 uppercase">
                Excel .XLSX
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-base font-bold text-slate-900">
                Planilha Excel Completa (.xlsx)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Exporte todos os registos formatados em folhas de cálculo oficiais para contabilidade e auditoria.
              </p>
            </div>

            {/* Specifications Box */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Conteúdo:</span>
                <span>Clientes, Encomendas, Recibos, Stock</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Moeda:</span>
                <span>Valores calculados em Meticais (MT)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Total Encomendas:</span>
                <span className="font-bold text-slate-900">{orders.length} registadas</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            {permissions.canExportBackup ? (
              <button
                onClick={exportExcel}
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm shadow-sm transition-all active:scale-98"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Gerar e Descarregar Excel (.xlsx)</span>
              </button>
            ) : (
              <div className="text-center text-xs text-slate-400 py-2">
                A sua conta atual não tem permissão para exportar relatórios.
              </div>
            )}
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Compatível com Microsoft Excel, Google Sheets e LibreOffice.
            </p>
          </div>
        </div>

        {/* OPTION 5: PWA DESKTOP APP */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between hover:border-indigo-300 transition-colors">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase">
                Chrome / Edge
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-base font-bold text-slate-900">
                Aplicação Web Desktop (PWA)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Janela independente sem barras de navegador com ícone na barra de tarefas do Windows.
              </p>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Espaço em disco:</span>
                <span className="text-emerald-700 font-medium">&lt; 5 MB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Atualizações:</span>
                <span>Automáticas em tempo real</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <button
              onClick={onOpenInstallPwa}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-sm transition-all active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Instalar como App no Computador</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Ou aceda aos 3 pontos do navegador &gt; "Instalar aplicação".
            </p>
          </div>
        </div>

        {/* OPTION 6: MOBILE ACCESS */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between hover:border-sky-300 transition-colors">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 uppercase">
                Telemóvel & Tablet
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-base font-bold text-slate-900">
                Acesso Móvel (Android & iOS)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Leve o controlo de vendas e dívidas consigo no bolso com interface adaptada para ecrãs pequenos.
              </p>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
              <p className="font-semibold text-slate-700">Android:</p>
              <p className="text-[11px] pl-2 border-l-2 border-emerald-400">
                3 pontos &gt; <strong>"Adicionar ao ecrã inicial"</strong>.
              </p>
              <p className="font-semibold text-slate-700 mt-1.5">iPhone:</p>
              <p className="text-[11px] pl-2 border-l-2 border-sky-400">
                Botão Partilhar &gt; <strong>"Ecrã principal"</strong>.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={handleCopyLink}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm shadow-sm transition-all active:scale-98"
            >
              {copiedUrl ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Link Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Link p/ WhatsApp / Telemóvel</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Envie para o seu WhatsApp e abra no telemóvel.
            </p>
          </div>
        </div>
      </div>

      {/* Backup JSON Box */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Cópia de Segurança Bruta (Backup JSON de Emergência)
            </h3>
            <p className="text-xs text-slate-500">
              Guarde uma cópia integral dos dados num ficheiro de texto seguro para restaurar em qualquer altura.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportJsonBackup}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          {backupSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Backup Transferido com Sucesso!</span>
            </>
          ) : (
            <>
              <HardDrive className="w-4 h-4" />
              <span>Descarregar Backup (.json)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
