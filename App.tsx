import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Sales } from './components/Sales';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS } from './constants';
import { Product, Transaction, ThemeColor } from './types';
import { fetchSheetData, upsertProduct, deleteProduct, adjustStock, addTransactionToSheet } from './services/sheetService';

const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwsLvTut-jqLFyAtWByJRo4F8pRHoyREEHSdsUyXwZrQc4OtxUVEM6f6lo8PT3MSxXw/exec";

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [theme, setTheme] = useState<ThemeColor>('emerald');
  const [scriptUrl, setScriptUrl] = useState(DEFAULT_SCRIPT_URL);
  
  // Data State
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [isLoading, setIsLoading] = useState(false);

  // Load script URL from local storage on mount, or use default
  useEffect(() => {
    const savedUrl = localStorage.getItem('LKT_SHEET_URL');
    const urlToUse = savedUrl || DEFAULT_SCRIPT_URL;
    
    setScriptUrl(urlToUse);
    
    // Always attempt to load data on startup
    loadDataFromSheet(urlToUse).catch(() => {});
    
    // If we fell back to default, save it for consistency
    if (!savedUrl) {
        localStorage.setItem('LKT_SHEET_URL', DEFAULT_SCRIPT_URL);
    }
  }, []);

  // POLLING: Auto-refresh data every 15 seconds if connected
  useEffect(() => {
    if (!scriptUrl) return;
    
    const intervalId = setInterval(() => {
      // Silent refresh (don't show loading spinner)
      fetchSheetData(scriptUrl)
        .then(data => {
            if (data.products) setProducts(data.products);
            if (data.transactions) setTransactions(data.transactions);
        })
        .catch(e => console.log("Background sync failed", e));
    }, 15000); // 15 seconds

    return () => clearInterval(intervalId);
  }, [scriptUrl]);

  const loadDataFromSheet = async (url: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await fetchSheetData(url);
      if (data.products) setProducts(data.products);
      if (data.transactions) setTransactions(data.transactions);
      return true;
    } catch (e) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // HANDLER: Save a single product (Update or Create)
  const handleProductSave = (product: Product) => {
    // Optimistic Update (Update UI immediately)
    setProducts(prev => {
        const exists = prev.find(p => p.id === product.id);
        if (exists) {
            return prev.map(p => p.id === product.id ? product : p);
        }
        return [product, ...prev];
    });

    // Send to Google Sheet
    if (scriptUrl) {
      upsertProduct(scriptUrl, product);
    }
  };

  // HANDLER: Delete a single product
  const handleProductDelete = (productId: string) => {
    // Optimistic Update
    setProducts(prev => prev.filter(p => p.id !== productId));

    // Send to Google Sheet
    if (scriptUrl) {
        deleteProduct(scriptUrl, productId);
    }
  };

  // HANDLER: Process Sale
  const handleTransactionComplete = (transaction: Transaction) => {
    // 1. Optimistic Update (Transactions)
    setTransactions(prev => [transaction, ...prev]);

    // 2. Optimistic Update (Inventory - Deduct Stock)
    setProducts(prev => prev.map(p => {
        const soldItem = transaction.items.find(item => item.productId === p.id);
        if (soldItem) {
            return { ...p, quantity: p.quantity - soldItem.quantity };
        }
        return p;
    }));
    
    // 3. Sync to Cloud
    if (scriptUrl) {
      addTransactionToSheet(scriptUrl, transaction);
      adjustStock(scriptUrl, transaction.items); // Only tell sheet to deduct X from Y
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        theme={theme}
        setTheme={setTheme}
      />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto h-full">
          {isLoading && (
            <div className="fixed top-4 right-4 bg-white px-4 py-2 rounded-lg shadow-md border border-slate-100 flex items-center gap-2 z-50 animate-pulse">
               <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
               <span className="text-xs font-medium text-slate-600">Syncing...</span>
            </div>
          )}

          {currentView === 'dashboard' && (
            <Dashboard 
                products={products} 
                transactions={transactions} 
                theme={theme}
            />
          )}
          
          {currentView === 'inventory' && (
            <Inventory 
                products={products} 
                setProducts={setProducts} 
                onProductSave={handleProductSave}
                onProductDelete={handleProductDelete}
                theme={theme}
            />
          )}

          {currentView === 'sales' && (
            <Sales 
                products={products} 
                setProducts={setProducts} 
                setTransactions={setTransactions} 
                onTransactionComplete={handleTransactionComplete}
                theme={theme}
            />
          )}

          {currentView === 'reports' && (
            <Reports 
                products={products} 
                transactions={transactions} 
                theme={theme}
            />
          )}

          {currentView === 'settings' && (
            <Settings 
                theme={theme}
                scriptUrl={scriptUrl}
                setScriptUrl={setScriptUrl}
                onRefreshData={() => loadDataFromSheet(scriptUrl)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;