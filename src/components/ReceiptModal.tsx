import React, { useState } from 'react';
import { X, Printer, Share2, Check, FileCheck, CheckCircle2, MessageSquare, Receipt } from 'lucide-react';
import { Order, Payment } from '../types';
import { formatMT, formatDate, formatOrderItemLine } from '../utils/formatters';
import { useApp } from '../context/AppContext';

interface ReceiptModalProps {
  order?: Order | null;
  payment?: Payment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  payment,
  isOpen,
  onClose,
}) => {
  const { clients } = useApp();
  const [copied, setCopied] = useState(false);
  const [receiptFormat, setReceiptFormat] = useState<'standard' | 'thermal'>('standard');

  if (!isOpen || (!order && !payment)) return null;

  // Find associated client to extract contact
  const clientName = payment ? payment.clientName : order?.clientName;
  const clientObj = clients.find(
    (c) => c.name.toLowerCase() === clientName?.toLowerCase() || (order && c.id === order.clientId)
  );

  const cleanPhone = clientObj?.contact?.replace(/\D/g, '') || '';
  const formattedPhone = cleanPhone.length === 9 ? `258${cleanPhone}` : cleanPhone;

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppMessage = () => {
    if (payment) {
      return `🧾 *RECIBO DE PAGAMENTO*
🔢 *Nº Recibo:* ${payment.receiptNumber}
👤 *Cliente:* ${payment.clientName}
💰 *Valor Recebido:* ${formatMT(payment.amount)}
💳 *Forma de Pagamento:* ${payment.method}
📅 *Data:* ${formatDate(payment.date)}
🏷️ *Tipo:* ${payment.type}
${payment.orderNumber ? `📌 *Ref. Encomenda:* ${payment.orderNumber}\n` : ''}${payment.notes ? `📝 *Obs:* ${payment.notes}\n` : ''}---------------------------------
🇲🇿 *Gestão de Vendas & Serviços*
Obrigado pela preferência! Guarde este recibo.`;
    }
    if (order) {
      let msg = `🧾 *COMPROVATIVO DE ENCOMENDA*
🔢 *Nº Encomenda:* ${order.orderNumber}
👤 *Cliente:* ${order.clientName}
📅 *Data:* ${formatDate(order.date)}

📦 *ITENS:*
`;
      order.items.forEach((i) => {
        msg += `• ${i.productName} (x${i.quantity}) = ${formatMT(i.subtotal)}\n`;
      });
      msg += `\n💰 *VALOR TOTAL:* ${formatMT(order.totalAmount)}
💵 *VALOR PAGO:* ${formatMT(order.amountPaid)}
`;
      if (order.balanceDue > 0) {
        msg += `⚠️ *SALDO PENDENTE:* ${formatMT(order.balanceDue)}\n`;
        if (order.dueDate) {
          msg += `⏰ *Data Limite de Pagamento:* ${formatDate(order.dueDate)}\n`;
        }
      } else {
        msg += `✅ *STATUS:* Totalmente Quitado (0 MT)\n`;
      }
      msg += `---------------------------------
🇲🇿 *Gestão de Vendas & Serviços*
Obrigado pela sua preferência!`;
      return msg;
    }
    return '';
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(getWhatsAppMessage());
    const url = formattedPhone 
      ? `https://wa.me/${formattedPhone}?text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(getWhatsAppMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className={`bg-white rounded-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all ${
        receiptFormat === 'thermal' ? 'max-w-xs' : 'max-w-lg'
      }`}>
        {/* Modal Controls */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold truncate">
              {payment ? payment.receiptNumber : order?.orderNumber}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleOpenWhatsApp}
              className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center space-x-1 shadow-xs transition-colors"
              title={formattedPhone ? `Enviar para WhatsApp (${clientObj?.contact})` : 'Enviar via WhatsApp'}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center space-x-1"
              title="Imprimir documento"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Format Selector Bar (Print:hidden) */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs print:hidden">
          <span className="font-semibold text-slate-600">Formato:</span>
          <div className="flex items-center space-x-1 bg-white p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setReceiptFormat('standard')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                receiptFormat === 'standard' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📄 A4 / Fatura
            </button>
            <button
              onClick={() => setReceiptFormat('thermal')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                receiptFormat === 'thermal' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🧾 Talão Térmico (POS)
            </button>
          </div>
        </div>

        {/* Printable Ticket Area */}
        {receiptFormat === 'thermal' ? (
          /* THERMAL POS RECEIPT FORMAT (58mm / 80mm) */
          <div id="printable-receipt" className="p-4 bg-white text-slate-950 font-mono text-[11px] leading-tight space-y-3">
            <div className="text-center border-b border-dashed border-slate-400 pb-2">
              <div className="text-xs font-black uppercase tracking-wide">GESTÃO & SERVIÇOS</div>
              <div className="text-[10px] text-slate-600">Filmes, Séries & Software</div>
              <div className="text-[9px] text-slate-500">Maputo / Matola - Moçambique</div>
              <div className="text-[9px] text-slate-500 mt-0.5">M-Pesa / e-Mola / Numerário</div>
            </div>

            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>DOC:</span>
                <span className="font-bold">{payment ? payment.receiptNumber : order?.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATA:</span>
                <span>{formatDate(payment ? payment.date : order?.date || '')}</span>
              </div>
              <div className="flex justify-between">
                <span>CLIENTE:</span>
                <span className="font-bold truncate max-w-[140px]">{payment ? payment.clientName : order?.clientName}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-400 py-1.5 space-y-1">
              {payment ? (
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-xs">
                    <span>RECEBIDO:</span>
                    <span>{formatMT(payment.amount)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>FORMA:</span>
                    <span>{payment.method}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>TIPO:</span>
                    <span>{payment.type}</span>
                  </div>
                  {payment.orderNumber && (
                    <div className="text-[9px] text-slate-500">Ref: {payment.orderNumber}</div>
                  )}
                </div>
              ) : order ? (
                <div>
                  <div className="flex justify-between text-[9px] font-bold pb-1 text-slate-500 border-b border-slate-200">
                    <span>QTD/ITEM</span>
                    <span>SUBTOTAL</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate max-w-[170px]">
                          {formatOrderItemLine(it)}
                        </span>
                        <span className="font-bold">{formatMT(it.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-slate-300 mt-2 pt-1 space-y-0.5 text-[10px]">
                    <div className="flex justify-between font-bold">
                      <span>TOTAL:</span>
                      <span>{formatMT(order.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PAGO:</span>
                      <span>{formatMT(order.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-200">
                      <span>A PAGAR:</span>
                      <span className={order.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                        {formatMT(order.balanceDue)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="text-center text-[9px] space-y-1 pt-1 text-slate-600">
              <div>*** OBRIGADO PELA PREFERÊNCIA ***</div>
              <div>Guarde este comprovativo</div>
              <div className="font-mono text-[8px] tracking-widest pt-1">||| |||||| | |||||||| |||| |</div>
            </div>
          </div>
        ) : (
          /* STANDARD FULL A4/INVOICE FORMAT */
          <div id="printable-receipt" className="p-6 bg-white text-slate-900 space-y-4">
            {/* Header */}
            <div className="text-center border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-base uppercase tracking-wider text-slate-900">
                Gestão de Vendas & Serviços
              </h3>
              <p className="text-xs text-slate-500">Filmes • Séries • Softwares • Baterias • Acessórios</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Maputo / Matola - Moçambique</p>
            </div>

            {/* Type Badge */}
            <div className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px]">DOCUMENTO</span>
                <span className="font-bold text-slate-900">
                  {payment ? payment.receiptNumber : order?.orderNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">DATA</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(payment ? payment.date : order?.date || '')}
                </span>
              </div>
            </div>

            {/* Client Info */}
            <div className="text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-500 block text-[10px]">CLIENTE</span>
                <span className="font-bold text-slate-900 text-sm">
                  {payment ? payment.clientName : order?.clientName}
                </span>
              </div>
              {clientObj?.contact && (
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">CONTACTO</span>
                  <span className="font-mono text-slate-700">{clientObj.contact}</span>
                </div>
              )}
            </div>

            {/* If Payment */}
            {payment && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-emerald-800 font-medium">Valor Recebido:</span>
                  <span className="text-xl font-extrabold text-emerald-900">
                    {formatMT(payment.amount)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-200/60">
                  <div>
                    <span className="text-slate-500 block text-[10px]">FORMA</span>
                    <span className="font-semibold text-slate-800">{payment.method}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">TIPO</span>
                    <span className="font-semibold text-slate-800">{payment.type}</span>
                  </div>
                </div>
                {payment.orderNumber && (
                  <div className="text-xs pt-1 text-slate-600">
                    Referente à Encomenda: <span className="font-bold">{payment.orderNumber}</span>
                  </div>
                )}
                {payment.notes && (
                  <div className="text-xs text-slate-500 italic pt-1">
                    Obs: {payment.notes}
                  </div>
                )}
              </div>
            )}

            {/* If Order */}
            {order && (
              <div className="space-y-3">
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100 text-slate-600 font-semibold text-[10px]">
                      <tr>
                        <th className="px-3 py-2 text-left">Item</th>
                        <th className="px-2 py-2 text-center">Qtd</th>
                        <th className="px-2 py-2 text-right">Preço</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {order.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-medium text-slate-800">
                            <div>{item.productName}</div>
                            <div className="text-[10px] text-slate-500 font-normal">
                              {formatOrderItemLine(item)}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center text-slate-600 font-medium">
                            {item.quantity}
                          </td>
                          <td className="px-2 py-2 text-right text-slate-600 font-mono">
                            {formatMT(item.unitPrice)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900 font-mono">
                            {formatMT(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Order Financial Balance Breakdown */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total da Encomenda:</span>
                    <span className="font-bold text-slate-900">{formatMT(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Valor Pago no Ato:</span>
                    <span>- {formatMT(order.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold">
                    <span>Saldo Desta Encomenda:</span>
                    <span className={order.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {order.balanceDue > 0 ? formatMT(order.balanceDue) : '0 MT (Totalmente Pago)'}
                    </span>
                  </div>
                  {order.dueDate && order.balanceDue > 0 && (
                    <div className="flex justify-between text-amber-700 text-[11px] pt-1 border-t border-amber-200">
                      <span>Data Limite de Pagamento:</span>
                      <span className="font-bold">{formatDate(order.dueDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer note */}
            <div className="pt-3 border-t border-slate-200 text-center space-y-2">
              <p className="text-[11px] text-slate-500">
                Obrigado pela preferência! Guarde este comprovativo.
              </p>
              <div className="text-[10px] text-slate-400">
                Pagamentos aceites via M-Pesa • e-Mola • Numerário
              </div>
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <button
            onClick={handleCopyWhatsApp}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl flex items-center space-x-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado para Área de Transferência!' : 'Copiar Texto'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
