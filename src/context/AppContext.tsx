import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Client, 
  Product, 
  ProductCategory,
  Order, 
  Payment, 
  StockMovement, 
  ClientFinancialSummary, 
  OrderItem, 
  PaymentMethod, 
  PaymentType,
  CustomerMediaDevice,
  DailyCashClosure,
  Supplier,
  Purchase,
  PurchasePaymentStatus,
  Expense,
  Proforma,
  Warehouse,
  StockTransfer,
  ProductBatch,
  CommissionPayment,
  DatabaseBackup,
  AutoBackupConfig,
  BackupCollectionCounts,
  SystemSettings
} from '../types';
import { 
  buildBackupPayload, 
  downloadJSONFile, 
  validateBackupJSON, 
  BackupDataSource 
} from '../utils/backupManager';
import { 
  initialClients, 
  initialProducts, 
  initialOrders, 
  initialPayments, 
  initialStockMovements,
  initialCustomerDevices,
  initialSuppliers,
  initialPurchases,
  initialExpenses,
  initialProformas,
  initialWarehouses,
  initialStockTransfers,
  initialBatches,
  initialCommissionPayments,
  initialSystemSettings
} from '../data/initialData';
import { exportFullExcelReport } from '../utils/excelExport';
import { db, initAuth, testFirestoreConnection } from '../lib/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDocs,
  getDoc
} from 'firebase/firestore';

interface AppContextType {
  clients: Client[];
  products: Product[];
  orders: Order[];
  payments: Payment[];
  stockMovements: StockMovement[];
  
  // Clients
  addClient: (data: { name: string; phone: string; location: string; notes?: string }) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientSummary: (clientId: string) => ClientFinancialSummary | null;
  clientSummaries: ClientFinancialSummary[];

  // Products
  addProduct: (data: Omit<Product, 'id' | 'code' | 'createdAt'>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, type: 'entrada' | 'saida_perda' | 'ajuste', quantity: number, notes?: string) => void;
  batchUpdateCategoryPrices: (category: ProductCategory, adjustment: { type: 'percent' | 'fixed' | 'set'; value: number }) => void;

  // Orders
  createOrder: (data: {
    clientId: string;
    date: string;
    items: OrderItem[];
    amountPaidNow: number;
    paymentMethod?: PaymentMethod;
    deliveryType?: 'Digital/Partilha' | 'Entrega Física' | 'Mista';
    notes?: string;
  }) => { order: Order; payment?: Payment };
  updateOrder: (
    orderId: string, 
    data: {
      clientId: string;
      date: string;
      items: OrderItem[];
      amountPaid: number;
      deliveryType?: 'Digital/Partilha' | 'Entrega Física' | 'Mista';
      status?: Order['status'];
      notes?: string;
    }
  ) => Order;
  deleteOrder: (orderId: string) => void;

  // Payments
  createPayment: (data: {
    clientId: string;
    amount: number;
    method: PaymentMethod;
    type: PaymentType;
    date: string;
    orderId?: string;
    notes?: string;
  }) => Payment;
  deletePayment: (paymentId: string) => void;

  // Media Devices (Pens USB & Discos de Clientes)
  customerDevices: CustomerMediaDevice[];
  addCustomerDevice: (data: Omit<CustomerMediaDevice, 'id' | 'deviceNumber'>) => CustomerMediaDevice;
  updateCustomerDevice: (id: string, data: Partial<CustomerMediaDevice>) => void;
  deleteCustomerDevice: (id: string) => void;

  // Daily Cash Closures (Fecho de Caixa)
  cashClosures: DailyCashClosure[];
  createCashClosure: (data: Omit<DailyCashClosure, 'id' | 'closedAt'>) => DailyCashClosure;
  deleteCashClosure: (closureId: string) => void;
  getDailyCashSummary: (dateStr?: string) => {
    date: string;
    totalSales: number;
    totalReceived: number;
    byMethod: {
      numerario: number;
      mpesa: number;
      emola: number;
      ponto24: number;
      banco: number;
    };
    orderCount: number;
    paymentCount: number;
  };

  // ==========================================
  // ERP: FORNECEDORES & COMPRAS
  // ==========================================
  suppliers: Supplier[];
  addSupplier: (data: Omit<Supplier, 'id' | 'code' | 'createdAt'>) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  purchases: Purchase[];
  createPurchase: (data: Omit<Purchase, 'id' | 'purchaseNumber' | 'createdAt'>) => Purchase;
  updatePurchase: (id: string, data: Partial<Purchase>) => void;
  deletePurchase: (id: string) => void;
  markPurchasePaid: (id: string, paymentMethod?: PaymentMethod) => void;

