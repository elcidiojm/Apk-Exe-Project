import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppUser, UserRole, UserPermissions } from '../types';
import { AdminBackupPanel } from './AdminBackupPanel';
import { 
  Database,
  Download,
  Users, 
  UserPlus, 
  Shield, 
  Key, 
  CheckCircle2, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  X,
  Sliders,
  RotateCcw,
  ShoppingCart,
  DollarSign,
  Boxes,
  BarChart3,
  Check,
  Lock,
  Eye,
  EyeOff,
  Mail
} from 'lucide-react';

interface UsersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsersManagementModal: React.FC<UsersManagementModalProps> = ({ isOpen, onClose }) => {
  const { 
    users, 
    currentUser, 
    isAdmin, 
    addUser, 
    updateUser, 
    updateUserPermissions, 
    resetUserPermissionsToRole, 
    getUserEffectivePermissions, 
    deleteUser, 
    toggleUserStatus,
    adminRecoveryEmail,
    adminMasterKey,
    updateAdminRecoverySettings
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'users' | 'backup' | 'recovery'>('users');
  const [isAdding, setIsAdding] = useState(false);
  const [isConfiguringRecovery, setIsConfiguringRecovery] = useState(false);
  const [recoveryEmailInput, setRecoveryEmailInput] = useState(adminRecoveryEmail);
  const [masterKeyInput, setMasterKeyInput] = useState(adminMasterKey);
  const [recoverySavedMsg, setRecoverySavedMsg] = useState<string | null>(null);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  const toggleRevealPin = (userId: string) => {
    setRevealedPins(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('vendedor');
  const [newPin, setNewPin] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Edit PIN state
  const [editingPinUserId, setEditingPinUserId] = useState<string | null>(null);
  const [editedPinValue, setEditedPinValue] = useState('');

  // Edit Permissions state
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<AppUser | null>(null);
  const [tempPermissions, setTempPermissions] = useState<UserPermissions | null>(null);

  if (!isOpen) return null;

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const res = addUser({
      username: newUsername,
      name: newName,
      role: newRole,
      pin: newPin || '1234',
    });

    if (!res.success) {
      setFormError(res.error || 'Erro ao criar utilizador');
    } else {
      setFormSuccess(`Utilizador "${newUsername}" criado com sucesso!`);
      setNewUsername('');
      setNewName('');
      setNewRole('vendedor');
      setNewPin('');
      setIsAdding(false);
      setTimeout(() => setFormSuccess(null), 4000);
    }
  };

  const handleSavePin = (userId: string) => {
    if (!editedPinValue.trim()) return;
    updateUser(userId, { pin: editedPinValue.trim() });
    setEditingPinUserId(null);
    setEditedPinValue('');
  };

  const handleOpenPermissions = (user: AppUser) => {
    setEditingPermissionsUser(user);
    setTempPermissions(getUserEffectivePermissions(user));
  };

  const handleTogglePermission = (key: keyof UserPermissions) => {
    if (!tempPermissions) return;
    setTempPermissions({
      ...tempPermissions,
      [key]: !tempPermissions[key],
    });
  };

  const handleSavePermissions = () => {
    if (!editingPermissionsUser || !tempPermissions) return;
    updateUserPermissions(editingPermissionsUser.id, tempPermissions);
    setFormSuccess(`Permissões de "${editingPermissionsUser.name}" atualizadas com sucesso!`);
    setEditingPermissionsUser(null);
    setTempPermissions(null);
    setTimeout(() => setFormSuccess(null), 4000);
  };

  const handleResetToRoleDefault = () => {
    if (!editingPermissionsUser) return;
    resetUserPermissionsToRole(editingPermissionsUser.id);
    const updated = getUserEffectivePermissions({ ...editingPermissionsUser, customPermissions: undefined });
    setTempPermissions(updated);
    setFormSuccess(`Permissões restauradas para o padrão do cargo!`);
    setTimeout(() => setFormSuccess(null), 3000);
  };

  const handleToggleAllPermissions = (enable: boolean) => {
    if (!tempPermissions) return;
    const updated: UserPermissions = {
      canManageUsers: enable && editingPermissionsUser?.role === 'admin',
      canViewDashboard: true,
      canCreateOrders: enable,
      canDeleteOrders: enable,
      canRegisterPayments: enable,
      canDeletePayments: enable,
      canManageClients: enable,
      canDeleteClients: enable,
      canManageStock: enable,
      canChangePrices: enable,
      canViewReports: enable,
      canExportBackup: enable,
      canResetDatabase: enable && editingPermissionsUser?.role === 'admin',
    };
    setTempPermissions(updated);
  };

  const roleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldAlert className="w-3 h-3" />
            <span>Administrador</span>
          </span>
        );
      case 'vendedor':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <UserCheck className="w-3 h-3" />
            <span>Vendedor (Balcão)</span>
          </span>
        );
      case 'armazem':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Shield className="w-3 h-3" />
            <span>Gestor de Armazém</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            <span>Visualizador</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Painel de Administração</h2>
              <p className="text-xs text-slate-500">
                Gestão de utilizadores, backup automático do banco de dados (Firestore) e segurança
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
                </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-4 sm:px-6 gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'users'
                ? 'border-purple-600 text-purple-900 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Utilizadores & Permissões</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'backup'
                ? 'border-emerald-600 text-emerald-900 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Cópia de Segurança & Backup (Firestore)</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Auto Ativo
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recovery')}
            className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'recovery'
                ? 'border-purple-600 text-purple-900 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Chave Mestra & Emergência</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'backup' && (
            <AdminBackupPanel />
          )}

          {activeTab === 'users' && (
            <>
          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Sub-panel: Edit Permissions for a specific user */}
          {editingPermissionsUser && tempPermissions ? (
            <div className="bg-purple-50/60 p-4 sm:p-5 rounded-2xl border border-purple-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-200">
                <div>
                  <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5 text-sm">
                    <Sliders className="w-4 h-4 text-purple-700" />
                    Definir Permissões de: <span className="text-purple-700 font-extrabold">{editingPermissionsUser.name}</span>
                  </span>
                  <p className="text-xs text-slate-500">
                    Utilizador: @{editingPermissionsUser.username} • Cargo Base: {editingPermissionsUser.role}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleResetToRoleDefault}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-600 hover:text-purple-700 bg-white border border-slate-300 rounded-lg hover:bg-purple-50 transition-colors"
                    title="Restaurar as permissões normais deste cargo"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Padrão do Cargo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllPermissions(true)}
                    className="px-2.5 py-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg font-semibold hover:bg-emerald-100"
                  >
                    Ativar Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllPermissions(false)}
                    className="px-2.5 py-1 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg font-semibold hover:bg-rose-100"
                  >
                    Desativar
                  </button>
                </div>
              </div>

              {/* Permissions Checkbox Grid */}
              <div className="space-y-4">
                {/* 1. Vendas & Encomendas */}
                <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                    <ShoppingCart className="w-4 h-4 text-emerald-600" />
                    <span>Módulo de Encomendas & Vendas</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-start space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={tempPermissions.canCreateOrders}
                        onChange={() => handleTogglePermission('canCreateOrders')}
                        className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 block">Criar Encomendas / Vendas</span>
                        <span className="text-[11px] text-slate-500">Pode lançar novos pedidos para clientes no balcão</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={tempPermissions.canDeleteOrders}
                        onChange={() => handleTogglePermission('canDeleteOrders')}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 block">Eliminar Encomendas</span>
                        <span className="text-[11px] text-rose-600">Pode apagar encomendas registadas anteriormente</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 2. Pagamentos & Finanças */}
                <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span>Módulo de Pagamentos & Recebimentos</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-start space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={tempPermissions.canRegisterPayments}
                        onChange={() => handleTogglePermission('canRegisterPayments')}
                        className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 block">Registar Pagamentos</span>
                        <span className="text-[11px] text-slate-500">Receber valores e amortizar dívidas de clientes</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={tempPermissions.canDeletePayments}
                        onChange={() => handleTogglePermission('canDeletePayments')}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 block">Eliminar Pagamentos</span>
                        <span className="text-[11px] text-rose-600">Pode apagar recibos e pagamentos efetuados</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 3. Clientes */}
                <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>Módulo de Clientes</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-start space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={tempPermissions.canManageClients}
                        onChange={() => handleTogglePermission('canManageClients')}
                        className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 block">Cadastrar & Editar Clientes</span>
                        <span className="text-[11px] text-slate-500">Criar fichas de clientes e atualizar contactos</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={tempPermissions.canDeleteClients}
                        onChange={() => handleTogglePermission('canDeleteClients')}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 block">Eliminar Clientes</span>
                        <span className="text-[11px] text-rose-600">Apagar clientes do registo geral</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 4. Produtos & Armazém */}
                <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                    <Boxes className="w-4 h-4 text-sky-600" />
                    <span>Produtos & Gestão de Armazém</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-start space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={tempPermissions.canManageStock}
                        onChange={() => handleTogglePermission('canManageStock')}
                        className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 block">Lançar Stock (Entradas e Saídas)</span>
                        <span className="text-[11px] text-slate-500">Dar entrada de mercadorias no armazém</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={tempPermissions.canChangePrices}
                        onChange={() => handleTogglePermission('canChangePrices')}
                        className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 block">Alterar Preços de Tabela</span>
                        <span className="text-[11px] text-slate-500">Modificar o preço de venda dos produtos em MT</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 5. Relatórios Financeiros & Backups */}
                <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span>Relatórios Financeiros & Backups</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-start space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={tempPermissions.canViewReports}
                        onChange={() => handleTogglePermission('canViewReports')}
                        className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 block">Visualizar Aba de Relatórios</span>
                        <span className="text-[11px] text-slate-500">Acesso a gráficos de faturação e margens de lucro</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={tempPermissions.canExportBackup}
                        onChange={() => handleTogglePermission('canExportBackup')}
                        className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 block">Exportar Planilha Excel (.xlsx)</span>
                        <span className="text-[11px] text-slate-500">Fazer download do arquivo Excel com todos os dados</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Save & Cancel Permissions buttons */}
              <div className="flex justify-end items-center space-x-2 pt-2 border-t border-purple-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPermissionsUser(null);
                    setTempPermissions(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Gravar Permissões de {editingPermissionsUser.name.split(' ')[0]}</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Add User Section */}
          {!isAdding && !isConfiguringRecovery ? (
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <span>Contas Registadas no Sistema ({users.length})</span>
              </h3>
              {isAdmin && !editingPermissionsUser && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfiguringRecovery(true);
                      setRecoveryEmailInput(adminRecoveryEmail);
                      setMasterKeyInput(adminMasterKey);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl shadow-xs transition-all"
                    title="Configurar E-mail e Chave Mestre de Recuperação"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                    <span>Chaves de Recuperação</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-all active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Novo Utilizador</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}

          </>
          )}

          {/* Admin Recovery Configuration Panel */}
          {(activeTab === 'recovery' || isConfiguringRecovery) && (
            <form onSubmit={(e) => {
              e.preventDefault();
              updateAdminRecoverySettings(recoveryEmailInput, masterKeyInput);
              setRecoverySavedMsg('Chaves de recuperação e e-mail salvas com sucesso!');
              setTimeout(() => {
                setRecoverySavedMsg(null);
                setIsConfiguringRecovery(false);
              }, 1500);
            }} className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-purple-200">
                <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Privacidade & Chaves de Recuperação de Emergência</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfiguringRecovery(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Estes dados são estritamente privados do Administrador e <strong>não são revelados no ecrã de login</strong> para garantir total privacidade e proteção contra terceiros.
              </p>

              {recoverySavedMsg && (
                <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center space-x-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{recoverySavedMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail Privado de Recuperação do Administrador
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={recoveryEmailInput}
                      onChange={(e) => setRecoveryEmailInput(e.target.value)}
                      placeholder="seuemail@empresa.com"
                      className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código / Chave Mestre de Segurança
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={masterKeyInput}
                      onChange={(e) => setMasterKeyInput(e.target.value)}
                      placeholder="Defina o seu código ou chave mestre"
                      className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfiguringRecovery(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Salvar Chaves Privadas
                </button>
              </div>
            </form>
          )}

          {isAdding && (
            <form onSubmit={handleCreateUser} className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-purple-200">
                <span className="text-xs font-bold text-purple-900">Cadastrar Novo Utilizador</span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
              </div>

              {formError && (
                <p className="text-xs text-rose-600 font-medium">{formError}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Alberto Mondlane"
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome de Utilizador (Login)
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Ex: alberto"
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo / Nível Inicial
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="vendedor">Vendedor (Balcão de Vendas)</option>
                    <option value="armazem">Gestor de Armazém (Apenas Stock)</option>
                    <option value="admin">Administrador (Acesso Total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código PIN / Senha de Acesso
                  </label>
                  <input
                    type="text"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Defina um PIN numérico (ex: 4 dígitos)"
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Gravar Utilizador
                </button>
              </div>
            </form>
          )}

          {/* Users Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-200">
              {users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                const isEditingThisPin = editingPinUserId === u.id;
                const hasCustomPerms = !!u.customPermissions && Object.keys(u.customPermissions).length > 0;
                const isConfiguringThis = editingPermissionsUser?.id === u.id;

                return (
                  <div 
                    key={u.id} 
                    className={`p-3.5 transition-colors ${
                      isConfiguringThis ? 'bg-purple-50/50' : 'hover:bg-slate-50'
                    } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        u.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : u.role === 'vendedor'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="text-sm font-bold text-slate-900">{u.name}</span>
                          <span className="text-xs text-slate-400 font-mono">(@{u.username})</span>
                          {isSelf && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                              Você
                            </span>
                          )}
                          {!u.active && (
                            <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">
                              Desativado
                            </span>
                          )}
                          {hasCustomPerms && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold px-1.5 py-0.5 rounded">
                              Permissões Personalizadas
                            </span>
                          )}
                        </div>

                        <div className="flex items-center flex-wrap gap-2 mt-1">
                          {roleBadge(u.role)}
                          <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                            <span>PIN:</span>
                            {isEditingThisPin ? (
                              <input
                                type="text"
                                className="w-16 px-1 py-0.5 text-xs border rounded font-mono"
                                value={editedPinValue}
                                onChange={(e) => setEditedPinValue(e.target.value)}
                                autoFocus
                              />
                            ) : (
                              <span className="font-mono font-bold text-slate-600 inline-flex items-center gap-1">
                                <span>{revealedPins[u.id] ? (u.pin || '••••') : '••••'}</span>
                                <button
                                  type="button"
                                  onClick={() => toggleRevealPin(u.id)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5"
                                  title={revealedPins[u.id] ? "Ocultar PIN" : "Ver PIN"}
                                >
                                  {revealedPins[u.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                              </span>
                            )}
                          </span>

                          {isAdmin && (
                            isEditingThisPin ? (
                              <div className="inline-flex space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleSavePin(u.id)}
                                  className="text-[11px] text-emerald-600 font-bold hover:underline"
                                >
                                  Gravar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPinUserId(null)}
                                  className="text-[11px] text-slate-500 hover:underline"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPinUserId(u.id);
                                  setEditedPinValue(u.pin || '');
                                }}
                                className="text-[11px] text-purple-600 hover:underline inline-flex items-center space-x-0.5"
                              >
                                <Key className="w-3 h-3" />
                                <span>Mudar PIN</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Permissions button, Active toggle, Delete */}
                    {isAdmin && (
                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        {/* Define Permissions button */}
                        <button
                          type="button"
                          onClick={() => handleOpenPermissions(u)}
                          className={`inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            isConfiguringThis
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'
                          }`}
                          title="Definir exatamente o que este utilizador pode fazer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Definir Permissões</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleUserStatus(u.id)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                            u.active 
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300' 
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300'
                          }`}
                          title={u.active ? 'Desativar acesso deste utilizador' : 'Reativar utilizador'}
                        >
                          {u.active ? 'Desativar' : 'Reativar'}
                        </button>

                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Tem a certeza que deseja eliminar o utilizador "${u.name}"?`)) {
                                const res = deleteUser(u.id);
                                if (!res.success) alert(res.error);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar Utilizador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
