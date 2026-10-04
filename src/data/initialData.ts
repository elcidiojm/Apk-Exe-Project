import { 
  Client, 
  Product, 
  Order, 
  Payment, 
  StockMovement, 
  CustomerMediaDevice,
  Supplier,
  Purchase,
  Expense,
  Proforma,
  Warehouse,
  StockTransfer,
  ProductBatch,
  CommissionPayment,
  SystemSettings
} from '../types';

export const initialClients: Client[] = [
  {
    id: 'cli-1',
    code: 'CLI-001',
    name: 'João Silva',
    phone: '+258 84 123 4567',
    location: 'Maputo - Polana Caniço',
    notes: 'Cliente habitual de filmes e séries. Pagamentos regulares por M-Pesa.',
    createdAt: '2025-08-10',
  },
  {
    id: 'cli-2',
    code: 'CLI-002',
    name: 'Carlos Alberto',
    phone: '+258 82 987 6543',
    location: 'Matola - Cidade',
    notes: 'Faz encomendas de software e novelas. Costuma amortizar em parcelas.',
    createdAt: '2025-08-15',
  },
  {
    id: 'cli-3',
    code: 'CLI-003',
    name: 'Manuel Joaquim',
    phone: '+258 85 555 1212',
    location: 'Maputo - Alto Maé',
    notes: 'Comprador frequente de baterias de telemóvel para revenda.',
    createdAt: '2025-08-20',
  },
  {
    id: 'cli-4',
    code: 'CLI-004',
    name: 'Ana Paula',
    phone: '+258 87 333 4455',
    location: 'Maputo - Mavalane',
    notes: 'Cliente de novelas e filmes.',
    createdAt: '2025-09-01',
  },
  {
    id: 'cli-5',
    code: 'CLI-005',
    name: 'Pedro Santos',
    phone: '+258 84 777 8899',
    location: 'Zimpeto',
    notes: 'Acessórios e baterias.',
    createdAt: '2025-09-05',
  },
];

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    code: 'P001',
    name: 'Filme Digital (Lançamento / HD)',
    category: 'Filmes',
    type: 'digital',
    price: 200,
    stockQuantity: 0,
    minStockAlert: 0,
    unit: 'filme',
    active: true,
    notes: 'Conteúdo digital partilhado via pen-drive, Telegram ou disco externo.',
    createdAt: '2025-08-01',
  },
  {
    id: 'prod-2',
    code: 'P002',
    name: 'Série Completa (Temporada)',
    category: 'Séries',
    type: 'digital',
    price: 500,
    stockQuantity: 0,
    minStockAlert: 0,
    unit: 'temporada',
    active: true,
    notes: 'Todas as temporadas e episódios organizados em alta qualidade.',
    createdAt: '2025-08-01',
  },
  {
    id: 'prod-3',
    code: 'P003',
    name: 'Novela Completa',
    category: 'Novelas',
    type: 'digital',
    price: 500,
    stockQuantity: 0,
    minStockAlert: 0,
    unit: 'novela',
    active: true,
    notes: 'Capítulos completos sem cortes.',
    createdAt: '2025-08-05',
  },
  {
    id: 'prod-4',
    code: 'P004',
    name: 'Pacote Programas PC / Software',
    category: 'Programas/Software',
    type: 'digital',
    price: 1000,
    stockQuantity: 0,
    minStockAlert: 0,
    unit: 'pacote',
    active: true,
    notes: 'Instalação e ativação de antivírus, Office e softwares essenciais.',
    createdAt: '2025-08-05',
  },
  {
    id: 'prod-5',
    code: 'P005',
    name: 'Bateria Samsung A15 / A14',
    category: 'Baterias',
    type: 'physical',
    price: 2500,
    stockQuantity: 23,
    minStockAlert: 5,
    unit: 'unidade',
    active: true,
    notes: 'Bateria original selada com garantia.',
    createdAt: '2025-08-10',
  },
  {
    id: 'prod-6',
    code: 'P006',
    name: 'Bateria iPhone 11 / XR',
    category: 'Baterias',
    type: 'physical',
    price: 2800,
    stockQuantity: 8,
    minStockAlert: 3,
    unit: 'unidade',
    active: true,
    notes: 'Bateria de alta durabilidade com 100% de capacidade.',
    createdAt: '2025-08-12',
  },
  {
    id: 'prod-7',
    code: 'P007',
    name: 'Cartão de Memória 64GB MicroSD',
    category: 'Acessórios',
    type: 'physical',
    price: 800,
    stockQuantity: 15,
    minStockAlert: 5,
    unit: 'unidade',
    active: true,
    notes: 'Classe 10 de alta velocidade para telemóvel e câmara.',
    createdAt: '2025-08-15',
  },
  {
    id: 'prod-8',
    code: 'P008',
    name: 'Instalação & Configuração de Sistema',
    category: 'Outros',
    type: 'service',
    price: 1500,
    stockQuantity: 0,
    minStockAlert: 0,
    unit: 'serviço',
    active: true,
    notes: 'Formatação, instalação do Windows e backup de ficheiros.',
    createdAt: '2025-08-20',
  },
];

