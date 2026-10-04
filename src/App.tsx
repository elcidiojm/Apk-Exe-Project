import React, { useState, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { UsersManagementModal } from './components/UsersManagementModal';
import { DashboardView } from './views/DashboardView';
import { OrdersView } from './views/OrdersView';
import { PaymentsView } from './views/PaymentsView';
import { ClientsView } from './views/ClientsView';
import { ProductsStockView } from './views/ProductsStockView';
import { PricingSettingsView } from './views/PricingSettingsView';
import { DownloadsCenterView } from './views/DownloadsCenterView';
import { MediaDevicesView } from './views/MediaDevicesView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

// ERP Modules
import { SuppliersAndPurchasesView } from './views/erp/SuppliersAndPurchasesView';
import { ExpensesView } from './views/erp/ExpensesView';
import { ProformasView } from './views/erp/ProformasView';
import { WarehousesAndBatchesView } from './views/erp/WarehousesAndBatchesView';
import { CommissionsView } from './views/erp/CommissionsView';

// Modals
import { NewOrderModal } from './components/NewOrderModal';
import { EditOrderModal } from './components/EditOrderModal';
import { NewPaymentModal } from './components/NewPaymentModal';
import { NewClientModal } from './components/NewClientModal';
import { NewProductModal } from './components/NewProductModal';
import { StockAdjustModal } from './components/StockAdjustModal';
import { ClientDetailModal } from './components/ClientDetailModal';
import { ReceiptModal } from './components/ReceiptModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { CashClosureModal } from './components/CashClosureModal';
import { Product, Order, Payment } from './types';

const MainAppContent: React.FC = () => {
  const { clients, orders, payments } = useApp();
  const { currentUser, permissions } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals state
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

  // Preselected client targets
  const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>(undefined);

  // Edit Order modal state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Client Detail View modal
  const [selectedClientIdForDetail, setSelectedClientIdForDetail] = useState<string | null>(null);

  // Receipt modal state
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isInstallPwaOpen, setIsInstallPwaOpen] = useState(false);
  const [isCashClosureOpen, setIsCashClosureOpen] = useState(false);

  // If user is not authenticated, show modern login screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  // Handlers
  const handleOpenNewOrder = (clientId?: string) => {
    if (!permissions.canCreateOrders) {
      alert('A sua conta não tem permissão para criar encomendas.');
      return;
    }
    setPreselectedClientId(clientId);
    setIsNewOrderOpen(true);
  };

  const handleOpenNewPayment = (clientId?: string) => {
    if (!permissions.canRegisterPayments) {
      alert('A sua conta não tem permissão para registar pagamentos.');
      return;
    }
    setPreselectedClientId(clientId);
    setIsNewPaymentOpen(true);
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientIdForDetail(clientId);
  };

  const handleViewOrderReceipt = (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      setReceiptOrder(ord);
      setReceiptPayment(null);
      setIsReceiptOpen(true);
    }
  };

  const handleViewPaymentReceipt = (paymentId: string) => {
    const pay = payments.find((p) => p.id === paymentId);
    if (pay) {
      setReceiptPayment(pay);
      setReceiptOrder(null);
      setIsReceiptOpen(true);
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientIdForDetail) || null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewOrder={() => handleOpenNewOrder()}
        onOpenNewPayment={() => handleOpenNewPayment()}
        onOpenInstallPwa={() => setIsInstallPwaOpen(true)}
        onOpenUsersModal={() => setIsUsersModalOpen(true)}
        onOpenCashClosure={() => setIsCashClosureOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={setActiveTab}
            onOpenNewOrder={() => handleOpenNewOrder()}
            onOpenNewPayment={() => handleOpenNewPayment()}
            onSelectClient={handleSelectClient}
            onViewOrderReceipt={handleViewOrderReceipt}
            onEditOrder={(order) => setEditingOrder(order)}
            onOpenInstallPwa={() => setIsInstallPwaOpen(true)}
            onOpenCashClosure={() => setIsCashClosureOpen(true)}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            onOpenNewOrder={() => handleOpenNewOrder()}
            onSelectClient={handleSelectClient}
            onViewOrderReceipt={handleViewOrderReceipt}
            onEditOrder={(order) => setEditingOrder(order)}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsView
            onOpenNewPayment={() => handleOpenNewPayment()}
            onSelectClient={handleSelectClient}
            onViewPaymentReceipt={handleViewPaymentReceipt}
            onOpenCashClosure={() => setIsCashClosureOpen(true)}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsView
            onOpenNewClient={() => {
              if (permissions.canManageClients) setIsNewClientOpen(true);
              else alert('A sua conta não tem permissão para criar novos clientes.');
            }}
            onSelectClient={handleSelectClient}
            onNewOrderForClient={(cid) => handleOpenNewOrder(cid)}
            onNewPaymentForClient={(cid) => handleOpenNewPayment(cid)}
          />
        )}

        {activeTab === 'proformas' && <ProformasView />}
        {activeTab === 'suppliers' && <SuppliersAndPurchasesView />}
        {activeTab === 'expenses' && <ExpensesView />}
        {activeTab === 'warehouses' && <WarehousesAndBatchesView />}
        {activeTab === 'commissions' && <CommissionsView />}

        {activeTab === 'devices' && (
          <MediaDevicesView />
        )}

        {activeTab === 'products' && (
          <ProductsStockView
            onOpenNewProduct={() => setIsNewProductOpen(true)}
            onOpenStockAdjust={(product) => setStockAdjustProduct(product)}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingSettingsView
            onOpenNewProduct={() => setIsNewProductOpen(true)}
          />
        )}

        {activeTab === 'downloads' && (
          <DownloadsCenterView
            onOpenInstallPwa={() => setIsInstallPwaOpen(true)}
          />
        )}

        {activeTab === 'settings' && <SettingsView />}

        {activeTab === 'reports' && permissions.canViewReports && <ReportsView />}
      </main>

      {/* Footer info */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Gestão de Clientes, Encomendas, Dívidas & Armazém — Moçambique (MT)</span>
          <span>Sessão iniciada como: <strong className="text-slate-600">{currentUser.name} ({currentUser.role})</strong></span>
        </div>
      </footer>

      {/* Modals */}
      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        preselectedClientId={preselectedClientId}
        onOpenNewClientModal={() => {
          setIsNewOrderOpen(false);
          setIsNewClientOpen(true);
        }}
        onOrderCreated={(orderId) => {
          handleViewOrderReceipt(orderId);
        }}
      />

      <EditOrderModal
        isOpen={!!editingOrder}
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
        onOrderUpdated={(orderId) => {
          setEditingOrder(null);
          handleViewOrderReceipt(orderId);
        }}
      />

      <NewPaymentModal
        isOpen={isNewPaymentOpen}
        onClose={() => setIsNewPaymentOpen(false)}
        preselectedClientId={preselectedClientId}
        onPaymentCreated={(payId) => {
          handleViewPaymentReceipt(payId);
        }}
      />

      <NewClientModal
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        onClientCreated={(clientId) => {
          setSelectedClientIdForDetail(clientId);
        }}
      />

      <NewProductModal
        isOpen={isNewProductOpen}
        onClose={() => setIsNewProductOpen(false)}
      />

      <StockAdjustModal
        isOpen={!!stockAdjustProduct}
        product={stockAdjustProduct}
        onClose={() => setStockAdjustProduct(null)}
      />

      <ClientDetailModal
        client={selectedClient}
        isOpen={!!selectedClientIdForDetail}
        onClose={() => setSelectedClientIdForDetail(null)}
        onNewOrderForClient={(cid) => {
          setSelectedClientIdForDetail(null);
          handleOpenNewOrder(cid);
        }}
        onNewPaymentForClient={(cid) => {
          setSelectedClientIdForDetail(null);
          handleOpenNewPayment(cid);
        }}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        order={receiptOrder}
        payment={receiptPayment}
        onClose={() => setIsReceiptOpen(false)}
      />

      <InstallPwaModal
        isOpen={isInstallPwaOpen}
        onClose={() => setIsInstallPwaOpen(false)}
      />

      <UsersManagementModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
      />

      <CashClosureModal
        isOpen={isCashClosureOpen}
        onClose={() => setIsCashClosureOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </AuthProvider>
  );
}
