import React, { useState } from 'react';
import { 
  DollarSign, 
  X, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  User, 
  Coins, 
  Smartphone, 
  CreditCard, 
  Building2, 
  FileSpreadsheet,
  Lock,
  History,
  Info,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatMT, formatDate } from '../utils/formatters';
import { DailyCashClosure } from '../types';

interface CashClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashClosureModal: React.FC<CashClosureModalProps> = ({ isOpen, onClose }) => {
  const { 
    getDailyCashSummary, 
    createCashClosure, 
    cashClosures, 
    deleteCashClosure, 
    clearCashClosuresHistory 
  } = useApp();
  const { currentUser, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'close' | 'history'>('close');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [initialCashFloat, setInitialCashFloat] = useState<number>(1000); // 1.000 MT fundo de trocos
  const [physicalCashCounted, setPhysicalCashCounted] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [viewingClosure, setViewingClosure] = useState<DailyCashClosure | null>(null);

  if (!isOpen) return null;

  const daySummary = getDailyCashSummary(selectedDate);
  const totalExpectedPhysicalCash = initialCashFloat + daySummary.byMethod.numerario;
  const cashDifference = physicalCashCounted - totalExpectedPhysicalCash;

  const handleConfirmClosure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    createCashClosure({
      closureDate: selectedDate,
      closedByUserId: currentUser.id,
      closedByUserName: currentUser.name,
      totalSalesDay: daySummary.totalSales,
      totalReceivedDay: daySummary.totalReceived,
      byMethod: daySummary.byMethod,
      initialCashFloat: Number(initialCashFloat) || 0,
      physicalCashCounted: Number(physicalCashCounted) || 0,
      cashDifference,
      notes,
      status: 'fechado',
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveTab('history');
    }, 1500);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Fecho de Caixa Diário (Balancete)
              </h2>
              <p className="text-xs text-slate-400">
                Conferência de entradas em Numerário, M-Pesa, e-Mola e Ponto24
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintReceipt}
              className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              title="Imprimir Balanço"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 px-5 pt-3 bg-slate-50 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('close')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'close'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Efetuar Fecho de Hoje / Data
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 border-b-2 flex items-center space-x-1 transition-colors ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico de Fechos Anteriores ({cashClosures.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
          {activeTab === 'close' ? (
            <form onSubmit={handleConfirmClosure} className="space-y-4">
              {/* Date selection and Operator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Data do Fecho de Caixa
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Operador / Responsável
                  </label>
                  <div className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentUser?.name || 'Administrador'} ({currentUser?.role})</span>
                  </div>
                </div>
              </div>

              {/* Day Totals Breakdown */}
              <div className="bg-slate-900 text-white p-4 rounded-xl shadow-inner space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400 text-xs font-medium">Movimentações de {formatDate(selectedDate)}:</span>
                  <span className="text-emerald-400 font-bold text-xs">
                    {daySummary.orderCount} Encomendas • {daySummary.paymentCount} Pagamentos
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Total Faturado no Dia:</span>
                    <span className="text-xl font-black text-white">{formatMT(daySummary.totalSales)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Total Efetivamente Recebido:</span>
                    <span className="text-xl font-black text-emerald-400">{formatMT(daySummary.totalReceived)}</span>
                  </div>
                </div>

                {/* Methods breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div className="bg-slate-800/80 p-2 rounded-lg text-center">
                    <span className="text-slate-400 block text-[10px]">Numerário (Cash)</span>
                    <span className="font-bold text-amber-400">{formatMT(daySummary.byMethod.numerario)}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg text-center">
                    <span className="text-slate-400 block text-[10px]">M-Pesa</span>
                    <span className="font-bold text-red-400">{formatMT(daySummary.byMethod.mpesa)}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg text-center">
                    <span className="text-slate-400 block text-[10px]">e-Mola</span>
                    <span className="font-bold text-orange-400">{formatMT(daySummary.byMethod.emola)}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg text-center">
                    <span className="text-slate-400 block text-[10px]">Ponto24 / POS</span>
                    <span className="font-bold text-blue-400">{formatMT(daySummary.byMethod.ponto24)}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg text-center">
                    <span className="text-slate-400 block text-[10px]">Transf. Banco</span>
                    <span className="font-bold text-teal-400">{formatMT(daySummary.byMethod.banco)}</span>
                  </div>
                </div>
              </div>

              {/* Physical cash drawer calculation */}
              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                  <Coins className="w-4 h-4 text-amber-700" />
                  <span>Conferência Física do Dinheiro em Caixa (Gaveta)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Fundo de Caixa Inicial (Trocos) (MT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={initialCashFloat}
                      onChange={(e) => setInitialCashFloat(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-500">Valor em dinheiro com que o dia abriu</span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Dinheiro Físico Contado na Gaveta (MT) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      required
                      value={physicalCashCounted}
                      onChange={(e) => setPhysicalCashCounted(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500">Total das notas e moedas apuradas</span>
                  </div>
                </div>

                {/* Calculation outcome */}
                <div className="p-3 bg-white rounded-lg border border-amber-200 flex flex-col sm:flex-row justify-between items-center gap-2">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Dinheiro Esperado na Gaveta:</span>
                    <span className="font-bold text-slate-900">
                      {formatMT(totalExpectedPhysicalCash)} (Fundo + Vendas em Numerário)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 block text-[11px]">Diferença / Balanço:</span>
                    <span
                      className={`text-sm font-black ${
                        cashDifference === 0
                          ? 'text-emerald-700'
                          : cashDifference > 0
                          ? 'text-blue-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {cashDifference === 0
                        ? '0 MT (Caixa Bateu Certo ✔)'
                        : cashDifference > 0
                        ? `+${formatMT(cashDifference)} (Sobra de Caixa)`
                        : `${formatMT(cashDifference)} (Quebra / Falta no Caixa ⚠️)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Observações do Fecho (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Turno encerrado sem incidentes, notas pequenas guardadas no cofre..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              {savedSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Fecho de Caixa registado e guardado com sucesso!</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition-colors inline-flex items-center space-x-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>Confirmar & Encerrar Caixa</span>
                </button>
              </div>
            </form>
          ) : (
            /* History of closures */
            <div className="space-y-3">
              {isAdmin && cashClosures.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Atenção: Tem certeza que deseja limpar todo o histórico de fechos de caixa? Esta ação removerá todos os registos de balancetes diários.')) {
                        clearCashClosuresHistory();
                      }
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Histórico de Fechos</span>
                  </button>
                </div>
              )}

              {cashClosures.length === 0 ? (
                <div className="text-center py-10 text-slate-400 border border-dashed border-slate-300 rounded-xl">
                  Ainda não existem fechos de caixa guardados.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {cashClosures.map((c) => (
                    <div key={c.id} className="p-3 bg-white hover:bg-slate-50 transition-colors flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-xs">
                            Fecho de {formatDate(c.closureDate)}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                            {c.closedByUserName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-3">
                          <span>Vendas: <strong className="text-slate-800">{formatMT(c.totalSalesDay)}</strong></span>
                          <span>Recebido: <strong className="text-emerald-700">{formatMT(c.totalReceivedDay)}</strong></span>
                          <span className={c.cashDifference < 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                            Dif: {c.cashDifference === 0 ? 'Certo' : formatMT(c.cashDifference)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            window.print();
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir</span>
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Deseja eliminar o registo de fecho de caixa de ${formatDate(c.closureDate)}?`)) {
                                deleteCashClosure(c.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar este fecho de caixa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
