export type ProductType = 'digital' | 'physical' | 'service';

export type ProductCategory = 
  | 'Filmes' 
  | 'Séries' 
  | 'Novelas' 
  | 'Programas/Software' 
  | 'Baterias' 
  | 'Acessórios' 
  | 'Serviços Técnicos'
  | 'Energia & Água'
  | 'Outros';

export interface Product {
  id: string;
  code: string;
  name: string;
  email?: string;
  category: ProductCategory;
  type: ProductType;
  price: number; // in MT
  sellingPrice?: number;
  costPrice?: number; // Preço de custo de compra em MT
  stockQuantity: number; // For physical products
  minStockAlert: number; // Minimum threshold
  unit: string; // e.g. "unidade", "temporada", "filme", "licença"
  active: boolean;
  notes?: string;
  createdAt: string;
  warehouseStock?: Record<string, number>; // Stock distribuído por ID do armazém
  batchNumber?: string; // Lote atual padrão
  expiryDate?: string; // Data de validade (YYYY-MM-DD)
}

export interface Client {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone: string;
  contact?: string;
  location: string;
  category?: string;
  address?: string;
  city?: string;
  notes?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productCode: string;
  productName: string;
  productType?: ProductType;
  discount?: number;
  category?: ProductCategory;
  quantity: number;
  unit?: string; // e.g. "Filme", "Temporada", "Capítulos", "Unidade"
  pricingMode?: 'armazem' | 'encomenda' | 'variavel';
  unitPrice: number; // in MT
  subtotal: number; // quantity * unitPrice
  notes?: string;
}

export type OrderStatus = 'pendente' | 'parcial' | 'paga' | 'entregue' | 'cancelada';

export interface Order {
  id: string;
  orderNumber: string; // e.g. ENC-0012
  clientId: string;
  clientName: string;
  date: string;
  dueDate?: string; // Data acordada para liquidação do saldo
  items: OrderItem[];
  totalAmount: number;
  clientEmail?: string;
  validUntil?: string;
  createdBy?: string;
  subtotal?: number;
  discount?: number;
  termsAndConditions?: string; // in MT
  amountPaid: number; // in MT paid at order time
  balanceDue: number; // in MT
  status: OrderStatus;
  deliveryType?: 'Digital/Partilha' | 'Entrega Física' | 'Mista';
  sellerUserId?: string;
  sellerUserName?: string;
  commissionRate?: number; // %
  commissionAmount?: number; // MT
  notes?: string;
}

export type PaymentMethod = 'M-Pesa' | 'e-Mola' | 'Numerário' | 'Transferência Bancária';

export type PaymentType = 
  | 'Parcela da dívida' 
  | 'Pagamento de encomenda' 
  | 'Liquidação total' 
  | 'Adiantamento' 
  | 'Outro';

export interface Payment {
  id: string;
  receiptNumber: string; // e.g. REC-0024
  clientId: string;
  clientName: string;
  orderId?: string;
  orderNumber?: string;
  amount: number; // in MT
  method: PaymentMethod;
  type: PaymentType;
  date: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productCode?: string;
  productName: string;
  date: string;
  type: 'entrada' | 'saida_venda' | 'saida_perda' | 'ajuste';
  quantity: number;
  previousStock: number;
  newStock: number;
  orderNumber?: string;
  notes?: string;
}

export interface ClientFinancialSummary {
  client: Client;
  totalPurchased: number;
  totalPaid: number;
  currentDebt: number; // > 0 means client owes MT, < 0 means credit
  orderCount: number;
  paymentCount: number;
  lastMovementDate?: string;
}

export type UserRole = 'admin' | 'vendedor' | 'armazem' | 'visualizador';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  passwordHash?: string; // Simple hash/code for offline & local authentication
  pin?: string;
  active: boolean;
  commissionRate?: number; // % comissão padrão (ex: 5)
  createdAt: string;
  lastLogin?: string;
  customPermissions?: Partial<UserPermissions>;
}

