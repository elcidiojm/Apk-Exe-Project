import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Monitor, 
  CheckCircle, 
  Smartphone, 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  FileCode,
  Laptop
} from 'lucide-react';
import { 
  APP_PUBLIC_URL, 
  downloadWindowsUrlShortcut, 
  downloadWindowsBatInstaller, 
  downloadWindowsZipPackage 
} from '../utils/desktopLauncher';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPwaModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInsideIframe, setIsInsideIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInsideIframe(window.self !== window.top);
    } catch {
      setIsInsideIframe(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Open in external tab where Chrome/Edge allows native install
      window.open(APP_PUBLIC_URL, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(APP_PUBLIC_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Instalar ou Abrir no Computador (Windows / PC)</h3>
              <p className="text-xs text-slate-400">Escolha a forma mais fácil e direta para o seu computador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Why the iframe didn't install directly note */}
          {isInsideIframe && (
            <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-xl text-xs text-amber-200 flex items-start space-x-2.5">
              <span className="text-base leading-none mt-0.5">ℹ️</span>
              <p className="leading-relaxed text-[11px]">
                <strong>Nota Importante:</strong> Por estar dentro da janela do Google AI Studio, os navegadores (Chrome/Edge) bloqueiam a instalação automática dentro do quadro. Use uma das opções abaixo para aceder diretamente!
              </p>
            </div>
          )}

          {/* Option 1: Open in full tab / Chrome PWA install */}
          <div className="p-4 bg-slate-800/80 rounded-xl border border-sky-600/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Opção 1: Abrir em Nova Aba do Navegador
                </h4>
              </div>
              <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 text-[10px] font-bold rounded">
                Mais Recomendada
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Abre o sistema numa aba normal fora do AI Studio. Lá, o botão de instalar do <strong>Google Chrome</strong> e <strong>Microsoft Edge</strong> fica 100% ativo!
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href={APP_PUBLIC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md transition-all text-center"
              >
                <span>Abrir Aplicação em Nova Aba</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 rounded-xl text-xs transition-all"
                title="Copiar link direto"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 text-[11px] text-slate-300 space-y-1">
              <p>📍 <strong>Como instalar depois de abrir a nova aba:</strong></p>
              <p className="text-slate-400">No Chrome ou Edge, clique no ícone de <strong>instalar (ecrãzinho com seta para baixo)</strong> no canto direito da barra de endereço ou vá aos <strong>3 pontinhos &gt; Instalar Gestão de Clientes e Vendas</strong>.</p>
            </div>
          </div>

          {/* Option 2: Download Windows Shortcut (.URL) */}
          <div className="p-4 bg-slate-800/80 rounded-xl border border-indigo-600/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Opção 2: Baixar Atalho para o Ambiente de Trabalho (.URL)
                </h4>
              </div>
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded">
                Imediato (1 Clique)
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Baixa um ficheiro de atalho oficial do Windows. Basta arrastar para o seu Ambiente de Trabalho e dar 2 cliques para abrir sempre que precisar!
            </p>

            <button
              onClick={downloadWindowsUrlShortcut}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Atalho para Ambiente de Trabalho (.url)</span>
            </button>
          </div>

          {/* Option 3: Download Automated Windows Installer (.BAT / .ZIP) */}
          <div className="p-4 bg-slate-800/80 rounded-xl border border-emerald-600/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Opção 3: Instalador Automático Windows (.BAT / .ZIP)
                </h4>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded">
                Modo Janela Nativa
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Abre o sistema em modo de <strong>janela de programa dedicada</strong> (sem abas do navegador, parecendo 100% um programa .exe instalado).
            </p>

            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1">
              <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Versão 100% Silenciosa e Offline Atualizada</span>
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                • <strong>Sem tela de CMD:</strong> Não abre janela preta do prompt de comando.<br />
                • <strong>Sem Conta Google:</strong> Não pede login de conta Google nem autorizações na nuvem.<br />
                • <strong>100% Local:</strong> Executa direto no seu computador via servidor local embutido (127.0.0.1).
              </p>
            </div>

            {/* Direct Official Setup Package Download */}
            <div className="space-y-2">
              <a
                href="/Instalador_Gestao_Clientes_Vendas_OFFLINE_Setup.exe"
                download="Instalador_Gestao_Clientes_Vendas_OFFLINE_Setup.exe"
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>BAIXAR INSTALADOR SETUP (.EXE) SILENCIOSO</span>
              </a>

              <a
                href="/Gestao_Clientes_Vendas_PORTATIL.zip"
                download="Gestao_Clientes_Vendas_PORTATIL.zip"
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-300 font-bold rounded-xl text-xs transition-all border border-slate-700 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>BAIXAR PACOTE COMPLETO (.ZIP) COM ÍCONE E OFFLINE</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="/app_icon.ico"
                download="app_icon.ico"
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-semibold rounded-xl text-xs transition-all border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Baixar Ícone (.ico)</span>
              </a>

              <button
                onClick={downloadWindowsUrlShortcut}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Atalho (.url)</span>
              </button>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-700 text-[11px] text-slate-300">
              <span className="text-emerald-400 font-bold">Conteúdo da Versão Offline Silenciosa:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                <li><code className="text-emerald-300">ABRIR_PROGRAMA.vbs</code>: Inicializador 100% invisível sem tela de CMD</li>
                <li><code className="text-emerald-300">Instalar_Atalho_Ambiente_Trabalho.vbs</code>: Cria atalho com ícone oficial</li>
                <li><code className="text-white">server.ps1</code>: Servidor local em segundo plano (sem conexão externa)</li>
                <li><code className="text-white">app_icon.ico</code>: Ícone oficial do sistema em alta definição</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-400">
            Compatível com Windows 10, Windows 11, Mac, Android e iPhone.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
