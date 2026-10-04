import React, { useState } from 'react';
import { X, Package, ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';

interface StockAdjustModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { adjustStock } = useApp();

  const [type, setType] = useState<'entrada' | 'saida_perda' | 'ajuste'>('entrada');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen || !product) return null;

  const currentStock = product.stockQuantity;
  let simulatedStock = currentStock;
  if (type === 'entrada') {
    simulatedStock = currentStock + quantity;
  } else if (type === 'saida_perda') {
    simulatedStock = Math.max(0, currentStock - quantity);
  } else if (type === 'ajuste') {
    simulatedStock = quantity;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustStock(product.id, type, quantity, notes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Movimentação de Stock
              </h2>
              <p className="text-xs text-slate-400">{product.name}</p>
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
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setType('entrada')}
              className={`p-2 rounded-xl border text-center transition-all ${
                type === 'entrada'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 mx-auto mb-0.5 text-emerald-600" />
              <span className="text-xs">Entrada (+)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('saida_perda')}
              className={`p-2 rounded-xl border text-center transition-all ${
                type === 'saida_perda'
                  ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 mx-auto mb-0.5 text-rose-600" />
              <span className="text-xs">Perda/Uso (-)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('ajuste')}
              className={`p-2 rounded-xl border text-center transition-all ${
                type === 'ajuste'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <RefreshCw className="w-4 h-4 mx-auto mb-0.5 text-indigo-600" />
              <span className="text-xs">Inventário (=)</span>
            </button>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-600">Stock Atual em Armazém:</span>
            <span className="font-bold text-slate-900 text-sm">
              {currentStock} {product.unit}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {type === 'ajuste' ? 'Novo Valor de Stock Total' : 'Quantidade a Movimentar'}
            </label>
            <input
              type="number"
              min={type === 'ajuste' ? 0 : 1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 text-slate-900 font-bold text-base rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Simulation pill */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex justify-between items-center">
            <span className="text-emerald-800 font-medium">Novo Stock Previsto:</span>
            <span className="text-emerald-900 font-extrabold text-sm">
              {simulatedStock} {product.unit}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo / Observação
            </label>
            <input
              type="text"
              placeholder="Ex.: Compra de novo lote, avaria de bateria, etc."
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
              <span>Confirmar Movimento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
