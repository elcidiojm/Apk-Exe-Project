import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Trash2, 
  Tag, 
  CreditCard,
  Building,
  TrendingDown,
  PieChart,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { formatMT } from '../../utils/formatters';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Renda/Instalações',
  'Salários & Comissões',
  'Eletricidade/EDM',
  'Água',
  'Internet & Comunicação',
  'Transporte & Combustível',
  'Fornecedores/Mercadoria',
  'Manutenção & Equipamento',
  'Impostos & Taxas',
  'Outros',
];

export const ExpensesView: React.FC = () => {
  const { 
    expenses, 
    createExpense, 
    updateExpense, 
    deleteExpense, 
    markExpensePaid,
    clearExpensesHistory
  } = useApp();
  const { isAdmin, currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Modal Novo Registo de Despesa
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Energia & Água' as ExpenseCategory,
    amount: 0,
    dueDate: new Date().toISOString().slice(0, 10),
    beneficiary: '',
    notes: '',
    isPaidImmediately: false,
    paymentMethod: 'Numerário' as PaymentMethod,
  });

  // Modal Liquidar Despesa
  const [liquidatingExpense, setLiquidatingExpense] = useState<Expense | null>(null);
  const [liquidateMethod, setLiquidateMethod] = useState<PaymentMethod>('Numerário');

  const todayStr = new Date().toISOString().slice(0, 10);

  // Financial Stats
  const stats = useMemo(() => {
    const totalPaid = expenses
      .filter((e) => e.status === 'paga')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalPending = expenses
      .filter((e) => e.status === 'pendente')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalOverdue = expenses
      .filter((e) => e.status === 'pendente' && e.dueDate && e.dueDate < todayStr)
      .reduce((sum, e) => sum + e.amount, 0);

    const thisMonthStr = todayStr.slice(0, 7);
    const thisMonthTotal = expenses
      .filter((e) => e.date.startsWith(thisMonthStr))
      .reduce((sum, e) => sum + e.amount, 0);

    // Grouping by Category
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    return {
      totalPaid,
      totalPending,
      totalOverdue,
      thisMonthTotal,
      categoryTotals,
    };
  }, [expenses, todayStr]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const expTitle = e.title || e.description || '';
      const expNum = e.expenseNumber || '';
      const expBeneficiary = e.beneficiary || '';
      const expNotes = e.notes || '';

      const matchSearch =
        expTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expBeneficiary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expNotes.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory =
        categoryFilter === 'todos' || e.category === categoryFilter;

      const matchStatus =
        statusFilter === 'todos' || e.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [expenses, searchTerm, categoryFilter, statusFilter]);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title.trim()) {
      alert('Por favor insira a descrição da despesa');
      return;
    }
    if (expenseForm.amount <= 0) {
      alert('O valor da despesa deve ser superior a zero');
      return;
    }

    createExpense({
      title: expenseForm.title.trim(),
      description: expenseForm.title.trim(),
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      date: todayStr,
      dueDate: expenseForm.dueDate || undefined,
      status: expenseForm.isPaidImmediately ? 'paga' : 'pendente',
      paidAt: expenseForm.isPaidImmediately ? todayStr : undefined,
      paymentMethod: expenseForm.isPaidImmediately ? expenseForm.paymentMethod : undefined,
      beneficiary: expenseForm.beneficiary.trim() || undefined,
      notes: expenseForm.notes.trim() || undefined,
      createdBy: currentUser?.name || 'Admin',
    });

    setExpenseForm({
      title: '',
      category: 'Energia & Água',
      amount: 0,
      dueDate: todayStr,
      beneficiary: '',
      notes: '',
      isPaidImmediately: false,
      paymentMethod: 'Numerário',
    });
    setIsNewExpenseModalOpen(false);
  };

  const handleConfirmLiquidate = () => {
    if (!liquidatingExpense) return;
    markExpensePaid(liquidatingExpense.id, liquidateMethod);
    setLiquidatingExpense(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Despesas & Contas a Pagar (ERP)</h1>
            <p className="text-sm text-slate-500">
              Controlo rigoroso de custos operacionais, salários, aluguer e obrigações financeiras da empresa
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin && expenses.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Deseja limpar do histórico todas as despesas que já foram pagas/liquidadas?')) {
                  clearExpensesHistory('paid');
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 transition-colors"
              title="Limpar apenas registos de despesas já liquidadas"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Limpar Pagas</span>
            </button>
          )}

          <button
            id="btn-new-expense"
            onClick={() => setIsNewExpenseModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-sm shadow-amber-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Nova Despesa</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Despesas Liquidadas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{formatMT(stats.totalPaid)}</div>
          <div className="text-xs text-slate-500 mt-1">Total efetivamente pago</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contas a Pagar Pendentes</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{formatMT(stats.totalPending)}</div>
          <div className="text-xs text-slate-500 mt-1">Obrigações em aberto</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Despesas Vencidas</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{formatMT(stats.totalOverdue)}</div>
          <div className="text-xs text-rose-500 mt-1">Passou a data limite de pagamento</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Despesas Deste Mês</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatMT(stats.thisMonthTotal)}</div>
          <div className="text-xs text-slate-500 mt-1">Compromissos do mês corrente</div>
        </div>
      </div>

      {/* Category Breakdown Chips */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
          Distribuição de Custos por Categoria
        </span>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.categoryTotals).map(([cat, total]) => (
            <div
              key={cat}
              className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
            >
              <span className="text-slate-600">{cat}:</span>
              <span className="font-bold text-slate-900">{formatMT(Number(total))}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por título, nº, beneficiário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="todos">Todas as Categorias</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="todos">Todos os Estados</option>
            <option value="paga">Pagas / Liquidadas</option>
            <option value="pendente">Pendentes a Pagar</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Nº Despesa</th>
                <th className="py-3.5 px-4">Descrição</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Beneficiário / Fornecedor</th>
                <th className="py-3.5 px-4">Data Vencimento</th>
                <th className="py-3.5 px-4 text-right">Valor (MT)</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhuma despesa registada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const isPaid = exp.status === 'paga';
                  const isOverdue = !isPaid && exp.dueDate && exp.dueDate < todayStr;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-700 text-xs">
                        {exp.expenseNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{exp.title || exp.description || 'Despesa'}</span>
                        {exp.notes && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                            {exp.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {exp.beneficiary || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {exp.dueDate ? (
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            {exp.dueDate}
                            {isOverdue && ' (Vencida!)'}
                          </span>
                        ) : (
                          <span className="text-slate-400">Sem data limite</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatMT(exp.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isOverdue
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isPaid ? 'Paga' : isOverdue ? 'Atrasada' : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {!isPaid && (
                            <button
                              onClick={() => {
                                setLiquidatingExpense(exp);
                                setLiquidateMethod('Numerário');
                              }}
                              className="px-2 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors"
                            >
                              Liquidar
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja apagar a despesa ${exp.title || exp.description || exp.expenseNumber}?`)) {
                                  deleteExpense(exp.id);
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
      {/* MODAL: NOVA DESPESA */}
      {/* ========================================== */}
      {isNewExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-amber-600" />
              <span>Registar Despesa / Conta a Pagar</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Lançamento de custos operacionais da empresa com vencimento e comprovativos
            </p>

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição da Despesa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pagamento Renda Loja Central (Mês Corrente)"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor (MT) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={expenseForm.amount || ''}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data Limite / Vencimento
                  </label>
                  <input
                    type="date"
                    value={expenseForm.dueDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Beneficiário / Entidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: EDM, Vodacom, Senhorio"
                    value={expenseForm.beneficiary}
                    onChange={(e) => setExpenseForm({ ...expenseForm, beneficiary: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações</label>
                <input
                  type="text"
                  placeholder="Notas adicionais, nº de referência..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Instant Payment Option */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expenseForm.isPaidImmediately}
                    onChange={(e) => setExpenseForm({ ...expenseForm, isPaidImmediately: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Marcar como paga imediatamente neste momento
                  </span>
                </label>

                {expenseForm.isPaidImmediately && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Método Utilizado para Pagamento
                    </label>
                    <select
                      value={expenseForm.paymentMethod}
                      onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as PaymentMethod })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="Numerário">Numerário / Dinheiro</option>
                      <option value="Transferência Bancária">Transferência Bancária</option>
                      <option value="M-Pesa">M-Pesa</option>
                      <option value="E-Mola">E-Mola</option>
                      <option value="Ponto24 / POS">Ponto24 / POS Cartão</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewExpenseModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 rounded-lg shadow-sm"
                >
                  Registar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: LIQUIDAR DESPESA PENDENTE */}
      {/* ========================================== */}
      {liquidatingExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Confirmar Liquidação de Despesa</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Registar quitação da despesa {liquidatingExpense.expenseNumber} ({liquidatingExpense.title || liquidatingExpense.description || 'Despesa'})
            </p>

            <div className="p-3 bg-slate-50 rounded-xl mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Valor a Liquidar:</span>
                <span className="font-bold text-slate-900 text-sm">{formatMT(liquidatingExpense.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiário:</span>
                <span className="text-slate-700 font-medium">{liquidatingExpense.beneficiary || 'Geral'}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Método de Pagamento</label>
                <select
                  value={liquidateMethod}
                  onChange={(e) => setLiquidateMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="Numerário">Numerário / Dinheiro</option>
                  <option value="Transferência Bancária">Transferência Bancária</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="E-Mola">E-Mola</option>
                  <option value="Ponto24 / POS">Ponto24 / POS Cartão</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setLiquidatingExpense(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLiquidate}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
