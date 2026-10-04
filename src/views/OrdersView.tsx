import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Search, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  Pencil,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus } from '../types';
import { formatMT, formatDate, formatOrderItemLine } from '../utils/formatters';

interface OrdersViewProps {
  onOpenNewOrder: () => void;
  onSelectClient: (clientId: string) => void;
  onViewOrderReceipt: (orderId: string) => void;
  onEditOrder: (order: Order) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  onOpenNewOrder,
  onSelectClient,
  onViewOrderReceipt,
  onEditOrder,
}) => {
  const { orders, clients, deleteOrder } = useApp();
  const { permissions, isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.notes && o.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.sellerUserName && o.sellerUserName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        o.items.some((it) => it.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'all' || o.status === statusFilter;

      let matchDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(o.date);
        const now = new Date();
        if (dateFilter === 'today') {
          matchDate = orderDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          matchDate = orderDate >= weekAgo;
        } else if (dateFilter === 'month') {
          matchDate =
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear();
        }
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [orders, searchTerm, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    const totalCount = orders.length;
    const paidCount = orders.filter((o) => o.status === 'paga').length;
    const partialCount = orders.filter((o) => o.status === 'parcial').length;
    const pendingCount = orders.filter((o) => o.status === 'pendente').length;
    const totalVolume = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalRemaining = orders.reduce((sum, o) => sum + (o.balanceDue || 0), 0);

    return { totalCount, paidCount, partialCount, pendingCount, totalVolume, totalRemaining };
  }, [orders]);

  const handleDelete = (id: string) => {
    deleteOrder(id);
    setConfirmDeleteId(null);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'paga':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Pago Total</span>
          </span>
        );
      case 'parcial':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Parcial</span>
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Não Pago</span>
          </span>
        );
      case 'entregue':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <CheckCircle2 className="w-3 h-3 text-sky-600" />
            <span>Entregue</span>
          </span>
        );
      case 'cancelada':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span>Cancelada</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-black text-slate-900">
              Gestão de Encomendas & Vendas
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Registado: <strong className="text-slate-800">{orders.length} encomendas</strong> • Volume Total: <strong className="text-emerald-600">{formatMT(stats.totalVolume)}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {permissions.canCreateOrders && (
            <button
              onClick={onOpenNewOrder}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Nova Encomenda</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Encomendas</div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">{stats.totalCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">{stats.paidCount} pagas totalmente</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Volume Total</div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1">{formatMT(stats.totalVolume)}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Vendas faturadas</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Dívida Pendente</div>
          <div className="text-lg sm:text-xl font-black text-rose-600 mt-1">{formatMT(stats.totalRemaining)}</div>
          <div className="text-[11px] text-rose-500 font-medium mt-0.5">{stats.pendingCount + stats.partialCount} por liquidar</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Estado de Pagamento</div>
          <div className="flex items-center space-x-1.5 mt-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md">{stats.paidCount} Pagas</span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-md">{stats.partialCount} Parc</span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-md">{stats.pendingCount} Pend</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por n.º de encomenda, cliente, produto, notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
            >
              <option value="all">Todos os Estados</option>
              <option value="paga">Pagas Totalmente</option>
              <option value="parcial">Parcialmente Pagas</option>
              <option value="pendente">Não Pagas (Pendentes)</option>
              <option value="entregue">Entregue</option>
              <option value="cancelada">Canceladas</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
            >
              <option value="all">Todas as Datas</option>
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Este Mês</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <ShoppingCart className="w-12 h-12 mx-auto text-slate-300" />
            <div className="text-sm font-semibold text-slate-600">Nenhuma encomenda encontrada</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Não existem registos de encomendas que correspondam aos filtros selecionados.
            </p>
            {permissions.canCreateOrders && (
              <button
                onClick={onOpenNewOrder}
                className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Criar Primeira Encomenda</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">N.º Encomenda</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Itens</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Pago</th>
                  <th className="py-3 px-4 text-right">Dívida</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const client = clients.find((c) => c.id === order.clientId);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Order Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {order.orderNumber}
                        {order.sellerUserName && (
                          <div className="text-[10px] font-normal text-slate-400">
                            Vendedor: {order.sellerUserName}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(order.date)}
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => onSelectClient(order.clientId)}
                          className="font-bold text-slate-900 hover:text-emerald-600 transition-colors text-left flex items-center space-x-1"
                        >
                          <span>{order.clientName}</span>
                          <ArrowUpRight className="w-3 h-3 text-slate-400" />
                        </button>
                        {client?.phone && (
                          <div className="text-[10px] text-slate-400">{client.phone}</div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div 
                          className="text-slate-800 font-semibold truncate" 
                          title={order.items.map((it) => formatOrderItemLine(it)).join(' • ')}
                        >
                          {order.items.map((it) => formatOrderItemLine(it)).join(' • ')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatMT(order.totalAmount)}
                      </td>

                      {/* Paid */}
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {formatMT(order.amountPaid || 0)}
                      </td>

                      {/* Remaining Debt */}
                      <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                        {order.balanceDue > 0 ? (
                          <span className="text-rose-600">{formatMT(order.balanceDue)}</span>
                        ) : (
                          <span className="text-slate-400">0,00 MT</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          {/* View Receipt / Invoice */}
                          <button
                            onClick={() => onViewOrderReceipt(order.id)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Ver Fatura / Recibo"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Edit Order */}
                          <button
                            onClick={() => onEditOrder(order)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar Encomenda"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete Order */}
                          {permissions.canDeleteOrders && (
                            <button
                              onClick={() => setConfirmDeleteId(order.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar Encomenda"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Eliminar Encomenda?</h3>
            <p className="text-xs text-slate-500">
              Esta ação cancelará e removerá a encomenda do sistema. Os pagamentos e saldo da conta serão recalculados.
            </p>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
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
