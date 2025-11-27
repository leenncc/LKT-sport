import { Product, Transaction, TransactionItem } from "../types";

// Helper to ensure data is clean before it hits the UI
const sanitizeProducts = (rawProducts: any[]): Product[] => {
    if (!Array.isArray(rawProducts)) return [];
    
    return rawProducts.map(p => {
        // FLEXIBLE KEY CHECKING:
        // Check for multiple common header names to support different sheet layouts
        const rawCost = p.costPrice !== undefined ? p.costPrice : (p.cost !== undefined ? p.cost : p.buyingPrice);
        const rawSell = p.sellingPrice !== undefined ? p.sellingPrice : (p.sell !== undefined ? p.sell : p.price);
        const rawQty = p.quantity !== undefined ? p.quantity : (p.qty !== undefined ? p.qty : p.stock);
        const rawDate = p.dateAdded !== undefined ? p.dateAdded : (p.date !== undefined ? p.date : p.created);

        // Ensure numbers are actually numbers
        const costPrice = Number(rawCost);
        const sellingPrice = Number(rawSell);
        const quantity = Number(rawQty);
        
        // Ensure date is valid
        let dateAdded = rawDate;
        const parsedDate = new Date(dateAdded);
        if (isNaN(parsedDate.getTime())) {
            dateAdded = new Date().toISOString(); // Default to today if invalid
        } else {
            dateAdded = parsedDate.toISOString(); // Standardize format
        }

        return {
            id: String(p.id || Math.random().toString(36).substr(2, 9)),
            sku: String(p.sku || ''),
            name: String(p.name || 'Unknown Item'),
            category: String(p.category || 'Uncategorized'),
            costPrice: isNaN(costPrice) ? 0 : costPrice,
            sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
            quantity: isNaN(quantity) ? 0 : quantity,
            dateAdded: dateAdded
        };
    });
};

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

        // SANITIZE DATA HERE
        if (data.products) {
            data.products = sanitizeProducts(data.products);
        }

        return data;
    } catch (e) {
        console.error("Parse Error", e);
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