import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  PlusCircle, 
  Phone, 
  MapPin, 
  CreditCard, 
  ShoppingCart, 
  FileText, 
  AlertTriangle,
  ArrowUpDown,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatMT, formatDate } from '../utils/formatters';

interface ClientsViewProps {
  onOpenNewClient: () => void;
  onSelectClient: (clientId: string) => void;
  onNewOrderForClient: (clientId: string) => void;
  onNewPaymentForClient: (clientId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onOpenNewClient,
  onSelectClient,
  onNewOrderForClient,
  onNewPaymentForClient,
}) => {
  const { clients, clientSummaries, orders, deleteClient } = useApp();
  const { permissions } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debtors' | 'overdue' | 'cleared'>('all');
  const [sortBy, setSortBy] = useState<'debt' | 'purchases' | 'name'>('debt');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getClientDebtDueDateInfo = (clientId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const pendingOrders = orders.filter(
      (o) => o.clientId === clientId && (o.status === 'pendente' || o.status === 'parcial') && o.dueDate
    );
    if (pendingOrders.length === 0) return null;

    const sorted = [...pendingOrders].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    const earliest = sorted[0];
    if (!earliest.dueDate) return null;

    const isOverdue = earliest.dueDate < today;
    const diffDays = Math.round(
      (new Date(today).getTime() - new Date(earliest.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      dueDate: earliest.dueDate,
      isOverdue,
      diffDays: Math.abs(diffDays),
      orderNumber: earliest.orderNumber,
    };
  };

  const handleSendWhatsAppReminder = (clientName: string, contact?: string, debtAmount?: number, dueDateInfo?: any) => {
    const cleanPhone = contact?.replace(/\D/g, '') || '';
    const formattedPhone = cleanPhone.length === 9 ? `258${cleanPhone}` : cleanPhone;
    
    let prazoText = '';
    if (dueDateInfo?.dueDate) {
      prazoText = dueDateInfo.isOverdue
        ? `\n⚠️ *Aviso de Vencimento:* O prazo acordado venceu a ${formatDate(dueDateInfo.dueDate)} (${dueDateInfo.diffDays} dias de atraso).`
        : `\n📅 *Prazo Acordado:* ${formatDate(dueDateInfo.dueDate)}.`;
    }

    const msg = `*LEMBRETE DE PAGAMENTO PENDENTE*
Olá Sr(a). *${clientName}*,
Esperamos que se encontre bem. Entramos em contacto para informar que tem um saldo pendente de *${formatMT(debtAmount || 0)}* na sua conta de cliente.${prazoText}

Pode regularizar via M-Pesa, e-Mola ou diretamente no nosso balcão.
Muito obrigado pela preferência e cooperação!`;

    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const filteredClients = useMemo(() => {
    return clientSummaries
      .filter((s) => {
        const matchSearch =
          s.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.client.phone.includes(searchTerm) ||
          s.client.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.client.code.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchSearch) return false;

        if (filterType === 'debtors') return s.currentDebt > 0;
        if (filterType === 'overdue') {
          return s.currentDebt > 0 && getClientDebtDueDateInfo(s.client.id)?.isOverdue;
        }
        if (filterType === 'cleared') return s.currentDebt <= 0;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'debt') return b.currentDebt - a.currentDebt;
        if (sortBy === 'purchases') return b.totalPurchased - a.totalPurchased;
        return a.client.name.localeCompare(b.client.name);
      });
  }, [clientSummaries, orders, searchTerm, filterType, sortBy]);

  const handleDelete = (id: string) => {
    deleteClient(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-black text-slate-900">
              Gestão de Clientes & Saldos
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Conta corrente de cada cliente com controlo de dívidas cumulativas e histórico
          </p>
        </div>

        {permissions.canManageClients && (
          <button
            onClick={onOpenNewClient}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-700/20 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Novo Cliente</span>
          </button>
        )}
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome, telefone (+258), localização..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
          >
            <option value="all">Todos os Clientes ({clients.length})</option>
            <option value="debtors">Apenas com Dívida</option>
            <option value="overdue">🚨 Prazos Vencidos (Urgente)</option>
            <option value="cleared">Sem Dívida / Liquidado</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="debt">Ordenar por Maior Dívida</option>
            <option value="purchases">Ordenar por Maior Volume Comprado</option>
            <option value="name">Ordenar por Nome (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            Nenhum cliente corresponde aos critérios de pesquisa.
          </div>
        ) : (
          filteredClients.map((s) => {
            const hasDebt = s.currentDebt > 0;
            const debtDueDateInfo = hasDebt ? getClientDebtDueDateInfo(s.client.id) : null;

            return (
              <div
                key={s.client.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold border border-purple-100">
                        {s.client.code}
                      </span>
                      <h3
                        onClick={() => onSelectClient(s.client.id)}
                        className="text-sm font-bold text-slate-900 hover:text-purple-600 transition-colors cursor-pointer mt-1"
                      >
                        {s.client.name}
                      </h3>
                    </div>

                    {permissions.canDeleteClients && (
                      <button
                        onClick={() => setConfirmDeleteId(s.client.id)}
                        className="text-slate-300 hover:text-rose-500 p-1"
                        title="Eliminar Cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Phone & Location */}
                  <div className="space-y-1 my-3 text-xs text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{s.client.phone || 'Sem telefone'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{s.client.location || 'Sem localização'}</span>
                    </div>
                  </div>

                  {/* Financial Balance Summary */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs mb-3">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Comprado:</span>
                      <span className="font-semibold text-slate-900">{formatMT(s.totalPurchased)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Pago:</span>
                      <span className="font-semibold text-emerald-700">{formatMT(s.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                      <span className="font-bold text-slate-700">Saldo Devedor:</span>
                      <span
                        className={`font-black text-sm ${
                          hasDebt ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {hasDebt ? formatMT(s.currentDebt) : '0 MT (Sem dívida)'}
                      </span>
                    </div>

                    {/* Due date badge */}
                    {debtDueDateInfo && (
                      <div className="pt-1.5 border-t border-slate-200">
                        {debtDueDateInfo.isOverdue ? (
                          <div className="flex items-center space-x-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
                            <span>🚨 Vencido há {debtDueDateInfo.diffDays} dias ({formatDate(debtDueDateInfo.dueDate)})</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                            <span>📅 Vence a {formatDate(debtDueDateInfo.dueDate)} ({debtDueDateInfo.diffDays} dias)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                  <button
                    onClick={() => onSelectClient(s.client.id)}
                    className="flex-1 inline-flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ficha / Extrato</span>
                  </button>

                  {hasDebt && (
                    <button
                      onClick={() => handleSendWhatsAppReminder(s.client.name, s.client.phone, s.currentDebt, debtDueDateInfo)}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-xs"
                      title="Enviar Lembrete de Cobrança no WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onNewOrderForClient(s.client.id)}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                    title="Nova Encomenda"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onNewPaymentForClient(s.client.id)}
                    className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors"
                    title="Registar Pagamento"
                  >
                    <CreditCard className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Eliminar Cliente?</h3>
            <p className="text-xs text-slate-500">
              Tem a certeza que pretende remover este cliente? Os registos associados de encomendas continuarão no histórico geral.
            </p>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
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
