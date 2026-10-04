import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  CreditCard, 
  Users, 
  Package, 
  FileText, 
  PlusCircle, 
  Menu, 
  X, 
  Download,
  AlertTriangle,
  Cloud,
  Laptop,
  ShieldCheck,
  LogOut,
  Sliders,
  HardDrive,
  DollarSign,
  Truck,
  TrendingDown,
  FileSpreadsheet,
  Boxes,
  Award,
  Database,
  Search,
  ChevronDown,
  ChevronUp,
  FileDown,
  FolderKanban,
  CheckCircle2,
  Receipt,
  UserCheck,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatMT } from '../utils/formatters';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewOrder: () => void;
  onOpenNewPayment: () => void;
  onOpenInstallPwa: () => void;
  onOpenUsersModal: () => void;
  onOpenCashClosure?: () => void;
}

type RibbonCategory = 
  | 'inicio' 
  | 'vendas' 
  | 'compras' 
  | 'stock' 
  | 'financeiro' 
  | 'servicos' 
  | 'sistema'
  | 'definicoes';

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewOrder,
  onOpenNewPayment,
  onOpenInstallPwa,
  onOpenUsersModal,
  onOpenCashClosure,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { totalDebt, products, customerDevices, exportExcel, syncStatus, syncWithCloud } = useApp();
  const { currentUser, logout, isAdmin, permissions } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncWithCloud();
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  // Stock alerts
  const lowStockCount = useMemo(() => {
    return products.filter(
      (p) => p.type === 'physical' && p.stockQuantity <= (p.minStockAlert || 5)
    ).length;
  }, [products]);

  // Devices status
  const pendingDevicesCount = useMemo(() => {
    return customerDevices.filter(
      (d) => d.status === 'gravando' || d.status === 'pronto'
    ).length;
  }, [customerDevices]);

  const readyDevicesCount = useMemo(() => {
    return customerDevices.filter((d) => d.status === 'pronto').length;
  }, [customerDevices]);

  // Map each activeTab to its parent Ribbon category
  const getCategoryForTab = (tab: string): RibbonCategory => {
    switch (tab) {
      case 'dashboard':
        return 'inicio';
      case 'orders':
      case 'clients':
      case 'proformas':
      case 'commissions':
        return 'vendas';
      case 'suppliers':
        return 'compras';
      case 'products':
      case 'warehouses':
      case 'pricing':
        return 'stock';
      case 'payments':
      case 'expenses':
        return 'financeiro';
      case 'devices':
        return 'servicos';
      case 'reports':
      case 'downloads':
        return 'sistema';
      case 'settings':
        return 'definicoes';
      default:
        return 'inicio';
    }
  };

  const [activeRibbon, setActiveRibbon] = useState<RibbonCategory>(() => getCategoryForTab(activeTab));

  // Sync active ribbon tab when activeTab changes externally
  useEffect(() => {
    const parentCat = getCategoryForTab(activeTab);
    setActiveRibbon(parentCat);
  }, [activeTab]);

  // Close quick search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleLabel = () => {
    if (!currentUser) return '';
    switch (currentUser.role) {
      case 'admin':
        return 'Administrador';
      case 'vendedor':
        return 'Vendedor';
      case 'armazem':
        return 'Armazém';
      default:
        return 'Visualizador';
    }
  };

  // Quick Action / Search items (Tell Me what you want to do)
  const allSearchableActions = useMemo(() => [
    { id: 'new_order', label: 'Nova Encomenda (Registar Venda)', category: 'Vendas', action: onOpenNewOrder, icon: PlusCircle, isModal: true },
    { id: 'new_payment', label: 'Novo Pagamento (Liquidar Dívida/Recibo)', category: 'Financeiro', action: onOpenNewPayment, icon: CreditCard, isModal: true },
    { id: 'cash_closure', label: 'Fecho de Caixa Diário', category: 'Financeiro', action: onOpenCashClosure, icon: DollarSign, isModal: true },
    { id: 'orders', label: 'Ver Todas as Encomendas', category: 'Vendas', action: () => setActiveTab('orders'), icon: ShoppingCart },
    { id: 'clients', label: 'Ver Clientes & Contas Correntes', category: 'Vendas', action: () => setActiveTab('clients'), icon: Users },
    { id: 'proformas', label: 'Orçamentos & Cotações Proforma', category: 'Vendas', action: () => setActiveTab('proformas'), icon: FileSpreadsheet },
    { id: 'commissions', label: 'Comissões de Vendedores', category: 'Vendas', action: () => setActiveTab('commissions'), icon: Award },
    { id: 'products', label: 'Catálogo de Produtos & Stock', category: 'Stock', action: () => setActiveTab('products'), icon: Package },
    { id: 'warehouses', label: 'Multi-Armazém, Lotes & Validades', category: 'Stock', action: () => setActiveTab('warehouses'), icon: Boxes },
    { id: 'pricing', label: 'Tabela de Preços & Categorias', category: 'Stock', action: () => setActiveTab('pricing'), icon: Sliders },
    { id: 'suppliers', label: 'Fornecedores & Compras ERP', category: 'Compras', action: () => setActiveTab('suppliers'), icon: Truck },
    { id: 'expenses', label: 'Despesas & Contas a Pagar', category: 'Financeiro', action: () => setActiveTab('expenses'), icon: TrendingDown },
    { id: 'devices', label: 'Pens, Discos & Cartões de Clientes', category: 'Serviços', action: () => setActiveTab('devices'), icon: HardDrive },
    { id: 'reports', label: 'Relatórios Gerenciais & Backup', category: 'Sistema', action: () => setActiveTab('reports'), icon: FileText },
    { id: 'excel_export', label: 'Exportar Base de Dados em Excel', category: 'Sistema', action: exportExcel, icon: FileDown },
    { id: 'users_modal', label: 'Gestão de Utilizadores & Permissões', category: 'Sistema', action: onOpenUsersModal, icon: ShieldCheck, isModal: true },
  ], [onOpenNewOrder, onOpenNewPayment, onOpenCashClosure, setActiveTab, exportExcel, onOpenUsersModal]);

  const filteredSearchActions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allSearchableActions.filter((a) =>
      a.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allSearchableActions, searchQuery]);

  return (
    <header className="bg-slate-900 text-slate-100 shadow-md sticky top-0 z-30 border-b border-slate-700/80 select-none">
      {/* 1. TOP TITLE BAR & QUICK ACCESS TOOLBAR (Estilo Excel / Primavera) */}
      <div className="bg-slate-950/90 border-b border-slate-800 text-xs px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2">
        {/* Left: Quick Access Toolbar (Barra de Acesso Rápido) */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Logo / Brand */}
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-2 mr-2 group focus:outline-none"
            title="Ir para o Painel Geral"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-slate-100 tracking-tight text-xs flex items-center space-x-1.5">
              <span>ERP COMERCIAL</span>
              <span className="hidden md:inline-block px-1.5 py-0.2 bg-emerald-950/80 text-emerald-400 font-mono text-[10px] rounded border border-emerald-800/60">
                MT
              </span>
            </span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block"></div>

          {/* Quick Access Action Buttons (Salvar/Nuvem, Excel, Fecho, etc.) */}
          <div className="hidden sm:flex items-center space-x-1">
            {/* Cloud Sync Status & Manual Trigger */}
            <button 
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                syncStatus === 'online' 
                  ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/60' 
                  : syncStatus === 'connecting' || isSyncing
                  ? 'bg-amber-950/70 border-amber-700/80 text-amber-300 hover:bg-amber-900/60'
                  : 'bg-rose-950/70 border-rose-700/80 text-rose-300 hover:bg-rose-900/60'
              }`}
              title="Clique para sincronizar dados com o Firestore e verificar atualizações do sistema"
            >
              <Cloud className={`w-3 h-3 ${isSyncing ? 'animate-bounce text-amber-300' : ''}`} />
              <span className="hidden xl:inline">
                {isSyncing 
                  ? 'A sincronizar...' 
                  : syncStatus === 'online' 
                  ? 'Nuvem Conectada' 
                  : syncStatus === 'connecting' 
                  ? 'A ligar...' 
                  : 'Offline (Clique p/ Sincronizar)'}
              </span>
              <RefreshCw className={`w-2.5 h-2.5 opacity-70 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* Quick Export Excel */}
            <button
              onClick={exportExcel}
              className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
              title="Exportar Dados em Excel (.csv/planilha)"
            >
              <FileDown className="w-3.5 h-3.5" />
            </button>

            {/* Quick Cash Closure */}
            {onOpenCashClosure && (
              <button
                onClick={onOpenCashClosure}
                className="flex items-center space-x-1 px-1.5 py-0.5 text-[11px] font-medium text-amber-300 hover:bg-amber-950/40 rounded transition-colors"
                title="Fecho de Caixa Diário"
              >
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Caixa</span>
              </button>
            )}

            {/* Quick New Order */}
            {permissions.canCreateOrders && (
              <button
                onClick={onOpenNewOrder}
                className="flex items-center space-x-1 px-2 py-0.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors shadow-xs"
                title="Atalho: Criar Nova Encomenda"
              >
                <PlusCircle className="w-3 h-3" />
                <span>+ Encomenda</span>
              </button>
            )}

            {/* Quick New Payment */}
            {permissions.canRegisterPayments && (
              <button
                onClick={onOpenNewPayment}
                className="flex items-center space-x-1 px-2 py-0.5 text-[11px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded transition-colors shadow-xs"
                title="Atalho: Registar Pagamento / Recibo"
              >
                <CreditCard className="w-3 h-3" />
                <span>+ Pagamento</span>
              </button>
            )}
          </div>
        </div>

        {/* Center: Tell-Me Search Bar (O que pretende fazer...) */}
        <div ref={searchRef} className="relative flex-1 max-w-xs sm:max-w-md mx-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Diga-me o que pretende fazer (procurar menu ou ação)..."
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-900/90 border border-slate-700/80 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 placeholder-slate-500 transition-all"
            />
          </div>

          {/* Quick Search Dropdown */}
          {isSearchOpen && filteredSearchActions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 max-h-72 overflow-y-auto py-1 divide-y divide-slate-800">
              {filteredSearchActions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.action) item.action();
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800/80 transition-colors text-xs group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="text-slate-200 font-medium">{item.label}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Total Debt Alert, User Profile & Logout */}
        <div className="flex items-center space-x-2 shrink-0">
          {totalDebt > 0 && permissions.canViewDashboard && (
            <div 
              onClick={() => setActiveTab('clients')}
              className="hidden md:flex items-center space-x-1.5 bg-rose-950/70 border border-rose-800/70 px-2 py-0.5 rounded text-[11px] cursor-pointer hover:bg-rose-900/70 transition-colors"
              title="Dívida Total de Clientes em Aberto"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-rose-300 font-medium">Dívida:</span>
              <span className="text-rose-100 font-bold">{formatMT(totalDebt)}</span>
            </div>
          )}

          {/* Admin Database & Users Shortcut */}
          {isAdmin && (
            <button
              onClick={onOpenUsersModal}
              className="hidden lg:flex items-center space-x-1 px-2 py-0.5 text-[10px] font-semibold text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/70 rounded transition-colors"
              title="Painel de Segurança & Utilizadores"
            >
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span>Gestão</span>
            </button>
          )}

          {/* User Profile Chip */}
          <div className="flex items-center space-x-1.5 border-l border-slate-800 pl-2">
            <button
              onClick={onOpenUsersModal}
              className="flex items-center space-x-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/80 transition-colors text-left"
              title={`Sessão iniciada como ${currentUser?.name} (${getRoleLabel()})`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                isAdmin ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {currentUser?.name.slice(0, 1).toUpperCase()}
              </div>
              <span className="hidden xl:inline text-slate-300 font-medium text-[11px] max-w-[90px] truncate">
                {currentUser?.name.split(' ')[0]}
              </span>
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
              title="Terminar Sessão"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 lg:hidden text-slate-300 hover:text-white hover:bg-slate-800 rounded"
              title="Menu Principal"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. RIBBON TABS BAR (Separadores Estilo Excel / Primavera) */}
      <div className="hidden lg:flex items-center justify-between bg-slate-900 px-4 border-b border-slate-700/60">
        <div className="flex items-center space-x-1">
          {/* Guia Início */}
          <button
            onClick={() => {
              setActiveRibbon('inicio');
              setActiveTab('dashboard');
            }}
            className={`px-3 py-2 text-xs font-bold transition-all relative flex items-center space-x-1.5 cursor-pointer ${
              activeRibbon === 'inicio'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>INÍCIO</span>
          </button>

          {/* Guia Vendas & Clientes */}
          <button
            onClick={() => {
              setActiveRibbon('vendas');
              if (!['orders', 'clients', 'proformas', 'commissions'].includes(activeTab)) {
                setActiveTab('orders');
              }
            }}
            className={`px-3 py-2 text-xs font-bold transition-all relative flex items-center space-x-1.5 cursor-pointer ${
              activeRibbon === 'vendas'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>VENDAS & CLIENTES</span>
          </button>

          {/* Guia Compras & Fornecedores */}
          <button
            onClick={() => {
              setActiveRibbon('compras');
              if (activeTab !== 'suppliers') {
                setActiveTab('suppliers');
              }
            }}
            className={`px-3 py-2 text-xs font-bold transition-all relative flex items-center space-x-1.5 cursor-pointer ${
              activeRibbon === 'compras'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>COMPRAS & FORNECEDORES</span>
          </button>

          {/* Guia Stock & Armazéns */}
          <button
            onClick={() => {
              setActiveRibbon('stock');
              if (!['products', 'warehouses', 'pricing'].includes(activeTab)) {
                setActiveTab('products');
              }
            }}
            className={`px-3 py-2 text-xs font-bold transition-all relative flex items-center space-x-1.5 cursor-pointer ${
              activeRibbon === 'stock'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>STOCK & ARMAZÉNS</span>
            {lowStockCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black animate-pulse">
                {lowStockCount}
              </span>
            )}
          </button>

          {/* Guia Financeiro & Caixa */}
          <button
            onClick={() => {
              setActiveRibbon('financeiro');
              if (!['payments', 'expenses'].includes(activeTab)) {
                setActiveTab('payments');
              }
            }}
            className={`px-3 py-2 text-xs font-bold transition-all relative flex items-center space-x-1.5 cursor-pointer ${
              activeRibbon === 'financeiro'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>FINANCEIRO & CAIXA</span>
          </button>

          {/* Guia Serviços & Mídias */}
          <button
            onClick={() => {
              setActiveRibbon('servicos');
              setActiveTab('devices');
            }}
            className={`px-3 py-2 text-xs font-bold transition-all relative flex items-center space-x-1.5 cursor-pointer ${
              activeRibbon === 'servicos'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>SERVIÇOS & MÍDIAS</span>
            {pendingDevicesCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                readyDevicesCount > 0 ? 'bg-emerald-500 text-slate-950 animate-pulse' : 'bg-sky-500 text-white'
              }`}>
                {pendingDevicesCount}
              </span>
            )}
          </button>

          {/* Guia Sistema & Relatórios */}
          <button
            onClick={() => {
              setActiveRibbon('sistema');
              if (!['reports', 'downloads'].includes(activeTab)) {
                setActiveTab('reports');
              }
            }}
            className={`px-3 py-2 text-xs font-bold transition-all relative flex items-center space-x-1.5 cursor-pointer ${
              activeRibbon === 'sistema'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>SISTEMA & RELATÓRIOS</span>
          </button>

          {/* Guia Definições (Módulo Central de Regras) */}
          <button
            onClick={() => {
              setActiveRibbon('definicoes');
              setActiveTab('settings');
            }}
            className={`px-3 py-2 text-xs font-bold transition-all relative flex items-center space-x-1.5 cursor-pointer ${
              activeRibbon === 'definicoes'
                ? 'bg-slate-800 text-indigo-400 border-t-2 border-indigo-500 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>DEFINIÇÕES</span>
          </button>
        </div>

        {/* Ribbon Collapse Toggle (Minimizar / Expandir Faixa estilo Excel) */}
        <button
          onClick={() => setIsRibbonCollapsed(!isRibbonCollapsed)}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors flex items-center space-x-1 text-[11px]"
          title={isRibbonCollapsed ? 'Expandir Faixa de Opções' : 'Minimizar Faixa de Opções'}
        >
          <span className="text-[10px] font-mono hidden xl:inline">
            {isRibbonCollapsed ? 'Mostrar Faixa' : 'Ocultar'}
          </span>
          {isRibbonCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 3. RIBBON COMMAND BAR (Grupos de Ferramentas Estilo Primavera / Excel) */}
      {!isRibbonCollapsed && (
        <div className="hidden lg:block bg-slate-800/95 border-b border-slate-700/80 px-4 py-2">
          {/* INÍCIO (DASHBOARD) */}
          {activeRibbon === 'inicio' && (
            <div className="flex items-stretch space-x-3">
              {/* Grupo: Visão Geral */}
              <div className="flex flex-col justify-between border-r border-slate-700/60 pr-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'dashboard'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <LayoutDashboard className="w-5 h-5 mb-1" />
                    <span className="text-[11px] font-bold">Painel Geral</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Indicadores
                </div>
              </div>

              {/* Grupo: Ações Rápidas */}
              <div className="flex flex-col justify-between border-r border-slate-700/60 pr-3">
                <div className="flex items-center space-x-2">
                  {permissions.canCreateOrders && (
                    <button
                      onClick={onOpenNewOrder}
                      className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white transition-all shadow-xs border border-emerald-500/40 cursor-pointer"
                    >
                      <PlusCircle className="w-5 h-5 mb-1 text-emerald-200" />
                      <span className="text-[11px] font-bold">+ Nova Encomenda</span>
                    </button>
                  )}

                  {permissions.canRegisterPayments && (
                    <button
                      onClick={onOpenNewPayment}
                      className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-amber-500/90 hover:bg-amber-400 text-slate-950 transition-all shadow-xs border border-amber-300/40 cursor-pointer"
                    >
                      <CreditCard className="w-5 h-5 mb-1 text-slate-900" />
                      <span className="text-[11px] font-bold">+ Registar Pagamento</span>
                    </button>
                  )}

                  {onOpenCashClosure && (
                    <button
                      onClick={onOpenCashClosure}
                      className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-amber-300 transition-all border border-amber-500/30 cursor-pointer"
                    >
                      <DollarSign className="w-5 h-5 mb-1 text-amber-400" />
                      <span className="text-[11px] font-bold">Fecho de Caixa</span>
                    </button>
                  )}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Lançamentos Rápidos
                </div>
              </div>

              {/* Grupo: Atalhos de Consulta */}
              <div className="flex flex-col justify-between border-r border-slate-700/60 pr-3">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="flex items-center space-x-2 px-2.5 py-1 rounded text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/70 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4 text-emerald-400" />
                    <span>Encomendas</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('clients')}
                    className="flex items-center space-x-2 px-2.5 py-1 rounded text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/70 transition-colors"
                  >
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Clientes & Saldos</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="flex items-center space-x-2 px-2.5 py-1 rounded text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/70 transition-colors"
                  >
                    <Package className="w-4 h-4 text-purple-400" />
                    <span>Catálogo de Stock</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Consultas Diretas
                </div>
              </div>

              {/* Grupo: Utilidades */}
              <div className="flex flex-col justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={exportExcel}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 transition-colors"
                    title="Exportar base de dados completa em Excel"
                  >
                    <FileDown className="w-4 h-4 text-emerald-400" />
                    <span>Exportar Excel</span>
                  </button>

                  <button
                    onClick={onOpenInstallPwa}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 text-xs font-semibold border border-sky-800/80 transition-colors"
                    title="Instalar como aplicativo no Windows/Mac ou telemóvel"
                  >
                    <Laptop className="w-4 h-4 text-sky-400" />
                    <span>Instalar App PC</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Exportação & Offline
                </div>
              </div>
            </div>
          )}

          {/* VENDAS & CLIENTES */}
          {activeRibbon === 'vendas' && (
            <div className="flex items-stretch space-x-3">
              {/* Grupo: Novos Movimentos */}
              <div className="flex flex-col justify-between border-r border-slate-700/60 pr-3">
                <div className="flex items-center space-x-2">
                  {permissions.canCreateOrders && (
                    <button
                      onClick={onOpenNewOrder}
                      className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs border border-emerald-400/40 cursor-pointer"
                    >
                      <PlusCircle className="w-5 h-5 mb-1" />
                      <span className="text-[11px] font-bold">+ Nova Encomenda</span>
                    </button>
                  )}
                  {permissions.canRegisterPayments && (
                    <button
                      onClick={onOpenNewPayment}
                      className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-xs border border-amber-300/40 cursor-pointer"
                    >
                      <CreditCard className="w-5 h-5 mb-1" />
                      <span className="text-[11px] font-bold">+ Receber Pagamento</span>
                    </button>
                  )}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Operações
                </div>
              </div>

              {/* Grupo: Documentos de Venda */}
              <div className="flex flex-col justify-between border-r border-slate-700/60 pr-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'orders'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5 mb-1 text-emerald-300" />
                    <span className="text-[11px] font-bold">Encomendas</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('proformas')}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'proformas'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 mb-1 text-teal-300" />
                    <span className="text-[11px] font-bold">Orçamentos / Proformas</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Documentos Comerciais
                </div>
              </div>

              {/* Grupo: Entidades & Vendedores */}
              <div className="flex flex-col justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('clients')}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'clients'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <Users className="w-5 h-5 mb-1 text-sky-300" />
                    <span className="text-[11px] font-bold">Clientes & Dívidas</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('commissions')}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'commissions'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <Award className="w-5 h-5 mb-1 text-amber-300" />
                    <span className="text-[11px] font-bold">Comissões de Vendas</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Entidades & Equipa
                </div>
              </div>
            </div>
          )}

          {/* COMPRAS & FORNECEDORES */}
          {activeRibbon === 'compras' && (
            <div className="flex items-stretch space-x-3">
              {/* Grupo: Fornecedores & Entradas */}
              <div className="flex flex-col justify-between border-r border-slate-700/60 pr-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('suppliers')}
                    className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-lg transition-all ${
                      activeTab === 'suppliers'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <Truck className="w-5 h-5 mb-1 text-indigo-300" />
                    <span className="text-[11px] font-bold">Fornecedores & Compras ERP</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Gestão de Compras
                </div>
              </div>

              {/* Grupo: Pedidos de Compra & Balanço */}
              <div className="flex flex-col justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('suppliers')}
                    className="flex flex-col items-center justify-center px-4 py-1.5 rounded-lg text-slate-300 hover:bg-slate-700/70 hover:text-white transition-all cursor-pointer"
                  >
                    <Package className="w-5 h-5 mb-1 text-emerald-300" />
                    <span className="text-[11px] font-bold">Ordens de Encomenda & Saldo</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Fornecedores
                </div>
              </div>
            </div>
          )}

          {/* STOCK & ARMAZÉNS */}
          {activeRibbon === 'stock' && (
            <div className="flex items-stretch space-x-3">
              {/* Grupo: Artigos & Inventário */}
              <div className="flex flex-col justify-between border-r border-slate-700/60 pr-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'products'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <Package className="w-5 h-5 mb-1 text-purple-300" />
                    <span className="text-[11px] font-bold">Produtos & Stock</span>
                    {lowStockCount > 0 && (
                      <span className="text-[9px] text-amber-300 font-bold mt-0.5">
                        ⚠️ {lowStockCount} em alerta
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('pricing')}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'pricing'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-5 h-5 mb-1 text-indigo-300" />
                    <span className="text-[11px] font-bold">Preços & Categorias</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Catálogo de Artigos
                </div>
              </div>

              {/* Grupo: Armazéns e Lotes */}
              <div className="flex flex-col justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('warehouses')}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'warehouses'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <Boxes className="w-5 h-5 mb-1 text-sky-300" />
                    <span className="text-[11px] font-bold">Multi-Armazém & Lotes</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Logística & Lotação
                </div>
              </div>
            </div>
          )}

          {/* FINANCEIRO & CAIXA */}
          {activeRibbon === 'financeiro' && (
            <div className="flex items-stretch space-x-3">
              {/* Grupo: Recebimentos */}
              <div className="flex flex-col justify-between border-r border-slate-700/60 pr-3">
                <div className="flex items-center space-x-2">
                  {permissions.canRegisterPayments && (
                    <button
                      onClick={onOpenNewPayment}
                      className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-xs border border-amber-300/40 cursor-pointer"
                    >
                      <PlusCircle className="w-5 h-5 mb-1" />
                      <span className="text-[11px] font-bold">+ Registar Pagamento</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('payments')}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'payments'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mb-1 text-emerald-300" />
                    <span className="text-[11px] font-bold">Recibos & Pagamentos</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Recebimentos de Clientes
                </div>
              </div>

              {/* Grupo: Caixa Diário */}
              <div className="flex flex-col justify-between border-r border-slate-700/60 pr-3">
                <div className="flex items-center space-x-2">
                  {onOpenCashClosure && (
                    <button
                      onClick={onOpenCashClosure}
                      className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-slate-700/90 hover:bg-slate-700 text-amber-300 transition-all border border-amber-500/40 cursor-pointer"
                    >
                      <DollarSign className="w-5 h-5 mb-1 text-amber-400" />
                      <span className="text-[11px] font-bold">Fecho de Caixa Diário</span>
                    </button>
                  )}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Apuramento de Caixa
                </div>
              </div>

              {/* Grupo: Pagamentos / Despesas */}
              <div className="flex flex-col justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'expenses'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <TrendingDown className="w-5 h-5 mb-1 text-rose-300" />
                    <span className="text-[11px] font-bold">Despesas & Contas a Pagar</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Saídas de Caixa
                </div>
              </div>
            </div>
          )}

          {/* SERVIÇOS & MÍDIAS */}
          {activeRibbon === 'servicos' && (
            <div className="flex items-stretch space-x-3">
              {/* Grupo: Mídias de Clientes */}
              <div className="flex flex-col justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('devices')}
                    className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-lg transition-all ${
                      activeTab === 'devices'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <HardDrive className="w-5 h-5 mb-1 text-sky-300" />
                    <span className="text-[11px] font-bold">Pens, Discos & Cartões</span>
                    {pendingDevicesCount > 0 && (
                      <span className="text-[9px] text-amber-300 font-bold mt-0.5">
                        {pendingDevicesCount} em oficina / gravação
                      </span>
                    )}
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Aparelhos de Clientes
                </div>
              </div>
            </div>
          )}

          {/* SISTEMA & RELATÓRIOS */}
          {activeRibbon === 'sistema' && (
            <div className="flex items-stretch space-x-3">
              {/* Grupo: Relatórios */}
              <div className="flex flex-col justify-between border-r border-slate-700/60 pr-3">
                <div className="flex items-center space-x-2">
                  {permissions.canViewReports && (
                    <button
                      onClick={() => setActiveTab('reports')}
                      className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
                        activeTab === 'reports'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                      }`}
                    >
                      <FileText className="w-5 h-5 mb-1 text-purple-300" />
                      <span className="text-[11px] font-bold">Relatórios Gerenciais</span>
                    </button>
                  )}

                  <button
                    onClick={exportExcel}
                    className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-600 cursor-pointer"
                  >
                    <FileDown className="w-5 h-5 mb-1 text-emerald-400" />
                    <span className="text-[11px] font-bold">Exportar Excel Geral</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Análise & Estatísticas
                </div>
              </div>

              {/* Grupo: Administração & Segurança */}
              <div className="flex flex-col justify-between border-r border-slate-700/60 pr-3">
                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    <button
                      onClick={onOpenUsersModal}
                      className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-800/80 transition-colors cursor-pointer"
                    >
                      <Database className="w-5 h-5 mb-1 text-purple-400" />
                      <span className="text-[11px] font-bold">Backup Firestore & Segurança</span>
                    </button>
                  )}

                  <button
                    onClick={onOpenUsersModal}
                    className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-5 h-5 mb-1 text-sky-400" />
                    <span className="text-[11px] font-bold">Utilizadores & Permissões</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Segurança & Controlo
                </div>
              </div>

              {/* Grupo: Instalação & Downloads */}
              <div className="flex flex-col justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('downloads')}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'downloads'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <Download className="w-5 h-5 mb-1 text-sky-300" />
                    <span className="text-[11px] font-bold">Central de Instalação</span>
                  </button>

                  <button
                    onClick={onOpenInstallPwa}
                    className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-700/70 transition-colors cursor-pointer"
                  >
                    <Laptop className="w-5 h-5 mb-1 text-sky-400" />
                    <span className="text-[11px] font-bold">Instalar PWA Offline</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Dispositivos & PWA
                </div>
              </div>
            </div>
          )}

          {/* DEFINIÇÕES DO SISTEMA (MÓDULO CENTRAL) */}
          {activeRibbon === 'definicoes' && (
            <div className="flex items-stretch space-x-3">
              {/* Grupo: Configurações Gerais */}
              <div className="flex flex-col justify-between border-r border-slate-700/60 pr-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-lg transition-all ${
                      activeTab === 'settings'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-5 h-5 mb-1 text-indigo-300" />
                    <span className="text-[11px] font-bold">Painel de Definições</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Configurações Gerais
                </div>
              </div>

              {/* Grupo: Artigos e Regras Especiais */}
              <div className="flex flex-col justify-between border-r border-slate-700/60 pr-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-700/70 hover:text-white transition-all cursor-pointer"
                  >
                    <Package className="w-5 h-5 mb-1 text-emerald-300" />
                    <span className="text-[11px] font-bold">Tipos & Categorias</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('pricing')}
                    className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-700/70 hover:text-white transition-all cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 mb-1 text-pink-300" />
                    <span className="text-[11px] font-bold">Regras Filmes & Séries</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Regras de Itens
                </div>
              </div>

              {/* Grupo: Armazéns e Depósitos */}
              <div className="flex flex-col justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('warehouses')}
                    className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-700/70 hover:text-white transition-all cursor-pointer"
                  >
                    <Boxes className="w-5 h-5 mb-1 text-amber-300" />
                    <span className="text-[11px] font-bold">Gestão de Armazéns</span>
                  </button>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold text-center mt-1">
                  Locais Físicos
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. MOBILE DRAWER MENU (Organizado por Módulos para evitar scroll horizontal caótico) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-4 pt-3 pb-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* User Profile Card */}
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isAdmin ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {currentUser?.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{currentUser?.name}</div>
                <div className="text-[10px] text-emerald-400 font-semibold">{getRoleLabel()}</div>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-800 rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-2">
            {permissions.canCreateOrders && (
              <button
                onClick={() => {
                  onOpenNewOrder();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Encomenda</span>
              </button>
            )}

            {permissions.canRegisterPayments && (
              <button
                onClick={() => {
                  onOpenNewPayment();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-xs"
              >
                <CreditCard className="w-4 h-4" />
                <span>+ Pagamento</span>
              </button>
            )}

            {onOpenCashClosure && (
              <button
                onClick={() => {
                  onOpenCashClosure();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-800 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold"
              >
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Fecho de Caixa</span>
              </button>
            )}

            <button
              onClick={() => {
                exportExcel();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>Exportar Excel</span>
            </button>
          </div>

          {/* Categorized Menu List */}
          <div className="space-y-3 pt-1">
            {/* Vendas & Clientes */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Vendas & Faturação
              </div>
              <button
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Painel Geral (Dashboard)</span>
              </button>
              <button
                onClick={() => { setActiveTab('orders'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'orders' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Encomendas & Vendas</span>
              </button>
              <button
                onClick={() => { setActiveTab('clients'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'clients' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4" />
                  <span>Clientes & Dívidas</span>
                </div>
                {totalDebt > 0 && (
                  <span className="text-[10px] bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800">
                    {formatMT(totalDebt)}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('proformas'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'proformas' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Orçamentos & Proformas</span>
              </button>
              <button
                onClick={() => { setActiveTab('commissions'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'commissions' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Comissões de Vendas</span>
              </button>
            </div>

            {/* Compras & Fornecedores */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Compras & Gastos
              </div>
              <button
                onClick={() => { setActiveTab('suppliers'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'suppliers' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Fornecedores & Compras ERP</span>
              </button>
              <button
                onClick={() => { setActiveTab('expenses'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'expenses' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>Despesas & Contas a Pagar</span>
              </button>
            </div>

            {/* Stock & Armazéns */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Stock & Armazéns
              </div>
              <button
                onClick={() => { setActiveTab('products'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'products' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Package className="w-4 h-4" />
                  <span>Produtos & Stock</span>
                </div>
                {lowStockCount > 0 && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">
                    ⚠️ {lowStockCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('warehouses'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'warehouses' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>Multi-Armazém & Lotes</span>
              </button>
              <button
                onClick={() => { setActiveTab('pricing'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'pricing' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Preços & Categorias</span>
              </button>
            </div>

            {/* Mídias & Oficina */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Serviços & Mídias
              </div>
              <button
                onClick={() => { setActiveTab('devices'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'devices' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <HardDrive className="w-4 h-4" />
                  <span>Pens, Discos & Cartões</span>
                </div>
                {pendingDevicesCount > 0 && (
                  <span className="text-[10px] bg-sky-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                    {pendingDevicesCount}
                  </span>
                )}
              </button>
            </div>

            {/* Relatórios & Configuração */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Sistema & Gestão
              </div>
              {permissions.canViewReports && (
                <button
                  onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                    activeTab === 'reports' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Relatórios Gerenciais</span>
                </button>
              )}
              <button
                onClick={() => { setActiveTab('downloads'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'downloads' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Central de Instalação & Downloads</span>
              </button>
              <button
                onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>⚙️ Definições do Sistema (Módulo Central)</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => { onOpenUsersModal(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-purple-300 hover:bg-slate-800"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Gerir Utilizadores & Backup Firestore</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