export interface UserPermissions {
  canManageUsers: boolean;
  canViewDashboard: boolean;
  canCreateOrders: boolean;
  canDeleteOrders: boolean;
  canRegisterPayments: boolean;
  canDeletePayments: boolean;
  canManageClients: boolean;
  canDeleteClients: boolean;
  canManageStock: boolean;
  canChangePrices: boolean;
  canViewReports: boolean;
  canExportBackup: boolean;
  canResetDatabase: boolean;
  // Módulos ERP
  canManageSuppliers?: boolean;
  canManagePurchases?: boolean;
  canManageExpenses?: boolean;
  canManageProformas?: boolean;
  canManageTransfers?: boolean;
  canViewCommissions?: boolean;
}

export type DeviceStatus = 'recebido' | 'gravando' | 'pronto' | 'entregue';

export type CustomerDeviceType = 
  | 'Pendrive' 
  | 'HDD' 
  | 'SSD' 
  | 'Micro SD' 
  | 'Computador/Desktop/Laptop' 
  | 'Outro'
  | string;

export interface CustomerMediaDevice {
  id: string;
  deviceNumber: string; // e.g. PEN-001
  clientId: string;
  clientName: string;
  clientPhone: string;
  deviceType: CustomerDeviceType;
  brandModel: string; // e.g. "Kingston 64GB Cinzenta"
  capacityGB?: string; // e.g. "64 GB", "1 TB"
  contentRequested: string; // e.g. "Novela Terra e Paixão completa + Série Vikings S1-S3"
  status: DeviceStatus;
  receivedDate: string;
  expectedDate?: string;
  deliveredDate?: string;
  orderId?: string;
  price?: number;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  processedBy?: string;
  action: string;
  details: string;
  entityType?: 'order' | 'payment' | 'client' | 'product' | 'price' | 'user' | 'device' | 'system';
}

export interface DailyCashClosure {
  id: string;
  closureDate: string; // YYYY-MM-DD
  closedAt: string; // ISO string
  closedByUserId: string;
  closedByUserName: string;
  totalSalesDay: number;
  totalReceivedDay: number;
  byMethod: {
    numerario: number;
    mpesa: number;
    emola: number;
    ponto24: number;
    banco: number;
  };
  initialCashFloat: number; // Fundo de caixa inicial em MT
  physicalCashCounted: number; // Dinheiro físico contado na gaveta
  cashDifference: number; // Diferença (sobra/falha de caixa)
  notes?: string;
  status: 'fechado';
}

// ==========================================
// MÓDULOS ERP: FORNECEDORES & COMPRAS
// ==========================================
export interface Supplier {
  id: string;
  code: string; // e.g. FORN-001
  name: string;
  email?: string;
  contactPerson?: string;
  phone: string;
  contact?: string;
  nuit?: string;
  paymentTerms?: string;
  location?: string;
  category?: string;
  address?: string;
  city?: string;
  categories?: string[];
  active?: boolean;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  costPrice: number; // in MT
  subtotal: number;
  batchNumber?: string;
  expiryDate?: string;
  warehouseId?: string;
  warehouseName?: string;
}

export type PurchaseStatus = 'recebida' | 'pendente' | 'cancelada';
export type PurchasePaymentStatus = 'pago' | 'parcial' | 'pendente';

export interface Purchase {
  id: string;
  purchaseNumber: string; // e.g. COMP-0001
  supplierId: string;
  supplierName: string;
  supplierDocNumber?: string;
  createdBy?: string;
  date: string;
  dueDate?: string;
  items: PurchaseItem[];
  totalAmount: number;
  clientEmail?: string;
  validUntil?: string;
  subtotal?: number;
  discount?: number;
  termsAndConditions?: string; // MT
  amountPaid: number; // MT
  balanceDue: number; // MT
  status: PurchaseStatus;
  paymentStatus: PurchasePaymentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
}

