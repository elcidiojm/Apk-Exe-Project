import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  Save,
  Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order, OrderItem, ProductCategory, ProductType, OrderStatus } from '../types';
import { formatMT } from '../utils/formatters';

interface EditOrderModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onOrderUpdated?: (orderId: string) => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  order,
  onClose,
  onOrderUpdated,
}) => {
  const { clients, products, updateOrder, getClientSummary, systemSettings } = useApp();

  const [clientId, setClientId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'Digital/Partilha' | 'Entrega Física' | 'Mista'>('Digital/Partilha');
  const [status, setStatus] = useState<OrderStatus>('pendente');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Pre-fill form whenever order changes
  useEffect(() => {
    if (order) {
      setClientId(order.clientId);
      setDate(order.date);
      setDeliveryType(order.deliveryType || 'Digital/Partilha');
      setStatus(order.status);
      setNotes(order.notes || '');
      setAmountPaid(order.amountPaid || 0);
      setItems(
        order.items.map((i) => ({
          ...i,
          category: i.category || (products.find((p) => p.id === i.productId)?.category || 'Outros'),
        }))
      );
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [order, products]);

  // Current client financial context
  const clientSummary = useMemo(() => {
    if (!clientId) return null;
    return getClientSummary(clientId);
  }, [clientId, getClientSummary]);

  // Calculations
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [items]);

  const balanceDue = Math.max(0, totalAmount - amountPaid);

  if (!isOpen || !order) return null;

  // Handle product selection from existing list
  const handleProductChange = (index: number, selectedProductId: string) => {
    if (selectedProductId === 'custom') {
      // Switch to custom item
      setItems((prev) => {
        const updated = [...prev];
        const qty = updated[index].quantity || 1;
        updated[index] = {
          productId: `custom-${Date.now()}`,
          productCode: 'SERV',
          productName: 'Serviço Personalizado',
          productType: 'service',
          category: 'Serviços Técnicos',
          quantity: qty,
          unitPrice: 0,
          subtotal: 0,
        };
        return updated;
      });
      return;
    }

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

  // Handle direct changes to custom fields
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
    // Find a matching product or default to custom
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
        productId: match ? match.id : `custom-${Date.now()}`,
        productCode: match ? match.code : 'CUSTOM',
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
    setSuccessMessage('');

    if (!clientId) {
      setErrorMessage('Por favor, selecione um cliente.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('A encomenda deve conter pelo menos um item.');
      return;
    }

    try {
      const updated = updateOrder(order.id, {
        clientId,
        date,
        items,
        amountPaid: Number(amountPaid),
        deliveryType,
        status,
        notes,
      });

      setSuccessMessage('Encomenda atualizada com sucesso!');
      if (onOrderUpdated) {
        onOrderUpdated(updated.id);
      }
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao atualizar encomenda.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight flex items-center space-x-2">
                <span>Editar Encomenda {order.orderNumber}</span>
                <span className="text-[10px] bg-slate-800 text-amber-400 font-mono px-2 py-0.5 rounded border border-slate-700">
                  Edição Completa
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Altere cliente, serviços, valores personalizados por item, pagamentos e datas
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

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Client & Date & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Client selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cliente <span className="text-rose-500">*</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              >
                <option value="">-- Selecione o Cliente --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - {c.phone}
                  </option>
                ))}
              </select>

              {clientSummary && (
                <div className="mt-1.5 text-[11px] text-slate-500 flex justify-between">
                  <span>Dívida Atual:</span>
                  <strong className={clientSummary.currentDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    {formatMT(clientSummary.currentDebt)}
                  </strong>
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data da Encomenda <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            {/* Status & Delivery */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-2 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none capitalize font-semibold"
                >
                  <option value="pendente">Pendente</option>
                  <option value="parcial">Parcial</option>
                  <option value="paga">Paga</option>
                  <option value="entregue">Entregue</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Entrega
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-2 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Digital/Partilha">Digital</option>
                  <option value="Entrega Física">Física</option>
                  <option value="Mista">Mista</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-amber-600" />
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
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
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
                        value={item.category || 'Outros'}
                        onChange={(e) => handleItemFieldChange(idx, 'category', e.target.value as ProductCategory)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-amber-500 font-medium"
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

                    {/* Product Name / Custom Description */}
                    <div className="sm:col-span-4">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[10px] font-semibold text-slate-500">
                          Nome do Item / Serviço #{idx + 1}
                        </label>
                        <span className="text-[9px] text-slate-400">Totalmente editável</span>
                      </div>
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => handleItemFieldChange(idx, 'productName', e.target.value)}
                        placeholder="Ex: Série: Breaking Bad T1-5 ou Novela Renascer"
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 font-medium"
                        required
                      />
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Qtd
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemFieldChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 py-1.5 text-center focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {/* Unit Price (MT) */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Preço Unit. (MT)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemFieldChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 py-1.5 text-right font-bold focus:ring-1 focus:ring-amber-500"
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

                    {/* Remove */}
                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className={`p-1.5 rounded-lg text-slate-400 transition-colors ${
                          items.length <= 1
                            ? 'opacity-20 cursor-not-allowed'
                            : 'hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Special pricing rules bar */}
                  {item.category === 'Filmes' && (
                    <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-pink-50 border border-pink-200 rounded-lg text-[11px] text-pink-900 mt-2">
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
                    <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] text-indigo-900 mt-2">
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
                    <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-purple-50 border border-purple-200 rounded-lg text-[11px] text-purple-900 mt-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        <span>Regra Novelas: Preço variável por episódios/capítulos</span>
                      </div>
                      <span className="text-purple-900 font-bold ml-auto">
                        {item.quantity} × {item.quantity === 1 ? 'Capítulo' : 'Capítulos'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total of the order */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-600">Total dos Itens:</span>
              <span className="text-base font-extrabold text-slate-900">
                {formatMT(totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment & Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor Pago pelo Cliente (MT)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={totalAmount * 2}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 text-emerald-700 font-bold text-sm rounded-xl px-3 py-2 pr-12 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                  MT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Ajuste caso o cliente tenha adiantado ou amortizado diretamente nesta encomenda.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Saldo Devedor Desta Encomenda
              </label>
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Restante a Pagar:</span>
                <span
                  className={`text-base font-extrabold font-mono ${
                    balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {formatMT(balanceDue)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {balanceDue === 0 ? '✓ Encomenda 100% liquidada' : '⚠️ Saldo em dívida na conta do cliente'}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Detalhes da Encomenda
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Temporadas 1 a 4 gravadas no disco externo do cliente..."
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Gravar Alterações da Encomenda</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
