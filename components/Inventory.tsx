import React, { useState, useMemo } from 'react';
import { Category, Product, InventoryProps } from '../types';
import { Plus, Search, AlertCircle, Sparkles, Trash2, X, Settings2, Calendar, Pencil, BarChart3 } from 'lucide-react';
import { analyzeObsolescence } from '../services/geminiService';
import { THEME_COLORS } from '../constants';

export const Inventory: React.FC<InventoryProps> = ({ products, setProducts, onSync, theme }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Inventory Settings
  const [obsolescenceThreshold, setObsolescenceThreshold] = useState(120);

  // New Product State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    category: Category.CLUBS,
    quantity: 1,
    dateAdded: new Date().toISOString().split('T')[0] // Default to today YYYY-MM-DD
  });

  const styles = THEME_COLORS[theme];

  const availableCategories = useMemo(() => {
    const defaults = Object.values(Category) as string[];
    const existing = products.map(p => p.category);
    return Array.from(new Set([...defaults, ...existing])).sort();
  }, [products]);

  const handleSaveProduct = () => {
    if (!newProduct.name || !newProduct.costPrice || !newProduct.sellingPrice || !newProduct.category) return;
    
    let updatedProducts = [...products];

    if (editId) {
      // Update existing
      updatedProducts = products.map(p => {
        if (p.id === editId) {
          return {
            ...p,
            name: newProduct.name!,
            sku: newProduct.sku || p.sku,
            category: newProduct.category!,
            costPrice: Number(newProduct.costPrice),
            sellingPrice: Number(newProduct.sellingPrice),
            quantity: Number(newProduct.quantity),
            dateAdded: newProduct.dateAdded ? new Date(newProduct.dateAdded).toISOString() : p.dateAdded
          };
        }
        return p;
      });
    } else {
      // Add new
      const product: Product = {
        id: Math.random().toString(36).substr(2, 9),
        sku: newProduct.sku || `SKU-${Math.floor(Math.random()*10000)}`,
        name: newProduct.name,
        category: newProduct.category,
        costPrice: Number(newProduct.costPrice),
        sellingPrice: Number(newProduct.sellingPrice),
        quantity: Number(newProduct.quantity),
        dateAdded: newProduct.dateAdded ? new Date(newProduct.dateAdded).toISOString() : new Date().toISOString()
      };
      updatedProducts = [product, ...products];
    }

    if (onSync) {
      onSync(updatedProducts);
    } else {
      setProducts(updatedProducts);
    }

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const updated = products.filter(p => p.id !== id);
      if (onSync) onSync(updated);
      else setProducts(updated);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditId(product.id);
    setNewProduct({
      name: product.name,
      sku: product.sku,
      category: product.category,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      dateAdded: new Date(product.dateAdded).toISOString().split('T')[0]
    });
    setIsCustomCategory(false);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setShowAddModal(false);
    setEditId(null);
    setNewProduct({ category: Category.CLUBS, quantity: 1, dateAdded: new Date().toISOString().split('T')[0] });
    setIsCustomCategory(false);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await analyzeObsolescence(products);
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDaysInStock = (dateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const added = new Date(dateStr);
    added.setHours(0,0,0,0);
    const diffTime = Math.abs(today.getTime() - added.getTime());
    const days = Math.floor(diffTime / (1000 * 3600 * 24));
    return days;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
        <div className="flex gap-2">
            <button 
                onClick={handleAnalyze}
                disabled={analyzing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${styles.bgLight} ${styles.text} hover:opacity-80`}
            >
                {analyzing ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {analyzing ? 'Analyzing...' : 'AI Check'}
            </button>
            <button 
                onClick={() => {
                  setEditId(null);
                  setNewProduct({ category: Category.CLUBS, quantity: 1, dateAdded: new Date().toISOString().split('T')[0] });
                  setShowAddModal(true);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors shadow-sm ${styles.primary} ${styles.hover}`}
            >
                <Plus className="w-4 h-4" /> Add Item
            </button>
        </div>
      </div>

      <div className="bg-slate-100 p-4 rounded-xl flex items-center justify-between">
         <div className="flex items-center gap-3">
             <Settings2 className="w-5 h-5 text-slate-500" />
             <span className="text-sm font-medium text-slate-700">Obsolescence Criteria:</span>
         </div>
         <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                 <label className="text-sm text-slate-600">Consider inventory obsolete after:</label>
                 <div className="relative">
                    <input 
                        type="number" 
                        value={obsolescenceThreshold}
                        onChange={(e) => setObsolescenceThreshold(Math.max(1, Number(e.target.value)))}
                        className={`w-20 px-3 py-1 border border-slate-300 rounded-lg text-center font-bold text-slate-700 focus:ring-2 outline-none ${styles.ring}`}
                    />
                 </div>
                 <span className="text-sm text-slate-600">days</span>
             </div>
         </div>
      </div>

      {aiAnalysis && (
        <div className={`bg-white p-6 rounded-xl shadow-md border-l-4 animate-slide-in ${styles.border.replace('border-200', 'border-500')}`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-slate-800">Gemini Analysis Report</h3>
                <button onClick={() => setAiAnalysis(null)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="prose prose-sm max-w-none text-slate-600 whitespace-pre-line">
                {aiAnalysis}
            </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
            type="text"
            placeholder="Search by name or SKU..."
            className={`w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${styles.ring}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                <tr>
                <th className="p-4 font-medium">Product Info</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium text-right">Cost / Sell</th>
                <th className="p-4 font-medium text-center">Stock</th>
                <th className="p-4 font-medium text-left">Obsolescence Risk</th>
                <th className="p-4 font-medium text-center">Date Added / Age</th>
                <th className="p-4 font-medium text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(product => {
                    const days = getDaysInStock(product.dateAdded);
                    const isObsolete = days > obsolescenceThreshold;
                    const riskPercentage = Math.min(100, (days / obsolescenceThreshold) * 100);
                    
                    let riskColor = 'bg-emerald-500';
                    let riskLabel = 'Fresh';
                    if (riskPercentage > 50) { riskColor = 'bg-amber-500'; riskLabel = 'Aging'; }
                    if (riskPercentage >= 100) { riskColor = 'bg-red-500'; riskLabel = 'Obsolete'; }

                    return (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                                <div className="font-medium text-slate-900">{product.name}</div>
                                <div className="text-xs text-slate-500">{product.sku}</div>
                            </td>
                            <td className="p-4 text-sm text-slate-600">
                                <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium">
                                    {product.category}
                                </span>
                            </td>
                            <td className="p-4 text-right text-sm">
                                <div className="text-slate-900 font-medium">RM {product.sellingPrice}</div>
                                <div className="text-slate-400 text-xs">RM {product.costPrice}</div>
                            </td>
                            <td className="p-4 text-center">
                                <span className={`font-bold ${product.quantity < 3 ? 'text-red-500' : 'text-slate-700'}`}>
                                    {product.quantity}
                                </span>
                            </td>
                            <td className="p-4 w-48">
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className={`font-medium ${riskPercentage >= 100 ? 'text-red-600' : 'text-slate-600'}`}>{riskLabel}</span>
                                        <span className="text-slate-400">{Math.round(riskPercentage)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-500 ${riskColor}`}
                                            style={{ width: `${riskPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-center">
                                <div className="flex flex-col items-center">
                                    <span className="text-xs text-slate-400 mb-1">{new Date(product.dateAdded).toLocaleDateString()}</span>
                                    <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${isObsolete ? 'bg-red-100 text-red-700' : 'text-slate-600 bg-slate-100'}`}>
                                        {isObsolete && <AlertCircle className="w-3 h-3" />}
                                        {days} days
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button 
                                      onClick={() => handleEditClick(product)}
                                      className={`p-2 text-slate-400 transition-colors ${styles.text.replace('text', 'hover:text')}`}
                                      title="Edit Product"
                                  >
                                      <Pencil className="w-4 h-4" />
                                  </button>
                                  <button 
                                      onClick={() => handleDelete(product.id)}
                                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                      title="Delete Product"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
            </table>
            {filteredProducts.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                    No products found. Add some inventory to get started.
                </div>
            )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">
                      {editId ? 'Edit Equipment' : 'Add New Equipment'}
                    </h3>
                    <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                            <input 
                                className={`w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 ${styles.ring}`}
                                value={newProduct.name || ''}
                                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                placeholder="e.g. Callaway Rogue ST Driver"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SKU (Optional)</label>
                            <input 
                                className={`w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 ${styles.ring}`}
                                value={newProduct.sku || ''}
                                onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                                placeholder="SKU-123"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            {isCustomCategory ? (
                                <div className="flex gap-2">
                                    <input 
                                        autoFocus
                                        className={`w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 ${styles.ring}`}
                                        placeholder="Type new category..."
                                        value={newProduct.category}
                                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                                    />
                                    <button 
                                        onClick={() => {
                                            setIsCustomCategory(false);
                                            setNewProduct({...newProduct, category: Category.CLUBS});
                                        }}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap px-2"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <select 
                                    className={`w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 ${styles.ring}`}
                                    value={newProduct.category}
                                    onChange={e => {
                                        if (e.target.value === 'CUSTOM_OPTION') {
                                            setIsCustomCategory(true);
                                            setNewProduct({...newProduct, category: ''});
                                        } else {
                                            setNewProduct({...newProduct, category: e.target.value});
                                        }
                                    }}
                                >
                                    {availableCategories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                    <option value="CUSTOM_OPTION" className={`font-bold ${styles.text}`}>+ Add New Category...</option>
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price (RM)</label>
                            <input 
                                type="number"
                                className={`w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 ${styles.ring}`}
                                value={newProduct.costPrice || ''}
                                onChange={e => setNewProduct({...newProduct, costPrice: Number(e.target.value)})}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price (RM)</label>
                            <input 
                                type="number"
                                className={`w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 ${styles.ring}`}
                                value={newProduct.sellingPrice || ''}
                                onChange={e => setNewProduct({...newProduct, sellingPrice: Number(e.target.value)})}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                            <input 
                                type="number"
                                className={`w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 ${styles.ring}`}
                                value={newProduct.quantity || ''}
                                onChange={e => setNewProduct({...newProduct, quantity: Number(e.target.value)})}
                                placeholder="1"
                            />
                        </div>
                        <div className="col-span-2">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Date Added / Bought</label>
                             <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="date"
                                    className={`w-full pl-10 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 ${styles.ring}`}
                                    value={newProduct.dateAdded || ''}
                                    onChange={e => setNewProduct({...newProduct, dateAdded: e.target.value})}
                                />
                             </div>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button 
                        onClick={resetForm}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveProduct}
                        className={`px-4 py-2 text-white rounded-lg shadow-md transition-colors ${styles.primary} ${styles.hover}`}
                    >
                        {editId ? 'Save Changes' : 'Add Product'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
