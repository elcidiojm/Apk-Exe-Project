import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Search, 
  Building2, 
  Trash2, 
  Edit3, 
  Package, 
  PlusCircle, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Supplier, Purchase, PurchaseItem, PurchasePaymentStatus, PaymentMethod } from '../../types';
import { formatMT, formatDate } from '../../utils/formatters';

export const SuppliersAndPurchasesView: React.FC = () => {
  const { 
    suppliers, 
    addSupplier, 
    updateSupplier, 
    deleteSupplier,
    purchases, 
    createPurchase, 
    deletePurchase,
    markPurchasePaid,
    products,
    warehouses
  } = useApp();

  const { currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'compras' | 'fornecedores'>('compras');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | PurchasePaymentStatus>('todos');

  // Supplier Modal state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    email: '',
    nuit: '',
    address: '',
    contactPerson: '',
    notes: '',
  });

  // Purchase Modal state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierDocNumber, setSupplierDocNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [purchaseDueDate, setPurchaseDueDate] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [amountPaidNow, setAmountPaidNow] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('M-Pesa');

  // New item row inside purchase modal
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemCostPrice, setItemCostPrice] = useState<number>(0);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<{ id: string; type: 'supplier' | 'purchase' } | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const totalPurchasesVolume = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalPaidVolume = purchases.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const totalDebtToSuppliers = purchases.reduce((sum, p) => sum + (p.balanceDue || 0), 0);
    const pendingPurchasesCount = purchases.filter((p) => p.paymentStatus !== 'pago').length;

    return {
      totalPurchasesVolume,
      totalPaidVolume,
      totalDebtToSuppliers,
      pendingPurchasesCount,
      suppliersCount: suppliers.length,
    };
  }, [purchases, suppliers]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchSearch =
        p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.supplierDocNumber && p.supplierDocNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'todos' || p.paymentStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [purchases, searchTerm, statusFilter]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      return (
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [suppliers, searchTerm]);

  const handleOpenSupplierModal = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
      setSupplierForm({
        name: sup.name,
        phone: sup.phone,
        email: sup.email || '',
        nuit: sup.nuit || '',
        address: sup.address || '',
        contactPerson: sup.contactPerson || '',
        notes: sup.notes || '',
      });
    } else {
      setEditingSupplier(null);
      setSupplierForm({
        name: '',
        phone: '',
        email: '',
        nuit: '',
        address: '',
        contactPerson: '',
        notes: '',
      });
    }
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim() || !supplierForm.phone.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name: supplierForm.name.trim(),
        phone: supplierForm.phone.trim(),
        email: supplierForm.email.trim() || undefined,
        nuit: supplierForm.nuit.trim() || undefined,
        address: supplierForm.address.trim() || undefined,
        contactPerson: supplierForm.contactPerson.trim() || undefined,
        notes: supplierForm.notes.trim() || undefined,
      });
    } else {
      addSupplier({
        name: supplierForm.name.trim(),
        phone: supplierForm.phone.trim(),
        email: supplierForm.email.trim() || undefined,
        nuit: supplierForm.nuit.trim() || undefined,
        address: supplierForm.address.trim() || undefined,
        contactPerson: supplierForm.contactPerson.trim() || undefined,
        notes: supplierForm.notes.trim() || undefined,
        active: true,
      });
    }
    setIsSupplierModalOpen(false);
  };

  const handleAddItemToPurchase = () => {
    if (!selectedProductId || itemQuantity <= 0 || itemCostPrice < 0) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const warehouse = warehouses.find((w) => w.id === selectedWarehouseId);

    const newItem: PurchaseItem = {
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      quantity: itemQuantity,
      costPrice: itemCostPrice,
      subtotal: itemQuantity * itemCostPrice,
      warehouseId: warehouse?.id,
      warehouseName: warehouse?.name,
    };

    setPurchaseItems((prev) => [...prev, newItem]);
    setSelectedProductId('');
    setItemQuantity(1);
    setItemCostPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || purchaseItems.length === 0) return;

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) return;

    const totalAmount = purchaseItems.reduce((sum, it) => sum + it.subtotal, 0);

    createPurchase({
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierDocNumber: supplierDocNumber.trim() || undefined,
      date: purchaseDate,
      dueDate: purchaseDueDate || undefined,
      items: purchaseItems,
      totalAmount,
      amountPaid: amountPaidNow,
      balanceDue: Math.max(0, totalAmount - amountPaidNow),
      status: 'recebida',
      paymentStatus: amountPaidNow >= totalAmount ? 'pago' : amountPaidNow > 0 ? 'parcial' : 'pendente',
      paymentMethod: amountPaidNow > 0 ? paymentMethod : undefined,
      notes: purchaseNotes.trim() || undefined,
      createdBy: currentUser?.name || 'Administrador',
    });

    setIsPurchaseModalOpen(false);
    setPurchaseItems([]);
    setSelectedSupplierId('');
    setSupplierDocNumber('');
    setAmountPaidNow(0);
    setPurchaseNotes('');
  };

  const handleDelete = () => {
    if (!confirmDeleteId) return;
    if (confirmDeleteId.type === 'supplier') {
      deleteSupplier(confirmDeleteId.id);
    } else {
      deletePurchase(confirmDeleteId.id);
    }
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-black text-slate-900">
              Fornecedores & Compras (ERP)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de fornecedores, encomendas de mercadorias e entradas em armazém
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {activeSubTab === 'compras' ? (
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Nova Compra / Entrada</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenSupplierModal()}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Novo Fornecedor</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Volume Total Compras</div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            {formatMT(stats.totalPurchasesVolume)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{purchases.length} compras registadas</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Pago a Fornecedores</div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1">
            {formatMT(stats.totalPaidVolume)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Amortizado</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Dívida a Fornecedores</div>
          <div className="text-lg sm:text-xl font-black text-rose-600 mt-1">
            {formatMT(stats.totalDebtToSuppliers)}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">
            {stats.pendingPurchasesCount} faturas em aberto
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Fornecedores Ativos</div>
          <div className="text-lg sm:text-xl font-black text-indigo-600 mt-1">
            {stats.suppliersCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Parceiros cadastrados</div>
        </div>
      </div>

      {/* Sub tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('compras')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'compras'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Compras & Entradas ({purchases.length})
            </button>
            <button
              onClick={() => setActiveSubTab('fornecedores')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'fornecedores'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fornecedores ({suppliers.length})
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            {activeSubTab === 'compras' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
              >
                <option value="todos">Todos os Estados</option>
                <option value="pago">Pagas Totalmente</option>
                <option value="parcial">Parcialmente Pagas</option>
                <option value="pendente">Pendentes (Não Pagas)</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Purchases or Suppliers */}
      {activeSubTab === 'compras' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredPurchases.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Package className="w-12 h-12 mx-auto text-slate-300" />
              <div className="text-sm font-semibold text-slate-600">Nenhuma compra encontrada</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Não existem registos de compras de fornecedores que correspondam aos filtros.
              </p>
              <button
                onClick={() => setIsPurchaseModalOpen(true)}
                className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Registar Primeira Compra</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">N.º Compra</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Fornecedor</th>
                    <th className="py-3 px-4">Doc. Fornecedor</th>
                    <th className="py-3 px-4">Itens</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Pago</th>
                    <th className="py-3 px-4 text-right">Saldo Devedor</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {purchase.purchaseNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(purchase.date)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {purchase.supplierName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {purchase.supplierDocNumber || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                        <div className="truncate" title={purchase.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}>
                          {purchase.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-400">{purchase.items.length} itens</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatMT(purchase.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {formatMT(purchase.amountPaid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                        {purchase.balanceDue > 0 ? (
                          <span className="text-rose-600">{formatMT(purchase.balanceDue)}</span>
                        ) : (
                          <span className="text-slate-400">0,00 MT</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {purchase.paymentStatus === 'pago' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Liquidado</span>
                          </span>
                        ) : purchase.paymentStatus === 'parcial' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Parcial</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>Pendente</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          {purchase.balanceDue > 0 && (
                            <button
                              onClick={() => markPurchasePaid(purchase.id)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-[10px] transition-colors cursor-pointer"
                              title="Marcar como Liquidado Totalmente"
                            >
                              Liquidar
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDeleteId({ id: purchase.id, type: 'purchase' })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Compra"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Suppliers Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Building2 className="w-12 h-12 mx-auto text-slate-300" />
              <div className="text-sm font-semibold text-slate-600">Nenhum fornecedor encontrado</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Não existem fornecedores registados ou correspondentes aos termos pesquisados.
              </p>
              <button
                onClick={() => handleOpenSupplierModal()}
                className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Adicionar Primeiro Fornecedor</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Nome / Empresa</th>
                    <th className="py-3 px-4">Contacto Principal</th>
                    <th className="py-3 px-4">NUIT</th>
                    <th className="py-3 px-4">Pessoa de Contacto</th>
                    <th className="py-3 px-4">Endereço / Localização</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                        {supplier.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{supplier.name}</div>
                        {supplier.email && (
                          <div className="text-[10px] text-slate-400">{supplier.email}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {supplier.phone}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {supplier.nuit || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {supplier.contactPerson || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {supplier.address || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenSupplierModal(supplier)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar Fornecedor"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId({ id: supplier.id, type: 'supplier' })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Fornecedor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome / Razão Social *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="Ex: Maputo Tech Distribuidora Lda"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone Principal *</label>
                  <input
                    type="text"
                    required
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="Ex: +258 84 123 4567"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NUIT</label>
                  <input
                    type="text"
                    value={supplierForm.nuit}
                    onChange={(e) => setSupplierForm({ ...supplierForm, nuit: e.target.value })}
                    placeholder="Ex: 400123456"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    placeholder="vendas@fornecedor.co.mz"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pessoa de Contacto</label>
                  <input
                    type="text"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    placeholder="Ex: Sr. Alberto"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Endereço / Armazém</label>
                <input
                  type="text"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  placeholder="Ex: Av. 24 de Julho, Maputo"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas Internas</label>
                <textarea
                  rows={2}
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  placeholder="Observações sobre descontos, prazos ou condições..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
                >
                  Guardar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Purchase Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 my-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Registar Nova Compra & Entrada em Armazém
                </h3>
                <p className="text-xs text-slate-500">
                  Os produtos adicionados darão entrada imediata no stock do sistema.
                </p>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fornecedor *</label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Selecione o fornecedor...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">N.º Fatura / Recibo Fornecedor</label>
                  <input
                    type="text"
                    value={supplierDocNumber}
                    onChange={(e) => setSupplierDocNumber(e.target.value)}
                    placeholder="Ex: FT-2024/9912"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data da Compra *</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Add Product Line */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Adicionar Itens à Compra
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Produto do Catálogo</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value);
                        const p = products.find((pr) => pr.id === e.target.value);
                        if (p) setItemCostPrice(p.costPrice || 0);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none"
                    >
                      <option value="">Selecionar produto...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code}) — Preço Atual: {formatMT(p.price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Custo Unitário (MT)</label>
                    <input
                      type="number"
                      min={0}
                      value={itemCostPrice}
                      onChange={(e) => setItemCostPrice(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddItemToPurchase}
                    disabled={!selectedProductId}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    + Adicionar Item à Lista
                  </button>
                </div>
              </div>

              {/* Items Table */}
              {purchaseItems.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Produto</th>
                        <th className="py-2 px-3 text-center">Qtd</th>
                        <th className="py-2 px-3 text-right">Custo Unit.</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                        <th className="py-2 px-3 text-center">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purchaseItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.productName}</td>
                          <td className="py-2 px-3 text-center">{item.quantity}</td>
                          <td className="py-2 px-3 text-right">{formatMT(item.costPrice)}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{formatMT(item.subtotal)}</td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <X className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-right">Total da Compra:</td>
                        <td className="py-2 px-3 text-right text-indigo-600 font-black">
                          {formatMT(purchaseItems.reduce((sum, it) => sum + it.subtotal, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Pago Agora (MT)</label>
                  <input
                    type="number"
                    min={0}
                    value={amountPaidNow}
                    onChange={(e) => setAmountPaidNow(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Método de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="e-Mola">e-Mola</option>
                    <option value="Numerário">Numerário</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações da Compra</label>
                <textarea
                  rows={2}
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  placeholder="Condições acordadas, número do recibo ou prazo para amortizar saldo..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={purchaseItems.length === 0 || !selectedSupplierId}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl cursor-pointer"
                >
                  Confirmar & Guardar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {confirmDeleteId.type === 'supplier' ? 'Eliminar Fornecedor?' : 'Eliminar Compra?'}
            </h3>
            <p className="text-xs text-slate-500">
              Tem a certeza de que pretende eliminar este registo? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
              >
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
