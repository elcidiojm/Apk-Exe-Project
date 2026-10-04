import React, { useState, useMemo } from 'react';
import { 
  HardDrive, 
  Search, 
  PlusCircle, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Tag, 
  Printer, 
  Trash2, 
  Edit, 
  User, 
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  Laptop,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { CustomerMediaDevice, DeviceStatus } from '../types';
import { formatMT, formatDate } from '../utils/formatters';

export const MediaDevicesView: React.FC = () => {
  const { customerDevices, addCustomerDevice, updateCustomerDevice, deleteCustomerDevice, clients } = useApp();
  const { permissions } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | DeviceStatus>('todos');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [isNewDeviceModalOpen, setIsNewDeviceModalOpen] = useState(false);
  const [printingDevice, setPrintingDevice] = useState<CustomerMediaDevice | null>(null);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [manualClientName, setManualClientName] = useState('');
  const [manualClientPhone, setManualClientPhone] = useState('');
  const [deviceType, setDeviceType] = useState<CustomerMediaDevice['deviceType']>('Pendrive');
  const [brandModel, setBrandModel] = useState('');
  const [capacityGB, setCapacityGB] = useState('64 GB');
  const [contentRequested, setContentRequested] = useState('');
  const [price, setPrice] = useState<number>(350);
  const [expectedDate, setExpectedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('');

  // Filtering
  const filteredDevices = useMemo(() => {
    return customerDevices.filter((d) => {
      const matchSearch =
        d.deviceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.clientPhone.includes(searchTerm) ||
        d.brandModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.contentRequested.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'todos' || d.status === statusFilter;
      const matchType =
        typeFilter === 'todos' ||
        d.deviceType === typeFilter ||
        (typeFilter === 'Pendrive' && (d.deviceType === 'Pen USB' || d.deviceType === 'Pendrive')) ||
        (typeFilter === 'HDD' && (d.deviceType === 'HDD' || d.deviceType.includes('HDD'))) ||
        (typeFilter === 'SSD' && (d.deviceType === 'SSD' || d.deviceType.includes('SSD'))) ||
        (typeFilter === 'Micro SD' && (d.deviceType === 'Micro SD' || d.deviceType.includes('MicroSD') || d.deviceType.includes('Cartão'))) ||
        (typeFilter === 'Computador/Desktop/Laptop' && (d.deviceType.includes('Computador') || d.deviceType.includes('Laptop') || d.deviceType.includes('Portátil') || d.deviceType.includes('Desktop'))) ||
        (typeFilter === 'Outro' && d.deviceType === 'Outro');

      return matchSearch && matchStatus && matchType;
    });
  }, [customerDevices, searchTerm, statusFilter, typeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = customerDevices.length;
    const aGravar = customerDevices.filter((d) => d.status === 'gravando' || d.status === 'recebido').length;
    const pronto = customerDevices.filter((d) => d.status === 'pronto').length;
    const entregue = customerDevices.filter((d) => d.status === 'entregue').length;
    return { total, aGravar, pronto, entregue };
  }, [customerDevices]);

  // WhatsApp notification generator
  const sendWhatsAppNotification = (device: CustomerMediaDevice) => {
    const cleanPhone = device.clientPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 9 ? `258${cleanPhone}` : cleanPhone;

    let msg = '';
    if (device.status === 'pronto') {
      msg = `*DISPOSITIVO PRONTO PARA LEVANTAMENTO* 🎬
Olá Sr(a). *${device.clientName}*,
Informamos que o seu dispositivo (*${device.brandModel}* - Etiqueta *${device.deviceNumber}*) já está pronto com o conteúdo solicitado:
📁 _${device.contentRequested}_
💰 Valor: *${formatMT(device.price || 0)}*

Pode passar no nosso balcão para efetuar o levantamento e teste. Muito obrigado!`;
    } else {
      msg = `*REGISTO DE DISPOSITIVO DE MÍDIA* 💾
Olá Sr(a). *${device.clientName}*,
O seu dispositivo (*${device.brandModel}*) foi recebido no nosso balcão sob a etiqueta *${device.deviceNumber}*.
📁 Conteúdo em gravação: _${device.contentRequested}_
📅 Previsão de entrega: ${device.expectedDate ? formatDate(device.expectedDate) : 'Em breve'}.
Avisaremos assim que estiver concluído!`;
    }

    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleCreateDevice = (e: React.FormEvent) => {
    e.preventDefault();
    let finalClientName = manualClientName;
    let finalClientPhone = manualClientPhone;
    let finalClientId = selectedClientId;

    if (selectedClientId) {
      const client = clients.find((c) => c.id === selectedClientId);
      if (client) {
        finalClientName = client.name;
        finalClientPhone = client.phone;
      }
    }

    if (!finalClientName.trim()) {
      alert('Por favor informe o nome do cliente.');
      return;
    }

    addCustomerDevice({
      clientId: finalClientId || `client-manual-${Date.now()}`,
      clientName: finalClientName,
      clientPhone: finalClientPhone,
      deviceType,
      brandModel: brandModel || `${deviceType} ${capacityGB}`,
      capacityGB,
      contentRequested,
      status: 'recebido',
      receivedDate: new Date().toISOString().slice(0, 10),
      expectedDate,
      price: Number(price) || 0,
      notes,
    });

    // Reset
    setIsNewDeviceModalOpen(false);
    setSelectedClientId('');
    setManualClientName('');
    setManualClientPhone('');
    setBrandModel('');
    setContentRequested('');
    setNotes('');
  };

  const handlePrintTag = (device: CustomerMediaDevice) => {
    setPrintingDevice(device);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case 'recebido':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Recebido</span>
          </span>
        );
      case 'gravando':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            <span>A Gravar</span>
          </span>
        );
      case 'pronto':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pronto p/ Entrega</span>
          </span>
        );
      case 'entregue':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <Check className="w-3.5 h-3.5 text-slate-500" />
            <span>Entregue</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Printable Tag Modal / View */}
      {printingDevice && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 text-black z-50">
          <div className="max-w-xs mx-auto border-2 border-dashed border-black p-4 text-center space-y-2 rounded-lg font-sans">
            <div className="text-xs uppercase font-bold tracking-widest text-slate-500">
              Etiqueta de Dispositivo
            </div>
            <div className="text-3xl font-black font-mono tracking-tight bg-slate-100 py-1 border border-black rounded">
              {printingDevice.deviceNumber}
            </div>
            <div className="text-sm font-bold text-slate-900 border-b border-black pb-1">
              {printingDevice.clientName}
            </div>
            <div className="text-xs font-mono text-slate-700">
              Tel: {printingDevice.clientPhone}
            </div>
            <div className="text-xs font-medium bg-slate-50 p-1 rounded">
              {printingDevice.deviceType} • {printingDevice.capacityGB} ({printingDevice.brandModel})
            </div>
            <div className="text-[11px] text-slate-600 italic">
              Conteúdo: {printingDevice.contentRequested}
            </div>
            <div className="text-xs font-bold pt-1 border-t border-black">
              Valor: {formatMT(printingDevice.price || 0)}
            </div>
            <div className="text-[9px] text-slate-500 pt-1">
              Recebido em: {formatDate(printingDevice.receivedDate)}
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-slate-700/70 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30 mb-2">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Gestão de Pen Drives & Discos Externos de Clientes</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Dispositivos de Mídia dos Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Registe pendrives e discos com número de etiqueta, capacidade, conteúdo solicitado e envie aviso automático no WhatsApp quando a gravação estiver pronta.
          </p>
        </div>

        <button
          onClick={() => setIsNewDeviceModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Registar Nova Pen / Disco</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Registados</span>
          <span className="text-2xl font-black text-slate-900">{stats.total}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Pens e Discos no histórico</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs bg-blue-50/20">
          <span className="text-xs text-blue-700 font-semibold block flex items-center justify-between">
            <span>A Gravar / Fila</span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          </span>
          <span className="text-2xl font-black text-blue-800">{stats.aGravar}</span>
          <span className="text-[11px] text-blue-600 block mt-0.5">Aguardando gravação ou a transferir</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <span className="text-xs text-emerald-700 font-semibold block flex items-center justify-between">
            <span>Prontos p/ Entrega</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </span>
          <span className="text-2xl font-black text-emerald-800">{stats.pronto}</span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">Disponíveis no balcão</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Já Entregues</span>
          <span className="text-2xl font-black text-slate-700">{stats.entregue}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Levantados pelos clientes</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar etiqueta, cliente, telefone ou novela..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {(['todos', 'recebido', 'gravando', 'pronto', 'entregue'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-semibold capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="Pendrive">Pendrive</option>
            <option value="HDD">HDD</option>
            <option value="SSD">SSD</option>
            <option value="Micro SD">Micro SD</option>
            <option value="Computador/Desktop/Laptop">Computador / Desktop / Laptop</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
      </div>

      {/* Devices List */}
      {filteredDevices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 text-slate-500">
          <HardDrive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">Nenhum dispositivo encontrado</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm || statusFilter !== 'todos'
              ? 'Tente ajustar os filtros de pesquisa.'
              : 'Clique em "+ Registar Nova Pen / Disco" para dar entrada ao primeiro dispositivo de cliente.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => {
            return (
              <div
                key={device.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
                  device.status === 'pronto'
                    ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                    : device.status === 'gravando'
                    ? 'border-blue-300'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Card Header: Device Tag and Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-black bg-slate-900 text-white px-2 py-0.5 rounded-md tracking-wider">
                        {device.deviceNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {device.deviceType}
                      </span>
                    </div>
                    {getStatusBadge(device.status)}
                  </div>

                  {/* Client Info */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{device.clientName}</span>
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {formatMT(device.price || 0)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{device.clientPhone || 'Sem telefone'}</span>
                    </div>
                  </div>

                  {/* Device Specs & Content */}
                  <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span className="font-semibold text-slate-700">Modelo:</span>
                      <span className="text-slate-900 font-medium">{device.brandModel} ({device.capacityGB})</span>
                    </div>

                    <div className="text-slate-700">
                      <span className="font-semibold block text-slate-800 mb-0.5">Conteúdo Solicitado:</span>
                      <p className="bg-white p-2 rounded-lg border border-slate-200 text-slate-800 text-[11px] leading-relaxed">
                        {device.contentRequested}
                      </p>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>Recebido: {formatDate(device.receivedDate)}</span>
                      {device.expectedDate && (
                        <span>Entrega: {formatDate(device.expectedDate)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions bottom bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                  {/* Quick Status Cycler */}
                  <div className="flex items-center space-x-1">
                    {device.status === 'recebido' && (
                      <button
                        onClick={() => updateCustomerDevice(device.id, { status: 'gravando' })}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200"
                        title="Começar a gravar"
                      >
                        Gravar ▶
                      </button>
                    )}
                    {device.status === 'gravando' && (
                      <button
                        onClick={() => updateCustomerDevice(device.id, { status: 'pronto' })}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                        title="Marcar como Pronto"
                      >
                        Concluir ✔
                      </button>
                    )}
                    {device.status === 'pronto' && (
                      <button
                        onClick={() => updateCustomerDevice(device.id, { status: 'entregue', deliveredDate: new Date().toISOString().slice(0, 10) })}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                        title="Marcar como Entregue ao Cliente"
                      >
                        Entregar 🤝
                      </button>
                    )}
                    {device.status === 'entregue' && (
                      <button
                        onClick={() => updateCustomerDevice(device.id, { status: 'pronto' })}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs"
                        title="Reabrir status"
                      >
                        Reabrir
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* WhatsApp notification */}
                    <button
                      onClick={() => sendWhatsAppNotification(device)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        device.status === 'pronto'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                      }`}
                      title="Avisar cliente via WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{device.status === 'pronto' ? 'Avisar Pronto' : 'WhatsApp'}</span>
                    </button>

                    {/* Print Tag */}
                    <button
                      onClick={() => handlePrintTag(device)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      title="Imprimir Etiqueta para Colar"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm(`Eliminar registo da etiqueta ${device.deviceNumber}?`)) {
                          deleteCustomerDevice(device.id);
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Novo Dispositivo de Mídia */}
      {isNewDeviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Registar Pen / Disco de Cliente</h3>
              </div>
              <button
                onClick={() => setIsNewDeviceModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="p-5 space-y-4 text-xs">
              {/* Select Client or Manual */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Cliente Registado ou Novo
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    if (e.target.value) {
                      const c = clients.find((cli) => cli.id === e.target.value);
                      if (c) {
                        setManualClientName(c.name);
                        setManualClientPhone(c.phone);
                      }
                    } else {
                      setManualClientName('');
                      setManualClientPhone('');
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Inserir Nome Manualmente --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedClientId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Mondlane"
                      value={manualClientName}
                      onChange={(e) => setManualClientName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: +258 84 123 4567"
                      value={manualClientPhone}
                      onChange={(e) => setManualClientPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Device Type & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tipo de Dispositivo
                  </label>
                  <select
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Pendrive">Pendrive</option>
                    <option value="HDD">HDD</option>
                    <option value="SSD">SSD</option>
                    <option value="Micro SD">Micro SD</option>
                    <option value="Computador/Desktop/Laptop">Computador / Desktop / Laptop</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Capacidade
                  </label>
                  <select
                    value={capacityGB}
                    onChange={(e) => setCapacityGB(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="16 GB">16 GB</option>
                    <option value="32 GB">32 GB</option>
                    <option value="64 GB">64 GB</option>
                    <option value="128 GB">128 GB</option>
                    <option value="256 GB">256 GB</option>
                    <option value="500 GB">500 GB</option>
                    <option value="1 TB">1 TB</option>
                    <option value="2 TB">2 TB</option>
                    <option value="Outra">Outra</option>
                  </select>
                </div>
              </div>

              {/* Brand & Model */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Marca, Cor ou Modelo (para identificar fisicamente)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Kingston Vermelha com tampa preta"
                  value={brandModel}
                  onChange={(e) => setBrandModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Content requested */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Conteúdo Solicitado *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Novela Renascer Cap 01 ao 80 + Filme Furiosa 2024 + Séries Netflix..."
                  value={contentRequested}
                  onChange={(e) => setContentRequested(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Price & Delivery Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Valor do Serviço (MT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Previsão de Entrega
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewDeviceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition-colors"
                >
                  Registar Dispositivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
