import React from 'react';
import { Product, Transaction, ReportsProps } from '../types';
import { FileSpreadsheet, Download, TrendingUp, Package, AlertTriangle, Calendar } from 'lucide-react';
import { THEME_COLORS } from '../constants';

export const Reports: React.FC<ReportsProps> = ({ products, transactions, theme }) => {
  const styles = THEME_COLORS[theme];

  // Helper to trigger download
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generateInventoryCSV = () => {
    const headers = ['ID', 'SKU', 'Product Name', 'Category', 'Cost Price (RM)', 'Selling Price (RM)', 'Quantity', 'Total Asset Value (RM)', 'Date Added', 'Days in Stock', 'Risk Percentage', 'Status'];
    const rows = products.map(p => {
        const stockValue = p.costPrice * p.quantity;
        const daysInStock = Math.floor((new Date().getTime() - new Date(p.dateAdded).getTime()) / (1000 * 3600 * 24));
        const status = daysInStock > 120 ? 'Obsolete Risk' : 'Active';
        const riskPct = Math.min(100, (daysInStock / 120) * 100);

        // Escape quotes for CSV format
        const safeName = `"${p.name.replace(/"/g, '""')}"`;
        const safeSku = `"${p.sku.replace(/"/g, '""')}"`;

        return [
            p.id,
            safeSku,
            safeName,
            p.category,
            p.costPrice.toFixed(2),
            p.sellingPrice.toFixed(2),
            p.quantity,
            stockValue.toFixed(2),
            new Date(p.dateAdded).toLocaleDateString(),
            daysInStock,
            riskPct.toFixed(0) + '%',
            status
        ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `LKT_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generateSalesCSV = () => {
    const headers = ['Date', 'Transaction ID', 'Customer Name', 'Payment Method', 'Item Name', 'Quantity', 'Unit Price (RM)', 'Line Total (RM)'];
    const rows: string[] = [];
    
    transactions.forEach(t => {
        t.items.forEach(item => {
            const safeCustomer = `"${(t.customerName || 'Walk-in').replace(/"/g, '""')}"`;
            const safeItem = `"${item.productName.replace(/"/g, '""')}"`;
            
            rows.push([
                new Date(t.date).toLocaleDateString(),
                t.id,
                safeCustomer,
                t.paymentMethod,
                safeItem,
                item.quantity,
                item.priceAtSale.toFixed(2),
                (item.priceAtSale * item.quantity).toFixed(2)
            ].join(','));
        });
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `LKT_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Summary Metrics
  const totalStockValue = products.reduce((acc, p) => acc + (p.costPrice * p.quantity), 0);
  const totalRevenue = transactions.reduce((acc, t) => acc + t.totalAmount, 0);
  const obsoleteCount = products.filter(p => {
      const days = (new Date().getTime() - new Date(p.dateAdded).getTime()) / (1000 * 3600 * 24);
      return days > 120;
  }).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">System Reports</h2>
        <span className="text-sm text-slate-500">Generate data for Google Sheets</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Inventory Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg ${styles.bgLight}`}>
                    <Package className={`w-6 h-6 ${styles.text}`} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-800">Inventory Status</h3>
                    <p className="text-sm text-slate-500">Stock levels and valuation</p>
                </div>
            </div>
            
            <div className="flex-1 space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">Total Asset Value</span>
                    <span className="font-bold text-slate-900">RM {totalStockValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <span className="text-amber-700 font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Obsolete Risk Items
                    </span>
                    <span className="font-bold text-amber-700">{obsoleteCount} items</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                    Downloads a full list of products including Cost Price, Selling Price, and Days in Stock to help identify slow-moving items.
                </p>
            </div>

            <button 
                onClick={generateInventoryCSV}
                className={`w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl font-medium transition-colors shadow-sm ${styles.primary} ${styles.hover}`}
            >
                <FileSpreadsheet className="w-5 h-5" /> Export to Google Sheets
            </button>
        </div>

        {/* Sales Report Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg ${styles.bgLight}`}>
                    <TrendingUp className={`w-6 h-6 ${styles.text}`} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-800">Sales Performance</h3>
                    <p className="text-sm text-slate-500">Transaction logs and revenue</p>
                </div>
            </div>

            <div className="flex-1 space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">Total Revenue</span>
                    <span className="font-bold text-slate-900">RM {totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">Transactions Recorded</span>
                    <span className="font-bold text-slate-900">{transactions.length}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                    Downloads a detailed transaction log suitable for pivot tables. Includes Customer Name and Payment Method for bank reconciliation.
                </p>
            </div>

            <button 
                onClick={generateSalesCSV}
                className={`w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl font-medium transition-colors shadow-sm ${styles.primary} ${styles.hover}`}
            >
                <FileSpreadsheet className="w-5 h-5" /> Export to Google Sheets
            </button>
        </div>

      </div>

      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
            <Download className="w-5 h-5" /> How to use with Google Sheets
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
            <li>Click the <strong>Export</strong> button above for the report you need.</li>
            <li>A <strong>.csv file</strong> will download to your computer.</li>
            <li>Open <strong>Google Sheets</strong> (sheets.google.com).</li>
            <li>Go to <strong>File &gt; Import &gt; Upload</strong> and select the downloaded file.</li>
            <li>Select "Detect automatically" for the separator type and click Import data.</li>
        </ol>
      </div>
    </div>
  );
};