export const initialOrders: Order[] = [
  {
    id: 'ord-1',
    orderNumber: 'ENC-0001',
    clientId: 'cli-1',
    clientName: 'João Silva',
    date: '2025-09-08',
    items: [
      {
        productId: 'prod-1',
        productCode: 'P001',
        productName: 'Filme Digital (Lançamento / HD)',
        productType: 'digital',
        quantity: 5,
        unitPrice: 200,
        subtotal: 1000,
      },
      {
        productId: 'prod-2',
        productCode: 'P002',
        productName: 'Série Completa (Temporada)',
        productType: 'digital',
        quantity: 2,
        unitPrice: 500,
        subtotal: 1000,
      },
    ],
    totalAmount: 2000,
    amountPaid: 1000,
    balanceDue: 1000,
    status: 'parcial',
    deliveryType: 'Digital/Partilha',
    notes: 'Pagou 1.000 MT via M-Pesa na entrega digital.',
  },
  {
    id: 'ord-2',
    orderNumber: 'ENC-0002',
    clientId: 'cli-2',
    clientName: 'Carlos Alberto',
    date: '2025-09-10',
    items: [
      {
        productId: 'prod-3',
        productCode: 'P003',
        productName: 'Novela Completa',
        productType: 'digital',
        quantity: 5,
        unitPrice: 500,
        subtotal: 2500,
      },
      {
        productId: 'prod-4',
        productCode: 'P004',
        productName: 'Pacote Programas PC / Software',
        productType: 'digital',
        quantity: 1,
        unitPrice: 1000,
        subtotal: 1000,
      },
    ],
    totalAmount: 3500,
    amountPaid: 1500,
    balanceDue: 2000,
    status: 'parcial',
    deliveryType: 'Digital/Partilha',
    notes: 'Sinal de 1.500 MT pago em numerário.',
  },
  {
    id: 'ord-3',
    orderNumber: 'ENC-0003',
    clientId: 'cli-3',
    clientName: 'Manuel Joaquim',
    date: '2025-09-11',
    items: [
      {
        productId: 'prod-5',
        productCode: 'P005',
        productName: 'Bateria Samsung A15 / A14',
        productType: 'physical',
        quantity: 2,
        unitPrice: 2500,
        subtotal: 5000,
      },
    ],
    totalAmount: 5000,
    amountPaid: 2000,
    balanceDue: 3000,
    status: 'parcial',
    deliveryType: 'Entrega Física',
    notes: 'Levantou as duas baterias e pagou 2.000 MT via e-Mola.',
  },
  {
    id: 'ord-4',
    orderNumber: 'ENC-0004',
    clientId: 'cli-4',
    clientName: 'Ana Paula',
    date: '2025-09-12',
    items: [
      {
        productId: 'prod-1',
        productCode: 'P001',
        productName: 'Filme Digital (Lançamento / HD)',
        productType: 'digital',
        quantity: 3,
        unitPrice: 200,
        subtotal: 600,
      },
      {
        productId: 'prod-3',
        productCode: 'P003',
        productName: 'Novela Completa',
        productType: 'digital',
        quantity: 1,
        unitPrice: 500,
        subtotal: 500,
      },
    ],
    totalAmount: 1100,
    amountPaid: 1100,
    balanceDue: 0,
    status: 'paga',
    deliveryType: 'Digital/Partilha',
    notes: 'Pago integralmente por M-Pesa.',
  },
  {
    id: 'ord-5',
    orderNumber: 'ENC-0005',
    clientId: 'cli-1',
    clientName: 'João Silva',
    date: '2025-09-12',
    items: [
      {
        productId: 'prod-7',
        productCode: 'P007',
        productName: 'Cartão de Memória 64GB MicroSD',
        productType: 'physical',
        quantity: 1,
        unitPrice: 800,
        subtotal: 800,
      },
    ],
    totalAmount: 800,
    amountPaid: 0,
    balanceDue: 800,
    status: 'pendente',
    deliveryType: 'Entrega Física',
    notes: 'Levou o cartão de memória e combinou pagar junto com a dívida anterior.',
  },
];

