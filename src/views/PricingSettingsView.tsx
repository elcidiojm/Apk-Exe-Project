import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  Tag, 
  Search, 
  PlusCircle, 
  Film, 
  Tv, 
  Theater, 
  Laptop, 
  BatteryMedium, 
  Cable, 
  Wrench, 
  Check, 
  Save, 
  Percent, 
  Layers, 
  ArrowUpDown, 
  Sparkles, 
  Trash2,
  AlertCircle,
  HelpCircle,
  Package
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Product, ProductCategory, ProductType } from '../types';
import { formatMT } from '../utils/formatters';

interface PricingSettingsViewProps {
  onOpenNewProduct: () => void;
}

export const PricingSettingsView: React.FC<PricingSettingsViewProps> = ({
  onOpenNewProduct,
}) => {
  const { products, updateProduct, deleteProduct, batchUpdateCategoryPrices, syncStatus } = useApp();
  const { isAdmin } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [recentlySavedId, setRecentlySavedId] = useState<string | null>(null);

  // Batch adjustment modal/popover state
  const [batchCategory, setBatchCategory] = useState<ProductCategory | null>(null);
  const [batchType, setBatchType] = useState<'percent' | 'fixed' | 'set'>('fixed');
  const [batchValue, setBatchValue] = useState<number>(50);

  const categories: { key: ProductCategory; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
    { key: 'Séries', label: 'Séries', icon: Tv, color: 'indigo' },
    { key: 'Novelas', label: 'Novelas', icon: Theater, color: 'purple' },
    { key: 'Filmes', label: 'Filmes', icon: Film, color: 'pink' },
    { key: 'Programas/Software', label: 'Programas & Software', icon: Laptop, color: 'sky' },
    { key: 'Baterias', label: 'Baterias (Armazém)', icon: BatteryMedium, color: 'emerald' },
    { key: 'Acessórios', label: 'Acessórios & Cabos', icon: Cable, color: 'amber' },
    { key: 'Serviços Técnicos', label: 'Serviços Técnicos', icon: Wrench, color: 'rose' },
    { key: 'Outros', label: 'Outros Itens', icon: Tag, color: 'slate' },
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Handle instant field update with immediate feedback
  const handleInstantUpdate = (productId: string, field: keyof Product, value: any) => {
    updateProduct(productId, { [field]: value });
    setRecentlySavedId(productId);
    setTimeout(() => {
      setRecentlySavedId((prev) => (prev === productId ? null : prev));
    }, 2000);
  };

  const handleApplyBatch = () => {
    if (!batchCategory) return;
    batchUpdateCategoryPrices(batchCategory, { type: batchType, value: Number(batchValue) });
    setBatchCategory(null);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                Definições de Preços & Catálogo por Categoria
              </h1>
              <p className="text-xs text-slate-500">
                Personalize os preços de cada produto de forma isolada. Todas as alterações são atualizadas e sincronizadas imediatamente na nuvem.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {recentlySavedId && (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold animate-pulse">
              <Check className="w-3.5 h-3.5" />
              <span>Atualizado na nuvem!</span>
            </div>
          )}

          {isAdmin && (
            <button
              onClick={onOpenNewProduct}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-700/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Novo Serviço / Produto</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Selector */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Categorias de Conteúdo e Serviços
          </span>
          <span className="text-[11px] text-slate-400">
            {products.length} itens cadastrados no total
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({products.length})
          </button>

          {categories.map((c) => {
            const count = products.filter((p) => p.category === c.key).length;
            const Icon = c.icon;
            const isSelected = selectedCategory === c.key;

            return (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{c.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar & Category Quick Action */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Pesquisar produto, série, código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {selectedCategory !== 'all' && isAdmin && (
          <button
            onClick={() => setBatchCategory(selectedCategory)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Percent className="w-3.5 h-3.5 text-amber-600" />
            <span>Ajustar Preços em Massa para "{selectedCategory}"</span>
          </button>
        )}
      </div>

      {/* Products & Prices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => {
          const isRecentlySaved = recentlySavedId === p.id;
          const isPhysical = p.type === 'physical';

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between space-y-3 ${
                isRecentlySaved
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <div>
                {/* Top badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        p.category === 'Séries'
                          ? 'bg-indigo-50 text-indigo-700'
                          : p.category === 'Novelas'
                          ? 'bg-purple-50 text-purple-700'
                          : p.category === 'Filmes'
                          ? 'bg-pink-50 text-pink-700'
                          : p.category === 'Programas/Software'
                          ? 'bg-sky-50 text-sky-700'
                          : p.category === 'Baterias'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      <span>{p.category}</span>
                    </span>

                    <span className="text-[10px] font-mono text-slate-400">
                      {p.code}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {isRecentlySaved && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                        <Check className="w-3 h-3 mr-0.5" /> Salvo
                      </span>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (confirm(`Tem a certeza que deseja eliminar "${p.name}"?`)) {
                            deleteProduct(p.id);
                          }
                        }}
                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Eliminar produto do catálogo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Name Edit */}
                <div className="mt-2.5">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                    Nome do Item / Serviço
                  </label>
                  <input
                    type="text"
                    defaultValue={p.name}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== p.name) {
                        handleInstantUpdate(p.id, 'name', e.target.value.trim());
                      }
                    }}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-slate-900 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Category & Unit Selector */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      Categoria
                    </label>
                    <select
                      value={p.category}
                      onChange={(e) => handleInstantUpdate(p.id, 'category', e.target.value as ProductCategory)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[11px] rounded-lg px-2 py-1.5 font-medium focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Séries">📺 Séries</option>
                      <option value="Novelas">🎭 Novelas</option>
                      <option value="Filmes">🎬 Filmes</option>
                      <option value="Programas/Software">💻 Software</option>
                      <option value="Baterias">🔋 Baterias</option>
                      <option value="Acessórios">🔌 Acessórios</option>
                      <option value="Serviços Técnicos">🛠️ Serviço</option>
                      <option value="Outros">➕ Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      Unidade de Venda
                    </label>
                    <input
                      type="text"
                      defaultValue={p.unit}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== p.unit) {
                          handleInstantUpdate(p.id, 'unit', e.target.value.trim());
                        }
                      }}
                      placeholder="temporada, un, etc."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[11px] rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Price Row (Core Feature) */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500">
                    Preço Padrão (MT)
                  </label>
                  <p className="text-[9px] text-slate-400">Personalize livremente</p>
                </div>

                <div className="relative w-32">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    defaultValue={p.price}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val >= 0 && val !== p.price) {
                        handleInstantUpdate(p.id, 'price', val);
                      }
                    }}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 text-indigo-700 font-extrabold text-sm rounded-xl px-2.5 py-1.5 pr-8 text-right focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="absolute right-2 top-2 text-xs font-bold text-slate-400 pointer-events-none">
                    MT
                  </span>
                </div>
              </div>

              {/* Stock info if physical */}
              {isPhysical && (
                <div className="bg-slate-50 rounded-lg p-2 text-[10px] text-slate-600 flex justify-between items-center border border-slate-200/60">
                  <span>Stock em Armazém:</span>
                  <span className="font-bold font-mono">
                    {p.stockQuantity} {p.unit}s
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
            <Tag className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Nenhum item encontrado nesta categoria ou pesquisa.
            </p>
            <p className="text-xs text-slate-400">
              Clique em "+ Novo Serviço / Produto" para cadastrar itens e definir preços.
            </p>
          </div>
        )}
      </div>

      {/* Batch Price Adjustment Modal */}
      {batchCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Ajustar Preços da Categoria "{batchCategory}"
              </h3>
              <button
                onClick={() => setBatchCategory(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Aplique um reajuste uniforme para todos os produtos e conteúdos cadastrados sob a categoria{' '}
              <strong>{batchCategory}</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Ajuste
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchType('fixed')}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      batchType === 'fixed'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Somar (+MT)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchType('percent')}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      batchType === 'percent'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Percentual (+%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchType('set')}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      batchType === 'set'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Definir Fixo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {batchType === 'percent' ? 'Percentagem (%)' : 'Valor em Meticais (MT)'}
                </label>
                <input
                  type="number"
                  value={batchValue}
                  onChange={(e) => setBatchValue(parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 50 ou 10"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBatchCategory(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyBatch}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs"
              >
                Aplicar a Todos ({products.filter((p) => p.category === batchCategory).length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
