import { Product, Transaction, TransactionItem } from "../types";

export const fetchSheetData = async (scriptUrl: string) => {
  try {
    const urlWithParams = `${scriptUrl}?action=read&t=${Date.now()}`;

    // No custom headers to avoid CORS preflight
    const response = await fetch(urlWithParams, {
      method: "GET"
    });
    
    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    
    if (text.trim().startsWith("<")) {
      throw new Error("Received HTML error. Please ensure 'Who has access' is set to 'Anyone' in your Google Script deployment.");
    }

    try {
        const data = JSON.parse(text);
        if (data.status === 'error') {
            throw new Error(`SCRIPT_ERROR: ${data.message}`);
        }
        return data;
    } catch (e) {
        throw new Error("Invalid Data received from Sheet.");
    }

  } catch (error: any) {
    console.error("Sheet Sync Error:", error);
    throw error;
  }
};

// Update or Add a single product (doesn't overwrite other rows)
export const upsertProduct = async (scriptUrl: string, product: Product) => {
  try {
    await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "UPSERT_PRODUCT", data: product })
    });
  } catch (error) {
    console.error("Failed to save product", error);
  }
};

// Delete a single product
export const deleteProduct = async (scriptUrl: string, productId: string) => {
  try {
    await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "DELETE_PRODUCT", data: { id: productId } })
    });
  } catch (error) {
    console.error("Failed to delete product", error);
  }
};

// Deduct stock for sold items only
export const adjustStock = async (scriptUrl: string, items: TransactionItem[]) => {
  try {
    // Convert transaction items to simple id/delta pairs
    // delta is negative because we are selling
    const adjustments = items.map(item => ({
      id: item.productId,
      delta: -item.quantity
    }));

    await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "ADJUST_STOCK", data: adjustments })
    });
  } catch (error) {
    console.error("Failed to adjust stock", error);
  }
};

export const addTransactionToSheet = async (scriptUrl: string, transaction: Transaction) => {
  try {
    await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "ADD_TRANSACTION", data: transaction })
    });
  } catch (error) {
    console.error("Failed to add transaction", error);
  }
};