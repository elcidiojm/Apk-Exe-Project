import React, { useRef, useState } from 'react';
import { 
  FileText, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  CreditCard, 
  Users, 
  Package,
  Check,
  Copy,
  Code,
  Laptop,
  ExternalLink,
  FileCode,
  Database,
  HardDrive,
  RefreshCw,
  Cloud
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatMT } from '../utils/formatters';
import { 
  APP_PUBLIC_URL, 
  downloadWindowsUrlShortcut, 
  downloadWindowsBatInstaller, 
  downloadWindowsZipPackage 
} from '../utils/desktopLauncher';

export const ReportsView: React.FC = () => {
  const { 
    totalSales, 
    totalReceived, 
    totalDebt, 
    clients, 
    orders, 
    payments, 
    products, 
    clientSummaries, 
    exportExcel, 
    exportJSONBackup, 
    importJSONBackup, 
    resetToDefaults,
    downloadBackupJSON,
    createBackup,
    isBackingUp,
    lastAutoBackupTime,
    autoBackupConfig,
    backups
  } = useApp();
  const [manualBackupNotice, setManualBackupNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'success' | 'error' | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [copiedSheets, setCopiedSheets] = useState(false);
  const [showSheetsGuide, setShowSheetsGuide] = useState(false);

  const googleSheetsCode = `function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Gestão de Vendas')
    .addItem('💰 Registar Pagamento Rápido', 'registarPagamento')
    .addToUi();
}

function registarPagamento() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Pagamentos');
  
  if (!sheet) {
    ui.alert('Aba "Pagamentos" não foi encontrada.');
    return;
  }
  
  var rCli = ui.prompt('Registar Pagamento', 'Digite o Nome do Cliente:', ui.ButtonSet.OK_CANCEL);
  if (rCli.getSelectedButton() !== ui.Button.OK) return;
  var cliente = rCli.getResponseText().trim();
  if (!cliente) return;
  
  var rVal = ui.prompt('Registar Pagamento', 'Digite o Valor em Meticais (MT):', ui.ButtonSet.OK_CANCEL);
  if (rVal.getSelectedButton() !== ui.Button.OK) return;
  var valor = parseFloat(rVal.getResponseText().replace(',', '.'));
  if (isNaN(valor) || valor <= 0) {
    ui.alert('Valor inválido!');
    return;
  }
  
  var rForma = ui.prompt('Forma de Pagamento', 'Forma (M-Pesa, e-Mola, Numerário, Banco):', ui.ButtonSet.OK_CANCEL);
  var forma = rForma.getResponseText().trim() || 'M-Pesa';
  
  var lastRow = sheet.getLastRow() + 1;
  var recNum = 'REC-' + ('000' + (lastRow - 1)).slice(-4);
  var dataHoje = Utilities.formatDate(new Date(), 'GMT+2', 'yyyy-MM-dd');
  
  sheet.appendRow([recNum, dataHoje, cliente, valor, forma, 'Amortização', 'Via Google Sheets', '']);
  ui.alert('✅ Pagamento registado com sucesso! A aba "Clientes e Dívidas" foi recalculada automaticamente.');
}`;

  const handleCopySheetsCode = () => {
    navigator.clipboard.writeText(googleSheetsCode);
    setCopiedSheets(true);
    setTimeout(() => setCopiedSheets(false), 3000);
  };

  // Method breakdown
  const methodTotals = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  // Product sales volume
  const productSales = orders
    .filter((o) => o.status !== 'cancelada')
    .flatMap((o) => o.items)
    .reduce((acc, item) => {
      acc[item.productName] = (acc[item.productName] || 0) + item.subtotal;
      return acc;
    }, {} as Record<string, number>);

  const sortedProducts: [string, number][] = (Object.entries(productSales) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importJSONBackup(content);
        if (ok) {
          setImportStatus('success');
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('error');
          setTimeout(() => setImportStatus(null), 4000);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-black text-slate-900">
              Relatórios, Excel & Backup dos Dados
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Exporte para folha de cálculo Excel (.xlsx) e guarde backups para segurança absoluta
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportExcel}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Baixar Planilha Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Faturado</span>
          <div className="text-xl font-black text-slate-900 mt-1">{formatMT(totalSales)}</div>
          <span className="text-[10px] text-slate-400">{orders.length} encomendas</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Recebido</span>
          <div className="text-xl font-black text-emerald-700 mt-1">{formatMT(totalReceived)}</div>
          <span className="text-[10px] text-emerald-600 font-medium">Caixa efetivo</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase">Dívida a Receber</span>
          <div className="text-xl font-black text-rose-600 mt-1">{formatMT(totalDebt)}</div>
          <span className="text-[10px] text-rose-500 font-medium">Clientes pendentes</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase">Base de Clientes</span>
          <div className="text-xl font-black text-purple-700 mt-1">{clients.length}</div>
          <span className="text-[10px] text-purple-600 font-medium">Clientes ativos</span>
        </div>
      </div>

      {/* DEDICATED EXCEL DASHBOARD & FORMULAS SECTION (PRIORITY FOCUS) */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-5 sm:p-6 rounded-2xl border-2 border-emerald-500/60 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800/60 pb-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-emerald-600 text-slate-950 rounded-xl shadow-lg shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-300 font-black text-[10px] rounded uppercase tracking-wider">
                  Solução 100% Microsoft Excel & Google Sheets
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Fórmulas Vivas Automáticas
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                Planilha Comercial Completa com Fórmulas Prontas
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Pode usar diretamente no seu Excel do computador ou telemóvel sem complicações. A planilha já traz todas as fórmulas (<span className="font-mono text-emerald-300">SOMA.SE / SUMIF</span>) programadas para somar vendas, calcular dívidas e abater amortizações instantaneamente.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
            <button
              onClick={exportExcel}
              className="flex items-center space-x-2 px-4 py-3 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-slate-950 rounded-xl text-xs font-black shadow-lg transition-all"
              title="Baixar ficheiro Excel com os dados registados neste momento"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
              <span>Baixar Planilha com Dados Atuais (.xlsx)</span>
            </button>

            <a
              href="/Gestao_Clientes_Vendas_Planilha_Excel.xlsx"
              download="Gestao_Clientes_Vendas_Planilha_Excel.xlsx"
              className="flex items-center space-x-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-600 rounded-xl text-xs font-bold shadow-md transition-all"
              title="Baixar modelo base pronto em Excel (download direto garantido)"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Baixar Modelo Base Direto (.xlsx)</span>
            </a>
          </div>
        </div>

        {/* 6 Sheets Explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="font-bold text-emerald-400">1. Aba "Painel Geral"</span>
            <p className="text-slate-300 text-[11px]">
              Cartões de resumo com fórmulas de total de vendas, total recebido e dívidas ativas.
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="font-bold text-emerald-400">2. Aba "Clientes e Dívidas"</span>
            <p className="text-slate-300 text-[11px]">
              Fórmula <span className="font-mono text-emerald-300">=SOMA.SE(...)</span> que soma todas as encomendas e deduz amortizações.
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="font-bold text-emerald-400">3. Aba "Produtos e Stock"</span>
            <p className="text-slate-300 text-[11px]">
              Alertas automáticos de <span className="text-rose-400 font-bold">ESGOTADO</span> ou <span className="text-amber-400 font-bold">STOCK BAIXO</span>.
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="font-bold text-emerald-400">4. Aba "Encomendas"</span>
            <p className="text-slate-300 text-[11px]">
              Registo de pedidos com cálculo de saldo pendente e estado (<span className="text-emerald-300">PAGA</span> / <span className="text-amber-300">PARCIAL</span> / <span className="text-rose-300">PENDENTE</span>).
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="font-bold text-emerald-400">5. Aba "Pagamentos"</span>
            <p className="text-slate-300 text-[11px]">
              Registo de amortizações por M-Pesa, e-Mola, Numerário e Transferência Bancária.
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
            <span className="font-bold text-emerald-400">6. Aba "Como Usar no Sheets e Excel"</span>
            <p className="text-slate-300 text-[11px]">
              Instruções completas para Google Sheets (Apps Script) e Microsoft Excel (VBA).
            </p>
          </div>
        </div>

        {/* Formula Reference Table for Excel */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Tabela de Fórmulas Automáticas (Para copiar ou consultar no Excel)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2 font-bold">Objetivo</th>
                  <th className="pb-2 font-bold font-mono">Fórmula Excel (Português)</th>
                  <th className="pb-2 font-bold font-mono">Fórmula Excel (Inglês / Sheets)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                <tr>
                  <td className="py-2 font-semibold text-white">Dívida de um Cliente</td>
                  <td className="py-2 font-mono text-emerald-400">=SOMA.SE(Encomendas!C:C; B2; Encomendas!E:E) - SOMA.SE(Pagamentos!C:C; B2; Pagamentos!D:D)</td>
                  <td className="py-2 font-mono text-sky-400">=SUMIF(Encomendas!C:C, B2, Encomendas!E:E) - SUMIF(Pagamentos!C:C, B2, Pagamentos!D:D)</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold text-white">Alerta de Stock</td>
                  <td className="py-2 font-mono text-emerald-400">=SE(G2=0; "ESGOTADO"; SE(G2&lt;=H2; "STOCK BAIXO"; "NORMAL"))</td>
                  <td className="py-2 font-mono text-sky-400">=IF(G2=0, "ESGOTADO", IF(G2&lt;=H2, "STOCK BAIXO", "NORMAL"))</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold text-white">Saldo Pendente Encomenda</td>
                  <td className="py-2 font-mono text-emerald-400">=MÁXIMO(0; E2-F2)</td>
                  <td className="py-2 font-mono text-sky-400">=MAX(0, E2-F2)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Breakdown Grid: Methods & Top Sold Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Distribuição dos Recebimentos por Canal
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(methodTotals).length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum pagamento registado ainda.</p>
            ) : (
              (Object.entries(methodTotals) as [string, number][]).map(([method, amount]) => {
                const percent = totalReceived > 0 ? Math.round((amount / totalReceived) * 100) : 0;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{method}</span>
                      <span className="text-slate-900 font-bold">
                        {formatMT(amount)} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Sold Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Package className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Produtos & Serviços com Maior Faturação
            </h3>
          </div>

          <div className="space-y-2.5">
            {sortedProducts.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhuma encomenda registada ainda.</p>
            ) : (
              sortedProducts.map(([name, amount], idx) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800">{name}</span>
                  </div>
                  <span className="font-black text-slate-900">{formatMT(amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* DEDICATED COMPUTER (PC) INSTALLATION & DOWNLOAD SECTION */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-5 sm:p-6 rounded-2xl border border-indigo-500/40 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/60 pb-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 font-bold text-[10px] rounded uppercase tracking-wider">
                  Windows PC & Telemóvel
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Opções Disponíveis e Testadas
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-1">
                Instalar no Computador / Baixar Atalho para Área de Trabalho
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Se os botões dentro do painel de teste não funcionaram, é porque os navegadores bloqueiam instalações automáticas dentro de quadros (iframes). Use qualquer uma das opções testadas abaixo:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={APP_PUBLIC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-4 py-3 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg transition-all"
            >
              <span>Abrir Fora do Painel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Option 1: Download Automated Windows Installer */}
          <div className="p-4 bg-slate-800/80 rounded-xl border border-emerald-500/60 space-y-3 flex flex-col justify-between shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-400" />
                  OPÇÃO 1: Instalador Setup (.EXE)
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded">
                  ⭐ Recomendado
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                100% Silencioso e Offline. Não abre tela de CMD e não pede login do Google. Instala com ícone oficial no Ambiente de Trabalho.
              </p>
            </div>

            <a
              href="/Instalador_Gestao_Clientes_Vendas_OFFLINE_Setup.exe"
              download="Instalador_Gestao_Clientes_Vendas_OFFLINE_Setup.exe"
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md cursor-pointer"
              title="Instalador Executável Direto (.exe)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Setup (.exe)</span>
            </a>
          </div>

          {/* Option 2: Portable Package (.ZIP) */}
          <div className="p-4 bg-slate-800/80 rounded-xl border border-teal-600/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-300 text-xs flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-teal-400" />
                  OPÇÃO 2: Pacote Portátil (.ZIP)
                </span>
                <span className="px-1.5 py-0.5 bg-teal-500/20 text-teal-300 text-[10px] font-bold rounded">
                  Sem Instalação
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Ideal para Pen Drive ou computador restrito. Extraia e dê dois cliques em <code>ABRIR_PROGRAMA.vbs</code> para abrir silenciosamente.
              </p>
            </div>

            <a
              href="/Gestao_Clientes_Vendas_PORTATIL.zip"
              download="Gestao_Clientes_Vendas_PORTATIL.zip"
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-teal-600 hover:bg-teal-500 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              title="Ficheiro .ZIP portátil completo"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Pacote (.zip)</span>
            </a>
          </div>

          {/* Option 3: Download .URL Shortcut */}
          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-indigo-400" />
                  OPÇÃO 3: Atalho & Ícone (.ICO)
                </span>
                <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-[10px] font-bold rounded">
                  Personalização
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Baixe o ícone de alta resolução oficial ou o atalho de acesso direto para o seu computador.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href="/app_icon.ico"
                download="app_icon.ico"
                className="flex items-center justify-center space-x-1 py-2.5 px-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Ícone (.ico)</span>
              </a>
              <button
                onClick={downloadWindowsUrlShortcut}
                className="flex items-center justify-center space-x-1 py-2.5 px-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Atalho (.url)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup and Restore Box (Directly addressing Page 38 & Page 73 of PDF) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black text-slate-900">
                Cópia de Segurança & Backup do Banco de Dados (Firestore)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Backup automático do banco de dados na nuvem e opção para descarregar o ficheiro .JSON para garantir a segurança absoluta dos dados.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-Backup Ativo (a cada {autoBackupConfig?.frequencyHours || 6}h)
            </span>
          </div>
        </div>

        {manualBackupNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{manualBackupNotice}</span>
          </div>
        )}

        {importStatus === 'success' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Backup restaurado com sucesso! Todos os dados foram atualizados.</span>
          </div>
        )}

        {importStatus === 'error' && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Ficheiro de backup inválido. Certifique-se de selecionar um ficheiro .json exportado pelo sistema.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          {/* Export JSON */}
          <button
            onClick={() => {
              downloadBackupJSON();
              setManualBackupNotice("Ficheiro de backup JSON descarregado com sucesso!");
              setTimeout(() => setManualBackupNotice(null), 4000);
            }}
            className="flex items-center justify-center space-x-2 p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Descarregar Backup (.JSON)</span>
          </button>

          {/* Trigger Firestore Snapshot */}
          <button
            disabled={isBackingUp}
            onClick={async () => {
              try {
                const b = await createBackup("manual", "Cópia Manual do Painel");
                setManualBackupNotice(`Ponto de restauro salvo no Firestore! (${b.totalRecords} registos salvaguardados)`);
                setTimeout(() => setManualBackupNotice(null), 4000);
              } catch (e: any) {
                alert("Erro ao salvar no Firestore: " + e.message);
              }
            }}
            className="flex items-center justify-center space-x-2 p-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            {isBackingUp ? (
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
            ) : (
              <Database className="w-4 h-4 text-purple-400" />
            )}
            <span>{isBackingUp ? "A Salvar..." : "Salvar no Firestore"}</span>
          </button>

          {/* Import JSON */}
          <label className="flex items-center justify-center space-x-2 p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-slate-300">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Restaurar Ficheiro de Backup</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Reset Demo Data */}
          <button
            onClick={() => setResetConfirm(true)}
            className="flex items-center justify-center space-x-2 p-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Repor Dados Originais</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation */}
      {resetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Repor dados de exemplo?</h3>
            <p className="text-xs text-slate-500">
              Isso substituirá os dados atuais pelos registos originais da conversa (João Silva, Carlos Alberto, etc.).
            </p>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                onClick={() => setResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  resetToDefaults();
                  setResetConfirm(false);
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Sim, Repor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
