import React, { useState, useMemo } from 'react';
import { 
  X, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone, 
  Banknote, 
  ArrowDownCircle 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentMethod, PaymentType } from '../types';
import { formatMT, getTodayDateString } from '../utils/formatters';

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedClientId?: string;
  onPaymentCreated?: (paymentId: string) => void;
}

export const NewPaymentModal: React.FC<NewPaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedClientId,
  onPaymentCreated,
}) => {
  const { clients, createPayment, getClientSummary } = useApp();

  const [clientId, setClientId] = useState<string>(preselectedClientId || (clients[0]?.id || ''));
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<PaymentMethod>('M-Pesa');
  const [type, setType] = useState<PaymentType>('Parcela da dívida');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  React.useEffect(() => {
    if (preselectedClientId) {
      setClientId(preselectedClientId);
    } else if (!clientId && clients.length > 0) {
      setClientId(clients[0].id);
    }
  }, [preselectedClientId, clients]);

  const clientSummary = useMemo(() => {
    if (!clientId) return null;
    return getClientSummary(clientId);
  }, [clientId, getClientSummary]);

  const currentDebt = clientSummary?.currentDebt || 0;
  const numAmount = typeof amount === 'number' ? amount : 0;
  const newDebtRemaining = Math.max(0, currentDebt - numAmount);
  const isCredit = numAmount > currentDebt && currentDebt > 0;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!clientId) {
      setErrorMessage('Por favor, selecione o cliente.');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setErrorMessage('Insira um valor válido maior que 0 MT.');
      return;
    }

    const created = createPayment({
      clientId,
      amount: Number(amount),
      method,
      type,
      date,
      notes: notes.trim() || undefined,
    });

    if (onPaymentCreated) {
      onPaymentCreated(created.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Registar Pagamento / Amortização
              </h2>
              <p className="text-xs text-slate-400">
                Abate direto no saldo devedor do cliente (M-Pesa, e-Mola, Caixa)
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Client select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cliente <span className="text-rose-500">*</span>
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            >
              <option value="">-- Selecione o Cliente --</option>
              {clients.map((c) => {
                const summ = getClientSummary(c.id);
                const debt = summ?.currentDebt || 0;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} — {debt > 0 ? `Dívida: ${formatMT(debt)}` : 'Sem dívida'} ({c.phone})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Current Debt Card */}
          {clientSummary && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  Dívida Atual em Aberto
                </span>
                <span
                  className={`text-lg font-extrabold ${
                    currentDebt > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {currentDebt > 0 ? formatMT(currentDebt) : '0 MT (Sem pendências)'}
                </span>
              </div>
              {currentDebt > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setAmount(currentDebt);
                    setType('Liquidação total');
                  }}
                  className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Liquidar Tudo
                </button>
              )}
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor a Pagar (MT) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Ex.: 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-300 text-slate-900 font-bold text-base rounded-xl px-3 py-2 pr-12 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                  MT
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Pagamento <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Method and Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="M-Pesa">📱 M-Pesa</option>
                <option value="e-Mola">📱 e-Mola</option>
                <option value="Numerário">💵 Numerário (Dinheiro Vivo)</option>
                <option value="Transferência Bancária">🏦 Transferência Bancária</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo do Lançamento
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PaymentType)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Parcela da dívida">Parcela da dívida</option>
                <option value="Liquidação total">Liquidação total</option>
                <option value="Pagamento de encomenda">Pagamento de encomenda</option>
                <option value="Adiantamento">Adiantamento / Saldo Credor</option>
              </select>
            </div>
          </div>

          {/* Real-time Calculation Simulation */}
          {numAmount > 0 && clientSummary && (
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-semibold text-amber-900 border-b border-amber-200/60 pb-1">
                <span>Resultado no Saldo do Cliente:</span>
                <ArrowDownCircle className="w-4 h-4 text-amber-700" />
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Dívida anterior:</span>
                <span className="font-semibold">{formatMT(currentDebt)}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700 font-medium">
                <span>Amortização com este pagamento:</span>
                <span>- {formatMT(numAmount)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-amber-200/60 text-slate-900 font-bold">
                <span>Dívida remanescente calculada:</span>
                <span className={newDebtRemaining === 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {newDebtRemaining === 0 ? '0 MT (Totalmente Paga! 🎉)' : formatMT(newDebtRemaining)}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Ref. Comprovativo
            </label>
            <input
              type="text"
              placeholder="Ex.: ID transação M-Pesa 2901923, recibo em papel, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
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
              className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl shadow-md transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Registar Pagamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
