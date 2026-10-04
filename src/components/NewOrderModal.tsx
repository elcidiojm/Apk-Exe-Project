import React, { useState, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  AlertCircle, 
  CreditCard, 
  CheckCircle2,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OrderItem, PaymentMethod, ProductCategory } from '../types';
import { formatMT, getTodayDateString } from '../utils/formatters';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (orderId: string) => void;
  preselectedClientId?: string;
  onOpenNewClientModal?: () => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  preselectedClientId,
  onOpenNewClientModal,
}) => {
  const { clients, products, createOrder, getClientSummary, systemSettings } = useApp();

  const [clientId, setClientId] = useState<string>(preselectedClientId || (clients[0]?.id || ''));
  const [date, setDate] = useState<string>(getTodayDateString());
  const [deliveryType, setDeliveryType] = useState<'Digital/Partilha' | 'Entrega Física' | 'Mista'>('Digital/Partilha');
  const [notes, setNotes] = useState<string>('');

  // Items in current order draft
  const [items, setItems] = useState<OrderItem[]>([
    {
      productId: products[0]?.id || '',
      productCode: products[0]?.code || '',
      productName: products[0]?.name || '',
      productType: products[0]?.type || 'digital',
      quantity: 1,
      unitPrice: products[0]?.price || 0,
      subtotal: products[0]?.price || 0,
    },
  ]);

  const [amountPaidNow, setAmountPaidNow] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('M-Pesa');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Keep client in sync if preselected
  React.useEffect(() => {
    if (preselectedClientId) {
      setClientId(preselectedClientId);
    } else if (!clientId && clients.length > 0) {
      setClientId(clients[0].id);
    }
  }, [preselectedClientId, clients]);

  // Current client financial context
  const clientSummary = useMemo(() => {
    if (!clientId) return null;
    return getClientSummary(clientId);
  }, [clientId, getClientSummary]);

  // Calculations
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [items]);

  const previousDebt = clientSummary?.currentDebt || 0;
  const newProjectedDebt = previousDebt + totalAmount - amountPaidNow;

  // Auto detect delivery type when items change
  React.useEffect(() => {
    const hasDigital = items.some(i => i.productType === 'digital');
    const hasPhysical = items.some(i => i.productType === 'physical');
    if (hasDigital && hasPhysical) {
      setDeliveryType('Mista');
    } else if (hasPhysical) {
      setDeliveryType('Entrega Física');
    } else {
      setDeliveryType('Digital/Partilha');
    }
  }, [items]);

  if (!isOpen) return null;

  const handleProductChange = (index: number, selectedProductId: string) => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    setItems((prev) => {
      const updated = [...prev];
      const qty = updated[index].quantity || 1;
      let unit = prod.unit;
      if (prod.category === 'Filmes') unit = 'filme';
      else if (prod.category === 'Séries') unit = 'temporada';
      else if (prod.category === 'Novelas') unit = 'capítulos';

      updated[index] = {
        productId: prod.id,
        productCode: prod.code,
        productName: prod.name,
        productType: prod.type,
        category: prod.category,
        unit: unit,
        quantity: qty,
        unitPrice: prod.price,
        subtotal: qty * prod.price,
      };
      return updated;
    });
  };

  const setSpecialPricing = (index: number, mode: 'armazem' | 'encomenda') => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const cat = item.category;
      let price = item.unitPrice;

      if (cat === 'Filmes') {
        price = mode === 'armazem' 
          ? (systemSettings?.itemTypesConfig?.filmPriceWarehouse ?? 10) 
          : (systemSettings?.itemTypesConfig?.filmPriceOrder ?? 30);
        item.unit = 'filme';
      } else if (cat === 'Séries') {
        price = mode === 'armazem' 
          ? (systemSettings?.itemTypesConfig?.seriesPriceWarehouse ?? 30) 
          : (systemSettings?.itemTypesConfig?.seriesPriceOrder ?? 50);
        item.unit = 'temporada';
      }

      item.pricingMode = mode;
      item.unitPrice = price;
      item.subtotal = item.quantity * price;
      updated[index] = item;
      return updated;
    });
  };

  const handleItemFieldChange = (index: number, field: keyof OrderItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      
      if (field === 'category') {
        const cat = value as ProductCategory;
        if (cat === 'Filmes') {
          item.unit = 'filme';
          item.unitPrice = systemSettings?.itemTypesConfig?.filmPriceWarehouse ?? 10;
          item.pricingMode = 'armazem';
        } else if (cat === 'Séries') {
          item.unit = 'temporada';
          item.unitPrice = systemSettings?.itemTypesConfig?.seriesPriceWarehouse ?? 30;
          item.pricingMode = 'armazem';
        } else if (cat === 'Novelas') {
          item.unit = 'capítulos';
          item.pricingMode = 'variavel';
        }
      }

      if (field === 'quantity' || field === 'unitPrice' || field === 'category') {
        const q = field === 'quantity' ? Math.max(1, Number(value) || 1) : item.quantity;
        const p = field === 'unitPrice' ? Math.max(0, Number(value) || 0) : item.unitPrice;
        item.quantity = q;
        item.unitPrice = p;
        item.subtotal = q * p;
      }

      updated[index] = item;
      return updated;
    });
  };

  const addItemRow = (categoryDefault: ProductCategory = 'Séries') => {
    const match = products.find((p) => p.category === categoryDefault);
    let defaultPrice = match ? match.price : 500;
    let defaultUnit = 'unidade';
    let defaultMode: 'armazem' | 'encomenda' | 'variavel' = 'armazem';

    if (categoryDefault === 'Filmes') {
      defaultPrice = systemSettings?.itemTypesConfig?.filmPriceWarehouse ?? 10;
      defaultUnit = 'filme';
      defaultMode = 'armazem';
    } else if (categoryDefault === 'Séries') {
      defaultPrice = systemSettings?.itemTypesConfig?.seriesPriceWarehouse ?? 30;
      defaultUnit = 'temporada';
      defaultMode = 'armazem';
    } else if (categoryDefault === 'Novelas') {
      defaultPrice = 0;
      defaultUnit = 'capítulos';
      defaultMode = 'variavel';
    }

    setItems((prev) => [
      ...prev,
      {
        productId: match ? match.id : `item-${Date.now()}`,
        productCode: match ? match.code : 'ITEM',
        productName: match ? match.name : categoryDefault,
        productType: match ? match.type : (categoryDefault === 'Baterias' || categoryDefault === 'Acessórios' ? 'physical' : 'digital'),
        category: categoryDefault,
        quantity: 1,
        unit: defaultUnit,
        pricingMode: defaultMode,
        unitPrice: defaultPrice,
        subtotal: defaultPrice,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!clientId) {
      setErrorMessage('Por favor, selecione um cliente.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Adicione pelo menos um produto à encomenda.');
      return;
    }

    // Check physical stock warnings
    for (const item of items) {
      if (item.productType === 'physical') {
        const prod = products.find((p) => p.id === item.productId);
        if (prod && prod.stockQuantity < item.quantity) {
          setErrorMessage(
            `Atenção: O produto "${prod.name}" tem apenas ${prod.stockQuantity} unidades em stock, mas você pediu ${item.quantity}. Ajuste a quantidade antes de avançar.`
          );
          return;
        }
      }
    }

    const { order } = createOrder({
      clientId,
      date,
      items,
      amountPaidNow: Number(amountPaidNow),
      paymentMethod: amountPaidNow > 0 ? paymentMethod : undefined,
      deliveryType,
      notes,
    });

    if (onOrderCreated) {
      onOrderCreated(order.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Registar Nova Encomenda
              </h2>
              <p className="text-xs text-slate-400">
                Multi-produto, validação de stock e cálculo automático de dívidas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Client & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Cliente <span className="text-rose-500">*</span>
                </label>
                {onOpenNewClientModal && (
                  <button
                    type="button"
                    onClick={onOpenNewClientModal}
                    className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    + Novo Cliente
                  </button>
                )}
              </div>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              >
                <option value="">-- Selecione o Cliente --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - {c.phone}
                  </option>
                ))}
              </select>

              {/* Client Debt Status Pill */}
              {clientSummary && (
                <div className="mt-2 text-xs flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-slate-600">Dívida Atual:</span>
                  <span
                    className={`font-bold ${
                      clientSummary.currentDebt > 0
                        ? 'text-rose-600'
                        : clientSummary.currentDebt < 0
                        ? 'text-emerald-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {clientSummary.currentDebt > 0
                      ? formatMT(clientSummary.currentDebt)
                      : clientSummary.currentDebt < 0
                      ? `${formatMT(Math.abs(clientSummary.currentDebt))} (Crédito)`
                      : 'Sem dívidas'}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Entrega
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Digital/Partilha">Digital / Partilha</option>
                  <option value="Entrega Física">Entrega Física</option>
                  <option value="Mista">Mista (Digital + Físico)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Table (Multi-Item) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Itens e Serviços da Encomenda
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => addItemRow('Séries')}
                  className="text-[11px] font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded-lg transition-colors"
                >
                  + Série
                </button>
                <button
                  type="button"
                  onClick={() => addItemRow('Novelas')}
                  className="text-[11px] font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded-lg transition-colors"
                >
                  + Novela
                </button>
                <button
                  type="button"
                  onClick={() => addItemRow('Filmes')}
                  className="text-[11px] font-semibold text-pink-700 bg-pink-100 hover:bg-pink-200 px-2 py-1 rounded-lg transition-colors"
                >
                  + Filme
                </button>
                <button
                  type="button"
                  onClick={() => addItemRow('Serviços Técnicos')}
                  className="text-[11px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg transition-colors"
                >
                  + Serviço
                </button>
                <button
                  type="button"
                  onClick={() => addItemRow('Baterias')}
                  className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded-lg transition-colors"
                >
                  + Físico
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId);
                const isPhysical = prod?.type === 'physical' || item.productType === 'physical';
                const stockAvailable = prod?.stockQuantity || 0;
                const isOverStock = isPhysical && prod && item.quantity > stockAvailable;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      {/* Category Selector */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Categoria
                        </label>
                        <select
                          value={item.category || (prod?.category || 'Séries')}
                          onChange={(e) => handleItemFieldChange(idx, 'category', e.target.value as ProductCategory)}
                          className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-emerald-500 font-semibold"
                        >
                          <option value="Séries">📺 Séries</option>
                          <option value="Novelas">🎭 Novelas</option>
                          <option value="Filmes">🎬 Filmes</option>
                          <option value="Programas/Software">💻 Software</option>
                          <option value="Baterias">🔋 Baterias</option>
                          <option value="Acessórios">🔌 Acessórios</option>
                          <option value="Serviços Técnicos">🛠️ Serviço</option>
                          <option value="Outros">➕ Outros</option>
                        </select>
                      </div>

                      {/* Product Name / Custom Title */}
                      <div className="sm:col-span-4">
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[10px] font-semibold text-slate-500">
                            Descrição / Nome do Item
                          </label>
                          <span className="text-[9px] text-slate-400">Personalizável</span>
                        </div>
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => handleItemFieldChange(idx, 'productName', e.target.value)}
                          placeholder="Ex: Série Stranger Things T1 a 4"
                          className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 font-medium"
                          required
                        />
                      </div>

                      {/* Quick Pick from Catalog */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Preencher do Catálogo
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-[11px] rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">(Personalizado)</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.category}] {p.name} ({formatMT(p.price)})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Qtd
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemFieldChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className={`w-full bg-slate-50 border text-slate-800 text-xs rounded-lg px-2 py-1.5 text-center focus:ring-1 focus:outline-none ${
                            isOverStock
                              ? 'border-rose-500 bg-rose-50/50 text-rose-700'
                              : 'border-slate-300 focus:ring-emerald-500'
                          }`}
                        />
                      </div>

                      {/* Unit Price (in MT) */}
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Preço (MT)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemFieldChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 py-1.5 text-right font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="sm:col-span-1 text-right">
                        <span className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Subtotal
                        </span>
                        <span className="text-xs font-bold text-slate-900 block">
                          {formatMT(item.subtotal)}
                        </span>
                      </div>

                      {/* Remove button */}
                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length <= 1}
                          className={`p-1.5 rounded-lg text-slate-400 transition-colors ${
                            items.length <= 1
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Remover este item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Special pricing rules bar */}
                    {item.category === 'Filmes' && (
                      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-pink-50 border border-pink-200 rounded-lg text-[11px] text-pink-900">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                          <span>Regra Filmes:</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSpecialPricing(idx, 'armazem')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              item.unitPrice === (systemSettings?.itemTypesConfig?.filmPriceWarehouse ?? 10)
                                ? 'bg-pink-600 text-white shadow-2xs'
                                : 'bg-white border border-pink-300 text-pink-800 hover:bg-pink-100'
                            }`}
                          >
                            No Armazém ({systemSettings?.itemTypesConfig?.filmPriceWarehouse ?? 10} MT)
                          </button>
                          <button
                            type="button"
                            onClick={() => setSpecialPricing(idx, 'encomenda')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              item.unitPrice === (systemSettings?.itemTypesConfig?.filmPriceOrder ?? 30)
                                ? 'bg-pink-600 text-white shadow-2xs'
                                : 'bg-white border border-pink-300 text-pink-800 hover:bg-pink-100'
                            }`}
                          >
                            Por Encomenda ({systemSettings?.itemTypesConfig?.filmPriceOrder ?? 30} MT)
                          </button>
                        </div>
                        <span className="text-pink-900 font-bold ml-auto">
                          {item.quantity} × {item.quantity === 1 ? 'Filme' : 'Filmes'}
                        </span>
                      </div>
                    )}

                    {item.category === 'Séries' && (
                      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] text-indigo-900">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          <span>Regra Séries (1 un = 1 temporada):</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSpecialPricing(idx, 'armazem')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              item.unitPrice === (systemSettings?.itemTypesConfig?.seriesPriceWarehouse ?? 30)
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-white border border-indigo-300 text-indigo-800 hover:bg-indigo-100'
                            }`}
                          >
                            No Armazém ({systemSettings?.itemTypesConfig?.seriesPriceWarehouse ?? 30} MT)
                          </button>
                          <button
                            type="button"
                            onClick={() => setSpecialPricing(idx, 'encomenda')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              item.unitPrice === (systemSettings?.itemTypesConfig?.seriesPriceOrder ?? 50)
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-white border border-indigo-300 text-indigo-800 hover:bg-indigo-100'
                            }`}
                          >
                            Por Encomenda ({systemSettings?.itemTypesConfig?.seriesPriceOrder ?? 50} MT)
                          </button>
                        </div>
                        <span className="text-indigo-900 font-bold ml-auto">
                          {item.quantity} × {item.quantity === 1 ? 'Temporada' : 'Temporadas'}
                        </span>
                      </div>
                    )}

                    {item.category === 'Novelas' && (
                      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-purple-50 border border-purple-200 rounded-lg text-[11px] text-purple-900">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                          <span>Regra Novelas: Preço variável por episódios/capítulos</span>
                        </div>
                        <span className="text-purple-900 font-bold ml-auto">
                          {item.quantity} × {item.quantity === 1 ? 'Capítulo' : 'Capítulos'}
                        </span>
                      </div>
                    )}

                    {/* Stock indicator info pill */}
                    <div className="flex items-center space-x-2 text-[11px] pt-1 border-t border-slate-100">
                      {isPhysical && prod ? (
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-medium ${
                            isOverStock
                              ? 'bg-rose-100 text-rose-700'
                              : stockAvailable <= (prod?.minStockAlert || 0)
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <Package className="w-3 h-3" />
                          <span>
                            Stock Armazém: {stockAvailable} {prod?.unit || 'un'}{' '}
                            {isOverStock ? '⚠️ Insuficiente!' : ''}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-medium bg-cyan-100 text-cyan-800">
                          <Layers className="w-3 h-3" />
                          <span>Conteúdo Digital (Partilha ilimitada sem stock)</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total of the order */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-600">Total dos Itens:</span>
              <span className="text-base font-extrabold text-slate-900">
                {formatMT(totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment on the Spot (Valor Pago no Momento) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-emerald-50/30 space-y-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pagamento no Momento da Encomenda
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor Pago Agora (MT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    value={amountPaidNow}
                    onChange={(e) => setAmountPaidNow(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white border border-slate-300 text-slate-900 font-bold text-sm rounded-xl px-3 py-2 pr-12 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                    MT
                  </span>
                </div>

                {/* Quick Payment Buttons */}
                <div className="flex space-x-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setAmountPaidNow(0)}
                    className="px-2 py-1 text-[10px] font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md"
                  >
                    0 MT (Dívida)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaidNow(Math.round(totalAmount / 2))}
                    className="px-2 py-1 text-[10px] font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md"
                  >
                    50% ({formatMT(Math.round(totalAmount / 2))})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaidNow(totalAmount)}
                    className="px-2 py-1 text-[10px] font-semibold bg-emerald-200 hover:bg-emerald-300 text-emerald-900 rounded-md"
                  >
                    100% Total
                  </button>
                </div>
              </div>

              {amountPaidNow > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="M-Pesa">📱 M-Pesa</option>
                    <option value="e-Mola">📱 e-Mola</option>
                    <option value="Numerário">💵 Numerário (Dinheiro Vivo)</option>
                    <option value="Transferência Bancária">🏦 Transferência Bancária</option>
                  </select>
                </div>
              )}
            </div>

            {/* Crucial: Simulated Customer Account Impact */}
            <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 flex items-center justify-between">
                <span>Resumo da Conta Corrente do Cliente:</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Cálculo automático em tempo real
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="block text-[10px] text-slate-500">Dívida Anterior</span>
                  <span className="font-bold text-slate-700">{formatMT(previousDebt)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="block text-[10px] text-slate-500">+ Nova Encomenda</span>
                  <span className="font-bold text-slate-900">{formatMT(totalAmount)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="block text-[10px] text-slate-500">- Pago Agora</span>
                  <span className="font-bold text-emerald-600">{formatMT(amountPaidNow)}</span>
                </div>
                <div
                  className={`p-2 rounded-lg border ${
                    newProjectedDebt > 0
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <span className="block text-[10px] font-semibold uppercase">
                    = Novo Saldo Dívida
                  </span>
                  <span className="font-extrabold text-sm">
                    {newProjectedDebt > 0 ? formatMT(newProjectedDebt) : '0 MT (Liquidado)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex.: Pendrive do cliente, entregar no fim da tarde, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Buttons Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl shadow-md shadow-emerald-700/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar & Registar Encomenda</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
