import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Sales } from './components/Sales';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS } from './constants';
import { Product, Transaction, ThemeColor } from './types';
import { fetchSheetData, syncInventoryToSheet, addTransactionToSheet } from './services/sheetService';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [theme, setTheme] = useState<ThemeColor>('emerald');
  const [scriptUrl, setScriptUrl] = useState('');
  
  // Data State
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [isLoading, setIsLoading] = useState(false);

  // Load script URL from local storage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('LKT_SHEET_URL');
    if (savedUrl) {
      setScriptUrl(savedUrl);
      // We use a silent catch here because we don't want to alert on initial load
      // (The user might be offline or URL might be stale)
      loadDataFromSheet(savedUrl).catch(e => console.warn("Initial sync failed:", e));
    }
  }, []);

  const loadDataFromSheet = async (url: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await fetchSheetData(url);
      if (data.products) setProducts(data.products);
      if (data.transactions) setTransactions(data.transactions);
      console.log("Data synced from sheet");
      return true;
    } catch (e) {
      // IMPORTANT: Throw the error so the Settings component can display the specific message
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncInventory = (updatedProducts: Product[]) => {
    // 1. Update Local State
    setProducts(updatedProducts);
    // 2. Sync to Cloud if connected
    if (scriptUrl) {
      syncInventoryToSheet(scriptUrl, updatedProducts);
    }
  };

  const handleTransactionComplete = (transaction: Transaction, updatedProducts: Product[]) => {
    // 1. Update Local State
    setTransactions(prev => [transaction, ...prev]);
    setProducts(updatedProducts);
    
    // 2. Sync to Cloud
    if (scriptUrl) {
      // We push the transaction individually
      addTransactionToSheet(scriptUrl, transaction);
      // We also update inventory because stock counts changed
      syncInventoryToSheet(scriptUrl, updatedProducts);
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
               <span className="text-xs font-medium text-slate-600">Syncing with Google Sheets...</span>
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
                onSync={handleSyncInventory} // Pass the sync handler
                theme={theme}
            />
          )}

          {currentView === 'sales' && (
            <Sales 
                products={products} 
                setProducts={setProducts} 
                setTransactions={setTransactions} 
                onTransactionComplete={handleTransactionComplete} // Pass the sync handler
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