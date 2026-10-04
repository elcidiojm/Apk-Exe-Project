import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  PlusCircle, 
  Trash2, 
  Eye, 
  AlertCircle,
  Smartphone,
  Banknote,
  Building2,
  DollarSign
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PaymentMethod } from '../types';
import { formatMT, formatDate } from '../utils/formatters';

interface PaymentsViewProps {
  onOpenNewPayment: () => void;
  onSelectClient: (clientId: string) => void;
  onViewPaymentReceipt: (paymentId: string) => void;
  onOpenCashClosure?: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  onOpenNewPayment,
  onSelectClient,
  onViewPaymentReceipt,
  onOpenCashClosure,
}) => {
  const { payments, totalReceived, deletePayment } = useApp();
  const { permissions } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.orderNumber && p.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchMethod = methodFilter === 'all' || p.method === methodFilter;

      return matchSearch && matchMethod;
    });
  }, [payments, searchTerm, methodFilter]);

  const handleDelete = (id: string) => {
    deletePayment(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-black text-slate-900">
              Registo de Pagamentos & Amortizações
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Recebido em Caixa: <span className="font-bold text-emerald-600">{formatMT(totalReceived)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onOpenCashClosure && (
            <button
              onClick={onOpenCashClosure}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Fecho de Caixa Diário</span>
            </button>
          )}

          {permissions.canRegisterPayments && (
            <button
              onClick={onOpenNewPayment}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-900 rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Novo Pagamento</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por cliente, recibo (REC-0001) ou encomenda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">Todas as Formas de Pagamento</option>
            <option value="M-Pesa">M-Pesa</option>
            <option value="e-Mola">e-Mola</option>
            <option value="Numerário">Numerário (Dinheiro)</option>
            <option value="Transferência Bancária">Transferência Bancária</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Nenhum pagamento registado com os critérios selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3 text-left">Nº Recibo</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Forma de Pagamento</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Ref. Encomenda</th>
                  <th className="px-4 py-3 text-right">Valor Pago</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {pay.receiptNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {formatDate(pay.date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-900">
                      <button
                        onClick={() => onSelectClient(pay.clientId)}
                        className="hover:text-amber-600 hover:underline text-left"
                      >
                        {pay.clientName}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                          pay.method === 'M-Pesa'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : pay.method === 'e-Mola'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : pay.method === 'Numerário'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        <span>{pay.method}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      <span className="text-[11px] text-slate-600 font-medium">
                        {pay.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {pay.orderNumber || 'Amortização Geral'}
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-emerald-700 whitespace-nowrap text-sm">
                      {formatMT(pay.amount)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onViewPaymentReceipt(pay.id)}
                          className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Ver Recibo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {permissions.canDeletePayments && (
                          <button
                            onClick={() => setConfirmDeleteId(pay.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar Pagamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Eliminar Pagamento?</h3>
            <p className="text-xs text-slate-500">
              Tem a certeza que pretende remover este registo de pagamento? O saldo do cliente será recalculado automaticamente.
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
