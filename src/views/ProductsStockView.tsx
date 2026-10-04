import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  PlusCircle, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Boxes,
  Film,
  Tv,
  Theater,
  Laptop,
  BatteryMedium,
  Cable,
  Wrench,
  Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Product, ProductCategory, ProductType } from '../types';
import { formatMT } from '../utils/formatters';

interface ProductsStockViewProps {
  onOpenNewProduct: () => void;
  onOpenStockAdjust: (product: Product) => void;
}

export const ProductsStockView: React.FC<ProductsStockViewProps> = ({
  onOpenNewProduct,
  onOpenStockAdjust,
}) => {
  const { products, deleteProduct } = useApp();
  const { permissions, isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ProductType | 'all'>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'in_stock'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const categories: { key: ProductCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'Séries', label: 'Séries', icon: Tv },
    { key: 'Novelas', label: 'Novelas', icon: Theater },
    { key: 'Filmes', label: 'Filmes', icon: Film },
    { key: 'Programas/Software', label: 'Software', icon: Laptop },
    { key: 'Baterias', label: 'Baterias', icon: BatteryMedium },
    { key: 'Acessórios', label: 'Acessórios', icon: Cable },
    { key: 'Serviços Técnicos', label: 'Serviços', icon: Wrench },
    { key: 'Outros', label: 'Outros', icon: Tag },
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchType = typeFilter === 'all' || p.type === typeFilter;

      let matchStock = true;
      if (stockStatusFilter === 'low') {
        matchStock = p.type === 'physical' && p.stockQuantity > 0 && p.stockQuantity <= (p.minStockAlert || 5);
      } else if (stockStatusFilter === 'out') {
        matchStock = p.type === 'physical' && p.stockQuantity <= 0;
      } else if (stockStatusFilter === 'in_stock') {
        matchStock = p.type !== 'physical' || p.stockQuantity > 0;
      }

      return matchSearch && matchCategory && matchType && matchStock;
    });
  }, [products, searchTerm, selectedCategory, typeFilter, stockStatusFilter]);

  const stats = useMemo(() => {
    const totalCount = products.length;
    const physicalProducts = products.filter((p) => p.type === 'physical');
    const digitalProducts = products.filter((p) => p.type === 'digital');
    const lowStock = physicalProducts.filter(
      (p) => p.stockQuantity > 0 && p.stockQuantity <= (p.minStockAlert || 5)
    );
    const outOfStock = physicalProducts.filter((p) => p.stockQuantity <= 0);
    const totalPhysicalUnits = physicalProducts.reduce((sum, p) => sum + p.stockQuantity, 0);

    return {
      totalCount,
      physicalCount: physicalProducts.length,
      digitalCount: digitalProducts.length,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      totalPhysicalUnits,
    };
  }, [products]);

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-black text-slate-900">
              Produtos & Controlo de Stock
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Total do Catálogo: <strong className="text-slate-800">{products.length} itens</strong> • {stats.physicalCount} produtos físicos ({stats.totalPhysicalUnits} unidades) e {stats.digitalCount} produtos digitais
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {permissions.canManageStock && (
            <button
              onClick={onOpenNewProduct}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Novo Produto</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Produtos</div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">{stats.totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{stats.digitalCount} digitais | {stats.physicalCount} físicos</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Unidades em Armazém</div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1">{stats.totalPhysicalUnits} un.</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Stock físico ativo</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Alerta de Baixo Stock</div>
          <div className="text-lg sm:text-xl font-black text-amber-600 mt-1">{stats.lowStockCount}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">Abaixo do nível mínimo</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Esgotados (Sem Stock)</div>
          <div className="text-lg sm:text-xl font-black text-rose-600 mt-1">{stats.outOfStockCount}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">Necessitam reposição</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome do produto, código, notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
            >
              <option value="all">Todos os Tipos</option>
              <option value="physical">Físico (com stock)</option>
              <option value="digital">Digital (ilimitado)</option>
              <option value="service">Serviço Técnico</option>
            </select>

            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
            >
              <option value="all">Todos os Estados</option>
              <option value="in_stock">Em Stock</option>
              <option value="low">⚠️ Baixo Stock</option>
              <option value="out">🛑 Esgotados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Package className="w-12 h-12 mx-auto text-slate-300" />
            <div className="text-sm font-semibold text-slate-600">Nenhum produto encontrado</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Não existem produtos correspondentes aos filtros selecionados.
            </p>
            {permissions.canManageStock && (
              <button
                onClick={onOpenNewProduct}
                className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Adicionar Primeiro Produto</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-right">Preço Venda</th>
                  <th className="py-3 px-4 text-center">Stock Atual</th>
                  <th className="py-3 px-4 text-center">Estado Stock</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const isLow = product.type === 'physical' && product.stockQuantity > 0 && product.stockQuantity <= (product.minStockAlert || 5);
                  const isOut = product.type === 'physical' && product.stockQuantity <= 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                        {product.code}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{product.name}</div>
                        {product.notes && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{product.notes}</div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {product.category}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4">
                        {product.type === 'digital' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                            Digital
                          </span>
                        ) : product.type === 'service' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Serviço
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                            Físico
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatMT(product.price)}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-4 text-center">
                        {product.type !== 'physical' ? (
                          <span className="text-slate-400 font-bold">∞ Ilimitado</span>
                        ) : (
                          <span className={`font-black text-sm ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                            {product.stockQuantity} un.
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {product.type !== 'physical' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Disponível</span>
                          </span>
                        ) : isOut ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Esgotado</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Baixo Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Em Stock</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Adjust Stock (for physical products) */}
                          {product.type === 'physical' && permissions.canManageStock && (
                            <button
                              onClick={() => onOpenStockAdjust(product)}
                              className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors flex items-center space-x-1 cursor-pointer"
                              title="Ajustar Stock (Entrada / Saída / Acerto)"
                            >
                              <Boxes className="w-3.5 h-3.5 text-purple-600" />
                              <span>Ajustar Stock</span>
                            </button>
                          )}

                          {/* Delete Product */}
                          {permissions.canManageStock && (
                            <button
                              onClick={() => setConfirmDeleteId(product.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar Produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Eliminar Produto?</h3>
            <p className="text-xs text-slate-500">
              Tem a certeza de que pretende remover este produto do catálogo?
            </p>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
              >
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
