import React, { useState } from 'react';
import { Product, Transaction, TransactionItem, SalesProps } from '../types';
import { ShoppingCart, Plus, Minus, CreditCard, Banknote, Landmark, FileText, User, MapPin, Calendar } from 'lucide-react';
import { THEME_COLORS } from '../constants';

export const Sales: React.FC<SalesProps> = ({ products, setProducts, setTransactions, onTransactionComplete, theme }) => {
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  
  // Transaction Details
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD' | 'ACCRUAL'>('CASH');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  const styles = THEME_COLORS[theme];

  const addToCart = () => {
    if (!selectedProduct) return;
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const existing = cart.find(item => item.productId === product.id);
    
    // Check stock
    const currentQtyInCart = existing ? existing.quantity : 0;
    if (product.quantity <= currentQtyInCart) {
        alert("Insufficient stock!");
        return;
    }

    if (existing) {
        setCart(cart.map(item => 
            item.productId === product.id 
                ? { ...item, quantity: item.quantity + 1 } 
                : item
        ));
    } else {
        setCart([...cart, {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            priceAtSale: product.sellingPrice
        }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
        if (item.productId === productId) {
            return { ...item, quantity: Math.max(1, item.quantity + delta) };
        }
        return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.priceAtSale * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const transaction: Transaction = {
        id: Date.now().toString(),
        date: new Date(transactionDate).toISOString(), // Use selected date
        items: [...cart],
        totalAmount: cartTotal,
        paymentMethod: paymentMethod,
        customerName: customerName || undefined,
        customerAddress: customerAddress || undefined
    };

    // Calculate new inventory state
    const updatedProducts = products.map(p => {
        const cartItem = cart.find(c => c.productId === p.id);
        if (cartItem) {
            return { ...p, quantity: p.quantity - cartItem.quantity };
        }
        return p;
    });

    if (onTransactionComplete) {
      onTransactionComplete(transaction, updatedProducts);
    } else {
      // Fallback if no handler provided
      setTransactions(prev => [transaction, ...prev]);
      setProducts(updatedProducts);
    }

    // Reset
    setCart([]);
    setSelectedProduct('');
    setCustomerName('');
    setCustomerAddress('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    alert("Sale recorded successfully!");
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">New Sale</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Product</label>
                <div className="flex gap-2">
                    <select 
                        className={`flex-1 p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 ${styles.ring}`}
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                    >
                        <option value="">-- Choose Item --</option>
                        {products.filter(p => p.quantity > 0).map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} - RM {p.sellingPrice} ({p.quantity} in stock)
                            </option>
                        ))}
                    </select>
                    <button 
                        onClick={addToCart}
                        disabled={!selectedProduct}
                        className={`px-6 py-3 rounded-lg text-white font-medium disabled:opacity-50 transition-colors ${styles.primary} ${styles.hover}`}
                    >
                        Add
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-slate-500" /> Customer Details (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                        <input 
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className={`w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 ${styles.ring}`}
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sale Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="date"
                                value={transactionDate}
                                onChange={(e) => setTransactionDate(e.target.value)}
                                className={`w-full pl-10 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 ${styles.ring}`}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Billing Address</label>
                        <div className="relative">
                             <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <textarea 
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                className={`w-full pl-10 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 ${styles.ring}`}
                                placeholder="e.g. 123 Golf Club Road, Kuala Lumpur"
                                rows={2}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-slate-100 flex flex-col h-[calc(100vh-140px)] sticky top-6">
            <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" /> Current Order
                </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                    <div className="text-center text-slate-400 mt-10">
                        Cart is empty
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.productId} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <div className="flex-1">
                                <div className="font-medium text-slate-800 text-sm">{item.productName}</div>
                                <div className={`text-xs font-bold ${styles.text}`}>RM {item.priceAtSale * item.quantity}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 text-slate-400 hover:text-slate-600">
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-medium text-sm w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 text-slate-400 hover:text-slate-600">
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button onClick={() => removeFromCart(item.productId)} className="ml-2 text-red-400 hover:text-red-600 text-xs">
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-bold text-xl text-slate-900">RM {cartTotal.toFixed(2)}</span>
                </div>

                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Payment Method</span>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => setPaymentMethod('CASH')}
                            className={`p-2 rounded-lg border text-sm flex flex-col items-center gap-1 ${paymentMethod === 'CASH' ? `${styles.bgLight} ${styles.border} ${styles.text}` : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                            <Banknote className="w-4 h-4" /> Cash
                        </button>
                        <button 
                            onClick={() => setPaymentMethod('BANK_TRANSFER')}
                            className={`p-2 rounded-lg border text-sm flex flex-col items-center gap-1 ${paymentMethod === 'BANK_TRANSFER' ? `${styles.bgLight} ${styles.border} ${styles.text}` : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                            <Landmark className="w-4 h-4" /> Bank
                        </button>
                        <button 
                            onClick={() => setPaymentMethod('CARD')}
                            className={`p-2 rounded-lg border text-sm flex flex-col items-center gap-1 ${paymentMethod === 'CARD' ? `${styles.bgLight} ${styles.border} ${styles.text}` : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                            <CreditCard className="w-4 h-4" /> Card
                        </button>
                        <button 
                            onClick={() => setPaymentMethod('ACCRUAL')}
                            className={`p-2 rounded-lg border text-sm flex flex-col items-center gap-1 ${paymentMethod === 'ACCRUAL' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                            <FileText className="w-4 h-4" /> Accrual
                        </button>
                    </div>
                </div>

                <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Complete Sale
                </button>
            </div>
        </div>
    </div>
  );
};
