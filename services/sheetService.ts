import { Product, Transaction } from "../types";

export const fetchSheetData = async (scriptUrl: string) => {
  try {
    // Append cache-buster to ensure we don't get a cached 302 redirect or old data
    const urlWithParams = `${scriptUrl}?action=read&t=${Date.now()}`;

    // IMPORTANT: Do NOT set Content-Type header for GET requests.
    // Setting it triggers a CORS Preflight (OPTIONS) request, which Google Apps Script
    // often fails to handle correctly, leading to "Network Error".
    const response = await fetch(urlWithParams, {
      method: "GET"
    });
    
    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    // Get text first to safely check for HTML (permission error pages)
    const text = await response.text();
    
    // If the response starts with <, it's likely an HTML error page (Login/Access Denied)
    if (text.trim().startsWith("<")) {
      throw new Error("Received HTML instead of JSON. This usually means 'Anyone' access is not set correctly on the deployment.");
    }

    try {
        const data = JSON.parse(text);
        if (data.status === 'error') {
            throw new Error(`SCRIPT_ERROR: ${data.message}`);
        }
        return data;
    } catch (e) {
        console.error("JSON Parse Error. Raw text:", text);
        throw new Error("Invalid JSON response. The script URL might be wrong or the script crashed.");
    }

  } catch (error: any) {
    console.error("Sheet Sync Error:", error);
    throw error;
  }
};

export const syncInventoryToSheet = async (scriptUrl: string, products: Product[]) => {
  try {
    // For POST, we use text/plain to avoid preflight, but we still send body
    await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ action: "SYNC_INVENTORY", data: products })
    });
  } catch (error) {
    console.error("Failed to sync inventory", error);
  }
};

export const addTransactionToSheet = async (scriptUrl: string, transaction: Transaction) => {
  try {
    await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ action: "ADD_TRANSACTION", data: transaction })
    });
  } catch (error) {
    console.error("Failed to add transaction", error);
  }
};