export const initialPayments: Payment[] = [
  {
    id: 'pay-1',
    receiptNumber: 'REC-0001',
    clientId: 'cli-1',
    clientName: 'João Silva',
    orderId: 'ord-1',
    orderNumber: 'ENC-0001',
    amount: 1000,
    method: 'M-Pesa',
    type: 'Pagamento de encomenda',
    date: '2025-09-08',
    notes: 'Sinal da encomenda ENC-0001',
  },
  {
    id: 'pay-2',
    receiptNumber: 'REC-0002',
    clientId: 'cli-2',
    clientName: 'Carlos Alberto',
    orderId: 'ord-2',
    orderNumber: 'ENC-0002',
    amount: 1500,
    method: 'Numerário',
    type: 'Pagamento de encomenda',
    date: '2025-09-10',
    notes: 'Entrada da encomenda ENC-0002',
  },
  {
    id: 'pay-3',
    receiptNumber: 'REC-0003',
    clientId: 'cli-3',
    clientName: 'Manuel Joaquim',
    orderId: 'ord-3',
    orderNumber: 'ENC-0003',
    amount: 2000,
    method: 'e-Mola',
    type: 'Pagamento de encomenda',
    date: '2025-09-11',
    notes: 'Pagamento parcial de baterias',
  },
  {
    id: 'pay-4',
    receiptNumber: 'REC-0004',
    clientId: 'cli-4',
    clientName: 'Ana Paula',
    orderId: 'ord-4',
    orderNumber: 'ENC-0004',
    amount: 1100,
    method: 'M-Pesa',
    type: 'Liquidação total',
    date: '2025-09-12',
    notes: 'Liquidação integral de filmes e novela',
  },
  {
    id: 'pay-5',
    receiptNumber: 'REC-0005',
    clientId: 'cli-1',
    clientName: 'João Silva',
    amount: 500,
    method: 'M-Pesa',
    type: 'Parcela da dívida',
    date: '2025-09-13',
    notes: 'Amortização da dívida acumulada',
  },
];

export const initialStockMovements: StockMovement[] = [
  {
    id: 'mov-1',
    productId: 'prod-5',
    productName: 'Bateria Samsung A15 / A14',
    date: '2025-09-01',
    type: 'entrada',
    quantity: 25,
    previousStock: 0,
    newStock: 25,
    notes: 'Compra de lote inicial de baterias',
  },
  {
    id: 'mov-2',
    productId: 'prod-5',
    productName: 'Bateria Samsung A15 / A14',
    date: '2025-09-11',
    type: 'saida_venda',
    quantity: 2,
    previousStock: 25,
    newStock: 23,
    orderNumber: 'ENC-0003',
    notes: 'Saída por encomenda ENC-0003 (Manuel Joaquim)',
  },
  {
    id: 'mov-3',
    productId: 'prod-7',
    productName: 'Cartão de Memória 64GB MicroSD',
    date: '2025-09-05',
    type: 'entrada',
    quantity: 16,
    previousStock: 0,
    newStock: 16,
    notes: 'Reposição de cartões de memória',
  },
  {
    id: 'mov-4',
    productId: 'prod-7',
    productName: 'Cartão de Memória 64GB MicroSD',
    date: '2025-09-12',
    type: 'saida_venda',
    quantity: 1,
    previousStock: 16,
    newStock: 15,
    orderNumber: 'ENC-0005',
    notes: 'Saída por encomenda ENC-0005 (João Silva)',
  },
];

import { AppUser, UserRole, UserPermissions } from '../types';

export const initialUsers: AppUser[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    name: 'Administrador Geral',
    role: 'admin',
    pin: '1234',
    active: true,
    createdAt: '2025-08-01',
  },
  {
    id: 'usr-vendedor-1',
    username: 'vendedor',
    name: 'Operador de Vendas (Balcão)',
    role: 'vendedor',
    pin: '2222',
    active: true,
    createdAt: '2025-08-10',
  },
  {
    id: 'usr-armazem-1',
    username: 'armazem',
    name: 'Gestor de Stock / Armazém',
    role: 'armazem',
    pin: '3333',
    active: true,
    createdAt: '2025-08-15',
  }
];