// ==========================================
// MÓDULOS ERP: DESPESAS & CONTAS A PAGAR
// ==========================================
export type ExpenseCategory = 
  | 'Renda/Instalações'
  | 'Salários & Comissões'
  | 'Eletricidade/EDM'
  | 'Água'
  | 'Internet & Comunicação'
  | 'Transporte & Combustível'
  | 'Fornecedores/Mercadoria'
  | 'Manutenção & Equipamento'
  | 'Impostos & Taxas'
  | 'Energia & Água'
  | 'Outros';

export interface Expense {
  id: string;
  expenseNumber: string; // e.g. DESP-0001
  description?: string;
  title?: string;
  category: ExpenseCategory;
  amount: number; // in MT
  date: string;
  dueDate?: string; // Data de vencimento da conta
  status: 'paga' | 'pendente';
  paymentMethod?: PaymentMethod;
  beneficiary?: string; // e.g. Senhorio, EDM, Vodacom, Nome do Fornecedor
  createdBy?: string;
  notes?: string;
  paidAt?: string;
  createdAt: string;
}

// ==========================================
// MÓDULOS ERP: ORÇAMENTOS / FATURAS PROFORMA
// ==========================================
export type ProformaStatus = 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada' | 'convertida';

export interface Proforma {
  id: string;
  proformaNumber: string; // e.g. PROF-0001
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientLocation?: string;
  date: string;
  validityDays?: number; // e.g. 15 ou 30 dias
  expiryDate?: string;
  items: OrderItem[];
  totalAmount: number;
  clientEmail?: string;
  validUntil?: string;
  createdBy?: string;
  subtotal?: number;
  discount?: number;
  termsAndConditions?: string;
  status: ProformaStatus;
  paymentTerms?: string; // e.g. "Pronto Pagamento" ou "50% Adiantamento"
  notes?: string;
  convertedOrderId?: string;
  createdAt: string;
}

// ==========================================
// MÓDULOS ERP: MULTI-ARMAZÉM & TRANSFERÊNCIAS
// ==========================================
export interface Warehouse {
  id: string;
  code: string; // e.g. ARM-01
  name: string;
  phone?: string;
  email?: string; // e.g. "Loja Principal (Balcão)", "Armazém Central"
  location: string;
  category?: string;
  address?: string;
  city?: string;
  isDefault?: boolean;
  isMain?: boolean;
  active?: boolean;
  manager?: string;
  notes?: string;
  createdAt: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string; // e.g. TRF-0001
  date: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  responsiblePerson?: string;
  reason?: string;
  transferredBy?: string;
  notes?: string;
  status?: 'concluida' | 'cancelada';
  createdAt: string;
}

// ==========================================
// MÓDULOS ERP: CONTROLO DE LOTES & VALIDADES
// ==========================================
export interface ProductBatch {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  batchNumber: string; // Lote (ex: LOT-2025-A)
  expiryDate?: string; // YYYY-MM-DD
  quantity: number;
  warehouseId?: string;
  warehouseName?: string;
  costPrice?: number;
  notes?: string;
  createdAt: string;
}

// ==========================================
// MÓDULOS ERP: COMISSÕES DE FUNCIONÁRIOS
// ==========================================
export interface CommissionPayment {
  id: string;
  paymentNumber: string; // e.g. COM-0001
  userId: string;
  userName: string;
  processedBy?: string;
  period: string; // e.g. "Setembro 2026"
  totalSalesAmount?: number;
  commissionRate?: number; // %
  amount: number; // MT
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

// ==========================================
// CÓPIA DE SEGURANÇA & BACKUP FIRESTORE
// ==========================================
export interface BackupCollectionCounts {
  clients: number;
  products: number;
  orders: number;
  payments: number;
  stockMovements: number;
  customerDevices: number;
  cashClosures: number;
  suppliers: number;
  purchases: number;
  expenses: number;
  proformas: number;
  warehouses: number;
  stockTransfers: number;
  batches: number;
  commissionPayments: number;
  users?: number;
}

export interface DatabaseBackup {
  id: string;
  name: string;
  email?: string;
  type: 'automatic' | 'manual';
  createdAt: string;
  totalRecords: number;
  totalCollections: number;
  sizeBytes: number;
  status: 'completed' | 'failed';
  summary: BackupCollectionCounts;
  payload?: any;
}

export interface AutoBackupConfig {
  enabled: boolean;
  frequencyHours: number; // 6, 12, 24
  lastBackupAt?: string;
  nextBackupAt?: string;
  maxStoredBackups: number;
}

// ==========================================
// DEFINIÇÕES E CONFIGURAÇÕES GERAIS DO SISTEMA
// ==========================================
export interface BankAccountDetail {
  id: string;
  bankName: string;
  accountNumber: string;
  nibIban: string;
  holderName?: string;
}

export interface MobileWalletDetail {
  id: string;
  type: 'M-Pesa' | 'e-Mola';
  number: string;
  name: string;
}

export interface SystemSettings {
  // 1. Configurações gerais
  systemName: string;
  currencySymbol: string;
  dateFormat: string;
  timezone: string;
  operationMode: 'offline_first' | 'cloud_hybrid';