  // ==========================================
  // ERP: DESPESAS & CONTAS A PAGAR
  // ==========================================
  expenses: Expense[];
  createExpense: (data: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt'>) => Expense;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  markExpensePaid: (id: string, paymentMethod?: PaymentMethod) => void;

  // ==========================================
  // ERP: ORÇAMENTOS / FATURAS PROFORMA
  // ==========================================
  proformas: Proforma[];
  createProforma: (data: Omit<Proforma, 'id' | 'proformaNumber' | 'createdAt'>) => Proforma;
  updateProforma: (id: string, data: Partial<Proforma>) => void;
  deleteProforma: (id: string) => void;
  convertProformaToOrder: (proformaId: string, amountPaidNow?: number, paymentMethod?: PaymentMethod) => { order: Order; payment?: Payment };

  // ==========================================
  // ERP: MULTI-ARMAZÉM & TRANSFERÊNCIAS
  // ==========================================
  warehouses: Warehouse[];
  addWarehouse: (data: Omit<Warehouse, 'id' | 'code' | 'createdAt'>) => Warehouse;
  updateWarehouse: (id: string, data: Partial<Warehouse>) => void;
  deleteWarehouse: (id: string) => void;

  stockTransfers: StockTransfer[];
  createStockTransfer: (data: Omit<StockTransfer, 'id' | 'transferNumber' | 'createdAt'>) => { success: boolean; error?: string; transfer?: StockTransfer };

  // ==========================================
  // ERP: CONTROLO DE LOTES & VALIDADES
  // ==========================================
  batches: ProductBatch[];
  addBatch: (data: Omit<ProductBatch, 'id' | 'createdAt'>) => ProductBatch;
  updateBatch: (id: string, data: Partial<ProductBatch>) => void;
  deleteBatch: (id: string) => void;

  // ==========================================
  // ERP: COMISSÕES DE FUNCIONÁRIOS
  // ==========================================
  commissionPayments: CommissionPayment[];
  createCommissionPayment: (data: Omit<CommissionPayment, 'id' | 'paymentNumber' | 'createdAt'>) => CommissionPayment;
  deleteCommissionPayment: (paymentId: string) => void;

  // Global KPIs & ERP Financial Metrics
  totalSales: number;
  totalReceived: number;
  totalDebt: number;
  totalExpenses: number;
  totalPendingExpenses: number;
  totalPurchases: number;
  netProfit: number; // Faturação - Custo Mercadorias - Despesas Operacionais Pagas

  // Cloud Sync
  syncStatus: 'connecting' | 'online' | 'offline';
  isCloudSynced: boolean;

  // Utilities
  exportExcel: () => void;
  exportJSONBackup: () => void;
  importJSONBackup: (jsonContent: string) => boolean;
  resetToDefaults: () => void;

  // Backups & Auto-Backup
  backups: DatabaseBackup[];
  autoBackupConfig: AutoBackupConfig;
  updateAutoBackupConfig: (config: Partial<AutoBackupConfig>) => void;
  createBackup: (type?: 'automatic' | 'manual', customName?: string) => Promise<DatabaseBackup>;
  downloadBackupJSON: (backupId?: string) => void;
  restoreFromBackup: (backup: DatabaseBackup) => Promise<boolean>;
  deleteBackup: (backupId: string) => Promise<void>;
  isBackingUp: boolean;
  lastAutoBackupTime: string | null;

  // Definições do Sistema (PONTO 1)
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  resetSystemSettings: () => void;

  // Limpeza de Históricos e Delecção (PONTO 4)
  deleteStockTransfer: (id: string) => void;
  clearStockTransfersHistory: () => void;
  clearCashClosuresHistory: () => void;
  clearExpensesHistory: (filter?: 'all' | 'paid') => void;
  clearCommissionPaymentsHistory: () => void;
  clearPaymentsHistory: () => void;
  clearAllDataToProduction: () => Promise<void>;

  // Sincronização em Tempo Real na Nuvem
  syncWithCloud: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CLIENTS: 'gcv_clients_v1',
  PRODUCTS: 'gcv_products_v1',
  ORDERS: 'gcv_orders_v1',
  PAYMENTS: 'gcv_payments_v1',
  STOCK_MOVEMENTS: 'gcv_stock_movements_v1',
  CUSTOMER_DEVICES: 'gcv_customer_devices_v1',
  CASH_CLOSURES: 'gcv_cash_closures_v1',
  SUPPLIERS: 'gcv_suppliers_v1',
  PURCHASES: 'gcv_purchases_v1',
  EXPENSES: 'gcv_expenses_v1',
  PROFORMAS: 'gcv_proformas_v1',
  WAREHOUSES: 'gcv_warehouses_v1',
  STOCK_TRANSFERS: 'gcv_stock_transfers_v1',
  BATCHES: 'gcv_batches_v1',
  COMMISSION_PAYMENTS: 'gcv_commission_payments_v1',
  BACKUPS: 'gcv_database_backups_v1',
  AUTO_BACKUP_CONFIG: 'gcv_auto_backup_config_v1',
  SYSTEM_SETTINGS: 'gcv_system_settings_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local state initialized with cached data or demo data
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
    return saved ? JSON.parse(saved) : initialStockMovements;
  });

  const [customerDevices, setCustomerDevices] = useState<CustomerMediaDevice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_DEVICES);
    return saved ? JSON.parse(saved) : initialCustomerDevices;
  });

  const [cashClosures, setCashClosures] = useState<DailyCashClosure[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CASH_CLOSURES);
    return saved ? JSON.parse(saved) : [];
  });

  // ERP State variables
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    return saved ? JSON.parse(saved) : initialPurchases;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [proformas, setProformas] = useState<Proforma[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFORMAS);
    return saved ? JSON.parse(saved) : initialProformas;
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
    return saved ? JSON.parse(saved) : initialWarehouses;
  });

  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STOCK_TRANSFERS);
    return saved ? JSON.parse(saved) : initialStockTransfers;
  });

  const [batches, setBatches] = useState<ProductBatch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BATCHES);
    return saved ? JSON.parse(saved) : initialBatches;
  });

  const [commissionPayments, setCommissionPayments] = useState<CommissionPayment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMMISSION_PAYMENTS);
    return saved ? JSON.parse(saved) : initialCommissionPayments;
  });

  // Backups State
  const [backups, setBackups] = useState<DatabaseBackup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BACKUPS);
    return saved ? JSON.parse(saved) : [];
  });

  const [autoBackupConfig, setAutoBackupConfig] = useState<AutoBackupConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_BACKUP_CONFIG);
    return saved ? JSON.parse(saved) : {
      enabled: true,
      frequencyHours: 6,
      maxStoredBackups: 15,
      lastBackupAt: undefined,
    };
  });

  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [lastAutoBackupTime, setLastAutoBackupTime] = useState<string | null>(() => {
    return localStorage.getItem("gcv_last_auto_backup_time") || null;
  });

  // System Settings State (PONTO 1)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SYSTEM_SETTINGS);
    return saved ? { ...initialSystemSettings, ...JSON.parse(saved) } : initialSystemSettings;
  });

  const [syncStatus, setSyncStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Sync to local storage for offline redundancy
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(systemSettings));
  }, [systemSettings]);

  // Sync to local storage for offline redundancy
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_DEVICES, JSON.stringify(customerDevices));
  }, [customerDevices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASH_CLOSURES, JSON.stringify(cashClosures));
  }, [cashClosures]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFORMAS, JSON.stringify(proformas));
  }, [proformas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_TRANSFERS, JSON.stringify(stockTransfers));
  }, [stockTransfers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMMISSION_PAYMENTS, JSON.stringify(commissionPayments));
  }, [commissionPayments]);

  // Real-time Firebase Firestore Sync
  useEffect(() => {
    let unsubscribeClients = () => {};
    let unsubscribeProducts = () => {};
    let unsubscribeOrders = () => {};
    let unsubscribePayments = () => {};
    let unsubscribeMovements = () => {};
    let unsubscribeDevices = () => {};
    let unsubscribeClosures = () => {};
    let unsubscribeSuppliers = () => {};
    let unsubscribePurchases = () => {};
    let unsubscribeExpenses = () => {};
    let unsubscribeProformas = () => {};
    let unsubscribeWarehouses = () => {};
    let unsubscribeTransfers = () => {};
    let unsubscribeBatches = () => {};
    let unsubscribeCommissions = () => {};
    let unsubscribeBackups = () => {};
    let unsubscribeSettings = () => {};

    const setupFirebaseSync = async () => {
      try {
        await initAuth();
        const isConnected = await testFirestoreConnection();
        if (isConnected) {
          setSyncStatus('online');
          setIsCloudSynced(true);

          // Sincronização inteligente de inicialização:
          // NUNCA recriar dados de exemplo automaticamente se o utilizador já tiver inicializado ou limpado a base de dados
          try {
            let isAlreadyInitialized = localStorage.getItem('gcv_db_initialized') === 'true';
            const metaDoc = await getDoc(doc(db, 'system_meta', 'app_state'));
            if (metaDoc.exists() && metaDoc.data()?.initialized) {
              isAlreadyInitialized = true;
              localStorage.setItem('gcv_db_initialized', 'true');
            }

            if (!isAlreadyInitialized) {
              const [clientsSnap, productsSnap] = await Promise.all([
                getDocs(collection(db, 'clients')),
                getDocs(collection(db, 'products'))
              ]);

              // Apenas semeia pela 1ª vez se ambas as coleções principais estiverem vazias e nunca tiver sido inicializado
              if (clientsSnap.empty && productsSnap.empty) {
                const batch = writeBatch(db);
                initialClients.forEach((c) => batch.set(doc(db, 'clients', c.id), c));
                initialProducts.forEach((p) => batch.set(doc(db, 'products', p.id), p));
                initialOrders.forEach((o) => batch.set(doc(db, 'orders', o.id), o));
                initialPayments.forEach((pay) => batch.set(doc(db, 'payments', pay.id), pay));
                initialStockMovements.forEach((m) => batch.set(doc(db, 'stockMovements', m.id), m));
                initialCustomerDevices.forEach((d) => batch.set(doc(db, 'customerDevices', d.id), d));
                initialSuppliers.forEach((s) => batch.set(doc(db, 'suppliers', s.id), s));
                initialPurchases.forEach((pu) => batch.set(doc(db, 'purchases', pu.id), pu));
                initialExpenses.forEach((e) => batch.set(doc(db, 'expenses', e.id), e));
                initialProformas.forEach((pr) => batch.set(doc(db, 'proformas', pr.id), pr));
                initialWarehouses.forEach((w) => batch.set(doc(db, 'warehouses', w.id), w));
                initialStockTransfers.forEach((t) => batch.set(doc(db, 'stockTransfers', t.id), t));
                initialBatches.forEach((b) => batch.set(doc(db, 'batches', b.id), b));
                initialCommissionPayments.forEach((cp) => batch.set(doc(db, 'commissionPayments', cp.id), cp));
                batch.set(doc(db, 'systemSettings', 'general'), initialSystemSettings);
                batch.set(doc(db, 'system_meta', 'app_state'), { initialized: true, seededAt: new Date().toISOString() });
                await batch.commit();
              } else {
                await setDoc(doc(db, 'system_meta', 'app_state'), { initialized: true }, { merge: true });
              }
              localStorage.setItem('gcv_db_initialized', 'true');
            }
          } catch (seedErr) {
            console.warn('Initial seeding note:', seedErr);
          }
        } else {
          setSyncStatus('offline');
          setIsCloudSynced(false);
        }

        // Setup real-time listeners for all collections (sincroniza mesmo quando a colecção estiver vazia)
        unsubscribeClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
          const data: Client[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as Client));
          setClients(data);
          localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(data));
        }, (err) => console.warn('Clients sync error:', err));

        unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
          const data: Product[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as Product));
          setProducts(data);
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data));
        }, (err) => console.warn('Products sync error:', err));

        unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
          const data: Order[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as Order));
          data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setOrders(data);
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data));
        }, (err) => console.warn('Orders sync error:', err));

        unsubscribePayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
          const data: Payment[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as Payment));
          data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setPayments(data);
          localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(data));
        }, (err) => console.warn('Payments sync error:', err));

        unsubscribeMovements = onSnapshot(collection(db, 'stockMovements'), (snapshot) => {
          const data: StockMovement[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as StockMovement));
          data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setStockMovements(data);
          localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(data));
        }, (err) => console.warn('StockMovements sync error:', err));

        unsubscribeDevices = onSnapshot(collection(db, 'customerDevices'), (snapshot) => {
          const data: CustomerMediaDevice[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as CustomerMediaDevice));
          data.sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
          setCustomerDevices(data);
          localStorage.setItem(STORAGE_KEYS.CUSTOMER_DEVICES, JSON.stringify(data));
        }, (err) => console.warn('CustomerDevices sync error:', err));

        unsubscribeClosures = onSnapshot(collection(db, 'cashClosures'), (snapshot) => {
          const data: DailyCashClosure[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as DailyCashClosure));
          data.sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());
          setCashClosures(data);
          localStorage.setItem(STORAGE_KEYS.CASH_CLOSURES, JSON.stringify(data));
        }, (err) => console.warn('CashClosures sync error:', err));

        unsubscribeSuppliers = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
          const data: Supplier[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as Supplier));
          setSuppliers(data);
          localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(data));
        }, (err) => console.warn('Suppliers sync error:', err));

        unsubscribePurchases = onSnapshot(collection(db, 'purchases'), (snapshot) => {
          const data: Purchase[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as Purchase));
          data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setPurchases(data);
          localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(data));
        }, (err) => console.warn('Purchases sync error:', err));

        unsubscribeExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
          const data: Expense[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as Expense));
          data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setExpenses(data);
          localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data));
        }, (err) => console.warn('Expenses sync error:', err));

        unsubscribeProformas = onSnapshot(collection(db, 'proformas'), (snapshot) => {
          const data: Proforma[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as Proforma));
          data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setProformas(data);
          localStorage.setItem(STORAGE_KEYS.PROFORMAS, JSON.stringify(data));
        }, (err) => console.warn('Proformas sync error:', err));

        unsubscribeWarehouses = onSnapshot(collection(db, 'warehouses'), (snapshot) => {
          const data: Warehouse[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as Warehouse));
          setWarehouses(data);
          localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(data));
        }, (err) => console.warn('Warehouses sync error:', err));

        unsubscribeTransfers = onSnapshot(collection(db, 'stockTransfers'), (snapshot) => {
          const data: StockTransfer[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as StockTransfer));
          data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setStockTransfers(data);
          localStorage.setItem(STORAGE_KEYS.STOCK_TRANSFERS, JSON.stringify(data));
        }, (err) => console.warn('StockTransfers sync error:', err));

        unsubscribeBatches = onSnapshot(collection(db, 'batches'), (snapshot) => {
          const data: ProductBatch[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as ProductBatch));
          setBatches(data);
          localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(data));
        }, (err) => console.warn('Batches sync error:', err));

        unsubscribeCommissions = onSnapshot(collection(db, 'commissionPayments'), (snapshot) => {
          const data: CommissionPayment[] = [];
          snapshot.forEach((docSnap) => data.push(docSnap.data() as CommissionPayment));
          data.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
          setCommissionPayments(data);
          localStorage.setItem(STORAGE_KEYS.COMMISSION_PAYMENTS, JSON.stringify(data));
        }, (err) => console.warn('CommissionPayments sync error:', err));

        unsubscribeBackups = onSnapshot(collection(db, 'database_backups'), (snapshot) => {
          const data: DatabaseBackup[] = [];
          snapshot.forEach((docSnap) => {
            const b = docSnap.data() as DatabaseBackup;
            data.push(b);
          });
          data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setBackups(data);
          localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(data));
        }, (err) => console.warn('Backups sync error:', err));

        unsubscribeSettings = onSnapshot(doc(db, 'systemSettings', 'general'), (docSnap) => {
          if (docSnap.exists()) {
            const remote = docSnap.data() as SystemSettings;
            setSystemSettings((prev) => ({ ...prev, ...remote }));
            localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(remote));
          }
        }, (err) => console.warn('Settings sync error:', err));

      } catch (error) {
        console.warn('Firebase setup fallback to local storage:', error);
        setSyncStatus('offline');
        setIsCloudSynced(false);
      }
    };

    setupFirebaseSync();

    return () => {
      unsubscribeClients();
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribePayments();
      unsubscribeMovements();
      unsubscribeDevices();
      unsubscribeClosures();
      unsubscribeSuppliers();
      unsubscribePurchases();
      unsubscribeExpenses();
      unsubscribeProformas();
      unsubscribeWarehouses();
      unsubscribeTransfers();
      unsubscribeBatches();
      unsubscribeCommissions();
      unsubscribeBackups();
      unsubscribeSettings();
    };
  }, []);

  // Forçar Sincronização em Tempo Real com a Nuvem e Atualização de Cache
  const syncWithCloud = async () => {
    setSyncStatus('connecting');
    try {
      const isConnected = await testFirestoreConnection();
      if (!isConnected) {
        setSyncStatus('offline');
        setIsCloudSynced(false);
        return;
      }

      setSyncStatus('online');
      setIsCloudSynced(true);

      const clientsSnap = await getDocs(collection(db, 'clients'));
      const clientsData: Client[] = [];
      clientsSnap.forEach(d => clientsData.push(d.data() as Client));
      setClients(clientsData);
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clientsData));

      const ordersSnap = await getDocs(collection(db, 'orders'));
      const ordersData: Order[] = [];
      ordersSnap.forEach(d => ordersData.push(d.data() as Order));
      ordersData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(ordersData);
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(ordersData));

      const paymentsSnap = await getDocs(collection(db, 'payments'));
      const paymentsData: Payment[] = [];
      paymentsSnap.forEach(d => paymentsData.push(d.data() as Payment));
      paymentsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPayments(paymentsData);
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(paymentsData));

      const productsSnap = await getDocs(collection(db, 'products'));
      const productsData: Product[] = [];
      productsSnap.forEach(d => productsData.push(d.data() as Product));
      setProducts(productsData);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(productsData));

      const devicesSnap = await getDocs(collection(db, 'customerDevices'));
      const devicesData: CustomerMediaDevice[] = [];
      devicesSnap.forEach(d => devicesData.push(d.data() as CustomerMediaDevice));
      devicesData.sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
      setCustomerDevices(devicesData);
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_DEVICES, JSON.stringify(devicesData));

      const settingsSnap = await getDoc(doc(db, 'systemSettings', 'general'));
      if (settingsSnap.exists()) {
        const s = settingsSnap.data() as SystemSettings;
        setSystemSettings(prev => ({ ...prev, ...s }));
        localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(s));
      }

      // Re-verificar Service Worker para novas atualizações
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) reg.update().catch(() => {});
        });
      }
    } catch (err) {
      console.warn('Manual sync warning:', err);
      setSyncStatus('offline');
      setIsCloudSynced(false);
    }
  };

  // Client Summaries & Totals
  const getClientSummary = (clientId: string): ClientFinancialSummary | null => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return null;

    const clientOrders = orders.filter((o) => o.clientId === clientId && o.status !== 'cancelada');
    const clientPayments = payments.filter((p) => p.clientId === clientId);

    const totalPurchased = clientOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
    const currentDebt = totalPurchased - totalPaid;

    const dates = [
      ...clientOrders.map((o) => o.date),
      ...clientPayments.map((p) => p.date),
    ].sort();
    const lastMovementDate = dates.length > 0 ? dates[dates.length - 1] : client.createdAt;

    return {
      client,
      totalPurchased,
      totalPaid,
      currentDebt,
      orderCount: clientOrders.length,
      paymentCount: clientPayments.length,
      lastMovementDate,
    };
  };

  const clientSummaries: ClientFinancialSummary[] = clients.map((c) => {
    const summary = getClientSummary(c.id);
    if (summary) return summary;
    return {
      client: c,
      totalPurchased: 0,
      totalPaid: 0,
      currentDebt: 0,
      orderCount: 0,
      paymentCount: 0,
      lastMovementDate: c.createdAt,
    };
  });

  const totalSales = orders
    .filter((o) => o.status !== 'cancelada')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  const totalDebt = clientSummaries
    .filter((s) => s.currentDebt > 0)
    .reduce((sum, s) => sum + s.currentDebt, 0);

  // Client Operations
  const addClient = (data: { name: string; phone: string; location: string; notes?: string }): Client => {
    const newCodeNum = clients.length + 1;
    const newClient: Client = {
      id: `cli-${Date.now()}`,
      code: `CLI-${String(newCodeNum).padStart(3, '0')}`,
      name: data.name.trim(),
      phone: data.phone.trim(),
      location: data.location.trim(),
      notes: data.notes?.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    
    // Optimistic local state update
    setClients((prev) => [newClient, ...prev]);

    // Push to cloud
    setDoc(doc(db, 'clients', newClient.id), newClient).catch((err) => {
      console.warn('Failed to save client to Firestore:', err);
    });

    return newClient;
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );

    const client = clients.find((c) => c.id === id);
    if (client) {
      setDoc(doc(db, 'clients', id), { ...client, ...data }).catch((err) => {
        console.warn('Failed to update client in Firestore:', err);
      });
    }
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    deleteDoc(doc(db, 'clients', id)).catch((err) => {
      console.warn('Failed to delete client from Firestore:', err);
    });
  };

  // Product Operations
  const addProduct = (data: Omit<Product, 'id' | 'code' | 'createdAt'>): Product => {
    const prefix = data.type === 'digital' ? 'DIG' : data.type === 'physical' ? 'FIS' : 'SRV';
    const newCodeNum = products.length + 1;
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      code: `${prefix}-${String(newCodeNum).padStart(3, '0')}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    
    setProducts((prev) => [newProduct, ...prev]);

    setDoc(doc(db, 'products', newProduct.id), newProduct).catch((err) => {
      console.warn('Failed to save product to Firestore:', err);
    });

    return newProduct;
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );

    const prod = products.find((p) => p.id === id);
    if (prod) {
      setDoc(doc(db, 'products', id), { ...prod, ...data }).catch((err) => {
        console.warn('Failed to update product in Firestore:', err);
      });
    }
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    deleteDoc(doc(db, 'products', id)).catch((err) => {
      console.warn('Failed to delete product in Firestore:', err);
    });
  };

  const adjustStock = (
    productId: string, 
    type: 'entrada' | 'saida_perda' | 'ajuste', 
    quantity: number, 
    notes?: string
  ) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct || targetProduct.type !== 'physical') return;

    const previousStock = targetProduct.stockQuantity;
    let newStock = previousStock;

    if (type === 'entrada') {
      newStock = previousStock + quantity;
    } else if (type === 'saida_perda') {
      newStock = Math.max(0, previousStock - quantity);
    } else if (type === 'ajuste') {
      newStock = Math.max(0, quantity);
    }

    // Update Product Stock
    updateProduct(productId, { stockQuantity: newStock });

    // Record Stock Movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId,
      productName: targetProduct.name,
      type,
      quantity,
      previousStock,
      newStock,
      date: new Date().toISOString().slice(0, 10),
      notes: notes || 'Ajuste manual de stock',
    };
    setStockMovements((prev) => [movement, ...prev]);

    setDoc(doc(db, 'stockMovements', movement.id), movement).catch((err) => {
      console.warn('Failed to save stock movement to Firestore:', err);
    });
  };

  // Order Operations
  const createOrder = (data: {
    clientId: string;
    date: string;
    items: OrderItem[];
    amountPaidNow: number;
    paymentMethod?: PaymentMethod;
    deliveryType?: 'Digital/Partilha' | 'Entrega Física' | 'Mista';
    notes?: string;
  }): { order: Order; payment?: Payment } => {
    const client = clients.find((c) => c.id === data.clientId);
    const clientName = client ? client.name : 'Cliente Não Registado';

    const totalAmount = data.items.reduce((sum, item) => sum + item.subtotal, 0);
    const balanceDue = Math.max(0, totalAmount - data.amountPaidNow);

    let status: Order['status'] = 'pendente';
    if (balanceDue === 0) {
      status = 'paga';
    } else if (data.amountPaidNow > 0) {
      status = 'parcial';
    }

    const orderNum = `ENC-${String(orders.length + 1).padStart(4, '0')}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      clientId: data.clientId,
      clientName,
      items: data.items,
      totalAmount,
      amountPaid: data.amountPaidNow,
      balanceDue,
      date: data.date,
      status,
      deliveryType: data.deliveryType || 'Mista',
      notes: data.notes,
    };

    // 1. Deduct stock for physical products in the order
    data.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && prod.type === 'physical') {
        const prevStock = prod.stockQuantity;
        const newStock = Math.max(0, prevStock - item.quantity);
        updateProduct(prod.id, { stockQuantity: newStock });

        const movement: StockMovement = {
          id: `mov-${Date.now()}-${item.productId}`,
          productId: prod.id,
          productName: prod.name,
          type: 'saida_venda',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock,
          date: data.date,
          orderNumber: newOrder.orderNumber,
          notes: `Saída por encomenda ${newOrder.orderNumber}`,
        };
        setStockMovements((prev) => [movement, ...prev]);
        setDoc(doc(db, 'stockMovements', movement.id), movement).catch(() => {});
      }
    });

    // 2. Add Order to local state & Firestore
    setOrders((prev) => [newOrder, ...prev]);
    setDoc(doc(db, 'orders', newOrder.id), newOrder).catch(() => {});

    // 3. If there was a payment on creation, register it
    let createdPayment: Payment | undefined;
    if (data.amountPaidNow > 0 && data.paymentMethod) {
      const payNum = `REC-${String(payments.length + 1).padStart(4, '0')}`;
      createdPayment = {
        id: `pay-${Date.now()}`,
        receiptNumber: payNum,
        clientId: data.clientId,
        clientName,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        amount: data.amountPaidNow,
        method: data.paymentMethod,
        type: balanceDue === 0 ? 'Liquidação total' : 'Adiantamento',
        date: data.date,
        notes: `Pagamento inicial da encomenda ${newOrder.orderNumber}`,
      };
      setPayments((prev) => [createdPayment!, ...prev]);
      setDoc(doc(db, 'payments', createdPayment.id), createdPayment).catch(() => {});
    }

    return { order: newOrder, payment: createdPayment };
  };

  const updateOrder = (
    orderId: string,
    data: {
      clientId: string;
      date: string;
      items: OrderItem[];
      amountPaid: number;
      deliveryType?: 'Digital/Partilha' | 'Entrega Física' | 'Mista';
      status?: Order['status'];
      notes?: string;
    }
  ): Order => {
    const existing = orders.find((o) => o.id === orderId);
    if (!existing) {
      throw new Error(`Encomenda ${orderId} não encontrada`);
    }

    const client = clients.find((c) => c.id === data.clientId);
    const clientName = client ? client.name : existing.clientName;

    const totalAmount = data.items.reduce((sum, item) => sum + item.subtotal, 0);
    const validAmountPaid = Math.max(0, data.amountPaid);
    const balanceDue = Math.max(0, totalAmount - validAmountPaid);

    let status: Order['status'] = data.status || 'pendente';
    if (!data.status) {
      if (balanceDue === 0) {
        status = 'paga';
      } else if (validAmountPaid > 0) {
        status = 'parcial';
      } else {
        status = 'pendente';
      }
    }

    // Adjust stock difference for physical items
    const oldPhysicalQtyMap = new Map<string, number>();
    existing.items.forEach((item) => {
      if (item.productType === 'physical') {
        oldPhysicalQtyMap.set(item.productId, (oldPhysicalQtyMap.get(item.productId) || 0) + item.quantity);
      }
    });

    const newPhysicalQtyMap = new Map<string, number>();
    data.items.forEach((item) => {
      if (item.productType === 'physical') {
        newPhysicalQtyMap.set(item.productId, (newPhysicalQtyMap.get(item.productId) || 0) + item.quantity);
      }
    });

    // Check all touched product IDs
    const allProdIds = new Set([...oldPhysicalQtyMap.keys(), ...newPhysicalQtyMap.keys()]);
    allProdIds.forEach((prodId) => {
      const oldQty = oldPhysicalQtyMap.get(prodId) || 0;
      const newQty = newPhysicalQtyMap.get(prodId) || 0;
      const diff = newQty - oldQty; // If positive, we need to subtract more stock; if negative, restore stock

      if (diff !== 0) {
        const prod = products.find((p) => p.id === prodId);
        if (prod && prod.type === 'physical') {
          const prevStock = prod.stockQuantity;
          const adjustedStock = Math.max(0, prevStock - diff);
          updateProduct(prod.id, { stockQuantity: adjustedStock });

          const movement: StockMovement = {
            id: `mov-${Date.now()}-${prod.id}`,
            productId: prod.id,
            productName: prod.name,
            type: diff > 0 ? 'saida_venda' : 'entrada',
            quantity: Math.abs(diff),
            previousStock: prevStock,
            newStock: adjustedStock,
            date: data.date,
            orderNumber: existing.orderNumber,
            notes: `Ajuste por edição da encomenda ${existing.orderNumber} (${diff > 0 ? 'mais' : 'menos'} ${Math.abs(diff)} un)`,
          };
          setStockMovements((prev) => [movement, ...prev]);
          setDoc(doc(db, 'stockMovements', movement.id), movement).catch(() => {});
        }
      }
    });

    const updatedOrder: Order = {
      ...existing,
      clientId: data.clientId,
      clientName,
      date: data.date,
      items: data.items,
      totalAmount,
      amountPaid: validAmountPaid,
      balanceDue,
      status,
      deliveryType: data.deliveryType || existing.deliveryType || 'Mista',
      notes: data.notes !== undefined ? data.notes : existing.notes,
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
    setDoc(doc(db, 'orders', orderId), updatedOrder).catch((err) => {
      console.warn('Erro ao atualizar encomenda no Firestore:', err);
    });

    return updatedOrder;
  };

  const batchUpdateCategoryPrices = (
    category: ProductCategory, 
    adjustment: { type: 'percent' | 'fixed' | 'set'; value: number }
  ) => {
    const updatedProducts: Product[] = [];
    setProducts((prev) =>
      prev.map((p) => {
        if (p.category !== category) return p;

        let newPrice = p.price;
        if (adjustment.type === 'percent') {
          newPrice = Math.round(p.price * (1 + adjustment.value / 100));
        } else if (adjustment.type === 'fixed') {
          newPrice = Math.max(0, p.price + adjustment.value);
        } else if (adjustment.type === 'set') {
          newPrice = Math.max(0, adjustment.value);
        }

        const updated = { ...p, price: newPrice };
        updatedProducts.push(updated);
        return updated;
      })
    );

    // Sync each updated product to Firestore
    updatedProducts.forEach((p) => {
      setDoc(doc(db, 'products', p.id), p).catch(() => {});
    });
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    deleteDoc(doc(db, 'orders', orderId)).catch(() => {});
  };

  // Payment Operations
  const createPayment = (data: {
    clientId: string;
    amount: number;
    method: PaymentMethod;
    type: PaymentType;
    date: string;
    orderId?: string;
    notes?: string;
  }): Payment => {
    const client = clients.find((c) => c.id === data.clientId);
    const clientName = client ? client.name : 'Cliente Desconhecido';

    let orderNumber: string | undefined;
    if (data.orderId) {
      const targetOrder = orders.find((o) => o.id === data.orderId);
      if (targetOrder) {
        orderNumber = targetOrder.orderNumber;
        const newPaid = targetOrder.amountPaid + data.amount;
        const newBalance = Math.max(0, targetOrder.totalAmount - newPaid);
        const newStatus: Order['status'] = newBalance === 0 ? 'paga' : 'parcial';

        updateOrderFinancials(targetOrder.id, newPaid, newBalance, newStatus);
      }
    }

    const payNum = `REC-${String(payments.length + 1).padStart(4, '0')}`;
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      receiptNumber: payNum,
      clientId: data.clientId,
      clientName,
      orderId: data.orderId,
      orderNumber,
      amount: data.amount,
      method: data.method,
      type: data.type,
      date: data.date,
      notes: data.notes,
    };

    setPayments((prev) => [newPayment, ...prev]);
    setDoc(doc(db, 'payments', newPayment.id), newPayment).catch(() => {});

    return newPayment;
  };

  const updateOrderFinancials = (orderId: string, amountPaid: number, balanceDue: number, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, amountPaid, balanceDue, status } : o))
    );

    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      setDoc(doc(db, 'orders', orderId), { ...ord, amountPaid, balanceDue, status }).catch(() => {});
    }
  };

  const deletePayment = (paymentId: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
    deleteDoc(doc(db, 'payments', paymentId)).catch(() => {});
  };

  // Export Excel
  const exportExcel = () => {
    exportFullExcelReport({
      clients,
      products,
      orders,
      payments,
      stockMovements,
      clientSummaries,
      totals: {
        totalSales,
        totalReceived,
        totalDebt,
      },
    });
  };

  // ==========================================
  // BACKUP AUTOMÁTICO & DESCARREGAR JSON
  // ==========================================
  const getDataSource = (): BackupDataSource => ({
    clients,
    products,
    orders,
    payments,
    stockMovements,
    customerDevices,
    cashClosures,
    suppliers,
    purchases,
    expenses,
    proformas,
    warehouses,
    stockTransfers,
    batches,
    commissionPayments,
  });

  const updateAutoBackupConfig = (config: Partial<AutoBackupConfig>) => {
    setAutoBackupConfig((prev) => {
      const updated = { ...prev, ...config };
      localStorage.setItem(STORAGE_KEYS.AUTO_BACKUP_CONFIG, JSON.stringify(updated));
      setDoc(doc(db, 'system_settings', 'auto_backup'), updated, { merge: true }).catch(() => {});
      return updated;
    });
  };

  const createBackup = async (type: 'automatic' | 'manual' = 'manual', customName?: string): Promise<DatabaseBackup> => {
    setIsBackingUp(true);
    try {
      const dataSource = getDataSource();
      const { backup, fullExport } = buildBackupPayload(dataSource, type, customName);

      // Save locally
      setBackups((prev) => {
        const filtered = prev.filter((b) => b.id !== backup.id);
        const updated = [backup, ...filtered].slice(0, autoBackupConfig.maxStoredBackups || 20);
        localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(updated));
        return updated;
      });

      if (type === 'automatic') {
        const nowIso = new Date().toISOString();
        setLastAutoBackupTime(nowIso);
        localStorage.setItem('gcv_last_auto_backup_time', nowIso);
        setAutoBackupConfig((prev) => {
          const next = { ...prev, lastBackupAt: nowIso };
          localStorage.setItem(STORAGE_KEYS.AUTO_BACKUP_CONFIG, JSON.stringify(next));
          return next;
        });
      }

      // Save to Firestore
      try {
        await setDoc(doc(db, 'database_backups', backup.id), backup);
        if (type === 'automatic') {
          await setDoc(doc(db, 'system_settings', 'auto_backup'), {
            lastBackupAt: new Date().toISOString(),
            lastBackupId: backup.id,
          }, { merge: true });
        }
      } catch (cloudErr) {
        console.warn('Backup guardado localmente, erro no Firestore:', cloudErr);
      }

      return backup;
    } finally {
      setIsBackingUp(false);
    }
  };

  const downloadBackupJSON = (backupId?: string) => {
    if (backupId) {
      const found = backups.find((b) => b.id === backupId);
      if (found && found.payload) {
        const dateStr = new Date(found.createdAt).toISOString().slice(0, 10);
        downloadJSONFile(found.payload, `Backup_Firestore_Gestao_${dateStr}_${found.id.slice(-6)}.json`);
        return;
      }
    }

    // Default: fresh live snapshot
    const dataSource = getDataSource();
    const { backup, fullExport } = buildBackupPayload(dataSource, 'manual', 'Download Direto');
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
    downloadJSONFile(fullExport, `Backup_Firestore_GestaoVendas_${dateStr}_${timeStr}.json`);

    // Register in Firestore as well
    setDoc(doc(db, 'database_backups', backup.id), backup).catch(() => {});
    setBackups((prev) => [backup, ...prev.filter((b) => b.id !== backup.id)]);
  };

  const deleteBackup = async (backupId: string) => {
    setBackups((prev) => {
      const updated = prev.filter((b) => b.id !== backupId);
      localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(updated));
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'database_backups', backupId));
    } catch (err) {
      console.warn('Erro ao eliminar backup do Firestore:', err);
    }
  };

  const restoreFromBackup = async (backup: DatabaseBackup): Promise<boolean> => {
    if (!backup || !backup.payload) return false;
    const jsonStr = JSON.stringify(backup.payload);
    return importJSONBackup(jsonStr);
  };

  // Export Backup JSON (backward compatible)
  const exportJSONBackup = () => {
    downloadBackupJSON();
  };

  // Import Backup JSON
  const importJSONBackup = (jsonContent: string): boolean => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed && parsed.data) {
        if (Array.isArray(parsed.data.clients)) {
          setClients(parsed.data.clients);
          parsed.data.clients.forEach((c: Client) => setDoc(doc(db, 'clients', c.id), c));
        }
        if (Array.isArray(parsed.data.products)) {
          setProducts(parsed.data.products);
          parsed.data.products.forEach((p: Product) => setDoc(doc(db, 'products', p.id), p));
        }
        if (Array.isArray(parsed.data.orders)) {
          setOrders(parsed.data.orders);
          parsed.data.orders.forEach((o: Order) => setDoc(doc(db, 'orders', o.id), o));
        }
        if (Array.isArray(parsed.data.payments)) {
          setPayments(parsed.data.payments);
          parsed.data.payments.forEach((p: Payment) => setDoc(doc(db, 'payments', p.id), p));
        }
        if (Array.isArray(parsed.data.stockMovements)) {
          setStockMovements(parsed.data.stockMovements);
          parsed.data.stockMovements.forEach((m: StockMovement) => setDoc(doc(db, 'stockMovements', m.id), m));
        }
        if (Array.isArray(parsed.data.suppliers)) {
          setSuppliers(parsed.data.suppliers);
          parsed.data.suppliers.forEach((s: Supplier) => setDoc(doc(db, 'suppliers', s.id), s));
        }
        if (Array.isArray(parsed.data.purchases)) {
          setPurchases(parsed.data.purchases);
          parsed.data.purchases.forEach((pu: Purchase) => setDoc(doc(db, 'purchases', pu.id), pu));
        }
        if (Array.isArray(parsed.data.expenses)) {
          setExpenses(parsed.data.expenses);
          parsed.data.expenses.forEach((e: Expense) => setDoc(doc(db, 'expenses', e.id), e));
        }
        if (Array.isArray(parsed.data.proformas)) {
          setProformas(parsed.data.proformas);
          parsed.data.proformas.forEach((pr: Proforma) => setDoc(doc(db, 'proformas', pr.id), pr));
        }
        if (Array.isArray(parsed.data.warehouses)) {
          setWarehouses(parsed.data.warehouses);
          parsed.data.warehouses.forEach((w: Warehouse) => setDoc(doc(db, 'warehouses', w.id), w));
        }
        if (Array.isArray(parsed.data.stockTransfers)) {
          setStockTransfers(parsed.data.stockTransfers);
          parsed.data.stockTransfers.forEach((t: StockTransfer) => setDoc(doc(db, 'stockTransfers', t.id), t));
        }
        if (Array.isArray(parsed.data.batches)) {
          setBatches(parsed.data.batches);
          parsed.data.batches.forEach((b: ProductBatch) => setDoc(doc(db, 'batches', b.id), b));
        }
        if (Array.isArray(parsed.data.customerDevices)) {
          setCustomerDevices(parsed.data.customerDevices);
          parsed.data.customerDevices.forEach((d: CustomerMediaDevice) => setDoc(doc(db, 'customerDevices', d.id), d));
        }
        if (Array.isArray(parsed.data.cashClosures)) {
          setCashClosures(parsed.data.cashClosures);
          parsed.data.cashClosures.forEach((c: DailyCashClosure) => setDoc(doc(db, 'cashClosures', c.id), c));
        }
        if (Array.isArray(parsed.data.commissionPayments)) {
          setCommissionPayments(parsed.data.commissionPayments);
          parsed.data.commissionPayments.forEach((cp: CommissionPayment) => setDoc(doc(db, 'commissionPayments', cp.id), cp));
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Automated Backup scheduler
  useEffect(() => {
    if (!autoBackupConfig.enabled) return;

    const checkAndRunAutoBackup = async () => {
      const now = Date.now();
      const last = autoBackupConfig.lastBackupAt 
        ? new Date(autoBackupConfig.lastBackupAt).getTime() 
        : (lastAutoBackupTime ? new Date(lastAutoBackupTime).getTime() : 0);
      
      const intervalMs = (autoBackupConfig.frequencyHours || 6) * 3600 * 1000;
      
      if (now - last >= intervalMs) {
        console.log('Executando backup automático periódico no Firestore...');
        await createBackup('automatic');
      }
    };

    const initialTimer = setTimeout(checkAndRunAutoBackup, 6000);
    const intervalTimer = setInterval(checkAndRunAutoBackup, 15 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [autoBackupConfig.enabled, autoBackupConfig.frequencyHours, autoBackupConfig.lastBackupAt, lastAutoBackupTime]);

  // Media Devices management (Pens, Discos, Computadores de Clientes)
  const addCustomerDevice = (data: Omit<CustomerMediaDevice, 'id' | 'deviceNumber'>): CustomerMediaDevice => {
    let prefix = 'DEV';
    if (data.deviceType.includes('Pen')) prefix = 'PEN';
    else if (data.deviceType === 'HDD' || data.deviceType.includes('HDD')) prefix = 'HDD';
    else if (data.deviceType === 'SSD' || data.deviceType.includes('SSD')) prefix = 'SSD';
    else if (data.deviceType.includes('Micro SD') || data.deviceType.includes('Cartão')) prefix = 'SD';
    else if (data.deviceType.includes('Computador') || data.deviceType.includes('Laptop') || data.deviceType.includes('Desktop')) prefix = 'PC';
    
    const num = (customerDevices.length + 1).toString().padStart(3, '0');
    const newDevice: CustomerMediaDevice = {
      ...data,
      id: `dev-${Date.now()}`,
      deviceNumber: `${prefix}-${num}`,
    };

    setCustomerDevices((prev) => [newDevice, ...prev]);
    if (isCloudSynced) {
      setDoc(doc(db, 'customerDevices', newDevice.id), newDevice).catch(() => {});
    }
    return newDevice;
  };

  const updateCustomerDevice = (id: string, data: Partial<CustomerMediaDevice>) => {
    setCustomerDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...data } : d))
    );
    if (isCloudSynced) {
      setDoc(doc(db, 'customerDevices', id), data, { merge: true }).catch(() => {});
    }
  };

  const deleteCustomerDevice = (id: string) => {
    setCustomerDevices((prev) => prev.filter((d) => d.id !== id));
    if (isCloudSynced) {
      deleteDoc(doc(db, 'customerDevices', id)).catch(() => {});
    }
  };

  // Daily Cash Register Closures
  const getDailyCashSummary = (dateStr?: string) => {
    const targetDate = dateStr || new Date().toISOString().slice(0, 10);
    const dayOrders = orders.filter((o) => o.date.slice(0, 10) === targetDate);
    const dayPayments = payments.filter((p) => p.date.slice(0, 10) === targetDate);

    const totalSales = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalReceived = dayPayments.reduce((sum, p) => sum + p.amount, 0);

    const byMethod = {
      numerario: 0,
      mpesa: 0,
      emola: 0,
      ponto24: 0,
      banco: 0,
    };

    dayPayments.forEach((p) => {
      const m = p.method?.toLowerCase() || '';
      if (m.includes('numer') || m.includes('dinheiro') || m.includes('cash')) {
        byMethod.numerario += p.amount;
      } else if (m.includes('mpesa') || m.includes('m-pesa')) {
        byMethod.mpesa += p.amount;
      } else if (m.includes('emola') || m.includes('e-mola')) {
        byMethod.emola += p.amount;
      } else if (m.includes('ponto') || m.includes('pos') || m.includes('cartao')) {
        byMethod.ponto24 += p.amount;
      } else {
        byMethod.banco += p.amount;
      }
    });

    return {
      date: targetDate,
      totalSales,
      totalReceived,
      byMethod,
      orderCount: dayOrders.length,
      paymentCount: dayPayments.length,
    };
  };

  const createCashClosure = (data: Omit<DailyCashClosure, 'id' | 'closedAt'>): DailyCashClosure => {
    const closure: DailyCashClosure = {
      ...data,
      id: `closure-${Date.now()}`,
      closedAt: new Date().toISOString(),
    };

    setCashClosures((prev) => [closure, ...prev]);
    if (isCloudSynced) {
      setDoc(doc(db, 'cashClosures', closure.id), closure).catch(() => {});
    }
    return closure;
  };

  const deleteCashClosure = (closureId: string) => {
    setCashClosures((prev) => prev.filter((c) => c.id !== closureId));
    if (isCloudSynced) {
      deleteDoc(doc(db, 'cashClosures', closureId)).catch(() => {});
    }
  };

  // ==========================================
  // ERP: FORNECEDORES
  // ==========================================
  const addSupplier = (data: Omit<Supplier, 'id' | 'code' | 'createdAt'>): Supplier => {
    const code = `FORN-${String(suppliers.length + 1).padStart(3, '0')}`;
    const newSupplier: Supplier = {
      ...data,
      id: `forn-${Date.now()}`,
      code,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setSuppliers((prev) => [newSupplier, ...prev]);
    if (isCloudSynced) {
      setDoc(doc(db, 'suppliers', newSupplier.id), newSupplier).catch(() => {});
    }
    return newSupplier;
  };

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    if (isCloudSynced) {
      setDoc(doc(db, 'suppliers', id), data, { merge: true }).catch(() => {});
    }
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    if (isCloudSynced) {
      deleteDoc(doc(db, 'suppliers', id)).catch(() => {});
    }
  };

  // ==========================================
  // ERP: COMPRAS DE FORNECEDORES & ENTRADAS DE STOCK
  // ==========================================
  const createPurchase = (data: Omit<Purchase, 'id' | 'purchaseNumber' | 'createdAt'>): Purchase => {
    const purchaseNumber = `COMP-${String(purchases.length + 1).padStart(4, '0')}`;
    const totalAmount = data.items.reduce((sum, it) => sum + it.subtotal, 0);
    const amountPaid = Math.max(0, data.amountPaid || 0);
    const balanceDue = Math.max(0, totalAmount - amountPaid);
    
    let paymentStatus: PurchasePaymentStatus = 'pendente';
    if (balanceDue === 0 && totalAmount > 0) {
      paymentStatus = 'pago';
    } else if (amountPaid > 0) {
      paymentStatus = 'parcial';
    }

    const newPurchase: Purchase = {
      ...data,
      id: `comp-${Date.now()}`,
      purchaseNumber,
      totalAmount,
      amountPaid,
      balanceDue,
      paymentStatus: data.paymentStatus || paymentStatus,
      createdAt: new Date().toISOString(),
    };

    // Incrementar stock físico e atualizar custos dos produtos comprados
    const newMovements: StockMovement[] = [];
    const newBatchesList: ProductBatch[] = [];

    data.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && prod.type === 'physical') {
        const updatedQty = (prod.stockQuantity || 0) + item.quantity;
        const updatedWarehouseStock = { ...(prod.warehouseStock || {}) };
        if (item.warehouseId) {
          updatedWarehouseStock[item.warehouseId] = (updatedWarehouseStock[item.warehouseId] || 0) + item.quantity;
        }

        const updatedProduct: Product = {
          ...prod,
          stockQuantity: updatedQty,
          costPrice: item.costPrice > 0 ? item.costPrice : prod.costPrice,
          warehouseStock: updatedWarehouseStock,
        };

        setProducts((prev) => prev.map((p) => (p.id === prod.id ? updatedProduct : p)));
        if (isCloudSynced) {
          setDoc(doc(db, 'products', prod.id), updatedProduct, { merge: true }).catch(() => {});
        }

        // Criar registo de movimento de stock de entrada
        const movement: StockMovement = {
          id: `mov-${Date.now()}-${item.productId}`,
          productId: prod.id,
          productCode: prod.code,
          productName: prod.name,
          type: 'entrada',
          quantity: item.quantity,
          previousStock: prod.stockQuantity || 0,
          newStock: updatedQty,
          date: data.date,
          notes: `Entrada por compra ${purchaseNumber} (${data.supplierName})`,
        };
        newMovements.push(movement);
        if (isCloudSynced) {
          setDoc(doc(db, 'stockMovements', movement.id), movement).catch(() => {});
        }

        // Se o item contém lote e validade, registar na tabela de lotes
        if (item.batchNumber && item.expiryDate) {
          const batchRecord: ProductBatch = {
            id: `batch-${Date.now()}-${item.productId}`,
            productId: prod.id,
            productCode: prod.code,
            productName: prod.name,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            quantity: item.quantity,
            warehouseId: item.warehouseId,
            warehouseName: item.warehouseName,
            costPrice: item.costPrice,
            createdAt: new Date().toISOString().slice(0, 10),
          };
          newBatchesList.push(batchRecord);
          if (isCloudSynced) {
            setDoc(doc(db, 'batches', batchRecord.id), batchRecord).catch(() => {});
          }
        }
      }
    });

    if (newMovements.length > 0) {
      setStockMovements((prev) => [...newMovements, ...prev]);
    }
    if (newBatchesList.length > 0) {
      setBatches((prev) => [...newBatchesList, ...prev]);
    }

    setPurchases((prev) => [newPurchase, ...prev]);
    if (isCloudSynced) {
      setDoc(doc(db, 'purchases', newPurchase.id), newPurchase).catch(() => {});
    }

    return newPurchase;
  };

  const updatePurchase = (id: string, data: Partial<Purchase>) => {
    setPurchases((prev) => prev.map((pu) => (pu.id === id ? { ...pu, ...data } : pu)));
    if (isCloudSynced) {
      setDoc(doc(db, 'purchases', id), data, { merge: true }).catch(() => {});
    }
  };

  const deletePurchase = (id: string) => {
    setPurchases((prev) => prev.filter((pu) => pu.id !== id));
    if (isCloudSynced) {
      deleteDoc(doc(db, 'purchases', id)).catch(() => {});
    }
  };

  const markPurchasePaid = (id: string, paymentMethod?: PaymentMethod) => {
    setPurchases((prev) =>
      prev.map((pu) => {
        if (pu.id === id) {
          const updated = {
            ...pu,
            amountPaid: pu.totalAmount,
            balanceDue: 0,
            paymentStatus: 'pago' as PurchasePaymentStatus,
            paymentMethod: paymentMethod || pu.paymentMethod || 'Transferência Bancária',
          };
          if (isCloudSynced) {
            setDoc(doc(db, 'purchases', id), updated, { merge: true }).catch(() => {});
          }
          return updated;
        }
        return pu;
      })
    );
  };

  // ==========================================
  // ERP: DESPESAS & CONTAS A PAGAR
  // ==========================================
  const createExpense = (data: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt'>): Expense => {
    const expenseNumber = `DESP-${String(expenses.length + 1).padStart(4, '0')}`;
    const newExpense: Expense = {
      ...data,
      id: `desp-${Date.now()}`,
      expenseNumber,
      createdAt: new Date().toISOString(),
      paidAt: data.status === 'paga' ? (data.paidAt || data.date) : undefined,
    };

    setExpenses((prev) => [newExpense, ...prev]);
    if (isCloudSynced) {
      setDoc(doc(db, 'expenses', newExpense.id), newExpense).catch(() => {});
    }
    return newExpense;
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
    if (isCloudSynced) {
      setDoc(doc(db, 'expenses', id), data, { merge: true }).catch(() => {});
    }
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (isCloudSynced) {
      deleteDoc(doc(db, 'expenses', id)).catch(() => {});
    }
  };

  const markExpensePaid = (id: string, paymentMethod?: PaymentMethod) => {
    const today = new Date().toISOString().slice(0, 10);
    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated: Expense = {
            ...e,
            status: 'paga',
            paidAt: today,
            paymentMethod: paymentMethod || e.paymentMethod || 'Numerário',
          };
          if (isCloudSynced) {
            setDoc(doc(db, 'expenses', id), updated, { merge: true }).catch(() => {});
          }
          return updated;
        }
        return e;
      })
    );
  };

  // ==========================================
  // ERP: ORÇAMENTOS / FATURAS PROFORMA
  // ==========================================
  const createProforma = (data: Omit<Proforma, 'id' | 'proformaNumber' | 'createdAt'>): Proforma => {
    const proformaNumber = `PROF-${String(proformas.length + 1).padStart(4, '0')}`;
    const newProforma: Proforma = {
      ...data,
      id: `prof-${Date.now()}`,
      proformaNumber,
      createdAt: new Date().toISOString(),
    };

    setProformas((prev) => [newProforma, ...prev]);
    if (isCloudSynced) {
      setDoc(doc(db, 'proformas', newProforma.id), newProforma).catch(() => {});
    }
    return newProforma;
  };

  const updateProforma = (id: string, data: Partial<Proforma>) => {
    setProformas((prev) => prev.map((pr) => (pr.id === id ? { ...pr, ...data } : pr)));
    if (isCloudSynced) {
      setDoc(doc(db, 'proformas', id), data, { merge: true }).catch(() => {});
    }
  };

  const deleteProforma = (id: string) => {
    setProformas((prev) => prev.filter((pr) => pr.id !== id));
    if (isCloudSynced) {
      deleteDoc(doc(db, 'proformas', id)).catch(() => {});
    }
  };

  const convertProformaToOrder = (
    proformaId: string,
    amountPaidNow: number = 0,
    paymentMethod: PaymentMethod = 'Numerário'
  ): { order: Order; payment?: Payment } => {
    const prof = proformas.find((p) => p.id === proformaId);
    if (!prof) {
      throw new Error(`Orçamento ${proformaId} não encontrado`);
    }

    const { order, payment } = createOrder({
      clientId: prof.clientId,
      date: new Date().toISOString().slice(0, 10),
      items: prof.items,
      amountPaidNow,
      paymentMethod,
      deliveryType: 'Mista',
      notes: `Convertido a partir do Orçamento/Proforma ${prof.proformaNumber}`,
    });

    // Marcar orçamento como convertido
    const updatedProf: Proforma = {
      ...prof,
      status: 'convertida',
      convertedOrderId: order.id,
    };
    setProformas((prev) => prev.map((p) => (p.id === proformaId ? updatedProf : p)));
    if (isCloudSynced) {
      setDoc(doc(db, 'proformas', proformaId), updatedProf, { merge: true }).catch(() => {});
    }

    return { order, payment };
  };

  // ==========================================
  // ERP: MULTI-ARMAZÉM & TRANSFERÊNCIAS
  // ==========================================
  const addWarehouse = (data: Omit<Warehouse, 'id' | 'code' | 'createdAt'>): Warehouse => {
    const code = `ARM-${String(warehouses.length + 1).padStart(2, '0')}`;
    const newWh: Warehouse = {
      ...data,
      id: `arm-${Date.now()}`,
      code,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setWarehouses((prev) => [newWh, ...prev]);
    if (isCloudSynced) {
      setDoc(doc(db, 'warehouses', newWh.id), newWh).catch(() => {});
    }
    return newWh;
  };

  const updateWarehouse = (id: string, data: Partial<Warehouse>) => {
    setWarehouses((prev) => prev.map((w) => (w.id === id ? { ...w, ...data } : w)));
    if (isCloudSynced) {
      setDoc(doc(db, 'warehouses', id), data, { merge: true }).catch(() => {});
    }
  };

  const deleteWarehouse = (id: string) => {
    setWarehouses((prev) => prev.filter((w) => w.id !== id));
    if (isCloudSynced) {
      deleteDoc(doc(db, 'warehouses', id)).catch(() => {});
    }
  };

  const createStockTransfer = (
    data: Omit<StockTransfer, 'id' | 'transferNumber' | 'createdAt'>
  ): { success: boolean; error?: string; transfer?: StockTransfer } => {
    const prod = products.find((p) => p.id === data.productId);
    if (!prod) {
      return { success: false, error: 'Produto não encontrado' };
    }

    // Verificar se armazém de origem tem stock disponível
    const fromWhStock = prod.warehouseStock?.[data.fromWarehouseId] ?? prod.stockQuantity ?? 0;
    if (fromWhStock < data.quantity) {
      return {
        success: false,
        error: `Stock insuficiente em ${data.fromWarehouseName} (Disponível: ${fromWhStock}, Solicitado: ${data.quantity})`,
      };
    }

    const transferNumber = `TRF-${String(stockTransfers.length + 1).padStart(4, '0')}`;
    const newTransfer: StockTransfer = {
      ...data,
      id: `trf-${Date.now()}`,
      transferNumber,
      status: 'concluida',
      createdAt: new Date().toISOString(),
    };

    // Atualizar stock nos armazéns
    const updatedWarehouseStock = { ...(prod.warehouseStock || {}) };
    updatedWarehouseStock[data.fromWarehouseId] = Math.max(0, fromWhStock - data.quantity);
    updatedWarehouseStock[data.toWarehouseId] = (updatedWarehouseStock[data.toWarehouseId] || 0) + data.quantity;

    const updatedProd: Product = {
      ...prod,
      warehouseStock: updatedWarehouseStock,
    };

    setProducts((prev) => prev.map((p) => (p.id === prod.id ? updatedProd : p)));
    if (isCloudSynced) {
      setDoc(doc(db, 'products', prod.id), updatedProd, { merge: true }).catch(() => {});
    }

    // Registar movimento de stock para auditoria
    const movement: StockMovement = {
      id: `mov-trf-${Date.now()}`,
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      type: 'ajuste',
      quantity: data.quantity,
      previousStock: prod.stockQuantity || 0,
      newStock: prod.stockQuantity || 0,
      date: data.date,
      notes: `Transferência ${transferNumber} (${data.fromWarehouseName} ➔ ${data.toWarehouseName})`,
    };
    setStockMovements((prev) => [movement, ...prev]);
    if (isCloudSynced) {
      setDoc(doc(db, 'stockMovements', movement.id), movement).catch(() => {});
    }

    setStockTransfers((prev) => [newTransfer, ...prev]);
    if (isCloudSynced) {
      setDoc(doc(db, 'stockTransfers', newTransfer.id), newTransfer).catch(() => {});
    }

    return { success: true, transfer: newTransfer };
  };

  // ==========================================
  // ERP: CONTROLO DE LOTES & VALIDADES
  // ==========================================
  const addBatch = (data: Omit<ProductBatch, 'id' | 'createdAt'>): ProductBatch => {
    const newBatch: ProductBatch = {
      ...data,
      id: `batch-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setBatches((prev) => [newBatch, ...prev]);
    if (isCloudSynced) {
      setDoc(doc(db, 'batches', newBatch.id), newBatch).catch(() => {});
    }
    return newBatch;
  };

  const updateBatch = (id: string, data: Partial<ProductBatch>) => {
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
    if (isCloudSynced) {
      setDoc(doc(db, 'batches', id), data, { merge: true }).catch(() => {});
    }
  };

  const deleteBatch = (id: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
    if (isCloudSynced) {
      deleteDoc(doc(db, 'batches', id)).catch(() => {});
    }
  };

  // ==========================================
  // ERP: COMISSÕES DE FUNCIONÁRIOS
  // ==========================================
  const createCommissionPayment = (
    data: Omit<CommissionPayment, 'id' | 'paymentNumber' | 'createdAt'>
  ): CommissionPayment => {
    const paymentNumber = `COM-${String(commissionPayments.length + 1).padStart(4, '0')}`;
    const newPayment: CommissionPayment = {
      ...data,
      id: `com-${Date.now()}`,
      paymentNumber,
      createdAt: new Date().toISOString(),
    };

    setCommissionPayments((prev) => [newPayment, ...prev]);
    if (isCloudSynced) {
      setDoc(doc(db, 'commissionPayments', newPayment.id), newPayment).catch(() => {});
    }
    return newPayment;
  };

  const deleteCommissionPayment = (paymentId: string) => {
    setCommissionPayments((prev) => prev.filter((p) => p.id !== paymentId));
    if (isCloudSynced) {
      deleteDoc(doc(db, 'commissionPayments', paymentId)).catch(() => {});
    }
  };

  // Financial Metrics & Real ERP Net Profit
  const totalExpenses = expenses
    .filter((e) => e.status === 'paga')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPendingExpenses = expenses
    .filter((e) => e.status === 'pendente')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPurchases = purchases
    .filter((p) => p.status !== 'cancelada')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  // Custo das mercadorias vendidas (CPV / COGS)
  const totalCostOfGoodsSold = orders
    .filter((o) => o.status !== 'cancelada')
    .reduce((orderSum, order) => {
      const orderCogs = order.items.reduce((itemSum, item) => {
        const prod = products.find((p) => p.id === item.productId);
        const itemCost = prod?.costPrice || (prod?.type === 'physical' ? item.unitPrice * 0.6 : 0);
        return itemSum + itemCost * item.quantity;
      }, 0);
      return orderSum + orderCogs;
    }, 0);

  // Lucro Real Líquido = Vendas - CPV - Despesas Pagas
  const netProfit = Math.max(0, totalSales - totalCostOfGoodsSold - totalExpenses);

  // Reset demo data
  const resetToDefaults = () => {
    setClients(initialClients);
    setProducts(initialProducts);
    setOrders(initialOrders);
    setPayments(initialPayments);
    setStockMovements(initialStockMovements);
    setCustomerDevices(initialCustomerDevices);
    setCashClosures([]);
    setSuppliers(initialSuppliers);
    setPurchases(initialPurchases);
    setExpenses(initialExpenses);
    setProformas(initialProformas);
    setWarehouses(initialWarehouses);
    setStockTransfers(initialStockTransfers);
    setBatches(initialBatches);
    setCommissionPayments(initialCommissionPayments);

    const batch = writeBatch(db);
    initialClients.forEach((c) => batch.set(doc(db, 'clients', c.id), c));
    initialProducts.forEach((p) => batch.set(doc(db, 'products', p.id), p));
    initialOrders.forEach((o) => batch.set(doc(db, 'orders', o.id), o));
    initialPayments.forEach((p) => batch.set(doc(db, 'payments', p.id), p));
    initialStockMovements.forEach((m) => batch.set(doc(db, 'stockMovements', m.id), m));
    initialCustomerDevices.forEach((d) => batch.set(doc(db, 'customerDevices', d.id), d));
    initialSuppliers.forEach((s) => batch.set(doc(db, 'suppliers', s.id), s));
    initialPurchases.forEach((pu) => batch.set(doc(db, 'purchases', pu.id), pu));
    initialExpenses.forEach((e) => batch.set(doc(db, 'expenses', e.id), e));
    initialProformas.forEach((pr) => batch.set(doc(db, 'proformas', pr.id), pr));
    initialWarehouses.forEach((w) => batch.set(doc(db, 'warehouses', w.id), w));
    initialStockTransfers.forEach((t) => batch.set(doc(db, 'stockTransfers', t.id), t));
    initialBatches.forEach((b) => batch.set(doc(db, 'batches', b.id), b));
    initialCommissionPayments.forEach((cp) => batch.set(doc(db, 'commissionPayments', cp.id), cp));
    batch.set(doc(db, 'systemSettings', 'general'), initialSystemSettings);
    batch.commit().catch(() => {});
  };

  // Definições do Sistema (PONTO 1)
  const updateSystemSettings = (updates: Partial<SystemSettings>) => {
    setSystemSettings((prev) => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(updated));
      if (isCloudSynced) {
        setDoc(doc(db, 'systemSettings', 'general'), updated, { merge: true }).catch(() => {});
      }
      return updated;
    });
  };

  const resetSystemSettings = () => {
    setSystemSettings(initialSystemSettings);
    localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(initialSystemSettings));
    if (isCloudSynced) {
      setDoc(doc(db, 'systemSettings', 'general'), initialSystemSettings).catch(() => {});
    }
  };

  // Limpeza de Históricos e Delecção (PONTO 4)
  const deleteStockTransfer = (id: string) => {
    setStockTransfers((prev) => prev.filter((t) => t.id !== id));
    if (isCloudSynced) {
      deleteDoc(doc(db, 'stockTransfers', id)).catch(() => {});
    }
  };

  const clearStockTransfersHistory = () => {
    setStockTransfers([]);
    localStorage.removeItem(STORAGE_KEYS.STOCK_TRANSFERS);
    if (isCloudSynced) {
      getDocs(collection(db, 'stockTransfers')).then((snap) => {
        const b = writeBatch(db);
        snap.forEach((d) => b.delete(d.ref));
        return b.commit();
      }).catch(() => {});
    }
  };

  const clearCashClosuresHistory = () => {
    setCashClosures([]);
    localStorage.removeItem(STORAGE_KEYS.CASH_CLOSURES);
    if (isCloudSynced) {
      getDocs(collection(db, 'cashClosures')).then((snap) => {
        const b = writeBatch(db);
        snap.forEach((d) => b.delete(d.ref));
        return b.commit();
      }).catch(() => {});
    }
  };

  const clearExpensesHistory = (filter: 'all' | 'paid' = 'all') => {
    if (filter === 'all') {
      setExpenses([]);
      localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    } else {
      setExpenses((prev) => prev.filter((e) => e.status !== 'paga'));
    }
    if (isCloudSynced) {
      getDocs(collection(db, 'expenses')).then((snap) => {
        const b = writeBatch(db);
        snap.forEach((d) => {
          const data = d.data() as Expense;
          if (filter === 'all' || data.status === 'paga') {
            b.delete(d.ref);
          }
        });
        return b.commit();
      }).catch(() => {});
    }
  };

  const clearCommissionPaymentsHistory = () => {
    setCommissionPayments([]);
    localStorage.removeItem(STORAGE_KEYS.COMMISSION_PAYMENTS);
    if (isCloudSynced) {
      getDocs(collection(db, 'commissionPayments')).then((snap) => {
        const b = writeBatch(db);
        snap.forEach((d) => b.delete(d.ref));
        return b.commit();
      }).catch(() => {});
    }
  };

  const clearPaymentsHistory = () => {
    setPayments([]);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    if (isCloudSynced) {
      getDocs(collection(db, 'payments')).then((snap) => {
        const b = writeBatch(db);
        snap.forEach((d) => b.delete(d.ref));
        return b.commit();
      }).catch(() => {});
    }
  };

  // Limpeza de todos os dados de exemplo para entrada em Produção Real
  const clearAllDataToProduction = async () => {
    // 1. Limpa estado local imediatamente
    setClients([]);
    setOrders([]);
    setPayments([]);
    setStockMovements([]);
    setCustomerDevices([]);
    setCashClosures([]);
    setSuppliers([]);
    setPurchases([]);
    setExpenses([]);
    setProformas([]);
    setStockTransfers([]);
    setBatches([]);
    setCommissionPayments([]);

    // 2. Persiste listas vazias no localStorage
    localStorage.setItem(STORAGE_KEYS.CLIENTS, '[]');
    localStorage.setItem(STORAGE_KEYS.ORDERS, '[]');
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, '[]');
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, '[]');
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_DEVICES, '[]');
    localStorage.setItem(STORAGE_KEYS.CASH_CLOSURES, '[]');
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, '[]');
    localStorage.setItem(STORAGE_KEYS.PURCHASES, '[]');
    localStorage.setItem(STORAGE_KEYS.EXPENSES, '[]');
    localStorage.setItem(STORAGE_KEYS.PROFORMAS, '[]');
    localStorage.setItem(STORAGE_KEYS.STOCK_TRANSFERS, '[]');
    localStorage.setItem(STORAGE_KEYS.BATCHES, '[]');
    localStorage.setItem(STORAGE_KEYS.COMMISSION_PAYMENTS, '[]');
    localStorage.setItem('gcv_db_initialized', 'true');

    // 3. Limpa coleções na nuvem e bloqueia recriação automática de exemplos
    try {
      const collectionsToWipe = [
        'clients',
        'orders',
        'payments',
        'stockMovements',
        'customerDevices',
        'cashClosures',
        'suppliers',
        'purchases',
        'expenses',
        'proformas',
        'stockTransfers',
        'batches',
        'commissionPayments'
      ];

      for (const colName of collectionsToWipe) {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      }

      await setDoc(doc(db, 'system_meta', 'app_state'), {
        initialized: true,
        mode: 'production',
        clearedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Erro ao limpar nuvem:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        clients,
        products,
        orders,
        payments,
        stockMovements,
        customerDevices,
        cashClosures,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        purchases,
        createPurchase,
        updatePurchase,
        deletePurchase,
        markPurchasePaid,
        expenses,
        createExpense,
        updateExpense,
        deleteExpense,
        markExpensePaid,
        proformas,
        createProforma,
        updateProforma,
        deleteProforma,
        convertProformaToOrder,
        warehouses,
        addWarehouse,
        updateWarehouse,
        deleteWarehouse,
        stockTransfers,
        createStockTransfer,
        deleteStockTransfer,
        clearStockTransfersHistory,
        batches,
        addBatch,
        updateBatch,
        deleteBatch,
        commissionPayments,
        createCommissionPayment,
        deleteCommissionPayment,
        clearCommissionPaymentsHistory,
        addClient,
        updateClient,
        deleteClient,
        getClientSummary,
        clientSummaries,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        batchUpdateCategoryPrices,
        createOrder,
        updateOrder,
        deleteOrder,
        createPayment,
        deletePayment,
        clearPaymentsHistory,
        addCustomerDevice,
        updateCustomerDevice,
        deleteCustomerDevice,
        getDailyCashSummary,
        createCashClosure,
        deleteCashClosure,
        clearCashClosuresHistory,
        clearExpensesHistory,
        totalSales,
        totalReceived,
        totalDebt,
        totalExpenses,
        totalPendingExpenses,
        totalPurchases,
        netProfit,
        syncStatus,
        isCloudSynced,
        syncWithCloud,
        exportExcel,
        exportJSONBackup,
        importJSONBackup,
        resetToDefaults,
        backups,
        autoBackupConfig,
        updateAutoBackupConfig,
        createBackup,
        downloadBackupJSON,
        restoreFromBackup,
        deleteBackup,
        isBackingUp,
        lastAutoBackupTime,
        systemSettings,
        updateSystemSettings,
        resetSystemSettings,
        clearAllDataToProduction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