export const getRolePermissions = (role: UserRole): UserPermissions => {
  switch (role) {
    case 'admin':
      return {
        canManageUsers: true,
        canViewDashboard: true,
        canCreateOrders: true,
        canDeleteOrders: true,
        canRegisterPayments: true,
        canDeletePayments: true,
        canManageClients: true,
        canDeleteClients: true,
        canManageStock: true,
        canChangePrices: true,
        canViewReports: true,
        canExportBackup: true,
        canResetDatabase: true,
        canManageSuppliers: true,
        canManagePurchases: true,
        canManageExpenses: true,
        canManageProformas: true,
        canManageTransfers: true,
        canViewCommissions: true,
      };
    case 'vendedor':
      return {
        canManageUsers: false,
        canViewDashboard: true,
        canCreateOrders: true,
        canDeleteOrders: false, // Vendedor não apaga encomendas
        canRegisterPayments: true,
        canDeletePayments: false, // Vendedor não apaga pagamentos
        canManageClients: true,
        canDeleteClients: false, // Vendedor não apaga clientes
        canManageStock: false, // Vendedor não altera stocks manuais
        canChangePrices: false, // Vendedor não altera preços de produtos
        canViewReports: false, // Vendedor não vê relatórios globais de lucro/backup
        canExportBackup: false,
        canResetDatabase: false,
        canManageSuppliers: false,
        canManagePurchases: false,
        canManageExpenses: false,
        canManageProformas: true, // Vendedor pode emitir orçamentos
        canManageTransfers: false,
        canViewCommissions: true, // Vendedor pode consultar as suas próprias comissões
      };
    case 'armazem':
      return {
        canManageUsers: false,
        canViewDashboard: true,
        canCreateOrders: false,
        canDeleteOrders: false,
        canRegisterPayments: false,
        canDeletePayments: false,
        canManageClients: false,
        canDeleteClients: false,
        canManageStock: true, // Armazém pode registar entradas e saídas
        canChangePrices: false,
        canViewReports: false,
        canExportBackup: false,
        canResetDatabase: false,
        canManageSuppliers: false,
        canManagePurchases: true, // Armazém pode registar recepção de compras
        canManageExpenses: false,
        canManageProformas: false,
        canManageTransfers: true, // Armazém pode transferir entre lojas/depósitos
        canViewCommissions: false,
      };
    case 'visualizador':
    default:
      return {
        canManageUsers: false,
        canViewDashboard: true,
        canCreateOrders: false,
        canDeleteOrders: false,
        canRegisterPayments: false,
        canDeletePayments: false,
        canManageClients: false,
        canDeleteClients: false,
        canManageStock: false,
        canChangePrices: false,
        canViewReports: false,
        canExportBackup: false,
        canResetDatabase: false,
        canManageSuppliers: false,
        canManagePurchases: false,
        canManageExpenses: false,
        canManageProformas: false,
        canManageTransfers: false,
        canViewCommissions: false,
      };
  }
};

export const initialCustomerDevices: CustomerMediaDevice[] = [
  {
    id: 'dev-1',
    deviceNumber: 'PEN-001',
    clientId: 'cli-1',
    clientName: 'João Silva',
    clientPhone: '+258 84 123 4567',
    deviceType: 'Pen USB',
    brandModel: 'Kingston DataTraveler Vermelha',
    capacityGB: '64 GB',
    contentRequested: 'Novela Renascer completa (Capítulos 01 ao 120)',
    status: 'gravando',
    receivedDate: '2025-09-17',
    expectedDate: '2025-09-18',
    price: 350,
    notes: 'Cliente pediu para organizar por pastas numeradas.',
  },
  {
    id: 'dev-2',
    deviceNumber: 'HDD-002',
    clientId: 'cli-2',
    clientName: 'Carlos Alberto',
    clientPhone: '+258 82 987 6543',
    deviceType: 'Disco Externo HDD/SSD',
    brandModel: 'Seagate Expansion Preto',
    capacityGB: '1 TB',
    contentRequested: 'Séries Netflix: Vikings Valhalla + Game of Thrones + Casa do Dragão + Pack Filmes Ação 2024',
    status: 'pronto',
    receivedDate: '2025-09-15',
    expectedDate: '2025-09-17',
    price: 1200,
    notes: 'Pronto para levantamento no balcão. Cliente avisado via WhatsApp.',
  },
  {
    id: 'dev-3',
    deviceNumber: 'PEN-003',
    clientId: 'cli-4',
    clientName: 'Ana Paula',
    clientPhone: '+258 87 333 4455',
    deviceType: 'Pen USB',
    brandModel: 'SanDisk Cruzer Blade 32GB',
    capacityGB: '32 GB',
    contentRequested: 'Novela Terra e Paixão (Últimos 40 capítulos)',
    status: 'entregue',
    receivedDate: '2025-09-10',
    deliveredDate: '2025-09-11',
    price: 250,
    notes: 'Entregue e testada na hora.',
  }
];

