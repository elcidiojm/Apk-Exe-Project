import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Plus, 
  Search, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  UserCheck, 
  Calendar, 
  Printer, 
  Download, 
  Receipt,
  TrendingUp,
  Percent,
  Sliders,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { CommissionPayment, PaymentMethod } from '../../types';
import { formatMT } from '../../utils/formatters';

export const CommissionsView: React.FC = () => {
  const { 
    commissionPayments, 
    createCommissionPayment, 
    deleteCommissionPayment,
    clearCommissionPaymentsHistory,
    orders 
  } = useApp();
  const { users, isAdmin, currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'history'>('employees');

  // Custom commission rates per user ID (defaults to 3% if not set)
  const [commissionRates, setCommissionRates] = useState<Record<string, number>>({
    'u-admin': 3,
    'u-vendedor': 4,
    'u-vendedor-2': 3.5,
  });

  // Modal Novo Pagamento de Comissão
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    userId: '',
    amount: 0,
    period: `${new Date().toLocaleString('pt-MZ', { month: 'long' })} ${new Date().getFullYear()}`,
    paymentMethod: 'M-Pesa' as PaymentMethod,
    notes: '',
  });

  // Voucher to print
  const [selectedVoucher, setSelectedVoucher] = useState<CommissionPayment | null>(null);

  // Calculate Employee Metrics
  const employeeMetrics = useMemo(() => {
    return users.map((user) => {
      // Find orders created by this user or matching their name
      const userOrders = orders.filter((o) => {
        if (o.status === 'cancelada') return false;
        return (
          o.createdBy === user.name ||
          o.createdBy === user.email ||
          (user.role === 'admin' && (!o.createdBy || o.createdBy === 'Admin'))
        );
      });

      const totalSales = userOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const ordersCount = userOrders.length;

      const rate = commissionRates[user.id] ?? 3.0; // Default 3%
      const totalEarned = (totalSales * rate) / 100;

      // Payments already made to this user
      const userPayments = commissionPayments.filter((p) => p.userId === user.id);
      const totalPaid = userPayments.reduce((sum, p) => sum + p.amount, 0);
      const balanceDue = Math.max(0, totalEarned - totalPaid);

      return {
        user,
        ordersCount,
        totalSales,
        rate,
        totalEarned,
        totalPaid,
        balanceDue,
      };
    });
  }, [users, orders, commissionPayments, commissionRates]);

  // General KPIs
  const stats = useMemo(() => {
    const totalCommissionsEarned = employeeMetrics.reduce((s, m) => s + m.totalEarned, 0);
    const totalCommissionsPaid = employeeMetrics.reduce((s, m) => s + m.totalPaid, 0);
    const totalPending = employeeMetrics.reduce((s, m) => s + m.balanceDue, 0);

    const topPerformer = [...employeeMetrics].sort((a, b) => b.totalSales - a.totalSales)[0];

    return {
      totalCommissionsEarned,
      totalCommissionsPaid,
      totalPending,
      topPerformer: topPerformer?.totalSales > 0 ? topPerformer : null,
    };
  }, [employeeMetrics]);

  // Filtered List
  const filteredEmployees = useMemo(() => {
    return employeeMetrics.filter((m) => {
      return (
        m.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [employeeMetrics, searchTerm]);

  // Handle Save Payment
  const handleSaveCommissionPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.userId) {
      alert('Selecione o funcionário');
      return;
    }
    if (paymentForm.amount <= 0) {
      alert('O valor da comissão deve ser superior a zero');
      return;
    }

    const targetUser = users.find((u) => u.id === paymentForm.userId);
    if (!targetUser) return;

    const newPayment = createCommissionPayment({
      userId: targetUser.id,
      userName: targetUser.name,
      amount: Number(paymentForm.amount),
      period: paymentForm.period,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: paymentForm.paymentMethod,
      notes: paymentForm.notes.trim() || undefined,
      processedBy: currentUser?.name || 'Admin',
    });

    setIsNewPaymentModalOpen(false);
    setPaymentForm({
      userId: '',
      amount: 0,
      period: `${new Date().toLocaleString('pt-MZ', { month: 'long' })} ${new Date().getFullYear()}`,
      paymentMethod: 'M-Pesa',
      notes: '',
    });
    setSelectedVoucher(newPayment);
  };

  const handleUpdateRate = (userId: string, newRate: number) => {
    setCommissionRates((prev) => ({
      ...prev,
      [userId]: Math.max(0, Math.min(100, newRate)),
    }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Comissões de Funcionários (ERP)</h1>
            <p className="text-sm text-slate-500">
              Cálculo automático de comissões por vendas concluídas, taxas parametrizadas e emissão de recibos de liquidação
            </p>
          </div>
        </div>

        <button
          id="btn-pay-commission"
          onClick={() => setIsNewPaymentModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Registar Pagamento de Comissão</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Comissões Geradas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatMT(stats.totalCommissionsEarned)}</div>
          <div className="text-xs text-slate-500 mt-1">Acumulado pelo desempenho de vendas</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comissões Pagas</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{formatMT(stats.totalCommissionsPaid)}</div>
          <div className="text-xs text-slate-500 mt-1">{commissionPayments.length} pagamentos efetuados</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Pendente a Pagar</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{formatMT(stats.totalPending)}</div>
          <div className="text-xs text-slate-500 mt-1">A liquidar à equipa comercial</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Maior Faturador</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2 truncate">
            {stats.topPerformer ? stats.topPerformer.user.name : 'N/A'}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            {stats.topPerformer ? `${formatMT(stats.topPerformer.totalSales)} em vendas` : 'Sem vendas ainda'}
          </div>
        </div>
      </div>

      {/* Subtabs and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('employees')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'employees'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👥 Mapa de Vendas & Comissões da Equipa
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'history'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Recibos de Pagamento Emitidos ({commissionPayments.length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar funcionário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* SUBTAB 1: EMPLOYEES COMMISSIONS MATRIX */}
      {activeSubTab === 'employees' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <th className="py-3 px-4">Funcionário</th>
                  <th className="py-3 px-4">Função</th>
                  <th className="py-3 px-4 text-center">Vendas Fechadas</th>
                  <th className="py-3 px-4 text-right">Volume Faturado</th>
                  <th className="py-3 px-4 text-center">Taxa Comissão (%)</th>
                  <th className="py-3 px-4 text-right">Comissão Ganha</th>
                  <th className="py-3 px-4 text-right">Comissão Paga</th>
                  <th className="py-3 px-4 text-right font-bold text-amber-700">Saldo a Pagar</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((m) => (
                  <tr key={m.user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{m.user.name}</span>
                      <span className="text-[10px] text-slate-400 block">{m.user.email}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                        {m.user.role === 'admin'
                          ? 'Administrador'
                          : m.user.role === 'vendedor'
                          ? 'Vendedor'
                          : 'Operador'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {m.ordersCount} vendas
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {formatMT(m.totalSales)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isAdmin ? (
                        <div className="inline-flex items-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            value={m.rate}
                            onChange={(e) => handleUpdateRate(m.user.id, Number(e.target.value))}
                            className="w-14 px-1.5 py-0.5 border border-slate-300 rounded text-center font-bold text-emerald-700 text-xs"
                          />
                          <span className="text-slate-400 font-bold">%</span>
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-700">{m.rate}%</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatMT(m.totalEarned)}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-600 font-medium">
                      {formatMT(m.totalPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {m.balanceDue > 0 ? (
                        <span className="text-amber-600">{formatMT(m.balanceDue)}</span>
                      ) : (
                        <span className="text-slate-400">Liquidado</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setPaymentForm({
                            userId: m.user.id,
                            amount: m.balanceDue > 0 ? m.balanceDue : m.totalEarned,
                            period: `${new Date().toLocaleString('pt-MZ', { month: 'long' })} ${new Date().getFullYear()}`,
                            paymentMethod: 'M-Pesa',
                            notes: `Comissão relativa ao período de ${new Date().toLocaleString('pt-MZ', { month: 'long' })}`,
                          });
                          setIsNewPaymentModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                      >
                        Pagar Comissão
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* SUBTAB 2: PAYMENT VOUCHERS HISTORY */
        <div className="space-y-3">
          {isAdmin && commissionPayments.length > 0 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Atenção: Tem certeza que deseja limpar todo o histórico de pagamentos de comissão?')) {
                    clearCommissionPaymentsHistory();
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Histórico de Pagamentos</span>
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <th className="py-3 px-4">Nº Comprovativo</th>
                    <th className="py-3 px-4">Beneficiário</th>
                    <th className="py-3 px-4">Período / Referência</th>
                    <th className="py-3 px-4">Data Pagamento</th>
                    <th className="py-3 px-4">Forma de Pagamento</th>
                    <th className="py-3 px-4 text-right">Valor Pago</th>
                    <th className="py-3 px-4">Processado por</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissionPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Nenhum pagamento de comissão registado até o momento.
                      </td>
                    </tr>
                  ) : (
                    commissionPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {p.paymentNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {p.userName}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {p.period}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {p.paymentDate}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {formatMT(p.amount)}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {p.processedBy || 'Admin'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => setSelectedVoucher(p)}
                              className="px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md"
                            >
                              Ver Recibo
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => {
                                  if (confirm(`Deseja apagar o registo de pagamento ${p.paymentNumber}?`)) {
                                    deleteCommissionPayment(p.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Eliminar este pagamento de comissão"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* ========================================== */}
      {/* MODAL: REGISTAR PAGAMENTO DE COMISSÃO */}
      {/* ========================================== */}
      {isNewPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Registar Pagamento de Comissão</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Emita a liquidação de comissões auferidas pelo vendedor ou colaborador
            </p>

            <form onSubmit={handleSaveCommissionPayment} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Colaborador / Vendedor *</label>
                <select
                  required
                  value={paymentForm.userId}
                  onChange={(e) => {
                    const uId = e.target.value;
                    const emp = employeeMetrics.find((m) => m.user.id === uId);
                    setPaymentForm({
                      ...paymentForm,
                      userId: uId,
                      amount: emp ? (emp.balanceDue > 0 ? emp.balanceDue : emp.totalEarned) : 0,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Selecione o Colaborador...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor a Pagar (MT) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={paymentForm.amount || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Forma de Pagamento *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="E-Mola">E-Mola</option>
                    <option value="Numerário">Numerário / Dinheiro</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Ponto24 / POS">Ponto24 / POS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mês / Período de Referência *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Março 2026"
                  value={paymentForm.period}
                  onChange={(e) => setPaymentForm({ ...paymentForm, period: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notas / Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Quitação total de comissões do trimestre"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPaymentModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: RECIBO DE PAGAMENTO DE COMISSÃO */}
      {/* ========================================== */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Recibo de Pagamento de Comissão</h3>
                <span className="font-mono text-xs text-emerald-700 font-bold">{selectedVoucher.paymentNumber}</span>
              </div>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs mb-5">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Beneficiário:</span>
                <span className="font-bold text-slate-900">{selectedVoucher.userName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Período Referência:</span>
                <span className="font-semibold text-slate-800">{selectedVoucher.period}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Data de Liquidação:</span>
                <span className="text-slate-800">{selectedVoucher.paymentDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Método de Pagamento:</span>
                <span className="font-semibold text-slate-800">{selectedVoucher.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 text-sm">
                <span className="font-bold text-slate-900">VALOR PAGO:</span>
                <span className="font-black text-emerald-600 text-base">{formatMT(selectedVoucher.amount)}</span>
              </div>
              {selectedVoucher.notes && (
                <div className="pt-2 text-slate-500 italic">
                  Obs: {selectedVoucher.notes}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