  // 2. Dados da empresa
  companyName: string;
  companyTradeName?: string;
  companyNuit: string;
  companyAddress: string;
  companyCity: string;
  companyProvince: string;
  companyPhone: string;
  companyPhoneSecondary?: string;
  companyEmail: string;
  companySlogan?: string;
  bankAccounts: BankAccountDetail[];
  mobileWallets: MobileWalletDetail[];

  // 3. Configurações de vendas
  defaultProfitMarginPercent: number;
  maxSalesDiscountPercent: number;
  allowSellBelowCost: boolean;
  blockSalesToDebtors: boolean;
  requireClientOnEverySale: boolean;

  // 4. Métodos e regras de pagamento
  enabledPaymentMethods: {
    cash: boolean;
    mpesa: boolean;
    emola: boolean;
    bankTransfer: boolean;
    posCard: boolean;
  };
  allowInstallmentPayments: boolean;
  requirePaymentProofRef: boolean;

  // 5. Regras de stock
  defaultLowStockThreshold: number;
  allowNegativeStock: boolean;
  enforceBatchTracking: boolean;
  defaultWarehouseId?: string;
  blockTransferWithoutStock: boolean;

  // 6. Regras de encomendas
  defaultOrderDeliveryDays: number;
  proformaValidityDays: number;
  standardTermsAndConditions: string;
  allowEditDeliveredOrders: boolean;

  // 7. Configurações de dívidas e crédito
  defaultCreditLimitMT: number;
  maxDebtDays: number;
  debtGracePeriodDays: number;
  onCreditLimitReached: 'bloquear' | 'avisar_adm';

  // 8. Alertas e notificações
  alertLowStock: boolean;
  alertOverdueDebts: boolean;
  alertExpiringBatches: boolean;
  alertDailyCashClosureReminder: boolean;
  soundEffects: boolean;

  // 9. Impressão de recibos/documentos
  receiptFormat: 'a4' | 'pos_80mm' | 'pos_58mm';
  showNuitOnReceipt: boolean;
  showBankDetailsOnReceipt: boolean;
  showWarrantyTermsOnReceipt: boolean;
  warrantyTermsText: string;
  footerThankYouMessage: string;

  // 10. Aparência do sistema
  tableDensity: 'compact' | 'comfortable';
  compactMode: boolean;

  // 11. Numeração automática de clientes, encomendas e pagamentos
  documentPrefixes: {
    order: string;
    receipt: string;
    client: string;
    proforma: string;
    purchase: string;
    expense: string;
    transfer: string;
    batch: string;
    device: string;
  };

  // 12. Regras de Tipos, Categorias e Preços Especiais (Filmes, Séries, Novelas)
  itemTypesConfig: {
    digitalCategories: string[];
    physicalCategories: string[];
    serviceCategories: string[];
    filmPriceWarehouse: number; // 10 MT
    filmPriceOrder: number; // 30 MT
    seriesPriceWarehouse: number; // 30 MT
    seriesPriceOrder: number; // 50 MT
    novelVariablePrice: boolean; // Preço variável/indefinido
  };

  // 13. Informações/versão do sistema
  systemVersion: string;
  updatedAt: string;
}