// ==========================================
// DADOS INICIAIS ERP: FORNECEDORES
// ==========================================
export const initialSuppliers: Supplier[] = [
  {
    id: 'forn-1',
    code: 'FORN-001',
    name: 'Distribuidora Nacional de Eletrónicos Lda',
    contactPerson: 'Eng. Américo Sitoe',
    phone: '+258 21 300 400',
    email: 'vendas@distribuidoranacional.co.mz',
    nuit: '400123987',
    location: 'Maputo - Av. 24 de Julho nº 1420',
    categories: ['Baterias', 'Acessórios', 'Componentes'],
    notes: 'Fornecedor principal de baterias e acessórios originais. Prazo de entrega de 24h a 48h.',
    createdAt: '2025-07-01',
  },
  {
    id: 'forn-2',
    code: 'FORN-002',
    name: 'TechImport Moçambique Distribuição',
    contactPerson: 'Sra. Fátima Noor',
    phone: '+258 84 990 1122',
    email: 'comercial@techimport.mz',
    nuit: '400987123',
    location: 'Matola - Zona Industrial',
    categories: ['Acessórios', 'Programas/Software', 'Serviços Técnicos'],
    notes: 'Importador oficial de cartões de memória, pens USB, cabos e discos rígidos.',
    createdAt: '2025-07-15',
  }
];

// ==========================================
// DADOS INICIAIS ERP: COMPRAS DE FORNECEDORES
// ==========================================
export const initialPurchases: Purchase[] = [
  {
    id: 'comp-1',
    purchaseNumber: 'COMP-0001',
    supplierId: 'forn-1',
    supplierName: 'Distribuidora Nacional de Eletrónicos Lda',
    date: '2025-09-02',
    dueDate: '2025-09-20',
    items: [
      {
        productId: 'prod-5',
        productCode: 'P005',
        productName: 'Bateria Samsung A15 / A14',
        quantity: 15,
        costPrice: 1600,
        subtotal: 24000,
        batchNumber: 'LOT-2025-SAM',
        expiryDate: '2026-11-30',
        warehouseId: 'arm-1',
        warehouseName: 'Loja Principal (Balcão)'
      },
      {
        productId: 'prod-7',
        productCode: 'P007',
        productName: 'Cartão de Memória 64GB MicroSD',
        quantity: 10,
        costPrice: 500,
        subtotal: 5000,
        batchNumber: 'LOT-2025-MEM',
        expiryDate: '2027-06-30',
        warehouseId: 'arm-1',
        warehouseName: 'Loja Principal (Balcão)'
      }
    ],
    totalAmount: 29000,
    amountPaid: 29000,
    balanceDue: 0,
    status: 'recebida',
    paymentStatus: 'pago',
    paymentMethod: 'Transferência Bancária',
    notes: 'Fatura de fornecedor nº 4892/2025. Stock conferido e arrumado na Loja Principal.',
    createdAt: '2025-09-02',
  },
  {
    id: 'comp-2',
    purchaseNumber: 'COMP-0002',
    supplierId: 'forn-1',
    supplierName: 'Distribuidora Nacional de Eletrónicos Lda',
    date: '2025-09-12',
    dueDate: '2025-09-30',
    items: [
      {
        productId: 'prod-6',
        productCode: 'P006',
        productName: 'Bateria iPhone 11 / XR',
        quantity: 10,
        costPrice: 1900,
        subtotal: 19000,
        batchNumber: 'LOT-2025-IPH',
        expiryDate: '2027-01-15',
        warehouseId: 'arm-2',
        warehouseName: 'Armazém Central (Depósito)'
      }
    ],
    totalAmount: 19000,
    amountPaid: 19000,
    balanceDue: 0,
    status: 'recebida',
    paymentStatus: 'pago',
    paymentMethod: 'M-Pesa',
    notes: 'Lote de baterias com garantia de fornecedor.',
    createdAt: '2025-09-12',
  }
];

