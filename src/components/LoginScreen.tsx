import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  KeyRound, 
  User as UserIcon, 
  AlertCircle, 
  ShoppingCart, 
  CheckCircle2, 
  ArrowRight,
  Eye,
  EyeOff,
  HelpCircle,
  X,
  Key,
  Mail,
  ShieldAlert,
  Check
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, resetAdminPinWithMasterKey } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Recovery modal state
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryTab, setRecoveryTab] = useState<'employee' | 'admin'>('employee');
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [newAdminPinInput, setNewAdminPinInput] = useState('');
  const [showNewAdminPin, setShowNewAdminPin] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = login(username, pin);
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Credenciais inválidas.');
      }
    }, 200);
  };

  const handleAdminRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccess(null);

    const res = resetAdminPinWithMasterKey(recoveryKeyInput, newAdminPinInput);
    if (!res.success) {
      setRecoveryError(res.error || 'Erro ao redefinir PIN de Administrador.');
    } else {
      setRecoverySuccess('PIN de Administrador redefinido com sucesso! Já pode entrar com a nova senha.');
      setUsername('admin');
      setPin(newAdminPinInput);
      setTimeout(() => {
        setIsRecoveryModalOpen(false);
        setRecoverySuccess(null);
        setRecoveryKeyInput('');
        setNewAdminPinInput('');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-xl shadow-emerald-950/50 mb-4 border border-emerald-400/30">
            <ShoppingCart className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestão de Clientes & Vendas
          </h1>
          <p className="mt-1 text-sm text-emerald-400/90 font-medium">
            Moçambique (MT) • Acesso Seguro ao Painel
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Iniciar Sessão</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-800 px-2.5 py-1 rounded">
              Acesso Privado
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/70 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nome de Utilizador / Conta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite o seu nome de utilizador..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Código PIN ou Senha
                </label>
                <button
                  type="button"
                  onClick={() => setIsRecoveryModalOpen(true)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center space-x-1 font-medium"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Esqueceu a senha?</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Digite o seu PIN de acesso..."
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                  title={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Painel de Gestão</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Recovery Modal */}
      {isRecoveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-white">
            <button
              onClick={() => {
                setIsRecoveryModalOpen(false);
                setRecoveryError(null);
                setRecoverySuccess(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Recuperação e Redefinição de Senha</h3>
                <p className="text-xs text-slate-400">Escolha o seu tipo de conta abaixo:</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => {
                  setRecoveryTab('employee');
                  setRecoveryError(null);
                }}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 text-center transition-colors ${
                  recoveryTab === 'employee'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sou Funcionário / Vendedor
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecoveryTab('admin');
                  setRecoveryError(null);
                }}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 text-center transition-colors ${
                  recoveryTab === 'admin'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sou o Administrador
              </button>
            </div>

            {/* Content for Employee */}
            {recoveryTab === 'employee' && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                  <p className="font-semibold text-slate-200">
                    Como recuperar a senha de um funcionário ou vendedor?
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    Por motivos de segurança interna, as senhas dos funcionários são geridas diretamente pelo <strong>Administrador da empresa</strong>.
                  </p>
                </div>

                <div className="space-y-2 bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50">
                  <span className="font-bold text-emerald-400 block">Passos para o Administrador redefinir o seu PIN:</span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                    <li>O Administrador entra no sistema com a conta dele.</li>
                    <li>No topo direito, clica no botão <strong>"Gerir Utilizadores"</strong>.</li>
                    <li>Ao lado do seu nome de funcionário, clica no botão <strong>"Mudar PIN"</strong>.</li>
                    <li>Digita o seu novo PIN de 4 dígitos e clica em <strong>"Gravar"</strong>.</li>
                  </ol>
                  <p className="text-[11px] text-slate-400 pt-1">
                    O seu novo PIN fica ativo imediatamente e já pode fazer login!
                  </p>
                </div>
              </div>
            )}

            {/* Content for Admin */}
            {recoveryTab === 'admin' && (
              <form onSubmit={handleAdminRecovery} className="space-y-4 text-xs">
                <div className="p-3.5 bg-purple-950/40 rounded-xl border border-purple-800/60 space-y-1.5">
                  <span className="font-bold text-purple-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-400" />
                    Redefinição de Emergência do Administrador
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    Para redefinir o PIN de Administrador, introduza o seu <strong>E-mail de Administrador</strong> registado ou a <strong>Chave Mestre de Segurança</strong> da empresa.
                  </p>
                </div>

                {recoveryError && (
                  <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-200 rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{recoveryError}</span>
                  </div>
                )}

                {recoverySuccess && (
                  <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-200 rounded-xl flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{recoverySuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    E-mail do Administrador ou Chave de Recuperação:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={recoveryKeyInput}
                      onChange={(e) => setRecoveryKeyInput(e.target.value)}
                      placeholder="Digite o e-mail cadastrado ou chave mestre..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Apenas o proprietário autorizado tem permissão para redefinir o PIN do Administrador.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Novo Código PIN para o Administrador:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type={showNewAdminPin ? 'text' : 'password'}
                      required
                      value={newAdminPinInput}
                      onChange={(e) => setNewAdminPinInput(e.target.value)}
                      placeholder="Digite o novo PIN (mínimo 3 dígitos)..."
                      className="w-full pl-9 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewAdminPin(!showNewAdminPin)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                      title={showNewAdminPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                    >
                      {showNewAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRecoveryModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Gravar Novo PIN de Admin</span>
                  </button>
                </div>
              </form>
            )}

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
              <span>Segurança Local & Firebase</span>
              <button
                type="button"
                onClick={() => setIsRecoveryModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Voltar ao Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
