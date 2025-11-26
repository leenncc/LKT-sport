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
        // If we get here, no error was thrown
        setStatus('SUCCESS');
        setTimeout(() => setStatus('IDLE'), 3000);
    } catch (e: any) {
        setStatus('ERROR');
        // Display the actual error message from sheetService
        setErrorMessage(e.message || "Unknown connection error");
    }
  };

  const copyCode = () => {
    const code = `
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Use try/catch here to create sheets if missing without crashing
    let inventorySheet = ss.getSheetByName("Inventory");
    if (!inventorySheet) inventorySheet = ss.insertSheet("Inventory");
    
    let transactionSheet = ss.getSheetByName("Transactions");
    if (!transactionSheet) transactionSheet = ss.insertSheet("Transactions");

    const iData = inventorySheet.getDataRange().getValues();
    const tData = transactionSheet.getDataRange().getValues();

    const products = rowToObject(iData);
    const transactions = rowToObject(tData).map(t => ({
      ...t,
      items: t.items ? JSON.parse(t.items) : []
    }));

    return ContentService.createTextOutput(JSON.stringify({ products, transactions }))
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
    
    if (body.action === 'SYNC_INVENTORY') {
      const sheet = ss.getSheetByName("Inventory") || ss.insertSheet("Inventory");
      sheet.clear();
      if (body.data.length > 0) {
        const headers = Object.keys(body.data[0]);
        const values = [headers, ...body.data.map(item => headers.map(h => item[h]))];
        sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
      }
      return success("Inventory Updated");
    }

    if (body.action === 'ADD_TRANSACTION') {
      const sheet = ss.getSheetByName("Transactions") || ss.insertSheet("Transactions");
      const t = body.data;
      const row = [t.id, t.date, JSON.stringify(t.items), t.totalAmount, t.paymentMethod, t.customerName || '', t.customerAddress || ''];
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["id", "date", "items", "totalAmount", "paymentMethod", "customerName", "customerAddress"]);
      }
      sheet.appendRow(row);
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
}
    `;
    navigator.clipboard.writeText(code);
    alert("Updated Code copied! Remember to create a NEW Deployment.");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Database Connection</h2>
        <button 
          onClick={handleSaveAndTest}
          disabled={status === 'TESTING'}
          className={`flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-slate-600 disabled:opacity-50`}
        >
          <RefreshCw className={`w-4 h-4 ${status === 'TESTING' ? 'animate-spin' : ''}`} /> 
          {status === 'TESTING' ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-xl ${styles.bgLight}`}>
            <Database className={`w-8 h-8 ${styles.text}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Google Sheets Integration</h3>
            <p className="text-slate-500 text-sm mt-1">
              Connect your Google Sheet to use it as a live database. Changes made in the app will sync to the sheet.
            </p>
          </div>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Google Apps Script Web App URL</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={localUrl}
                onChange={(e) => {
                    setLocalUrl(e.target.value);
                    if (status === 'ERROR') setStatus('IDLE');
                    setErrorMessage('');
                }}
                placeholder="https://script.google.com/macros/s/.../exec"
                className={`flex-1 p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 ${styles.ring} font-mono text-sm text-slate-600`}
              />
              <button 
                onClick={handleSaveAndTest}
                disabled={status === 'TESTING'}
                className={`px-6 py-3 rounded-lg text-white font-medium shadow-md transition-all flex items-center gap-2 min-w-[120px] justify-center ${styles.primary} ${styles.hover} disabled:opacity-50`}
              >
                {status === 'TESTING' && <Loader2 className="w-5 h-5 animate-spin" />}
                {status === 'SUCCESS' && <CheckCircle className="w-5 h-5" />}
                {status === 'ERROR' && <XCircle className="w-5 h-5" />}
                {status === 'IDLE' && <Save className="w-5 h-5" />}
                {status === 'IDLE' ? 'Save' : status === 'TESTING' ? 'Testing' : status === 'SUCCESS' ? 'Saved' : 'Retry'}
              </button>
            </div>
            
            {errorMessage && (
                <div className="mt-3 bg-red-50 p-4 rounded-lg border border-red-100">
                    <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-2">
                         <AlertCircle className="w-4 h-4" /> Connection Failed
                    </div>
                    <p className="text-sm text-red-800 mb-3 font-medium">{errorMessage}</p>
                    <div className="text-xs text-red-700 space-y-1 pl-4 list-disc bg-white/50 p-3 rounded">
                        <li>Did you select <strong>"New Deployment"</strong> (not Manage)?</li>
                        <li>Is Access set to <strong>"Anyone"</strong>?</li>
                        <li>Does the URL end in <strong>/exec</strong>?</li>
                    </div>
                </div>
            )}
            
            {status === 'SUCCESS' && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm mt-3 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <CheckCircle className="w-4 h-4" />
                    Connection successful! Database is now linked.
                </div>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className={`text-sm font-medium ${styles.text} hover:underline flex items-center gap-2`}
          >
            <HelpCircle className="w-4 h-4" />
            {showGuide ? 'Hide Setup Guide' : 'Show Setup Guide & Code'}
          </button>
          
          {showGuide && (
            <div className="mt-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-3">Setup Instructions (Follow Carefully):</h4>
              <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600 mb-6">
                <li>Create a new Google Sheet.</li>
                <li>Go to <strong>Extensions &gt; Apps Script</strong>.</li>
                <li><strong>Copy the code below</strong> and paste it into the script editor (delete any existing code).</li>
                <li>Click <strong>Deploy &gt; New deployment</strong>. <span className="text-red-500 font-bold">(Do not click "Manage Deployments")</span></li>
                <li>Select type: <strong>Web app</strong>.</li>
                <li>Set "Who has access" to: <strong>Anyone</strong>.</li>
                <li>Click Deploy and copy the Web App URL (ending in /exec).</li>
              </ol>
              
              <div className="relative">
                <button 
                  onClick={copyCode}
                  className="absolute top-2 right-2 p-2 bg-white rounded-md shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-600"
                  title="Copy Code"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg overflow-x-auto text-xs font-mono h-64">
{`function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let inventorySheet = ss.getSheetByName("Inventory");
    if (!inventorySheet) inventorySheet = ss.insertSheet("Inventory");
    
    let transactionSheet = ss.getSheetByName("Transactions");
    if (!transactionSheet) transactionSheet = ss.insertSheet("Transactions");

    const iData = inventorySheet.getDataRange().getValues();
    const tData = transactionSheet.getDataRange().getValues();

    const products = rowToObject(iData);
    const transactions = rowToObject(tData).map(t => ({
      ...t,
      items: t.items ? JSON.parse(t.items) : []
    }));

    return ContentService.createTextOutput(JSON.stringify({ products, transactions }))
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
    
    if (body.action === 'SYNC_INVENTORY') {
      const sheet = ss.getSheetByName("Inventory") || ss.insertSheet("Inventory");
      sheet.clear();
      if (body.data.length > 0) {
        const headers = Object.keys(body.data[0]);
        const values = [headers, ...body.data.map(item => headers.map(h => item[h]))];
        sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
      }
      return success("Inventory Updated");
    }

    if (body.action === 'ADD_TRANSACTION') {
      const sheet = ss.getSheetByName("Transactions") || ss.insertSheet("Transactions");
      const t = body.data;
      const row = [t.id, t.date, JSON.stringify(t.items), t.totalAmount, t.paymentMethod, t.customerName || '', t.customerAddress || ''];
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["id", "date", "items", "totalAmount", "paymentMethod", "customerName", "customerAddress"]);
      }
      sheet.appendRow(row);
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
}`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};