export const initialExpenses: Expense[] = [
  {
    id: 'desp-1',
    expenseNumber: 'DESP-0001',
    title: 'Renda Mensal do Espaço Comercial / Balcão',
    description: 'Renda Mensal do Espaço Comercial / Balcão',
    category: 'Renda/Instalações',
    amount: 15000,
    date: '2025-09-01',
    status: 'paga',
    paymentMethod: 'Transferência Bancária',
    beneficiary: 'Imobiliária Maputo Centro Lda',
    notes: 'Recibo de renda de Setembro/2025 arquivado.',
    paidAt: '2025-09-01',
    createdAt: '2025-09-01',
  },
  {
    id: 'desp-2',
    expenseNumber: 'DESP-0002',
    title: 'Recarga Credelec EDM (Eletricidade Loja)',
    description: 'Recarga Credelec EDM (Eletricidade Loja)',
    category: 'Eletricidade/EDM',
    amount: 2500,
    date: '2025-09-05',
    status: 'paga',
    paymentMethod: 'M-Pesa',
    beneficiary: 'Eletricidade de Moçambique (EDM)',
    notes: 'Recarga para o contador nº 140029381.',
    paidAt: '2025-09-05',
    createdAt: '2025-09-05',
  },
  {
    id: 'desp-3',
    expenseNumber: 'DESP-0003',
    title: 'Fatura Mensal Internet Fibra Óptica 50Mbps',
    description: 'Fatura Mensal Internet Fibra Óptica 50Mbps',
    category: 'Internet & Comunicação',
    amount: 3200,
    date: '2025-09-10',
    dueDate: '2025-09-25',
    status: 'pendente',
    beneficiary: 'Vodacom Moçambique / TVCabo',
    notes: 'Fatura enviada por e-mail, aguarda aprovação de pagamento.',
    createdAt: '2025-09-10',
  },
  {
    id: 'desp-4',
    expenseNumber: 'DESP-0004',
    title: 'Manutenção de Ar Condicionado e Limpeza Técnica',
    description: 'Manutenção de Ar Condicionado e Limpeza Técnica',
    category: 'Manutenção & Equipamento',
    amount: 1800,
    date: '2025-09-15',
    dueDate: '2025-09-28',
    status: 'pendente',
    beneficiary: 'TecnoClima Assistência',
    notes: 'Revisão periódica do sistema de refrigeração do armazém.',
    createdAt: '2025-09-15',
  }
];

// ==========================================
// DADOS INICIAIS ERP: ORÇAMENTOS / PROFORMAS
// ==========================================
export const initialProformas: Proforma[] = [
  {
    id: 'prof-1',
    proformaNumber: 'PROF-0001',
    clientId: 'cli-2',
    clientName: 'Carlos Alberto',
    clientPhone: '+258 82 987 6543',
    clientLocation: 'Matola - Cidade',
    date: '2025-09-16',
    validityDays: 15,
    expiryDate: '2025-10-01',
    items: [
      {
        productId: 'prod-4',
        productCode: 'P004',
        productName: 'Pacote Programas PC / Software',
        productType: 'digital',
        quantity: 2,
        unitPrice: 1000,
        subtotal: 2000,
        notes: 'Instalação em 2 computadores de escritório'
      },
      {
        productId: 'prod-5',
        productCode: 'P005',
        productName: 'Bateria Samsung A15 / A14',
        productType: 'physical',
        quantity: 2,
        unitPrice: 2500,
        subtotal: 5000,
      },
      {
        productId: 'prod-8',
        productCode: 'P008',
        productName: 'Instalação & Configuração de Sistema',
        productType: 'service',
        quantity: 1,
        unitPrice: 1500,
        subtotal: 1500,
      }
    ],
    totalAmount: 8500,
    status: 'enviada',
    paymentTerms: '50% de adjudicação na aprovação, restante na entrega dos equipamentos.',
    notes: 'Orçamento com garantia de 3 meses para os componentes físicos.',
    createdAt: '2025-09-16',
  }
];

