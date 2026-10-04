import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Package, 
  ShoppingCart, 
  Warehouse, 
  Building2, 
  Layers, 
  Tv, 
  Film, 
  Theater, 
  Laptop, 
  BatteryMedium, 
  Wrench, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Info,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Phone,
  CreditCard,
  Database,
  AlertTriangle,
  Cloud
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatMT } from '../utils/formatters';

export const SettingsView: React.FC = () => {
  const { systemSettings, updateSystemSettings, syncWithCloud, syncStatus, clearAllDataToProduction } = useApp();
  const { isAdmin } = useAuth();

  const [activeSection, setActiveSection] = useState<'products' | 'sales' | 'stock' | 'company'>('products');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newDigitalCat, setNewDigitalCat] = useState('');
  const [newPhysicalCat, setNewPhysicalCat] = useState('');
  const [newServiceCat, setNewServiceCat] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Local form state cloned from systemSettings
  const [formState, setFormState] = useState({
    // Produtos & Serviços
    digitalCategories: systemSettings?.itemTypesConfig?.digitalCategories || [
      'Filmes', 
      'Séries', 
      'Novelas', 
      'Programas/Software'
    ],
    physicalCategories: systemSettings?.itemTypesConfig?.physicalCategories || [
      'Baterias', 
      'Acessórios', 
      'Outros'
    ],
    serviceCategories: systemSettings?.itemTypesConfig?.serviceCategories || [
      'Serviços Técnicos', 
      'Instalação & Configuração', 
      'Reparação', 
      'Outros Serviços'
    ],
    filmPriceWarehouse: systemSettings?.itemTypesConfig?.filmPriceWarehouse ?? 10,
    filmPriceOrder: systemSettings?.itemTypesConfig?.filmPriceOrder ?? 30,
    seriesPriceWarehouse: systemSettings?.itemTypesConfig?.seriesPriceWarehouse ?? 30,
    seriesPriceOrder: systemSettings?.itemTypesConfig?.seriesPriceOrder ?? 50,
    novelVariablePrice: systemSettings?.itemTypesConfig?.novelVariablePrice ?? true,

    // Vendas
    defaultProfitMarginPercent: systemSettings?.defaultProfitMarginPercent ?? 25,
    maxSalesDiscountPercent: systemSettings?.maxSalesDiscountPercent ?? 10,
    defaultOrderDeliveryDays: systemSettings?.defaultOrderDeliveryDays ?? 2,
    proformaValidityDays: systemSettings?.proformaValidityDays ?? 15,
    blockSalesToDebtors: systemSettings?.blockSalesToDebtors ?? false,
    standardTermsAndConditions: systemSettings?.standardTermsAndConditions || '',

    // Stock & Armazéns
    defaultLowStockThreshold: systemSettings?.defaultLowStockThreshold ?? 5,
    allowNegativeStock: systemSettings?.allowNegativeStock ?? false,
    blockTransferWithoutStock: systemSettings?.blockTransferWithoutStock ?? true,

    // Empresa & Sistema
    companyName: systemSettings?.companyName || '',
    companyTradeName: systemSettings?.companyTradeName || '',
    companyNuit: systemSettings?.companyNuit || '',
    companyPhone: systemSettings?.companyPhone || '',
    companyPhoneSecondary: systemSettings?.companyPhoneSecondary || '',
    companyEmail: systemSettings?.companyEmail || '',
    companyAddress: systemSettings?.companyAddress || '',
    companyCity: systemSettings?.companyCity || '',
    currencySymbol: systemSettings?.currencySymbol || 'MT',
    receiptFormat: systemSettings?.receiptFormat || 'a4',
  });

  // Keep state updated if systemSettings changes in context
  useEffect(() => {
    if (systemSettings) {
      setFormState({
        digitalCategories: systemSettings.itemTypesConfig?.digitalCategories || [
          'Filmes', 
          'Séries', 
          'Novelas', 
          'Programas/Software'
        ],
        physicalCategories: systemSettings.itemTypesConfig?.physicalCategories || [
          'Baterias', 
          'Acessórios', 
          'Outros'
        ],
        serviceCategories: systemSettings.itemTypesConfig?.serviceCategories || [
          'Serviços Técnicos', 
          'Instalação & Configuração', 
          'Reparação', 
          'Outros Serviços'
        ],
        filmPriceWarehouse: systemSettings.itemTypesConfig?.filmPriceWarehouse ?? 10,
        filmPriceOrder: systemSettings.itemTypesConfig?.filmPriceOrder ?? 30,
        seriesPriceWarehouse: systemSettings.itemTypesConfig?.seriesPriceWarehouse ?? 30,
        seriesPriceOrder: systemSettings.itemTypesConfig?.seriesPriceOrder ?? 50,
        novelVariablePrice: systemSettings.itemTypesConfig?.novelVariablePrice ?? true,

        defaultProfitMarginPercent: systemSettings.defaultProfitMarginPercent ?? 25,
        maxSalesDiscountPercent: systemSettings.maxSalesDiscountPercent ?? 10,
        defaultOrderDeliveryDays: systemSettings.defaultOrderDeliveryDays ?? 2,
        proformaValidityDays: systemSettings.proformaValidityDays ?? 15,
        blockSalesToDebtors: systemSettings.blockSalesToDebtors ?? false,
        standardTermsAndConditions: systemSettings.standardTermsAndConditions || '',

        defaultLowStockThreshold: systemSettings.defaultLowStockThreshold ?? 5,
        allowNegativeStock: systemSettings.allowNegativeStock ?? false,
        blockTransferWithoutStock: systemSettings.blockTransferWithoutStock ?? true,

        companyName: systemSettings.companyName || '',
        companyTradeName: systemSettings.companyTradeName || '',
        companyNuit: systemSettings.companyNuit || '',
        companyPhone: systemSettings.companyPhone || '',
        companyPhoneSecondary: systemSettings.companyPhoneSecondary || '',
        companyEmail: systemSettings.companyEmail || '',
        companyAddress: systemSettings.companyAddress || '',
        companyCity: systemSettings.companyCity || '',
        currencySymbol: systemSettings.currencySymbol || 'MT',
        receiptFormat: systemSettings.receiptFormat || 'a4',
      });
    }
  }, [systemSettings]);

  const handleSave = () => {
    updateSystemSettings({
      itemTypesConfig: {
        digitalCategories: formState.digitalCategories,
        physicalCategories: formState.physicalCategories,
        serviceCategories: formState.serviceCategories,
        filmPriceWarehouse: Number(formState.filmPriceWarehouse),
        filmPriceOrder: Number(formState.filmPriceOrder),
        seriesPriceWarehouse: Number(formState.seriesPriceWarehouse),
        seriesPriceOrder: Number(formState.seriesPriceOrder),
        novelVariablePrice: Boolean(formState.novelVariablePrice),
      },
      defaultProfitMarginPercent: Number(formState.defaultProfitMarginPercent),
      maxSalesDiscountPercent: Number(formState.maxSalesDiscountPercent),
      defaultOrderDeliveryDays: Number(formState.defaultOrderDeliveryDays),
      proformaValidityDays: Number(formState.proformaValidityDays),
      blockSalesToDebtors: Boolean(formState.blockSalesToDebtors),
      standardTermsAndConditions: formState.standardTermsAndConditions,

      defaultLowStockThreshold: Number(formState.defaultLowStockThreshold),
      allowNegativeStock: Boolean(formState.allowNegativeStock),
      blockTransferWithoutStock: Boolean(formState.blockTransferWithoutStock),

      companyName: formState.companyName,
      companyTradeName: formState.companyTradeName,
      companyNuit: formState.companyNuit,
      companyPhone: formState.companyPhone,
      companyPhoneSecondary: formState.companyPhoneSecondary,
      companyEmail: formState.companyEmail,
      companyAddress: formState.companyAddress,
      companyCity: formState.companyCity,
      currencySymbol: formState.currencySymbol,
      receiptFormat: formState.receiptFormat as any,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Category list helpers
  const addCategory = (type: 'digital' | 'physical' | 'service') => {
    if (type === 'digital' && newDigitalCat.trim()) {
      if (!formState.digitalCategories.includes(newDigitalCat.trim())) {
        setFormState((prev) => ({
          ...prev,
          digitalCategories: [...prev.digitalCategories, newDigitalCat.trim()],
        }));
      }
      setNewDigitalCat('');
    } else if (type === 'physical' && newPhysicalCat.trim()) {
      if (!formState.physicalCategories.includes(newPhysicalCat.trim())) {
        setFormState((prev) => ({
          ...prev,
          physicalCategories: [...prev.physicalCategories, newPhysicalCat.trim()],
        }));
      }
      setNewPhysicalCat('');
    } else if (type === 'service' && newServiceCat.trim()) {
      if (!formState.serviceCategories.includes(newServiceCat.trim())) {
        setFormState((prev) => ({
          ...prev,
          serviceCategories: [...prev.serviceCategories, newServiceCat.trim()],
        }));
      }
      setNewServiceCat('');
    }
  };

  const removeCategory = (type: 'digital' | 'physical' | 'service', catToRemove: string) => {
    if (type === 'digital') {
      setFormState((prev) => ({
        ...prev,
        digitalCategories: prev.digitalCategories.filter((c) => c !== catToRemove),
      }));
    } else if (type === 'physical') {
      setFormState((prev) => ({
        ...prev,
        physicalCategories: prev.physicalCategories.filter((c) => c !== catToRemove),
      }));
    } else if (type === 'service') {
      setFormState((prev) => ({
        ...prev,
        serviceCategories: prev.serviceCategories.filter((c) => c !== catToRemove),
      }));
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Module Title Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center border border-indigo-200">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Definições do Sistema
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                Módulo Central
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Determina as regras, tipos de produtos, categorias, unidades e comportamento de todos os módulos.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {saveSuccess && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Configurações Salvas & Sincronizadas!</span>
            </div>
          )}
          <button
            onClick={handleSave}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Alterações</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs between Configuration Blocks */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSection('products')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'products'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produtos & Serviços</span>
        </button>

        <button
          onClick={() => setActiveSection('sales')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'sales'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Vendas & Encomendas</span>
        </button>

        <button
          onClick={() => setActiveSection('stock')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'stock'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Stock & Armazéns</span>
        </button>

        <button
          onClick={() => setActiveSection('company')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'company'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Sistema & Empresa</span>
        </button>
      </div>

      {/* SECTION 1: PRODUTOS E SERVIÇOS (REGRAS ESTRUTURAIS) */}
      {activeSection === 'products' && (
        <div className="space-y-6">
          {/* Card: Tipos de Item & Regras de Categorias */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>1. Tipos de Item & Categorias Associadas</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                O sistema divide o catálogo em 3 tipos fundamentais. Ao cadastrar um item, apenas as categorias pertencentes ao tipo escolhido são apresentadas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* TIPO 1: DIGITAL */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-indigo-600" />
                    <span>DIGITAL</span>
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full">
                    Sem controlo de stock
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Itens gravados em Pens, Discos HDD/SSD, Cartões Micro SD ou partilhados digitalmente.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Categorias Digitais Ativas:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {formState.digitalCategories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 text-xs bg-white border border-slate-300 text-slate-800 px-2 py-1 rounded-lg font-medium"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => removeCategory('digital', cat)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-1.5 pt-2">
                  <input
                    type="text"
                    placeholder="Nova categoria digital..."
                    value={newDigitalCat}
                    onChange={(e) => setNewDigitalCat(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 text-xs rounded-lg px-2.5 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => addCategory('digital')}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* TIPO 2: FÍSICO */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                    <BatteryMedium className="w-4 h-4 text-emerald-600" />
                    <span>FÍSICO</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    Com controlo de armazém
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Equipamentos, baterias, acessórios e mercadorias físicas armazenadas nos depósitos.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Categorias Físicas Ativas:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {formState.physicalCategories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 text-xs bg-white border border-slate-300 text-slate-800 px-2 py-1 rounded-lg font-medium"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => removeCategory('physical', cat)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-1.5 pt-2">
                  <input
                    type="text"
                    placeholder="Nova categoria física..."
                    value={newPhysicalCat}
                    onChange={(e) => setNewPhysicalCat(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 text-xs rounded-lg px-2.5 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => addCategory('physical')}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* TIPO 3: SERVIÇO */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <span>SERVIÇO</span>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                    Mão de obra técnica
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Reparações, formatação de computadores, substituição de ecrãs e instalações.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Categorias de Serviços Ativas:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {formState.serviceCategories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 text-xs bg-white border border-slate-300 text-slate-800 px-2 py-1 rounded-lg font-medium"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => removeCategory('service', cat)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-1.5 pt-2">
                  <input
                    type="text"
                    placeholder="Nova categoria serviço..."
                    value={newServiceCat}
                    onChange={(e) => setNewServiceCat(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 text-xs rounded-lg px-2.5 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => addCategory('service')}
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Regras Especiais de Preços & Unidades (Filmes, Séries, Novelas) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>2. Regras Especiais de Preços & Unidades de Mídia</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina os valores padrão aplicados nas encomendas e a interpretação correta de unidades pelo sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* REGRA DOS FILMES */}
              <div className="border border-pink-200 bg-pink-50/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-pink-900 font-bold text-xs pb-2 border-b border-pink-200">
                  <Film className="w-4 h-4 text-pink-600" />
                  <span>Regra Especial — Filmes</span>
                </div>
                <div className="text-[11px] text-pink-950 space-y-2">
                  <p>
                    <strong>Unidade:</strong> 1 Filme (apresenta ex: 8 × Filmes).
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Preço no Armazém (MT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formState.filmPriceWarehouse}
                      onChange={(e) => setFormState({ ...formState, filmPriceWarehouse: Number(e.target.value) })}
                      className="w-full bg-white border border-pink-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Quando já existente no acervo (Padrão: 10 MT)</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Preço por Encomenda (MT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formState.filmPriceOrder}
                      onChange={(e) => setFormState({ ...formState, filmPriceOrder: Number(e.target.value) })}
                      className="w-full bg-white border border-pink-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Quando precisa ser descarregado (Padrão: 30 MT)</span>
                  </div>
                </div>
              </div>

              {/* REGRA DAS SÉRIES */}
              <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs pb-2 border-b border-indigo-200">
                  <Tv className="w-4 h-4 text-indigo-600" />
                  <span>Regra Especial — Séries</span>
                </div>
                <div className="text-[11px] text-indigo-950 space-y-2">
                  <p className="bg-indigo-100/70 p-2 rounded-lg text-[10px] font-bold text-indigo-900">
                    ⚠️ 1 Unidade = 1 Temporada (e não série completa). Apresentação: 1 × Temporada.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Preço Temporada Armazém (MT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formState.seriesPriceWarehouse}
                      onChange={(e) => setFormState({ ...formState, seriesPriceWarehouse: Number(e.target.value) })}
                      className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Por temporada existente (Padrão: 30 MT)</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Preço Temporada Encomenda (MT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formState.seriesPriceOrder}
                      onChange={(e) => setFormState({ ...formState, seriesPriceOrder: Number(e.target.value) })}
                      className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Por temporada nova por encomenda (Padrão: 50 MT)</span>
                  </div>
                </div>
              </div>

              {/* REGRA DAS NOVELAS */}
              <div className="border border-purple-200 bg-purple-50/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs pb-2 border-b border-purple-200">
                  <Theater className="w-4 h-4 text-purple-600" />
                  <span>Regra Especial — Novelas</span>
                </div>
                <div className="text-[11px] text-purple-950 space-y-2">
                  <p>
                    <strong>Unidade:</strong> Capítulos / Episódios (apresenta ex: 5 × Capítulos).
                  </p>
                  <div className="p-3 bg-white border border-purple-200 rounded-lg space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-purple-900">
                      <input
                        type="checkbox"
                        checked={formState.novelVariablePrice}
                        onChange={(e) => setFormState({ ...formState, novelVariablePrice: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>Preço variável conforme capítulos</span>
                    </label>
                    <p className="text-[10px] text-slate-500">
                      As novelas possuem comportamento diferente: o preço é ajustado no ato da encomenda com base no número de capítulos pedidos pelo cliente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: VENDAS & ENCOMENDAS */}
      {activeSection === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              <span>Regras de Vendas & Encomendas</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Controle margens de lucro, prazos de entrega padrão e regras de crédito.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prazo Padrão de Entrega de Encomendas (dias)
              </label>
              <input
                type="number"
                min="0"
                value={formState.defaultOrderDeliveryDays}
                onChange={(e) => setFormState({ ...formState, defaultOrderDeliveryDays: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Validade dos Orçamentos / Proformas (dias)
              </label>
              <input
                type="number"
                min="1"
                value={formState.proformaValidityDays}
                onChange={(e) => setFormState({ ...formState, proformaValidityDays: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Margem de Lucro Padrão sugerida (%)
              </label>
              <input
                type="number"
                min="0"
                value={formState.defaultProfitMarginPercent}
                onChange={(e) => setFormState({ ...formState, defaultProfitMarginPercent: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Desconto Máximo Autorizado aos Vendedores (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formState.maxSalesDiscountPercent}
                onChange={(e) => setFormState({ ...formState, maxSalesDiscountPercent: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Termos & Condições Padrão impressos nos Recibos
            </label>
            <textarea
              rows={3}
              value={formState.standardTermsAndConditions}
              onChange={(e) => setFormState({ ...formState, standardTermsAndConditions: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* SECTION 3: STOCK & ARMAZÉNS */}
      {activeSection === 'stock' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-indigo-600" />
              <span>Regras de Stock & Armazéns</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comportamento do armazém para artigos físicos, limites de alerta e transferências.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alerta de Stock Mínimo Padrão (unidades)
              </label>
              <input
                type="number"
                min="1"
                value={formState.defaultLowStockThreshold}
                onChange={(e) => setFormState({ ...formState, defaultLowStockThreshold: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-3 pt-6">
              <input
                type="checkbox"
                id="blockTransfer"
                checked={formState.blockTransferWithoutStock}
                onChange={(e) => setFormState({ ...formState, blockTransferWithoutStock: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <label htmlFor="blockTransfer" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Bloquear transferências entre depósitos se o stock de origem for insuficiente
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: SISTEMA & DADOS DA EMPRESA */}
      {activeSection === 'company' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Dados da Empresa & Moeda de Moçambique</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Informações oficiais que constam nos cabeçalhos de faturas, recibos e relatórios.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome da Empresa / Razão Social
              </label>
              <input
                type="text"
                value={formState.companyName}
                onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Comercial / Marca da Loja
              </label>
              <input
                type="text"
                value={formState.companyTradeName}
                onChange={(e) => setFormState({ ...formState, companyTradeName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NUIT (Número Único de Identificação Tributária)
              </label>
              <input
                type="text"
                value={formState.companyNuit}
                onChange={(e) => setFormState({ ...formState, companyNuit: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Símbolo da Moeda
              </label>
              <input
                type="text"
                value={formState.currencySymbol}
                disabled
                className="w-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl p-2.5 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Moeda oficial: Metical Moçambicano (MT)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone Principal / WhatsApp
              </label>
              <input
                type="text"
                value={formState.companyPhone}
                onChange={(e) => setFormState({ ...formState, companyPhone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone Alternativo
              </label>
              <input
                type="text"
                value={formState.companyPhoneSecondary}
                onChange={(e) => setFormState({ ...formState, companyPhoneSecondary: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Endereço / Localização
              </label>
              <input
                type="text"
                value={formState.companyAddress}
                onChange={(e) => setFormState({ ...formState, companyAddress: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cidade / Província
              </label>
              <input
                type="text"
                value={formState.companyCity}
                onChange={(e) => setFormState({ ...formState, companyCity: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Sincronização em Tempo Real & Base de Dados na Nuvem */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center space-x-2 mb-4">
              <Cloud className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900">Sincronização & Base de Dados Central</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Estado da Conexão</span>
                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      syncStatus === 'online' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : syncStatus === 'connecting'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        syncStatus === 'online' ? 'bg-emerald-500 animate-pulse' : syncStatus === 'connecting' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      <span>{syncStatus === 'online' ? 'Online (Firestore Nuvem)' : syncStatus === 'connecting' ? 'A Ligar...' : 'Offline (Modo Local)'}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    Todas as alterações no Chrome App (PWA) e no painel Google Studio sincronizam diretamente com a mesma base de dados.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={async () => {
                    setIsSyncing(true);
                    await syncWithCloud();
                    setTimeout(() => setIsSyncing(false), 800);
                  }}
                  className="w-full inline-flex items-center justify-center space-x-2 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
                  <span>{isSyncing ? 'A Sincronizar...' : 'Forçar Sincronização em Tempo Real'}</span>
                </button>
              </div>

              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-rose-700 mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-black">Zerar Dados de Teste para Produção</span>
                  </div>
                  <p className="text-[11px] text-rose-600/90 leading-relaxed mb-3">
                    Apaga todos os clientes fictícios, pedidos e produtos de teste criados como exemplo. Bloqueia permanentemente a recriação automática de dados fictícios.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full inline-flex items-center justify-center space-x-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Tudo & Iniciar Sistema Vazio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Limpeza de Produção */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-2">
              Deseja zerar os dados de exemplo?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Esta ação removerá todos os clientes, produtos, encomendas, pagamentos e transferências de exemplo da nuvem e do armazenamento local.
              <br /><br />
              <strong>Garantia de Produção:</strong> O sistema ficará limpo e <u>nunca mais</u> recriará dados fictícios automaticamente.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={async () => {
                  setIsClearing(true);
                  await clearAllDataToProduction();
                  setIsClearing(false);
                  setShowClearConfirm(false);
                }}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer inline-flex items-center space-x-1.5"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>A Limpar Base de Dados...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar & Zerar para Produção</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
