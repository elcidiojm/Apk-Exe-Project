/**
 * Gestão de Clientes & Vendas (Moçambique)
 * Utilitários de Instalação e Execução Desktop 100% Silenciosa e Offline
 * (Sem telas pretas de CMD e Sem Pedido de Conta Google)
 */

export const getAppUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://ais-dev-hc5bffivo4rqvrj5kk7i7a-656498759235.europe-west1.run.app';
};

export const APP_PUBLIC_URL = typeof window !== 'undefined' && window.location.origin
  ? window.location.origin
  : 'https://ais-dev-hc5bffivo4rqvrj5kk7i7a-656498759235.europe-west1.run.app';

/**
 * Descarrega o Instalador Setup (.EXE) Direto
 * 100% Silencioso: não abre janela de CMD
 * 100% Offline: não pede login de Conta Google nem Cloud Run
 */
export const downloadWindowsInstallerExe = () => {
  const a = document.createElement('a');
  a.href = '/Instalador_Gestao_Clientes_Vendas_OFFLINE_Setup.exe';
  a.download = 'Instalador_Gestao_Clientes_Vendas_OFFLINE_Setup.exe';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * Descarrega o Script Silencioso VBScript (.VBS)
 * Cria o atalho com o ícone sem abrir NENHUMA janela preta de CMD
 */
export const downloadWindowsSilentInstaller = () => {
  const vbs = `' ====================================================================\r\n` +
    `' INSTALADOR DE ATALHO SILENCIOSO - GESTAO DE CLIENTES E VENDAS\r\n` +
    `' (SEM TELA PRETA DE CMD E SEM PEDIDO DE CONTA GOOGLE)\r\n` +
    `' ====================================================================\r\n` +
    `Set WshShell = CreateObject("WScript.Shell")\r\n` +
    `Set fso = CreateObject("Scripting.FileSystemObject")\r\n` +
    `desktopPath = WshShell.SpecialFolders("Desktop")\r\n` +
    `targetDir = WshShell.ExpandEnvironmentStrings("%APPDATA%\\GestaoClientesVendas")\r\n` +
    `If Not fso.FolderExists(targetDir) Then fso.CreateFolder(targetDir)\r\n` +
    `Set shortcut = WshShell.CreateShortcut(desktopPath & "\\Gestão de Clientes e Vendas.lnk")\r\n` +
    `shortcut.TargetPath = "wscript.exe"\r\n` +
    `shortcut.Arguments = """" & targetDir & "\\ABRIR_PROGRAMA.vbs"""\r\n` +
    `shortcut.WorkingDirectory = targetDir\r\n` +
    `shortcut.IconLocation = targetDir & "\\app_icon.ico,0"\r\n` +
    `shortcut.Description = "Sistema de Gestão de Clientes e Vendas"\r\n` +
    `shortcut.Save\r\n` +
    `WshShell.Popup "Atalho criado no seu Ambiente de Trabalho com sucesso!" & vbCrLf & "Iniciando sem tela preta e sem conta Google...", 3, "Gestão de Clientes e Vendas", 64\r\n`;

  const blob = new Blob([vbs], { type: 'text/vbscript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Instalar_Atalho_Silencioso.vbs';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Compatibilidade: redireciona para o Setup (.EXE) silencioso para não abrir CMD
 */
export const downloadWindowsBatInstaller = () => {
  downloadWindowsInstallerExe();
};

/**
 * Descarrega o Pacote Portátil Completo (.ZIP) contendo todos os ficheiros offline e inicializador silencioso
 */
export const downloadWindowsZipPackage = () => {
  const a = document.createElement('a');
  a.href = '/Gestao_Clientes_Vendas_PORTATIL.zip';
  a.download = 'Gestao_Clientes_Vendas_PORTATIL.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * Descarrega o atalho de internet (.URL) com o ícone oficial
 */
export const downloadWindowsUrlShortcut = () => {
  const targetUrl = getAppUrl();
  const content = `[InternetShortcut]\r\nURL=${targetUrl}\r\nIconIndex=0\r\nIconFile=%APPDATA%\\GestaoClientesVendas\\app_icon.ico\r\n`;
  const blob = new Blob([content], { type: 'application/internet-shortcut' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Gestão de Clientes e Vendas.url';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