// ==========================================
// DADOS INICIAIS ERP: MULTI-ARMAZÉM
// ==========================================
export const initialWarehouses: Warehouse[] = [
  {
    id: 'arm-1',
    code: 'ARM-01',
    name: 'Loja Principal (Balcão)',
    location: 'Maputo Centro - Av. 24 de Julho',
    isDefault: true,
    notes: 'Ponto de atendimento ao público e vendas ao balcão.',
    createdAt: '2025-08-01',
  },
  {
    id: 'arm-2',
    code: 'ARM-02',
    name: 'Armazém Central (Depósito)',
    location: 'Matola Gare - Pavilhão A',
    isDefault: false,
    notes: 'Depósito de reserva para recepção de contentores e stock a granel.',
    createdAt: '2025-08-01',
  }
];

export const initialStockTransfers: StockTransfer[] = [
  {
    id: 'trf-1',
    transferNumber: 'TRF-0001',
    date: '2025-09-14',
    fromWarehouseId: 'arm-2',
    fromWarehouseName: 'Armazém Central (Depósito)',
    toWarehouseId: 'arm-1',
    toWarehouseName: 'Loja Principal (Balcão)',
    productId: 'prod-5',
    productCode: 'P005',
    productName: 'Bateria Samsung A15 / A14',
    quantity: 8,
    responsiblePerson: 'Gestor de Armazém',
    notes: 'Reposição do expositor do balcão para o fim de semana.',
    status: 'concluida',
    createdAt: '2025-09-14',
  }
];

// ==========================================
// DADOS INICIAIS ERP: LOTES & VALIDADES
// ==========================================
export const initialBatches: ProductBatch[] = [
  {
    id: 'batch-1',
    productId: 'prod-5',
    productCode: 'P005',
    productName: 'Bateria Samsung A15 / A14',
    batchNumber: 'LOT-2025-SAM',
    expiryDate: '2026-11-30',
    quantity: 15,
    warehouseId: 'arm-1',
    warehouseName: 'Loja Principal (Balcão)',
    costPrice: 1600,
    notes: 'Lote novo recebido da Distribuidora Nacional.',
    createdAt: '2025-09-02',
  },
  {
    id: 'batch-2',
    productId: 'prod-6',
    productCode: 'P006',
    productName: 'Bateria iPhone 11 / XR',
    batchNumber: 'LOT-2024-IPH-OLD',
    expiryDate: '2026-10-05',
    quantity: 3,
    warehouseId: 'arm-1',
    warehouseName: 'Loja Principal (Balcão)',
    costPrice: 1800,
    notes: 'Atenção: Validade aproxima-se nos próximos 20 dias. Priorizar na venda!',
    createdAt: '2025-08-10',
  },
  {
    id: 'batch-3',
    productId: 'prod-7',
    productCode: 'P007',
    productName: 'Cartão de Memória 64GB MicroSD',
    batchNumber: 'LOT-2025-MEM',
    expiryDate: '2027-06-30',
    quantity: 12,
    warehouseId: 'arm-1',
    warehouseName: 'Loja Principal (Balcão)',
    costPrice: 500,
    notes: 'Embalagens seladas com garantia de 2 anos.',
    createdAt: '2025-09-02',
  }
];

// ==========================================
// DADOS INICIAIS ERP: COMISSÕES DE FUNCIONÁRIOS
// ==========================================

export const initialCommissionPayments: CommissionPayment[] = [
  {
    id: "com-1",
    paymentNumber: "COM-0001",
    userId: "usr-vendedor-1",
    userName: "Carlos Vítor (Balcão)",
    period: "Agosto 2025",
    totalSalesAmount: 42000,
    commissionRate: 5,
    amount: 2100,
    paymentDate: "2025-09-02",
    paymentMethod: "M-Pesa",
    notes: "Comissão referente ao fecho de vendas do mês de Agosto.",
    createdAt: "2025-09-02",
  }
];

