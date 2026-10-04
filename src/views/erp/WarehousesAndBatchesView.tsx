import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  ArrowRightLeft, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Package, 
  Trash2, 
  Check, 
  Layers, 
  Archive,
  History,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Warehouse, StockTransfer, ProductBatch } from '../../types';
import { formatMT } from '../../utils/formatters';

export const WarehousesAndBatchesView: React.FC = () => {
  const { 
    warehouses, 
    addWarehouse, 
    deleteWarehouse,
    stockTransfers, 
    createStockTransfer,
    deleteStockTransfer,
    clearStockTransfersHistory,
    batches, 
    addBatch, 
    deleteBatch,
    products 
  } = useApp();
  const { isAdmin, currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'transfers' | 'batches' | 'warehouses'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');

  // New Warehouse Modal
  const [isNewWhModalOpen, setIsNewWhModalOpen] = useState(false);
  const [whForm, setWhForm] = useState({
    name: '',
    location: '',
    manager: '',
    phone: '',
  });

  // New Transfer Modal
  const [isNewTransferModalOpen, setIsNewTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    productId: '',
    quantity: 1,
    date: new Date().toISOString().slice(0, 10),
    reason: 'Reposição de stock para venda balcão',
  });

  // New Batch Modal
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    productId: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 10,
    warehouseId: '',
    costPrice: 0,
  });

  // Filter for Batches: All vs Near Expiry (< 60 days) vs Expired
  const [batchStatusFilter, setBatchStatusFilter] = useState<'todos' | 'expirados' | 'alerta'>('todos');

  const todayStr = new Date().toISOString().slice(0, 10);

  // Helper to calculate days until expiration
  const getDaysUntilExpiry = (expiryDate: string) => {
    const diffMs = new Date(expiryDate).getTime() - new Date(todayStr).getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Batches Analytics
  const batchStats = useMemo(() => {
    let expiredCount = 0;
    let alertCount = 0; // <= 60 days
    let okCount = 0;

    batches.forEach((b) => {
      const days = getDaysUntilExpiry(b.expiryDate);
      if (days < 0) {
        expiredCount++;
      } else if (days <= 60) {
        alertCount++;
      } else {
        okCount++;
      }
    });

    return { expiredCount, alertCount, okCount, totalBatches: batches.length };
  }, [batches, todayStr]);

  // Filtered Products for Matrix
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [products, searchTerm]);

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchSearch =
        b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.productCode.toLowerCase().includes(searchTerm.toLowerCase());

      const days = getDaysUntilExpiry(b.expiryDate);
      let matchStatus = true;
      if (batchStatusFilter === 'expirados') {
        matchStatus = days < 0;
      } else if (batchStatusFilter === 'alerta') {
        matchStatus = days >= 0 && days <= 60;
      }

      return matchSearch && matchStatus;
    });
  }, [batches, searchTerm, batchStatusFilter, todayStr]);

  // Save Warehouse
  const handleSaveWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whForm.name.trim()) {
      alert('Por favor insira o nome do armazém / loja');
      return;
    }

    addWarehouse({
      name: whForm.name.trim(),
      location: whForm.location.trim() || undefined,
      manager: whForm.manager.trim() || undefined,
      phone: whForm.phone.trim() || undefined,
      isMain: warehouses.length === 0,
      active: true,
    });

    setWhForm({ name: '', location: '', manager: '', phone: '' });
    setIsNewWhModalOpen(false);
  };

  // Save Transfer
  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.fromWarehouseId || !transferForm.toWarehouseId) {
      alert('Selecione o armazém de origem e de destino');
      return;
    }
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
      alert('O armazém de origem e de destino não podem ser iguais');
      return;
    }
    if (!transferForm.productId) {
      alert('Selecione o produto a transferir');
      return;
    }
    if (transferForm.quantity <= 0) {
      alert('A quantidade deve ser superior a zero');
      return;
    }

    const fromWh = warehouses.find((w) => w.id === transferForm.fromWarehouseId);
    const toWh = warehouses.find((w) => w.id === transferForm.toWarehouseId);
    const prod = products.find((p) => p.id === transferForm.productId);

    if (!fromWh || !toWh || !prod) return;

    const result = createStockTransfer({
      fromWarehouseId: fromWh.id,
      fromWarehouseName: fromWh.name,
      toWarehouseId: toWh.id,
      toWarehouseName: toWh.name,
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      quantity: Number(transferForm.quantity),
      date: transferForm.date,
      reason: transferForm.reason.trim() || 'Transferência de stock',
      transferredBy: currentUser?.name || 'Admin',
    });

    if (!result.success) {
      alert(result.error || 'Erro ao efetuar transferência');
      return;
    }

    setIsNewTransferModalOpen(false);
    setTransferForm({
      fromWarehouseId: '',
      toWarehouseId: '',
      productId: '',
      quantity: 1,
      date: new Date().toISOString().slice(0, 10),
      reason: 'Reposição de stock para venda balcão',
    });
    alert(`Transferência efetuada com sucesso! ${transferForm.quantity} unidades movidas para ${toWh.name}.`);
  };

  // Save Batch
  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.productId || !batchForm.batchNumber.trim() || !batchForm.expiryDate) {
      alert('Preencha os campos obrigatórios (Produto, Nº do Lote, Data de Validade)');
      return;
    }

    const prod = products.find((p) => p.id === batchForm.productId);
    if (!prod) return;

    const wh = warehouses.find((w) => w.id === batchForm.warehouseId);

    addBatch({
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      batchNumber: batchForm.batchNumber.trim(),
      expiryDate: batchForm.expiryDate,
      quantity: Number(batchForm.quantity) || 1,
      warehouseId: wh?.id,
      warehouseName: wh?.name,
      costPrice: Number(batchForm.costPrice) || prod.costPrice || 0,
    });

    setIsNewBatchModalOpen(false);
    setBatchForm({
      productId: '',
      batchNumber: '',
      expiryDate: '',
      quantity: 10,
      warehouseId: '',
      costPrice: 0,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Multi-Armazém & Controlo de Lotes (ERP)</h1>
            <p className="text-sm text-slate-500">
              Gestão de múltiplas lojas/filiais, transferência entre armazéns e controlo rigoroso de validades e lotes
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-new-wh"
            onClick={() => setIsNewWhModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <Building2 className="w-4 h-4" />
            <span>Novo Armazém / Loja</span>
          </button>

          <button
            id="btn-new-transfer"
            onClick={() => {
              if (warehouses.length < 2) {
                alert('Precisa de pelo menos 2 armazéns ou lojas registadas para realizar transferências.');
                setIsNewWhModalOpen(true);
                return;
              }
              setIsNewTransferModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-500/30 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Nova Transferência entre Lojas</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Armazéns / Filiais</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{warehouses.length}</div>
          <div className="text-xs text-slate-500 mt-1">Pontos de venda e depósitos ativos</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transferências Realizadas</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stockTransfers.length}</div>
          <div className="text-xs text-slate-500 mt-1">Movimentos entre lojas auditados</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lotes a Expirar (&le; 60 dias)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{batchStats.alertCount}</div>
          <div className="text-xs text-slate-500 mt-1">Atenção requerida / promoções</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lotes Vencidos / Expirados</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{batchStats.expiredCount}</div>
          <div className="text-xs text-rose-500 mt-1">Produtos fora do prazo de validade</div>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'matrix' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📦 Matriz de Stock por Armazém
          </button>
          <button
            onClick={() => setActiveSubTab('transfers')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'transfers' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔄 Histórico de Transferências ({stockTransfers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('batches')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'batches' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⏳ Controlo de Lotes & Validades ({batches.length})
          </button>
          <button
            onClick={() => setActiveSubTab('warehouses')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'warehouses' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏢 Lista de Lojas ({warehouses.length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* SUBTAB 1: STOCK MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Disponibilidade de Stock Multi-Armazém</h3>
              <p className="text-xs text-slate-500">
                Visualize a quantidade de cada produto em cada filial ou armazém da empresa em tempo real
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {filteredProducts.length} produtos registados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Categoria</th>
                  {warehouses.map((wh) => (
                    <th key={wh.id} className="py-3 px-4 text-center">
                      <span className="block font-bold text-slate-900">{wh.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{wh.code}</span>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center font-bold text-teal-700">Stock Total</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  const isPhysical = prod.type === 'physical';
                  const totalStock = prod.stockQuantity ?? 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                        {prod.code}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {prod.name}
                        {!isPhysical && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-600">
                            Digital
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {prod.category}
                      </td>

                      {/* Stock in each warehouse */}
                      {warehouses.map((wh) => {
                        const whStock = prod.warehouseStock?.[wh.id] ?? (wh.isMain ? totalStock : 0);
                        return (
                          <td key={wh.id} className="py-2.5 px-4 text-center font-mono">
                            {isPhysical ? (
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  whStock > 0 ? 'bg-slate-100 text-slate-800' : 'text-slate-300'
                                }`}
                              >
                                {whStock} un
                              </span>
                            ) : (
                              <span className="text-slate-400">∞</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Stock */}
                      <td className="py-2.5 px-4 text-center font-bold font-mono">
                        {isPhysical ? (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs ${
                              totalStock <= prod.minStockAlert
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-teal-50 text-teal-700 border border-teal-200'
                            }`}
                          >
                            {totalStock} un
                          </span>
                        ) : (
                          <span className="text-indigo-600 font-bold">Ilimitado</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        {isPhysical && warehouses.length > 1 && totalStock > 0 && (
                          <button
                            onClick={() => {
                              setTransferForm((prev) => ({
                                ...prev,
                                productId: prod.id,
                                fromWarehouseId: warehouses[0]?.id || '',
                                toWarehouseId: warehouses[1]?.id || '',
                              }));
                              setIsNewTransferModalOpen(true);
                            }}
                            className="text-teal-600 hover:text-teal-700 font-semibold text-[11px] underline"
                          >
                            Transferir
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TRANSFERS HISTORY */}
      {activeSubTab === 'transfers' && (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-teal-600" />
                <span>Histórico de Transferências de Stock Entre Armazéns</span>
              </h3>
              <p className="text-xs text-slate-500">
                Auditoria de todas as movimentações de mercadoria realizadas entre lojas e balcões
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {isAdmin && stockTransfers.length > 0 && (
                <button
                  id="btn-clear-transfers-history"
                  onClick={() => {
                    if (confirm('Atenção: Tem certeza que deseja limpar todo o histórico de transferências de stock? Esta ação é definitiva para efeitos de auditoria.')) {
                      clearStockTransfersHistory();
                    }
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                  title="Eliminar e limpar todos os registos do histórico de transferências"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Histórico</span>
                </button>
              )}

              <button
                onClick={() => setIsNewTransferModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nova Transferência</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <th className="py-3 px-4">Nº Transferência</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Origem ➔ Destino</th>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4 text-center">Quantidade</th>
                    <th className="py-3 px-4">Motivo</th>
                    <th className="py-3 px-4">Responsável</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Nenhuma transferência entre lojas registada ainda.
                      </td>
                    </tr>
                  ) : (
                    stockTransfers.map((trf) => (
                      <tr key={trf.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-teal-700">
                          {trf.transferNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {trf.date}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900">{trf.fromWarehouseName}</span>
                          <span className="mx-1.5 text-teal-600 font-bold">➔</span>
                          <span className="font-semibold text-teal-700">{trf.toWarehouseName}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {trf.productName}
                          <span className="block text-[10px] text-slate-400 font-mono">{trf.productCode}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold font-mono text-slate-900">
                          {trf.quantity} un
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {trf.reason}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {trf.transferredBy || 'Admin'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Concluída
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm(`Deseja eliminar o registo da transferência ${trf.transferNumber}?`)) {
                                  deleteStockTransfer(trf.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar este registo de transferência"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: BATCHES & EXPIRY */}
      {activeSubTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Filtrar por validade:</span>
              <button
                onClick={() => setBatchStatusFilter('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  batchStatusFilter === 'todos'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({batches.length})
              </button>
              <button
                onClick={() => setBatchStatusFilter('alerta')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  batchStatusFilter === 'alerta'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                ⚠️ A Expirar em Breve ({batchStats.alertCount})
              </button>
              <button
                onClick={() => setBatchStatusFilter('expirados')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  batchStatusFilter === 'expirados'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                ⛔ Vencidos ({batchStats.expiredCount})
              </button>
            </div>

            <button
              onClick={() => setIsNewBatchModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-lg shadow-sm flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Lote Manual</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <th className="py-3 px-4">Nº do Lote</th>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4">Localização / Armazém</th>
                    <th className="py-3 px-4 text-center">Quantidade</th>
                    <th className="py-3 px-4 text-right">Preço de Custo</th>
                    <th className="py-3 px-4">Data de Validade</th>
                    <th className="py-3 px-4 text-center">Dias Restantes</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    {isAdmin && <th className="py-3 px-4 text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Nenhum lote com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((batch) => {
                      const daysLeft = getDaysUntilExpiry(batch.expiryDate);
                      const isExpired = daysLeft < 0;
                      const isAlert = !isExpired && daysLeft <= 60;

                      return (
                        <tr key={batch.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {batch.batchNumber}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {batch.productName}
                            <span className="block text-[10px] text-slate-400 font-mono">{batch.productCode}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {batch.warehouseName || 'Loja Principal'}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-slate-900">
                            {batch.quantity} un
                          </td>
                          <td className="py-3 px-4 text-right">
                            {formatMT(batch.costPrice || 0)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                            {batch.expiryDate}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            {isExpired ? (
                              <span className="text-rose-600 font-bold">Vencido há {Math.abs(daysLeft)} dias</span>
                            ) : (
                              <span className={isAlert ? 'text-amber-600 font-bold' : 'text-emerald-700'}>
                                {daysLeft} dias
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                isExpired
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : isAlert
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isExpired ? '⛔ Expirado' : isAlert ? '⚠️ Alerta Breve' : '✓ Válido'}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => {
                                  if (confirm(`Eliminar o lote ${batch.batchNumber}?`)) {
                                    deleteBatch(batch.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: WAREHOUSES LIST */}
      {activeSubTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                      {wh.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1.5">{wh.name}</h3>
                  </div>
                  {wh.isMain && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Sede Principal
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  {wh.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{wh.location}</span>
                    </div>
                  )}
                  {wh.manager && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Responsável: {wh.manager}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Estado: Ativo</span>
                {!wh.isMain && isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm(`Deseja remover o armazém ${wh.name}?`)) {
                        deleteWarehouse(wh.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: NOVO ARMAZÉM */}
      {/* ========================================== */}
      {isNewWhModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              <span>Cadastrar Novo Armazém / Loja</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Crie uma filial ou armazém secundário para gerir stock segregado
            </p>

            <form onSubmit={handleSaveWarehouse} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Armazém / Loja *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Filial Matola ou Armazém Geral"
                  value={whForm.name}
                  onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Localização / Endereço</label>
                <input
                  type="text"
                  placeholder="Ex: Av. da Matola nº 400"
                  value={whForm.location}
                  onChange={(e) => setWhForm({ ...whForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gerente / Responsável</label>
                <input
                  type="text"
                  placeholder="Ex: Manuel Sitoe"
                  value={whForm.manager}
                  onChange={(e) => setWhForm({ ...whForm, manager: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewWhModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  Guardar Armazém
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: NOVA TRANSFERÊNCIA ENTRE LOJAS */}
      {/* ========================================== */}
      {isNewTransferModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <ArrowRightLeft className="w-5 h-5 text-teal-600" />
              <span>Transferência de Stock entre Lojas</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Mova mercadorias de um armazém para outro com auditoria e atualização imediata de stock
            </p>

            <form onSubmit={handleSaveTransfer} className="space-y-3.5 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Armazém Origem *</label>
                  <select
                    required
                    value={transferForm.fromWarehouseId}
                    onChange={(e) => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Selecione Origem...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Armazém Destino *</label>
                  <select
                    required
                    value={transferForm.toWarehouseId}
                    onChange={(e) => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Selecione Destino...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Produto a Transferir *</label>
                <select
                  required
                  value={transferForm.productId}
                  onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Selecione o Produto...</option>
                  {products.filter((p) => p.type === 'physical').map((p) => {
                    const fromWhStock = transferForm.fromWarehouseId
                      ? (p.warehouseStock?.[transferForm.fromWarehouseId] ?? p.stockQuantity ?? 0)
                      : (p.stockQuantity ?? 0);

                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code}) — Disponível na origem: {fromWhStock} un
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantidade a Mover *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data da Transferência *</label>
                  <input
                    type="date"
                    required
                    value={transferForm.date}
                    onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo / Guia de Transporte</label>
                <input
                  type="text"
                  placeholder="Ex: Guia nº 45/2026 - Reposição urgente"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTransferModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  Confirmar Transferência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: NOVO LOTE MANUAL */}
      {/* ========================================== */}
      {isNewBatchModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <span>Registar Lote & Data de Validade</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Monitorização de prazos de validade para controlo de perdas e frescura de produtos
            </p>

            <form onSubmit={handleSaveBatch} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Produto *</label>
                <select
                  required
                  value={batchForm.productId}
                  onChange={(e) => setBatchForm({ ...batchForm, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Selecione o Produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nº do Lote *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: LOT-2026/04"
                    value={batchForm.batchNumber}
                    onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Validade *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.expiryDate}
                    onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantidade no Lote</label>
                  <input
                    type="number"
                    min="1"
                    value={batchForm.quantity}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Armazém / Loja</label>
                  <select
                    value={batchForm.warehouseId}
                    onChange={(e) => setBatchForm({ ...batchForm, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Selecione Armazém...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewBatchModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  Guardar Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
