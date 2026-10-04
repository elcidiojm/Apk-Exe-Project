import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  ShoppingCart, 
  Share2, 
  Check, 
  Printer, 
  PlusCircle, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client } from '../types';
import { formatMT, formatDate } from '../utils/formatters';

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onNewOrderForClient: (clientId: string) => void;
  onNewPaymentForClient: (clientId: string) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  isOpen,
  onClose,
  onNewOrderForClient,
  onNewPaymentForClient,
}) => {
  const { orders, payments, getClientSummary } = useApp();
  const [copiedMessage, setCopiedMessage] = useState(false);

  if (!isOpen || !client) return null;

  const summary = getClientSummary(client.id);
  const clientOrders = orders.filter((o) => o.clientId === client.id);
  const clientPayments = payments.filter((p) => p.clientId === client.id);

  // Build unified chronological ledger (Extrato da Conta Corrente)
  interface LedgerEntry {
    date: string;
    id: string;
    type: 'order' | 'payment';
    title: string;
    description: string;
    debit: number; // Order amount (+)
    credit: number; // Payment amount (-)
    balanceAfter: number;
    rawObj: any;
  }

  const rawEntries: { date: string; type: 'order' | 'payment'; obj: any }[] = [
    ...clientOrders.map((o) => ({ date: o.date, type: 'order' as const, obj: o })),
    ...clientPayments.map((p) => ({ date: p.date, type: 'payment' as const, obj: p })),
  ];

  // Sort ascending by date for cumulative running balance calculation
  rawEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningDebt = 0;
  const chronologicalLedger: LedgerEntry[] = rawEntries.map((entry) => {
    if (entry.type === 'order') {
      const order = entry.obj;
      const debit = order.totalAmount;
      runningDebt += debit;
      return {
        date: order.date,
        id: order.id,
        type: 'order',
        title: `Encomenda ${order.orderNumber}`,
        description: order.items.map((i: any) => `${i.quantity}x ${i.productName}`).join(', '),
        debit,
        credit: 0,
        balanceAfter: runningDebt,
        rawObj: order,
      };
    } else {
      const payment = entry.obj;
      const credit = payment.amount;
      runningDebt -= credit;
      return {
        date: payment.date,
        id: payment.id,
        type: 'payment',
        title: `Pagamento ${payment.receiptNumber} (${payment.method})`,
        description: payment.notes || payment.type,
        debit: 0,
        credit,
        balanceAfter: runningDebt,
        rawObj: payment,
      };
    }
  });

  // Display latest first
  const displayLedger = [...chronologicalLedger].reverse();

  // Format WhatsApp message to send to client
  const generateWhatsAppText = () => {
    const debtStr = (summary?.currentDebt || 0) > 0 ? formatMT(summary!.currentDebt) : '0 MT (Sem dívida)';
    let msg = `*EXTRATO DE CONTA - GESTÃO DE ENCOMENDAS*\n`;
    msg += `Cliente: *${client.name}*\n`;
    msg += `Contacto: ${client.phone}\n`;
    msg += `Data: ${new Date().toLocaleDateString('pt-MZ')}\n\n`;
    msg += `*RESUMO FINANCEIRO:*\n`;
    msg += `• Total Encomendado: ${formatMT(summary?.totalPurchased || 0)}\n`;
    msg += `• Total Pago/Amortizado: ${formatMT(summary?.totalPaid || 0)}\n`;
    msg += `• *SALDO EM DÍVIDA ATUAL: ${debtStr}*\n\n`;
    msg += `*ÚLTIMOS MOVIMENTOS:*\n`;
    chronologicalLedger.slice(-4).forEach((item) => {
      if (item.type === 'order') {
        msg += `📦 ${formatDate(item.date)}: ${item.title} (+${formatMT(item.debit)})\n`;
      } else {
        msg += `💵 ${formatDate(item.date)}: ${item.title} (-${formatMT(item.credit)})\n`;
      }
    });
    msg += `\n_Para pagamentos via M-Pesa ou e-Mola, favor contactar._ Obrigado pela preferência!`;
    return msg;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateWhatsAppText());
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">{client.name}</h2>
                <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {client.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center space-x-3 mt-0.5">
                <span className="flex items-center space-x-1">
                  <Phone className="w-3 h-3" />
                  <span>{client.phone}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{client.location || 'Sem localização'}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Imprimir Ficha"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Top Cards: Total Comprado, Total Pago, Dívida Atual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Total Comprado</span>
                <ShoppingCart className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-lg font-bold text-slate-900">
                {formatMT(summary?.totalPurchased || 0)}
              </div>
              <span className="text-[10px] text-slate-500">
                {summary?.orderCount || 0} encomendas registadas
              </span>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-xs text-emerald-700 mb-1">
                <span>Total Já Pago</span>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-emerald-800">
                {formatMT(summary?.totalPaid || 0)}
              </div>
              <span className="text-[10px] text-emerald-600">
                {summary?.paymentCount || 0} pagamentos / amortizações
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                (summary?.currentDebt || 0) > 0
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                <span>Saldo em Dívida Atual</span>
                {(summary?.currentDebt || 0) > 0 && (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                )}
              </div>
              <div
                className={`text-xl font-extrabold ${
                  (summary?.currentDebt || 0) > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {(summary?.currentDebt || 0) > 0
                  ? formatMT(summary!.currentDebt)
                  : '0 MT (Regularizado)'}
              </div>
              <span className="text-[10px] opacity-80">
                {(summary?.currentDebt || 0) > 0
                  ? 'Pode ser abatido em parcelas'
                  : 'Conta sem pendências financeiras'}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-100/70 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNewOrderForClient(client.id)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Nova Encomenda para {client.name.split(' ')[0]}</span>
              </button>
              <button
                onClick={() => onNewPaymentForClient(client.id)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-lg text-xs font-semibold shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>+ Registar Pagamento</span>
              </button>
            </div>

            <button
              onClick={copyToClipboard}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              {copiedMessage ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copiado para WhatsApp!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar Extrato p/ WhatsApp</span>
                </>
              )}
            </button>
          </div>

          {/* Chronological Account Ledger (Extrato da Conta Corrente) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Extrato Detalhado da Conta Corrente (Movimentos)</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                {chronologicalLedger.length} movimentações no histórico
              </span>
            </div>

            {displayLedger.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-300">
                Nenhuma encomenda ou pagamento registado para este cliente ainda.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2.5 text-left">Data</th>
                      <th className="px-3 py-2.5 text-left">Tipo & Referência</th>
                      <th className="px-3 py-2.5 text-left">Detalhes / Itens</th>
                      <th className="px-3 py-2.5 text-right text-rose-700">Débito (+)</th>
                      <th className="px-3 py-2.5 text-right text-emerald-700">Crédito (-)</th>
                      <th className="px-3 py-2.5 text-right">Saldo Devedor Acumulado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {displayLedger.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-600 font-medium">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              item.type === 'order'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {item.title}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 max-w-xs truncate">
                          {item.description}
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold text-rose-600">
                          {item.debit > 0 ? `+${formatMT(item.debit)}` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold text-emerald-600">
                          {item.credit > 0 ? `-${formatMT(item.credit)}` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap font-bold text-slate-900">
                          <span
                            className={
                              item.balanceAfter > 0
                                ? 'text-rose-600'
                                : item.balanceAfter < 0
                                ? 'text-emerald-600'
                                : 'text-slate-600'
                            }
                          >
                            {formatMT(item.balanceAfter)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