// ==========================================
// DEFINIÇÕES E CONFIGURAÇÕES DO SISTEMA (ERP)
// ==========================================
export const initialSystemSettings: SystemSettings = {
  // 1. Configurações gerais
  systemName: 'Gestão de Clientes & Vendas ERP',
  currencySymbol: 'MT',
  dateFormat: 'DD/MM/AAAA',
  timezone: 'Africa/Maputo (GMT+2)',
  operationMode: 'offline_first',

  // 2. Dados da empresa
  companyName: 'Gestão Comercial & Serviços Moçambique Lda',
  companyTradeName: 'GCV Informática & Eletrónicos',
  companyNuit: '400192834',
  companyAddress: 'Av. Eduardo Mondlane, nº 1845, R/C',
  companyCity: 'Maputo',
  companyProvince: 'Maputo Cidade',
  companyPhone: '+258 84 100 2000',
  companyPhoneSecondary: '+258 82 300 4000',
  companyEmail: 'comercial@gestaoclientes.co.mz',
  companySlogan: 'Excelência em Vendas, Gestão de Stock e Assistência Técnica',
  bankAccounts: [
    {
      id: 'bank-1',
      bankName: 'Millennium BIM',
      accountNumber: '129384750',
      nibIban: '0001 0000 0129 3847 5012 3',
      holderName: 'Gestão Comercial Lda',
    },
    {
      id: 'bank-2',
      bankName: 'BCI (Banco Comercial e de Investimentos)',
      accountNumber: '984726150',
      nibIban: '0008 0000 0984 7261 5088 1',
      holderName: 'Gestão Comercial Lda',
    }
  ],
  mobileWallets: [
    {
      id: 'mw-1',
      type: 'M-Pesa',
      number: '+258 84 100 2000',
      name: 'GCV Loja Balcão',
    },
    {
      id: 'mw-2',
      type: 'e-Mola',
      number: '+258 86 100 2000',
      name: 'GCV Loja Balcão',
    }
  ],

  // 3. Configurações de vendas
  defaultProfitMarginPercent: 25,
  maxSalesDiscountPercent: 10,
  allowSellBelowCost: false,
  blockSalesToDebtors: false,
  requireClientOnEverySale: false,

  // 4. Métodos e regras de pagamento
  enabledPaymentMethods: {
    cash: true,
    mpesa: true,
    emola: true,
    bankTransfer: true,
    posCard: true,
  },
  allowInstallmentPayments: true,
  requirePaymentProofRef: false,

  // 5. Regras de stock
  defaultLowStockThreshold: 5,
  allowNegativeStock: false,
  enforceBatchTracking: false,
  defaultWarehouseId: 'arm-1',
  blockTransferWithoutStock: true,

  // 6. Regras de encomendas
  defaultOrderDeliveryDays: 2,
  proformaValidityDays: 15,
  standardTermsAndConditions: 'Os produtos fornecidos possuem garantia de 6 meses contra defeitos de fabrico. Não se aceitam devoluções de consumíveis ou mídias digitais após gravação.',
  allowEditDeliveredOrders: false,

  // 7. Configurações de dívidas e crédito
  defaultCreditLimitMT: 5000,
  maxDebtDays: 30,
  debtGracePeriodDays: 5,
  onCreditLimitReached: 'avisar_adm',

  // 8. Alertas e notificações
  alertLowStock: true,
  alertOverdueDebts: true,
  alertExpiringBatches: true,
  alertDailyCashClosureReminder: true,
  soundEffects: true,

  // 9. Impressão de recibos/documentos
  receiptFormat: 'a4',
  showNuitOnReceipt: true,
  showBankDetailsOnReceipt: true,
  showWarrantyTermsOnReceipt: true,
  warrantyTermsText: 'Garantia legal de conformidade nos termos do Código Comercial de Moçambique. Guarde este recibo como comprovativo de compra.',
  footerThankYouMessage: 'Obrigado pela sua preferência e confiança! Volte sempre.',

  // 10. Aparência do sistema
  tableDensity: 'comfortable',
  compactMode: false,

  // 11. Numeração automática de clientes, encomendas e pagamentos
  documentPrefixes: {
    order: 'ENC-',
    receipt: 'REC-',
    client: 'CLI-',
    proforma: 'PROF-',
    purchase: 'COMP-',
    expense: 'DESP-',
    transfer: 'TRF-',
    batch: 'LOT-',
    device: 'DEV-',
  },

  // 12. Regras de Tipos, Categorias e Preços Especiais (Filmes, Séries, Novelas)
  itemTypesConfig: {
    digitalCategories: ['Filmes', 'Séries', 'Novelas', 'Programas/Software'],
    physicalCategories: ['Baterias', 'Acessórios', 'Outros'],
    serviceCategories: ['Serviços Técnicos', 'Instalação & Configuração', 'Reparação', 'Outros Serviços'],
    filmPriceWarehouse: 10,
    filmPriceOrder: 30,
    seriesPriceWarehouse: 30,
    seriesPriceOrder: 50,
    novelVariablePrice: true,
  },

  // 13. Informações/versão do sistema
  systemVersion: '2.5 Pro ERP Moçambique',
  updatedAt: new Date().toISOString(),
};

