import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated?: (clientId: string) => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
}) => {
  const { addClient } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+258 ');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Por favor, informe o nome do cliente.');
      return;
    }

    const created = addClient({
      name,
      phone,
      location,
      notes: notes.trim() || undefined,
    });

    if (onClientCreated) {
      onClientCreated(created.id);
    }

    // Reset
    setName('');
    setPhone('+258 ');
    setLocation('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Novo Cliente
              </h2>
              <p className="text-xs text-slate-400">
                Cadastrar cliente para encomendas e controlo de conta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex.: João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              placeholder="+258 84 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Localização / Bairro / Cidade
            </label>
            <input
              type="text"
              placeholder="Ex.: Maputo - Polana Caniço, Matola"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              placeholder="Preferências, canal habitual de pagamento, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
