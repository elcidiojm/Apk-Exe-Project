import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole, UserPermissions } from '../types';
import { initialUsers, getRolePermissions } from '../data/initialData';
import { db, initAuth } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';

interface AuthContextType {
  currentUser: AppUser | null;
  users: AppUser[];
  permissions: UserPermissions;
  isAdmin: boolean;
  login: (username: string, pin: string) => { success: boolean; error?: string };
  logout: () => void;
  addUser: (data: { username: string; name: string; role: UserRole; pin: string }) => { success: boolean; error?: string };
  updateUser: (id: string, data: Partial<AppUser>) => void;
  updateUserPermissions: (id: string, customPermissions: Partial<UserPermissions>) => void;
  resetUserPermissionsToRole: (id: string) => void;
  getUserEffectivePermissions: (user: AppUser) => UserPermissions;
  resetAdminPinWithMasterKey: (recoveryKey: string, newPin: string) => { success: boolean; error?: string };
  adminRecoveryEmail: string;
  adminMasterKey: string;
  updateAdminRecoverySettings: (email: string, masterKey: string) => void;
  deleteUser: (id: string) => { success: boolean; error?: string };
  toggleUserStatus: (id: string) => void;
}

export const getUserEffectivePermissions = (user: AppUser | null): UserPermissions => {
  if (!user) return getRolePermissions('visualizador');
  const base = getRolePermissions(user.role);
  if (user.customPermissions) {
    return { ...base, ...user.customPermissions };
  }
  return base;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'gcv_current_user_v1';
const USERS_STORAGE_KEY = 'gcv_users_list_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load users from storage or initial seed
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse users from localStorage', e);
    }
    return initialUsers;
  });

  // Current logged in user (null means locked / needs login)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse current user from localStorage', e);
    }
    return null;
  });

  // Save users list locally
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  // Save current session locally
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [currentUser]);

  // Sync users to Firebase Firestore (when online)
  useEffect(() => {
    let unsubscribeUsers = () => {};

    const syncUsersFromFirestore = async () => {
      try {
        await initAuth();
        const usersCol = collection(db, 'users');
        const usersSnap = await getDocs(usersCol);

        if (usersSnap.empty) {
          // Seed users on Firestore if empty
          const batch = writeBatch(db);
          initialUsers.forEach((u) => {
            batch.set(doc(db, 'users', u.id), u);
          });
          await batch.commit();
        }

        // Listen for real-time user updates
        unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
          if (!snapshot.empty) {
            const data: AppUser[] = [];
            snapshot.forEach((d) => data.push(d.data() as AppUser));
            setUsers(data);

            // If current user was updated in db, update state
            if (currentUser) {
              const updatedSelf = data.find((u) => u.id === currentUser.id);
              if (updatedSelf) {
                if (!updatedSelf.active) {
                  // User was deactivated! Log out immediately
                  setCurrentUser(null);
                } else {
                  setCurrentUser(updatedSelf);
                }
              }
            }
          }
        }, (err) => {
          console.warn('Users firestore listener warning:', err);
        });
      } catch (err) {
        console.warn('Users sync fallback to local storage:', err);
      }
    };

    syncUsersFromFirestore();

    return () => {
      unsubscribeUsers();
    };
  }, []);

  // Compute permissions for current user
  const permissions: UserPermissions = getUserEffectivePermissions(currentUser);

  const isAdmin = currentUser?.role === 'admin';

  // Login handler
  const login = (username: string, pin: string): { success: boolean; error?: string } => {
    const trimmedUser = username.trim().toLowerCase();
    const found = users.find(
      (u) => u.username.toLowerCase() === trimmedUser || u.name.toLowerCase() === trimmedUser
    );

    if (!found) {
      return { success: false, error: 'Utilizador não encontrado no sistema.' };
    }

    if (!found.active) {
      return { success: false, error: 'Esta conta foi desativada pelo Administrador.' };
    }

    // Check PIN (default pin if empty is 1234)
    const expectedPin = found.pin || '1234';
    if (pin.trim() !== expectedPin.trim()) {
      return { success: false, error: 'Código PIN ou Senha incorreta.' };
    }

    const updatedUser: AppUser = {
      ...found,
      lastLogin: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);

    // Update in list
    setUsers((prev) => prev.map((u) => (u.id === found.id ? updatedUser : u)));

    // Sync last login to Firestore if online
    try {
      setDoc(doc(db, 'users', found.id), updatedUser, { merge: true }).catch(() => {});
    } catch {}

    return { success: true };
  };

  // Logout handler
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Add new user (Admin only)
  const addUser = (data: {
    username: string;
    name: string;
    role: UserRole;
    pin: string;
  }): { success: boolean; error?: string } => {
    const cleanUsername = data.username.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanUsername) {
      return { success: false, error: 'O nome de utilizador é obrigatório.' };
    }

    const exists = users.some((u) => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      return { success: false, error: 'Já existe um utilizador com esse nome de utilizador.' };
    }

    const newUser: AppUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      username: cleanUsername,
      name: data.name.trim(),
      role: data.role,
      pin: data.pin.trim() || '1234',
      active: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setUsers((prev) => [...prev, newUser]);

    // Save to Firestore
    try {
      setDoc(doc(db, 'users', newUser.id), newUser).catch(() => {});
    } catch {}

    return { success: true };
  };

  // Update user
  const updateUser = (id: string, data: Partial<AppUser>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...data };
          if (currentUser?.id === id) {
            setCurrentUser(updated);
          }
          try {
            setDoc(doc(db, 'users', id), updated, { merge: true }).catch(() => {});
          } catch {}
          return updated;
        }
        return u;
      })
    );
  };

  // Delete user (cannot delete last admin)
  const deleteUser = (id: string): { success: boolean; error?: string } => {
    const target = users.find((u) => u.id === id);
    if (!target) return { success: false, error: 'Utilizador não encontrado.' };

    if (target.role === 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin' && u.active).length;
      if (adminCount <= 1) {
        return { success: false, error: 'Não é possível eliminar o único Administrador ativo do sistema.' };
      }
    }

    if (currentUser?.id === id) {
      return { success: false, error: 'Não pode eliminar o utilizador com o qual tem sessão iniciada.' };
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));

    try {
      deleteDoc(doc(db, 'users', id)).catch(() => {});
    } catch {}

    return { success: true };
  };

  // Toggle user active status
  const toggleUserStatus = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;

    if (target.role === 'admin' && target.active) {
      const adminCount = users.filter((u) => u.role === 'admin' && u.active).length;
      if (adminCount <= 1) {
        alert('Não pode desativar o único Administrador ativo!');
        return;
      }
    }

    updateUser(id, { active: !target.active });
  };

  // Update specific custom permissions for a user
  const updateUserPermissions = (id: string, customPermissions: Partial<UserPermissions>) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;

    const merged = {
      ...(target.customPermissions || {}),
      ...customPermissions,
    };

    updateUser(id, { customPermissions: merged });
  };

  // Reset user permissions back to standard role defaults
  const resetUserPermissionsToRole = (id: string) => {
    updateUser(id, { customPermissions: undefined });
  };

  const [adminRecoveryEmail, setAdminRecoveryEmail] = useState<string>(() => {
    return localStorage.getItem('gcv_admin_recovery_email') || '';
  });

  const [adminMasterKey, setAdminMasterKey] = useState<string>(() => {
    return localStorage.getItem('gcv_admin_master_key') || '';
  });

  const updateAdminRecoverySettings = (email: string, masterKey: string) => {
    const cleanEmail = email.trim();
    setAdminRecoveryEmail(cleanEmail);
    localStorage.setItem('gcv_admin_recovery_email', cleanEmail);

    const cleanKey = masterKey.trim();
    setAdminMasterKey(cleanKey);
    localStorage.setItem('gcv_admin_master_key', cleanKey);
  };

  // Emergency Admin Password / PIN Reset with Master Key or Administrator Email
  const resetAdminPinWithMasterKey = (recoveryKey: string, newPin: string): { success: boolean; error?: string } => {
    const key = recoveryKey.trim().toLowerCase();
    
    // Check if recovery key matches admin's configured credentials
    const validConfiguredKeys = [
      adminRecoveryEmail ? adminRecoveryEmail.toLowerCase() : null,
      adminMasterKey ? adminMasterKey.toLowerCase() : null
    ].filter(Boolean) as string[];

    // If admin has not set custom keys yet, allow safe default master key or prompt
    const matches = validConfiguredKeys.length > 0
      ? validConfiguredKeys.includes(key)
      : (key === 'admin' || key === 'recuperar');

    if (!matches) {
      return { 
        success: false, 
        error: 'Chave de segurança ou e-mail de recuperação incorreto.' 
      };
    }

    if (!newPin.trim() || newPin.trim().length < 3) {
      return { 
        success: false, 
        error: 'O novo PIN deve ter pelo menos 3 dígitos.' 
      };
    }

    const adminUser = users.find((u) => u.username === 'admin') || users.find((u) => u.role === 'admin');
    if (!adminUser) {
      return { success: false, error: 'Conta de Administrador não encontrada.' };
    }

    // Update PIN and ensure account is active
    updateUser(adminUser.id, { pin: newPin.trim(), active: true });

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        permissions,
        isAdmin,
        login,
        logout,
        addUser,
        updateUser,
        updateUserPermissions,
        resetUserPermissionsToRole,
        getUserEffectivePermissions,
        resetAdminPinWithMasterKey,
        adminRecoveryEmail,
        adminMasterKey,
        updateAdminRecoverySettings,
        deleteUser,
        toggleUserStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
