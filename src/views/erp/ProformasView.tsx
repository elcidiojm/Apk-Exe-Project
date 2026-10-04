import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Eye, 
  CheckCircle, 
  ArrowRightCircle, 
  Calendar, 
  Trash2, 
  Download, 
  Printer, 
  Clock, 
  AlertCircle,
  Building,
  User,
  Package,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Proforma, ProformaStatus, OrderItem, PaymentMethod } from '../../types';
import { formatMT } from '../../utils/formatters';

export const ProformasView: React.FC<{
  onOpenOrderReceipt?: (orderId: string) => void;
}> = ({ onOpenOrderReceipt }) => {
  const { 
    proformas, 
    createProforma, 
    updateProforma, 
    deleteProforma, 
    convertProformaToOrder,
    clients, 
    products 
  } = useApp();
  const { isAdmin, currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Modal Novo Orçamento / Proforma
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [proformaForm, setProformaForm] = useState({
    clientId: '',
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    termsAndConditions: 'Preços válidos por 15 dias. Pagamento a 100% ou sinal de 50%. Entregas em Maputo e Matola.',
    notes: '',
  });

  const [proformaItems, setProformaItems] = useState<
    Array<{
      productId: string;
      productName: string;
      productCode: string;
      unitPrice: number;
      quantity: number;
      discount: number;
    }>
  >([]);

  // Selected Proforma for Document Preview / Print
  const [viewingProforma, setViewingProforma] = useState<Proforma | null>(null);

  // Conversion Confirmation Modal
  const [convertingProforma, setConvertingProforma] = useState<Proforma | null>(null);
  const [convertAmountPaid, setConvertAmountPaid] = useState<number>(0);
  const [convertPaymentMethod, setConvertPaymentMethod] = useState<PaymentMethod>('Numerário');

  // KPI Stats
  const stats = useMemo(() => {
    const totalIssued = proformas.length;
    const totalProposedValue = proformas.reduce((sum, p) => sum + p.totalAmount, 0);
    const convertedCount = proformas.filter((p) => p.status === 'convertida').length;
    const approvedCount = proformas.filter((p) => p.status === 'aprovada').length;
    const activeCount = proformas.filter((p) => p.status === 'enviada' || p.status === 'rascunho').length;

    const conversionRate = totalIssued > 0 ? Math.round((convertedCount / totalIssued) * 100) : 0;

    return {
      totalIssued,
      totalProposedValue,
      convertedCount,
      approvedCount,
      activeCount,
      conversionRate,
    };
  }, [proformas]);

  // Filtered Proformas
  const filteredProformas = useMemo(() => {
    return proformas.filter((p) => {
      const matchSearch =
        p.proformaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === 'todos' || p.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [proformas, searchTerm, statusFilter]);

  // Add Item to Draft
  const handleAddItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setProformaItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        productCode: prod.code,
        unitPrice: prod.sellingPrice || prod.price || 0,
        quantity: 1,
        discount: 0,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setProformaItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setProformaItems((prev) => prev.filter((_, i) => i !== index));
  };

  const proformaItemsSubtotal = proformaItems.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0
  );
  const proformaItemsDiscount = proformaItems.reduce(
    (sum, it) => sum + it.discount,
    0
  );
  const proformaItemsTotal = Math.max(0, proformaItemsSubtotal - proformaItemsDiscount);

  // Handle Save Proforma
  const handleSaveProforma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proformaForm.clientId) {
      alert('Por favor selecione o cliente');
      return;
    }
    if (proformaItems.length === 0) {
      alert('Adicione pelo menos um produto ou serviço à cotação');
      return;
    }

    const client = clients.find((c) => c.id === proformaForm.clientId);
    if (!client) return;

    const mappedItems: OrderItem[] = proformaItems.map((it) => ({
      productId: it.productId,
      productCode: it.productCode,
      productName: it.productName,
      unitPrice: Number(it.unitPrice) || 0,
      quantity: Number(it.quantity) || 1,
      subtotal: Math.max(0, (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0)),
      discount: Number(it.discount) || 0,
    }));

    const newProf = createProforma({
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      clientEmail: client.email,
      date: new Date().toISOString().slice(0, 10),
      validUntil: proformaForm.validUntil,
      status: 'enviada',
      items: mappedItems,
      subtotal: proformaItemsSubtotal,
      discount: proformaItemsDiscount,
      totalAmount: proformaItemsTotal,
      termsAndConditions: proformaForm.termsAndConditions,
      notes: proformaForm.notes.trim() || undefined,
      createdBy: currentUser?.name || 'Admin',
    });

    setProformaItems([]);
    setProformaForm({
      clientId: '',
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      termsAndConditions: 'Preços válidos por 15 dias. Pagamento a 100% ou sinal de 50%. Entregas em Maputo e Matola.',
      notes: '',
    });
    setIsNewModalOpen(false);
    setViewingProforma(newProf);
  };

  // Convert to Order Execution
  const handleConfirmConvert = () => {
    if (!convertingProforma) return;
    try {
      const { order } = convertProformaToOrder(
        convertingProforma.id,
        convertAmountPaid,
        convertPaymentMethod
      );

      setConvertingProforma(null);
      if (onOpenOrderReceipt) {
        onOpenOrderReceipt(order.id);
      } else {
        alert(`Orçamento ${convertingProforma.proformaNumber} convertido com sucesso na Encomenda ${order.orderNumber}!`);
      }
    } catch (err: any) {
      alert(`Erro ao converter orçamento: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Orçamentos & Faturas Proforma (ERP)</h1>
            <p className="text-sm text-slate-500">
              Emissão de propostas comerciais formais, cotações para clientes e conversão instantânea em vendas reais
            </p>
          </div>
        </div>

        <button
          id="btn-new-proforma"
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 shadow-sm shadow-purple-500/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Orçamento / Proforma</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total em Propostas</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatMT(stats.totalProposedValue)}</div>
          <div className="text-xs text-slate-500 mt-1">{stats.totalIssued} orçamentos emitidos</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Convertidos em Vendas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{stats.convertedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Taxa de sucesso: {stats.conversionRate}%</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Orçamentos Aprovados</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{stats.approvedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Prontos a faturar</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Em Negociação</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{stats.activeCount}</div>
          <div className="text-xs text-slate-500 mt-1">Aguardando aprovação do cliente</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nº, cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="todos">Todos os Estados</option>
            <option value="enviada">Enviadas</option>
            <option value="aprovada">Aprovadas</option>
            <option value="convertida">Convertidas em Venda</option>
            <option value="rascunho">Rascunho</option>
            <option value="expirada">Expiradas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Nº Proforma</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Data Emissão</th>
                <th className="py-3.5 px-4">Válido Até</th>
                <th className="py-3.5 px-4">Itens</th>
                <th className="py-3.5 px-4 text-right">Valor Total</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProformas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum orçamento encontrado.
                  </td>
                </tr>
              ) : (
                filteredProformas.map((prof) => {
                  const isConverted = prof.status === 'convertida';
                  const isApproved = prof.status === 'aprovada';
                  const isSent = prof.status === 'enviada';

                  return (
                    <tr key={prof.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-purple-600 text-xs">
                        {prof.proformaNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {prof.clientName}
                        {prof.clientPhone && (
                          <span className="block text-[11px] font-normal text-slate-400">
                            {prof.clientPhone}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                        {prof.date}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                        {prof.validUntil || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {prof.items.reduce((s, it) => s + it.quantity, 0)} itens
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatMT(prof.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isConverted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isApproved
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isSent
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isConverted ? '✓ Convertida' : isApproved ? 'Aprovada' : isSent ? 'Enviada' : prof.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setViewingProforma(prof)}
                            title="Ver Documento Formal Proforma"
                            className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!isConverted && (
                            <button
                              onClick={() => {
                                setConvertingProforma(prof);
                                setConvertAmountPaid(prof.totalAmount);
                                setConvertPaymentMethod('Numerário');
                              }}
                              title="Converter em Venda / Encomenda Real"
                              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                            >
                              <ArrowRightCircle className="w-3.5 h-3.5" />
                              <span>Converter</span>
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja apagar o orçamento ${prof.proformaNumber}?`)) {
                                  deleteProforma(prof.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL: NOVO ORÇAMENTO / PROFORMA */}
      {/* ========================================== */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-purple-600" />
              <span>Criar Cotação / Fatura Proforma</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Crie uma proposta comercial formal para o cliente. Poderá convertê-la em venda com um clique mais tarde.
            </p>

            <form onSubmit={handleSaveProforma} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente *</label>
                  <select
                    required
                    value={proformaForm.clientId}
                    onChange={(e) => setProformaForm({ ...proformaForm, clientId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Selecione o Cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data Limite de Validade *</label>
                  <input
                    type="date"
                    required
                    value={proformaForm.validUntil}
                    onChange={(e) => setProformaForm({ ...proformaForm, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                  </input>
                </div>
              </div>

              {/* Items Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Package className="w-4 h-4 text-purple-600" />
                    <span>Produtos & Serviços da Proforma ({proformaItems.length})</span>
                  </span>

                  <div className="w-64">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddItem(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">+ Adicionar Item ao Orçamento...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code}) — {formatMT(p.sellingPrice || p.price || 0)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {proformaItems.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-300">
                    Nenhum item adicionado. Adicione produtos ou serviços acima.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proformaItems.map((it, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs"
                      >
                        <div className="sm:col-span-4">
                          <span className="font-bold text-slate-900 block truncate">{it.productName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{it.productCode}</span>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400">Preço Unit. (MT)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.unitPrice}
                            onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-slate-300 rounded font-semibold text-right"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400">Quantidade</label>
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                            className="w-full px-2 py-1 border border-slate-300 rounded font-semibold text-center"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400">Desconto (MT)</label>
                          <input
                            type="number"
                            min="0"
                            value={it.discount}
                            onChange={(e) => handleUpdateItem(idx, 'discount', Math.max(0, Number(e.target.value)))}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-right text-rose-600"
                          />
                        </div>

                        <div className="sm:col-span-1 text-right">
                          <label className="block text-[10px] text-slate-400">Total</label>
                          <span className="font-bold text-slate-900 block pt-1">
                            {formatMT(Math.max(0, it.quantity * it.unitPrice - it.discount))}
                          </span>
                        </div>

                        <div className="sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-2 text-sm font-bold text-slate-900 space-x-6">
                      <span className="text-slate-500">Subtotal: {formatMT(proformaItemsSubtotal)}</span>
                      {proformaItemsDiscount > 0 && (
                        <span className="text-rose-600">Desconto: -{formatMT(proformaItemsDiscount)}</span>
                      )}
                      <span className="text-purple-700">Total Proforma: {formatMT(proformaItemsTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Termos e Condições Comerciais
                </label>
                <textarea
                  rows={2}
                  value={proformaForm.termsAndConditions}
                  onChange={(e) => setProformaForm({ ...proformaForm, termsAndConditions: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Internas</label>
                <input
                  type="text"
                  placeholder="Ex: Proposta com desconto especial aprovado pela gerência"
                  value={proformaForm.notes}
                  onChange={(e) => setProformaForm({ ...proformaForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Emitir Orçamento / Proforma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: VER / IMPRIMIR FATURA PROFORMA */}
      {/* ========================================== */}
      {viewingProforma && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">FATURA PROFORMA</h2>
                <span className="font-mono text-xs font-bold text-purple-600">{viewingProforma.proformaNumber}</span>
              </div>
              <button
                onClick={() => setViewingProforma(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs mb-6">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-semibold uppercase">Dados do Cliente:</span>
                <span className="font-bold text-slate-900 text-sm block mt-1">{viewingProforma.clientName}</span>
                {viewingProforma.clientPhone && (
                  <span className="text-slate-600 block">Tel: {viewingProforma.clientPhone}</span>
                )}
                {viewingProforma.clientEmail && (
                  <span className="text-slate-600 block">Email: {viewingProforma.clientEmail}</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-semibold uppercase">Detalhes da Emissão:</span>
                <span className="text-slate-700 block mt-1">Data: <strong>{viewingProforma.date}</strong></span>
                <span className="text-slate-700 block">Válido Até: <strong>{viewingProforma.validUntil || '15 Dias'}</strong></span>
                <span className="text-slate-700 block">Emitido por: {viewingProforma.createdBy || 'Comercial'}</span>
              </div>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="py-2.5">Descrição</th>
                    <th className="py-2.5 text-center">Qtd</th>
                    <th className="py-2.5 text-right">Preço Unitário</th>
                    <th className="py-2.5 text-right">Desconto</th>
                    <th className="py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingProforma.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-medium text-slate-900">
                        {it.productName}
                        <span className="block text-[10px] text-slate-400 font-mono">{it.productCode}</span>
                      </td>
                      <td className="py-2.5 text-center font-semibold">{it.quantity}</td>
                      <td className="py-2.5 text-right">{formatMT(it.unitPrice)}</td>
                      <td className="py-2.5 text-right text-rose-600">
                        {it.discount ? `-${formatMT(it.discount)}` : '—'}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{formatMT(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-semibold">{formatMT(viewingProforma.subtotal)}</span>
              </div>
              {viewingProforma.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Desconto Concedido:</span>
                  <span className="font-semibold">-{formatMT(viewingProforma.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>VALOR TOTAL PROPOSTO:</span>
                <span className="text-purple-700 font-black">{formatMT(viewingProforma.totalAmount)}</span>
              </div>
            </div>

            {viewingProforma.termsAndConditions && (
              <div className="mt-6 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Termos e Condições:</span>
                <p>{viewingProforma.termsAndConditions}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-6">
              <span className="text-[11px] text-slate-400 italic">
                * Este documento não serve de fatura definitiva para efeitos fiscais.
              </span>
              <div className="flex space-x-2.5">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  onClick={() => setViewingProforma(null)}
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 rounded-lg"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CONVERTER EM ENCOMENDA REAL */}
      {/* ========================================== */}
      {convertingProforma && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <ArrowRightCircle className="w-5 h-5 text-emerald-600" />
              <span>Converter Orçamento em Venda Real</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Esta ação criará uma Encomenda oficial no sistema com os itens e valores deste orçamento ({convertingProforma.proformaNumber}).
            </p>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-emerald-800 font-medium">Cliente:</span>
                <span className="font-bold text-emerald-950">{convertingProforma.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800 font-medium">Valor Total da Venda:</span>
                <span className="font-bold text-emerald-950 text-sm">{formatMT(convertingProforma.totalAmount)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Valor Pago Imediatamente (MT)
                </label>
                <input
                  type="number"
                  min="0"
                  max={convertingProforma.totalAmount}
                  value={convertAmountPaid}
                  onChange={(e) => setConvertAmountPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-emerald-600"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  {convertAmountPaid < convertingProforma.totalAmount
                    ? `Ficará com saldo devedor em conta corrente de ${formatMT(convertingProforma.totalAmount - convertAmountPaid)}`
                    : 'Pagamento a 100% liquidado neste ato'}
                </span>
              </div>

              {convertAmountPaid > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Forma de Pagamento</label>
                  <select
                    value={convertPaymentMethod}
                    onChange={(e) => setConvertPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Numerário">Numerário / Dinheiro</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="E-Mola">E-Mola</option>
                    <option value="Ponto24 / POS">Ponto24 / POS Cartão</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setConvertingProforma(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmConvert}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Confirmar Venda & Gerar Encomenda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
