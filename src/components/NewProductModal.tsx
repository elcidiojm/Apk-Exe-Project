import React, { useState, useEffect, useMemo } from 'react';
import { X, PackagePlus, CheckCircle2, AlertCircle, Layers, Package, Wrench, Sparkles, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCategory, ProductType } from '../types';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: (productId: string) => void;
}

export const NewProductModal: React.FC<NewProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated,
}) => {
  const { addProduct, systemSettings } = useApp();

  const [type, setType] = useState<ProductType>('digital');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Filmes');
  const [price, setPrice] = useState<number | ''>(10);
  const [unit, setUnit] = useState('1 filme');
  const [isVariablePrice, setIsVariablePrice] = useState(false);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Categories per type from systemSettings
  const availableCategories = useMemo(() => {
    const cfg = systemSettings?.itemTypesConfig;
    if (type === 'digital') {
      return cfg?.digitalCategories && cfg.digitalCategories.length > 0 
        ? cfg.digitalCategories 
        : ['Filmes', 'Séries', 'Novelas', 'Programas/Software'];
    } else if (type === 'physical') {
      return cfg?.physicalCategories && cfg.physicalCategories.length > 0 
        ? cfg.physicalCategories 
        : ['Baterias', 'Acessórios', 'Outros'];
    } else {
      return cfg?.serviceCategories && cfg.serviceCategories.length > 0 
        ? cfg.serviceCategories 
        : ['Serviços Técnicos', 'Instalação & Configuração', 'Reparação', 'Outros Serviços'];
    }
  }, [type, systemSettings]);

  // When type changes, automatically set category to first available for that type
  const handleTypeChange = (newType: ProductType) => {
    setType(newType);
    let defaultCat = '';
    const cfg = systemSettings?.itemTypesConfig;

    if (newType === 'digital') {
      defaultCat = cfg?.digitalCategories?.[0] || 'Filmes';
      setCategory(defaultCat);
      applyCategoryDefaults(defaultCat);
    } else if (newType === 'physical') {
      defaultCat = cfg?.physicalCategories?.[0] || 'Baterias';
      setCategory(defaultCat);
      setUnit('unidade');
      setPrice(350);
      setIsVariablePrice(false);
    } else {
      defaultCat = cfg?.serviceCategories?.[0] || 'Serviços Técnicos';
      setCategory(defaultCat);
      setUnit('serviço');
      setPrice(250);
      setIsVariablePrice(false);
    }
  };

  const applyCategoryDefaults = (catName: string) => {
    if (catName === 'Filmes' || catName.toLowerCase().includes('filme')) {
      setUnit('1 filme');
      setPrice(systemSettings?.itemTypesConfig?.filmPriceWarehouse || 10);
      setIsVariablePrice(false);
    } else if (catName === 'Séries' || catName.toLowerCase().includes('série')) {
      setUnit('1 temporada');
      setPrice(systemSettings?.itemTypesConfig?.seriesPriceWarehouse || 30);
      setIsVariablePrice(false);
    } else if (catName === 'Novelas' || catName.toLowerCase().includes('novela')) {
      setUnit('capítulos');
      setIsVariablePrice(true);
      setPrice('');
    } else if (catName === 'Programas/Software' || catName.toLowerCase().includes('software')) {
      setUnit('licença/pacote');
      setPrice(250);
      setIsVariablePrice(false);
    } else {
      setUnit('unidade');
      setIsVariablePrice(false);
    }
  };

  const handleCategorySelect = (selectedCat: string) => {
    setCategory(selectedCat);
    applyCategoryDefaults(selectedCat);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Por favor, informe o nome do produto ou serviço.');
      return;
    }

    if (!isVariablePrice && (price === '' || Number(price) < 0)) {
      setErrorMessage('Informe um preço válido em MT.');
      return;
    }

    const created = addProduct({
      name: name.trim(),
      category: category as ProductCategory,
      type,
      price: isVariablePrice ? (price === '' ? 0 : Number(price)) : Number(price),
      stockQuantity: type === 'physical' ? Number(stockQuantity) : 0,
      minStockAlert: type === 'physical' ? Number(minStockAlert) : 0,
      unit: unit.trim() || (type === 'digital' ? '1 unidade' : 'unidade'),
      active: true,
      notes: notes.trim() || undefined,
    });

    if (onProductCreated) {
      onProductCreated(created.id);
    }

    // Reset
    setName('');
    setPrice(10);
    setUnit('1 filme');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Novo Produto / Serviço
              </h2>
              <p className="text-xs text-slate-400">
                Registo estruturado por Tipo: Digital, Físico e Serviços
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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

          {/* 1. SELEÇÃO DE TIPO (DIGITAL / FÍSICO / SERVIÇO) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              1. Tipo de Item <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('digital')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  type === 'digital'
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>DIGITAL</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Filmes, Séries, Novelas
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('physical')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  type === 'physical'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  <span>FÍSICO</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Baterias, Acessórios
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('service')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  type === 'service'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <Wrench className="w-3.5 h-3.5 text-amber-600" />
                  <span>SERVIÇO</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Técnicos & Reparações
                </p>
              </button>
            </div>
          </div>

          {/* 2. CATEGORIA FILTRADA EXCLUSIVAMENTE PELO TIPO SELECIONADO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Categoria ({type.toUpperCase()}) <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Mostra apenas categorias do tipo {type}.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Item <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder={
                  category === 'Filmes' 
                    ? 'Ex.: Filmes (ou Filme Gladiador II)' 
                    : category === 'Séries' 
                    ? 'Ex.: Séries (ou Série Vikings)' 
                    : category === 'Novelas' 
                    ? 'Ex.: Novela Renascer' 
                    : 'Ex.: Bateria Samsung A15'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* REGRAS ESPECIAIS EM DESTAQUE (FILMES / SÉRIES / NOVELAS) */}
          {category === 'Filmes' && (
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-pink-950">
                <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                <span>Regra Especial — Filmes:</span>
              </div>
              <p className="text-[11px] text-pink-800">
                • <strong>10 MT</strong> por filme quando disponível no armazém (SD Card, Pen, HDD, Telefone).
                <br />
                • <strong>30 MT</strong> por filme se solicitado por encomenda.
              </p>
            </div>
          )}

          {category === 'Séries' && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-indigo-950">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Regra Especial — Séries:</span>
              </div>
              <p className="text-[11px] text-indigo-800">
                • <strong>1 unidade = 1 temporada</strong> (e não série completa).
                <br />
                • <strong>30 MT</strong> por temporada existente no armazém / <strong>50 MT</strong> se por encomenda.
              </p>
            </div>
          )}

          {category === 'Novelas' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-purple-950">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Regra Especial — Novelas:</span>
              </div>
              <p className="text-[11px] text-purple-800">
                Preço variável conforme o número de capítulos ou preço indefinido no registo.
              </p>
              <label className="flex items-center space-x-2 text-[11px] font-semibold text-purple-900 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={isVariablePrice}
                  onChange={(e) => setIsVariablePrice(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Preço variável/indefinido (definido no momento da encomenda)</span>
              </label>
            </div>
          )}

          {/* 3. PREÇO & UNIDADE REAL DE VENDA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preço Unitário Base (MT) {!isVariablePrice && <span className="text-rose-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  disabled={isVariablePrice}
                  placeholder={isVariablePrice ? 'Variável / A definir na venda' : 'Ex.: 10 ou 30'}
                  value={isVariablePrice ? '' : price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className={`w-full border rounded-xl px-3 py-2 pr-12 focus:outline-none text-sm font-bold ${
                    isVariablePrice 
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500'
                  }`}
                  required={!isVariablePrice}
                />
                <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                  MT
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unidade Real <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex.: 1 filme, 1 temporada, capítulos, unidade"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs font-medium rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Unidade exibida na encomenda (ex: 8 × Filmes, 1 × Temporada).
              </p>
            </div>
          </div>

          {/* Se FÍSICO: Stock Inicial & Alerta de Mínimo */}
          {type === 'physical' && (
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                <Package className="w-4 h-4 text-emerald-700" />
                <span>Configuração de Stock do Armazém</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Stock Inicial no Armazém
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Alerta de Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Detalhes Adicionais
            </label>
            <input
              type="text"
              placeholder="Ex.: Formato de ficheiro, idiomas, garantia ou especificações..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Botões */}
          <div className="pt-2 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Produto / Serviço</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
