import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  PlusCircle, 
  ArrowRight, 
  Package, 
  AlertTriangle,
  Layers,
  FileSpreadsheet,
  Laptop,
  Download,
  Pencil,
  BarChart3,
  Sliders,
  PieChart as PieChartIcon,
  HardDrive,
  MessageSquare,
  Truck,
  TrendingDown,
  Boxes,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { useApp } from '../context/AppContext';
import { Order } from '../types';
import { formatMT, formatDate } from '../utils/formatters';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenNewOrder: () => void;
  onOpenNewPayment: () => void;
  onSelectClient: (clientId: string) => void;
  onViewOrderReceipt: (orderId: string) => void;
  onEditOrder?: (order: Order) => void;
  onOpenInstallPwa?: () => void;
  onOpenCashClosure?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewOrder,
  onOpenNewPayment,
  onSelectClient,
  onViewOrderReceipt,
  onEditOrder,
  onOpenInstallPwa,
  onOpenCashClosure,
}) => {
  const { 
    totalSales, 
    totalReceived, 
    totalDebt, 
    clients, 
    orders, 
    payments, 
    products, 
    customerDevices,
    clientSummaries, 
    exportExcel 
  } = useApp();

  // Top Debtors (clients with currentDebt > 0 sorted descending)
  const topDebtors = [...clientSummaries]
    .filter((s) => s.currentDebt > 0)
    .sort((a, b) => b.currentDebt - a.currentDebt)
    .slice(0, 5);

  const handleSendWhatsAppReminder = (e: React.MouseEvent, clientName: string, clientPhone: string, debt: number) => {
    e.stopPropagation();
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 9 ? `258${cleanPhone}` : cleanPhone;
    const message = `Olá Sr(a). *${clientName}*, esperamos que esteja bem!\n\nPassamos para lembrar cordialmente que possui um saldo pendente de *${formatMT(debt)}* na nossa loja.\n\nPoderá regularizar via M-Pesa, e-Mola ou no nosso balcão.\nMuito obrigado pela preferência!`;
    const url = formattedPhone 
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Recent Orders
  const recentOrders = orders.slice(0, 5);

  // Physical products with low or zero stock
  const allLowStockProducts = useMemo(() => {
    return products.filter((p) => p.type === 'physical' && p.stockQuantity <= p.minStockAlert);
  }, [products]);
  const outOfStockCount = allLowStockProducts.filter((p) => p.stockQuantity <= 0).length;
  const lowStockProducts = allLowStockProducts.slice(0, 4);

  // Visual Bar calculations
  const maxBarValue = Math.max(totalSales, 1);
  const salesPercent = 100;
  const receivedPercent = Math.min(100, Math.round((totalReceived / maxBarValue) * 100));
  const debtPercent = Math.min(100, Math.round((totalDebt / maxBarValue) * 100));

  // Chart 1: Sales by Category
  const categoryChartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {
      'Séries': 0,
      'Novelas': 0,
      'Filmes': 0,
      'Programas/Software': 0,
      'Baterias': 0,
      'Acessórios': 0,
      'Serviços Técnicos': 0,
      'Outros': 0,
    };

    orders.forEach((ord) => {
      ord.items.forEach((it) => {
        const cat = it.category || products.find((p) => p.id === it.productId)?.category || 'Outros';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (it.subtotal || 0);
      });
    });

    const categoryColors: Record<string, string> = {
      'Séries': '#6366f1',
      'Novelas': '#a855f7',
      'Filmes': '#ec4899',
      'Programas/Software': '#0284c7',
      'Baterias': '#10b981',
      'Acessórios': '#f59e0b',
      'Serviços Técnicos': '#f43f5e',
      'Outros': '#64748b',
    };

    return Object.entries(categoryTotals).map(([name, valor]) => ({
      name,
      valor,
      color: categoryColors[name] || '#64748b',
    }));
  }, [orders, products]);

  // Chart 2: Cash Flow (Sales vs Received Over Time)
  const cashFlowTimeline = useMemo(() => {
    const map: Record<string, { date: string; displayDate: string; vendas: number; recebido: number }> = {};

    orders.forEach((o) => {
      const d = o.date;
      if (!map[d]) {
        map[d] = { date: d, displayDate: formatDate(d), vendas: 0, recebido: 0 };
      }
      map[d].vendas += o.totalAmount;
    });

    payments.forEach((p) => {
      const d = p.date;
      if (!map[d]) {
        map[d] = { date: d, displayDate: formatDate(d), vendas: 0, recebido: 0 };
      }
      map[d].recebido += p.amount;
    });

    const sorted = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-7);
  }, [orders, payments]);

  // Chart 3: Financial Status Pie
  const financialPieData = useMemo(() => [
    { name: 'Recebido em Caixa', value: totalReceived, color: '#10b981' },
    { name: 'Em Dívida (Saldo Clientes)', value: totalDebt, color: '#f43f5e' },
  ], [totalReceived, totalDebt]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Date & System State */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-4 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-700/60">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Painel de Controlo
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Visão geral de vendas em Meticais (MT), caixa recebido, dívidas ativas e armazém.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportExcel}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md active:scale-95 border border-emerald-300"
            title="Descarregar folha de cálculo Excel com fórmulas automáticas"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-950" />
            <span>Baixar Planilha Excel (.xlsx)</span>
          </button>

          <a
            href="/Gestao_Clientes_Vendas_Planilha_Excel.xlsx"
            download="Gestao_Clientes_Vendas_Planilha_Excel.xlsx"
            className="hidden sm:flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-300 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all shadow-xs"
            title="Download direto do modelo Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Modelo Direto (.xlsx)</span>
          </a>

          {onOpenInstallPwa && (
            <button
              onClick={onOpenInstallPwa}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-xl transition-all"
              title="Atalhos para PC / Windows"
            >
              <Laptop className="w-3.5 h-3.5 text-slate-400" />
              <span>Atalhos PC</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Stock Alert Banner (Critical Warning) */}
      {allLowStockProducts.length > 0 && (
        <div className="bg-rose-50/90 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-rose-950">
                    Alerta de Armazém: {allLowStockProducts.length} {allLowStockProducts.length === 1 ? 'Produto Físico' : 'Produtos Físicos'} com Stock Baixo ou Esgotado!
                  </h3>
                  {outOfStockCount > 0 && (
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-600 text-white tracking-wider animate-pulse">
                      {outOfStockCount} Esgotado(s)
                    </span>
                  )}
                </div>
                <p className="text-xs text-rose-700 mt-1">
                  Os seguintes artigos atingiram ou desceram do stock mínimo de segurança. Reponha as quantidades para evitar roturas de vendas:
                </p>

                {/* Quick badges of low-stock products */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {allLowStockProducts.slice(0, 6).map((prod) => (
                    <span
                      key={prod.id}
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        prod.stockQuantity <= 0
                          ? 'bg-rose-200 text-rose-950 border-rose-300'
                          : 'bg-amber-100 text-amber-950 border-amber-300'
                      }`}
                    >
                      <span>{prod.name}</span>
                      <span className="font-mono text-[11px] font-black">
                        ({prod.stockQuantity} / min {prod.minStockAlert} {prod.unit})
                      </span>
                    </span>
                  ))}
                  {allLowStockProducts.length > 6 && (
                    <span className="text-xs text-rose-700 font-semibold self-center">
                      +{allLowStockProducts.length - 6} outros
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start md:self-auto shrink-0">
              <button
                onClick={() => onNavigate('products')}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
              >
                <Package className="w-4 h-4" />
                <span>Repor Stock no Armazém</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6 Metric Highlight Cards (Inspired by Page 18 of the PDF) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Vendas */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl p-4 shadow-lg shadow-emerald-900/20 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
              Total Vendas
            </span>
            <ShoppingCart className="w-4 h-4 text-emerald-200" />
          </div>
          <div className="mt-2 text-lg sm:text-xl font-black">
            {formatMT(totalSales)}
          </div>
          <p className="text-[10px] text-emerald-100/80 mt-1">
            Todas as encomendas
          </p>
        </div>

        {/* Card 2: Recebido */}
        <div className="bg-gradient-to-br from-sky-600 to-blue-700 text-white rounded-2xl p-4 shadow-lg shadow-blue-900/20 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-100">
              Total Recebido
            </span>
            <DollarSign className="w-4 h-4 text-sky-200" />
          </div>
          <div className="mt-2 text-lg sm:text-xl font-black">
            {formatMT(totalReceived)}
          </div>
          <p className="text-[10px] text-sky-100/80 mt-1">
            Em caixa / amortizado
          </p>
        </div>

        {/* Card 3: Em Dívida */}
        <div className="bg-gradient-to-br from-rose-600 to-red-700 text-white rounded-2xl p-4 shadow-lg shadow-rose-900/20 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-100">
              Em Dívida
            </span>
            <AlertCircle className="w-4 h-4 text-rose-200" />
          </div>
          <div className="mt-2 text-lg sm:text-xl font-black">
            {formatMT(totalDebt)}
          </div>
          <p className="text-[10px] text-rose-100/80 mt-1">
            Saldo devedor clientes
          </p>
        </div>

        {/* Card 4: Clientes */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-2xl p-4 shadow-lg shadow-purple-900/20">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-100">
              Clientes
            </span>
            <Users className="w-4 h-4 text-purple-200" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black">
            {clients.length}
          </div>
          <p className="text-[10px] text-purple-100/80 mt-1">
            Activos cadastrados
          </p>
        </div>

        {/* Card 5: Encomendas */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-4 shadow-lg shadow-amber-900/20">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
              Encomendas
            </span>
            <Package className="w-4 h-4 text-amber-200" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black">
            {orders.length}
          </div>
          <p className="text-[10px] text-amber-100/80 mt-1">
            Registadas no histórico
          </p>
        </div>

        {/* Card 6: Pagamentos */}
        <div className="bg-gradient-to-br from-teal-600 to-emerald-800 text-white rounded-2xl p-4 shadow-lg shadow-teal-900/20">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-100">
              Pagamentos
            </span>
            <CreditCard className="w-4 h-4 text-teal-200" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black">
            {payments.length}
          </div>
          <p className="text-[10px] text-teal-100/80 mt-1">
            M-Pesa, e-Mola, Caixa
          </p>
        </div>
      </div>

      {/* Acesso Rápido Buttons (Identical to page 18) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={onOpenNewOrder}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Nova Encomenda</span>
            <span className="text-[10px] text-emerald-700">Registar venda</span>
          </button>

          <button
            onClick={onOpenNewPayment}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Novo Pagamento</span>
            <span className="text-[10px] text-amber-800">Abater dívida</span>
          </button>

          <button
            onClick={() => onNavigate('clients')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/80 transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Clientes</span>
            <span className="text-[10px] text-purple-700">Ver contas</span>
          </button>

          <button
            onClick={() => onNavigate('products')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200/80 transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Produtos & Stock</span>
            <span className="text-[10px] text-sky-700">Físicos & Digitais</span>
          </button>

          <button
            onClick={() => onNavigate('orders')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Histórico Vendas</span>
            <span className="text-[10px] text-indigo-700">Todas encomendas</span>
          </button>

          <button
            onClick={() => onNavigate('pricing')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200/80 transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-violet-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Preços & Categorias</span>
            <span className="text-[10px] text-violet-700">Definições isoladas</span>
          </button>

          <button
            onClick={() => onNavigate('devices')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/80 transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <HardDrive className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Pens & Discos</span>
            <span className="text-[10px] text-teal-700">Gravações ({customerDevices.filter(d => d.status === 'gravando' || d.status === 'recebido').length} na fila)</span>
          </button>

          {onOpenCashClosure && (
            <button
              onClick={onOpenCashClosure}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 transition-all active:scale-95 group text-center"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">Fecho de Caixa</span>
              <span className="text-[10px] text-amber-800">Balancete diário</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('clients')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200/80 transition-all active:scale-95 group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Dívidas Clientes</span>
            <span className="text-[10px] text-rose-700">Saldos devedores</span>
          </button>
        </div>
      </div>

      {/* ERP Modules Bento Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
              Sistema Integrado de Gestão Empresarial
            </span>
            <h2 className="text-base sm:text-lg font-black text-white">
              Módulos ERP Moçambique
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Fornecedores • Despesas • Multi-Armazém • Cotações • Comissões
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Orçamentos / Proformas */}
          <button
            onClick={() => onNavigate('proformas')}
            className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 transition-all text-left group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                Vendas
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                Orçamentos & Proformas
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                Cotações em Meticais com conversão direta em venda.
              </p>
            </div>
          </button>

          {/* 2. Compras & Fornecedores */}
          <button
            onClick={() => onNavigate('suppliers')}
            className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 transition-all text-left group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                Compras
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                Fornecedores & Entradas
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                Ordens de compra, reposição automática e faturas de fornecedor.
              </p>
            </div>
          </button>

          {/* 3. Despesas & Contas a Pagar */}
          <button
            onClick={() => onNavigate('expenses')}
            className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-rose-500/50 transition-all text-left group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 group-hover:scale-105 transition-transform">
                <TrendingDown className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                Finanças
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                Despesas & Contas a Pagar
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                Custos fixos, aluguer, água, energia e cálculo de lucro líquido real.
              </p>
            </div>
          </button>

          {/* 4. Multi-Armazém & Lotes */}
          <button
            onClick={() => onNavigate('warehouses')}
            className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 transition-all text-left group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 group-hover:scale-105 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                Stock
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                Multi-Armazém & Lotes
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                Transferência entre lojas, controlo de datas de validade e lotes.
              </p>
            </div>
          </button>

          {/* 5. Comissões de Funcionários */}
          <button
            onClick={() => onNavigate('commissions')}
            className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 transition-all text-left group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                RH & Vendas
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                Comissões de Vendas
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                Cálculo automático de % por vendedor e liquidação com recibo.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Charts & Visual Analytics Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Gráficos & Análise por Categorias e Fluxo de Caixa
              </h2>
              <p className="text-[11px] text-slate-400">
                Desempenho em Meticais (MT) por Séries, Novelas, Filmes, Software, Físicos e Serviços
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('pricing')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors self-start sm:self-auto"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configurar Preços por Categoria</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Sales By Category */}
          <div className="lg:col-span-6 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Volume de Vendas por Categoria (MT)
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Categorias ativas
              </span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-25} 
                    textAnchor="end" 
                    interval={0} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    tickFormatter={(val) => `${val} MT`} 
                  />
                  <Tooltip 
                    formatter={(val: any) => [`${formatMT(Number(val))}`, 'Total Vendido']}
                    contentStyle={{ borderRadius: '12px', fontSize: '11px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Cash Flow Timeline (Sales vs Payments) */}
          <div className="lg:col-span-6 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Fluxo Recente: Vendas vs. Pagamentos (MT)
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Últimos dias ativos
              </span>
            </div>
            <div className="h-60 w-full">
              {cashFlowTimeline.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Sem dados cronológicos suficientes para gerar o gráfico.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                    <defs>
                      <linearGradient id="vendasGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="recebidoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      tickFormatter={(val) => `${val} MT`} 
                    />
                    <Tooltip 
                      formatter={(val: any, name: any) => [
                        formatMT(Number(val)), 
                        name === 'vendas' ? 'Total Vendas' : 'Total Recebido'
                      ]}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '6px' }}
                      formatter={(value) => (value === 'vendas' ? 'Vendas' : 'Recebido em Caixa')}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="vendas" 
                      stroke="#6366f1" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#vendasGrad)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="recebido" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#recebidoGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section: Latest Orders & Top Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Orders (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Últimas Encomendas
                </h3>
              </div>
              <button
                onClick={() => onNavigate('orders')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center space-x-1"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold text-[10px] uppercase">
                    <th className="py-2 text-left">Data</th>
                    <th className="py-2 text-left">Cliente</th>
                    <th className="py-2 text-left">Itens</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-center">Estado</th>
                    <th className="py-2 text-right">Recibo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 whitespace-nowrap text-slate-500">
                        {formatDate(ord.date)}
                      </td>
                      <td className="py-2.5 whitespace-nowrap font-medium text-slate-900">
                        <button
                          onClick={() => onSelectClient(ord.clientId)}
                          className="hover:text-emerald-600 hover:underline text-left"
                        >
                          {ord.clientName}
                        </button>
                      </td>
                      <td className="py-2.5 text-slate-600 max-w-[140px] truncate">
                        {ord.items.map((i) => i.productName).join(', ')}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap font-bold text-slate-900">
                        {formatMT(ord.totalAmount)}
                      </td>
                      <td className="py-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ord.status === 'paga'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'parcial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          {onEditOrder && (
                            <button
                              onClick={() => onEditOrder(ord)}
                              className="text-amber-600 hover:text-amber-800 p-1 hover:bg-amber-50 rounded"
                              title="Editar Encomenda"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onViewOrderReceipt(ord.id)}
                            className="text-slate-400 hover:text-slate-700 text-[11px] underline"
                          >
                            Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 flex justify-between items-center text-xs text-slate-500">
            <span>Total de encomendas: {orders.length}</span>
            <button
              onClick={onOpenNewOrder}
              className="text-emerald-600 font-bold hover:underline"
            >
              + Nova Encomenda
            </button>
          </div>
        </div>

        {/* Right Column: Resumo por Cliente (Top Devedores) (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Resumo de Dívidas por Cliente
                </h3>
              </div>
              <button
                onClick={() => onNavigate('clients')}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center space-x-1"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {topDebtors.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl">
                Parabéns! Não existem clientes com dívidas em aberto.
              </div>
            ) : (
              <div className="space-y-2.5">
                {topDebtors.map((s, index) => (
                  <div
                    key={s.client.id}
                    onClick={() => onSelectClient(s.client.id)}
                    className="p-3 bg-slate-50 hover:bg-rose-50/50 rounded-xl border border-slate-200 hover:border-rose-200 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-bold text-xs text-slate-900 group-hover:text-rose-700 transition-colors block">
                          {s.client.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Comprado: {formatMT(s.totalPurchased)} | Pago: {formatMT(s.totalPaid)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <span className="text-xs font-black text-rose-600 block">
                          {formatMT(s.currentDebt)}
                        </span>
                        <span className="text-[9px] text-slate-400 uppercase font-semibold">
                          Em Dívida
                        </span>
                      </div>

                      {s.client.phone && (
                        <button
                          type="button"
                          onClick={(e) => handleSendWhatsAppReminder(e, s.client.name, s.client.phone, s.currentDebt)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
                          title="Enviar lembrete no WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 flex justify-between items-center text-xs text-slate-500">
            <span>Dívida Global:</span>
            <span className="font-black text-rose-600">{formatMT(totalDebt)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Visual Balance Progress & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Balance Comparison Bar */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Comparativo: Vendas vs. Recebido vs. Em Dívida</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Meticais (MT)</span>
          </div>

          <div className="space-y-3">
            {/* Sales Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-600">Total de Vendas / Encomendas</span>
                <span className="font-bold text-slate-900">{formatMT(totalSales)}</span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${salesPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Received Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-600">Total Recebido (Caixa)</span>
                <span className="font-bold text-sky-700">{formatMT(totalReceived)} ({receivedPercent}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${receivedPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Debt Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-600">Saldo Pendente em Dívida</span>
                <span className="font-bold text-rose-600">{formatMT(totalDebt)} ({debtPercent}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${debtPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts (Physical Products) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Stock Armazém (Produtos Físicos)</span>
              </h3>
              <button
                onClick={() => onNavigate('products')}
                className="text-xs text-sky-600 font-semibold hover:underline"
              >
                Gerir Stock
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
                <span className="text-base">✅</span>
                <span>Todos os produtos físicos estão com níveis de stock saudáveis.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{p.name}</span>
                      <span className="text-[10px] text-slate-500">
                        Preço: {formatMT(p.price)} | Alerta Mínimo: {p.minStockAlert} {p.unit}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-black text-sm block ${
                          p.stockQuantity === 0 ? 'text-rose-600' : 'text-amber-700'
                        }`}
                      >
                        {p.stockQuantity === 0 ? 'ESGOTADO' : `${p.stockQuantity} ${p.unit}`}
                      </span>
                      <span className="text-[9px] text-slate-400">Stock Atual</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
            💡 Produtos digitais (filmes, séries, novelas, programas) não sofrem limitação de stock físico.
          </p>
        </div>
      </div>
    </div>
  );
};
