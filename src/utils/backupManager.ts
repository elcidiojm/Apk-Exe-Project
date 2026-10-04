import { 
  DatabaseBackup, 
  BackupCollectionCounts, 
  AutoBackupConfig,
  Client, 
  Product, 
  Order, 
  Payment, 
  StockMovement, 
  CustomerMediaDevice, 
  DailyCashClosure, 
  Supplier, 
  Purchase, 
  Expense, 
  Proforma, 
  Warehouse, 
  StockTransfer, 
  ProductBatch, 
  CommissionPayment 
} from '../types';

export interface BackupDataSource {
  clients: Client[];
  products: Product[];
  orders: Order[];
  payments: Payment[];
  stockMovements: StockMovement[];
  customerDevices: CustomerMediaDevice[];
  cashClosures: DailyCashClosure[];
  suppliers: Supplier[];
  purchases: Purchase[];
  expenses: Expense[];
  proformas: Proforma[];
  warehouses: Warehouse[];
  stockTransfers: StockTransfer[];
  batches: ProductBatch[];
  commissionPayments: CommissionPayment[];
}

export function buildBackupPayload(
  source: BackupDataSource,
  type: 'automatic' | 'manual' = 'manual',
  customName?: string
): { backup: DatabaseBackup; fullExport: any } {
  const now = new Date();
  const id = `backup-${now.getTime()}`;
  const timestamp = now.toISOString();
  const dateFormatted = now.toLocaleDateString('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const summary: BackupCollectionCounts = {
    clients: source.clients.length,
    products: source.products.length,
    orders: source.orders.length,
    payments: source.payments.length,
    stockMovements: source.stockMovements.length,
    customerDevices: source.customerDevices.length,
    cashClosures: source.cashClosures.length,
    suppliers: source.suppliers.length,
    purchases: source.purchases.length,
    expenses: source.expenses.length,
    proformas: source.proformas.length,
    warehouses: source.warehouses.length,
    stockTransfers: source.stockTransfers.length,
    batches: source.batches.length,
    commissionPayments: source.commissionPayments.length,
  };

  const totalRecords = Object.values(summary).reduce((acc, count) => acc + (count || 0), 0);
  const totalCollections = Object.keys(summary).length;

  const defaultName = type === 'automatic' 
    ? `Backup Automático (${dateFormatted})` 
    : (customName || `Cópia de Segurança Manual (${dateFormatted})`);

  const fullExport = {
    metadata: {
      appName: 'Gestão de Clientes, Encomendas e Vendas (ERP)',
      appVersion: '3.5',
      platform: 'Google Cloud / Firebase Firestore',
      currency: 'Meticais (MT)',
      backupId: id,
      backupName: defaultName,
      backupType: type,
      createdAt: timestamp,
      createdFormatted: dateFormatted,
      totalRecords,
      totalCollections,
      summary,
    },
    data: {
      clients: source.clients,
      products: source.products,
      orders: source.orders,
      payments: source.payments,
      stockMovements: source.stockMovements,
      customerDevices: source.customerDevices,
      cashClosures: source.cashClosures,
      suppliers: source.suppliers,
      purchases: source.purchases,
      expenses: source.expenses,
      proformas: source.proformas,
      warehouses: source.warehouses,
      stockTransfers: source.stockTransfers,
      batches: source.batches,
      commissionPayments: source.commissionPayments,
    },
  };

  const jsonString = JSON.stringify(fullExport);
  const sizeBytes = new Blob([jsonString]).size;

  const backup: DatabaseBackup = {
    id,
    name: defaultName,
    type,
    createdAt: timestamp,
    totalRecords,
    totalCollections,
    sizeBytes,
    status: 'completed',
    summary,
    payload: fullExport,
  };

  return { backup, fullExport };
}

export function downloadJSONFile(data: any, fileName: string) {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function validateBackupJSON(jsonContent: string): { 
  valid: boolean; 
  data?: any; 
  error?: string; 
  summary?: BackupCollectionCounts;
  totalRecords?: number;
} {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!parsed) {
      return { valid: false, error: 'O ficheiro está vazio ou é inválido.' };
    }

    const payloadData = parsed.data || parsed;
    
    // Check if at least some core collections exist
    const hasAnyCollection = 
      Array.isArray(payloadData.clients) ||
      Array.isArray(payloadData.products) ||
      Array.isArray(payloadData.orders) ||
      Array.isArray(payloadData.payments);

    if (!hasAnyCollection) {
      return { 
        valid: false, 
        error: 'Estrutura de dados não reconhecida. Não foram encontradas coleções válidas (clientes, produtos, encomendas, pagamentos).' 
      };
    }

    const summary: BackupCollectionCounts = {
      clients: Array.isArray(payloadData.clients) ? payloadData.clients.length : 0,
      products: Array.isArray(payloadData.products) ? payloadData.products.length : 0,
      orders: Array.isArray(payloadData.orders) ? payloadData.orders.length : 0,
      payments: Array.isArray(payloadData.payments) ? payloadData.payments.length : 0,
      stockMovements: Array.isArray(payloadData.stockMovements) ? payloadData.stockMovements.length : 0,
      customerDevices: Array.isArray(payloadData.customerDevices) ? payloadData.customerDevices.length : 0,
      cashClosures: Array.isArray(payloadData.cashClosures) ? payloadData.cashClosures.length : 0,
      suppliers: Array.isArray(payloadData.suppliers) ? payloadData.suppliers.length : 0,
      purchases: Array.isArray(payloadData.purchases) ? payloadData.purchases.length : 0,
      expenses: Array.isArray(payloadData.expenses) ? payloadData.expenses.length : 0,
      proformas: Array.isArray(payloadData.proformas) ? payloadData.proformas.length : 0,
      warehouses: Array.isArray(payloadData.warehouses) ? payloadData.warehouses.length : 0,
      stockTransfers: Array.isArray(payloadData.stockTransfers) ? payloadData.stockTransfers.length : 0,
      batches: Array.isArray(payloadData.batches) ? payloadData.batches.length : 0,
      commissionPayments: Array.isArray(payloadData.commissionPayments) ? payloadData.commissionPayments.length : 0,
    };

    const totalRecords = Object.values(summary).reduce((a, b) => a + b, 0);

    return { 
      valid: true, 
      data: payloadData, 
      summary, 
      totalRecords 
    };
  } catch (err: any) {
    return { valid: false, error: `Erro ao interpretar JSON: ${err?.message || 'Sintaxe inválida'}` };
  }
}
