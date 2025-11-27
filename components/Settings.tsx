import React, { useState } from 'react';
import { SettingsProps } from '../types';
import { Database, Save, RefreshCw, CheckCircle, AlertCircle, Copy, Loader2, XCircle, HelpCircle } from 'lucide-react';
import { THEME_COLORS } from '../constants';

export const Settings: React.FC<SettingsProps> = ({ theme, scriptUrl, setScriptUrl, onRefreshData }) => {
  const [localUrl, setLocalUrl] = useState(scriptUrl);
  const [status, setStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const styles = THEME_COLORS[theme];

  const handleSaveAndTest = async () => {
    // 0. Clean input
    const cleanUrl = localUrl.trim();
    setLocalUrl(cleanUrl);

    // 1. Basic Validation
    if (!cleanUrl) {
        setErrorMessage("Please enter a URL");
        setStatus('ERROR');
        return;
    }
    if (!cleanUrl.includes('/exec')) {
        setErrorMessage("Invalid URL. It must end with '/exec' (not /edit)");
        setStatus('ERROR');
        return;
    }

    setErrorMessage('');
    setStatus('TESTING');
    
    // 2. Commit URL to state immediately so fetch uses it
    setScriptUrl(cleanUrl);
    localStorage.setItem('LKT_SHEET_URL', cleanUrl);

    // 3. Attempt Refresh
    try {
        await onRefreshData();
        setStatus('SUCCESS');
        setTimeout(() => setStatus('IDLE'), 3000);
    } catch (e: any) {
        setStatus('ERROR');
        setErrorMessage(e.message || "Unknown connection error");
    }
  };

  const appsScriptCode = `
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let inventorySheet = ss.getSheetByName("Inventory");
    if (!inventorySheet) {
      inventorySheet = ss.insertSheet("Inventory");
      // FIXED HEADER ORDER
      inventorySheet.appendRow(["id", "sku", "name", "category", "costPrice", "sellingPrice", "quantity", "dateAdded"]);
    }
    
    let transactionSheet = ss.getSheetByName("Transactions");
    if (!transactionSheet) {
      transactionSheet = ss.insertSheet("Transactions");
      transactionSheet.appendRow(["id", "date", "items", "totalAmount", "paymentMethod", "customerName", "customerAddress"]);
    }

    const iData = inventorySheet.getDataRange().getValues();
    const tData = transactionSheet.getDataRange().getValues();

    const products = rowToObject(iData);
    const transactions = rowToObject(tData).map(t => ({
      ...t,
      items: t.items ? JSON.parse(t.items) : []
    }));

    return ContentService.createTextOutput(JSON.stringify({ products, transactions, version: "2.0" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const data = body.data;

    const iSheet = ss.getSheetByName("Inventory") || ss.insertSheet("Inventory");
    const tSheet = ss.getSheetByName("Transactions") || ss.insertSheet("Transactions");

    // === ACTION: UPSERT (Add or Update) ===
    if (action === 'UPSERT_PRODUCT') {
       const rows = iSheet.getDataRange().getValues();
       let rowIndex = -1;
       // Find if exists
       for (let i = 1; i < rows.length; i++) {
         if (rows[i][0] == data.id) { // Column 0 is ID
           rowIndex = i + 1; // 1-based index
           break;
         }
       }
       
       // FIXED DATA ORDER: id, sku, name, category, cost, sell, qty, date
       const rowData = [
         data.id, 
         data.sku, 
         data.name, 
         data.category, 
         data.costPrice, 
         data.sellingPrice, 
         data.quantity, 
         data.dateAdded
       ];

       if (rowIndex > 0) {
         iSheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
         return success("Product Updated");
       } else {
         iSheet.appendRow(rowData);
         return success("Product Added");
       }
    }

    // === ACTION: DELETE ===
    if (action === 'DELETE_PRODUCT') {
       const rows = iSheet.getDataRange().getValues();
       for (let i = 1; i < rows.length; i++) {
         if (rows[i][0] == data.id) {
           iSheet.deleteRow(i + 1);
           return success("Product Deleted");
         }
       }
       return success("Product Not Found");
    }

    // === ACTION: ADJUST STOCK (Smart Deduction) ===
    if (action === 'ADJUST_STOCK') {
       const rows = iSheet.getDataRange().getValues();
       // data is array of {id, delta}
       for (let d of data) {
         for (let i = 1; i < rows.length; i++) {
           if (rows[i][0] == d.id) {
             // FIXED COLUMN INDEX: Quantity is Column G (Index 6)
             const currentQty = Number(rows[i][6]); 
             const newQty = Math.max(0, currentQty + d.delta);
             // FIXED WRITE COLUMN: Column G is the 7th column (1-based)
             iSheet.getRange(i + 1, 7).setValue(newQty); 
             break;
           }
         }
       }
       return success("Stock Adjusted");
    }

    // === ACTION: ADD TRANSACTION ===
    if (action === 'ADD_TRANSACTION') {
      const row = [data.id, data.date, JSON.stringify(data.items), data.totalAmount, data.paymentMethod, data.customerName || '', data.customerAddress || ''];
      tSheet.appendRow(row);
      return success("Transaction Added");
    }
    
    return success("No Action Taken");
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function rowToObject(data) {
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function success(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    alert("Apps Script code copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Data Source Connection</h3>
            <p className="text-sm text-slate-500 mb-4">Connect the application to a Google Sheet to enable cloud storage and multi-device sync.</p>
            
            <label className="block text-sm font-medium text-slate-700 mb-1">Google Apps Script Web App URL</label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={localUrl}
                    onChange={(e) => setLocalUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbxWrYFJQDouXn3tcpgjxmFegFWWVvHL7uUaZKUqH4aIdG0aTxZmuxA4AwrL9xlbU0g5/exec"
                    className={`flex-1 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 ${styles.ring}`}
                />
                <button 
                    onClick={handleSaveAndTest}
                    disabled={status === 'TESTING'}
                    className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-colors ${styles.primary} ${styles.hover} disabled:opacity-50`}
                >
                    {status === 'TESTING' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4" />
                    )}
                    {status === 'TESTING' ? 'Testing...' : 'Connect & Sync'}
                </button>
            </div>
            
            {status === 'SUCCESS' && (
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 font-medium animate-fade-in">
                    <CheckCircle className="w-4 h-4" /> Connection Successful! Data Synced. <span className="text-xs text-emerald-400 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Backend v2.0</span>
                </div>
            )}
            
            {status === 'ERROR' && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-600 font-medium animate-fade-in">
                    <AlertCircle className="w-4 h-4" /> {errorMessage}
                </div>
            )}
          </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Database className="w-5 h-5" /> Google Sheets Backend Setup
              </h3>
              <button 
                onClick={() => setShowGuide(!showGuide)} 
                className={`text-sm font-medium hover:underline flex items-center gap-1 ${styles.text}`}
              >
                  <HelpCircle className="w-4 h-4" /> {showGuide ? "Hide Guide" : "View Setup Instructions"}
              </button>
          </div>

          {showGuide && (
              <div className="space-y-4 animate-fade-in text-sm text-slate-700">
                  <p>To create your own backend:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Create a new <strong>Google Sheet</strong>.</li>
                      <li>Go to <strong>Extensions &gt; Apps Script</strong>.</li>
                      <li>Copy the code below and paste it into the editor (replace existing code).</li>
                      <li>Click <strong>Deploy &gt; New Deployment</strong>.</li>
                      <li>Select <strong>Web App</strong>.</li>
                      <li>Set <strong>Who has access</strong> to <strong>"Anyone"</strong>.</li>
                      <li>Click <strong>Deploy</strong> and copy the generated URL.</li>
                      <li>Paste the URL in the field above and click Connect.</li>
                  </ol>
                  
                  <div className="relative bg-slate-900 rounded-lg p-4 mt-4 group">
                       <button 
                           onClick={copyCode} 
                           className="absolute top-3 right-3 p-2 bg-white/10 text-white rounded hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                           title="Copy Code"
                       >
                           <Copy className="w-4 h-4" />
                       </button>
                       <pre className="text-xs text-slate-300 overflow-x-auto h-64 font-mono custom-scrollbar">
                           {appsScriptCode}
                       </pre>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};