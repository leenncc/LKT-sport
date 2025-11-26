import { GoogleGenAI } from "@google/genai";
import { Product, Transaction } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY not found in environment");
  return new GoogleGenAI({ apiKey });
};

export const analyzeObsolescence = async (products: Product[]) => {
  const ai = getAiClient();
  
  // Calculate days in stock for context
  const today = new Date();
  const inventoryContext = products.map(p => {
    const daysInStock = Math.floor((today.getTime() - new Date(p.dateAdded).getTime()) / (1000 * 3600 * 24));
    return `Item: ${p.name}, Category: ${p.category}, Days in Stock: ${daysInStock}, Qty: ${p.quantity}, Cost: RM ${p.costPrice}`;
  }).join('\n');

  const prompt = `
    You are an expert retail inventory analyst for a Golf Shop ("LKT Sport Academic").
    The business suffers from inventory obsolescence because they sell high variety/low volume items.
    
    Here is the current inventory list with 'Days in Stock':
    ${inventoryContext}

    Please provide a strategic report:
    1. Identify items at high risk of becoming obsolete (older than 120 days).
    2. Suggest specific clearance or bundling strategies for these items.
    3. Estimate potential loss if not sold soon.
    
    Keep the tone professional and actionable. Format as simple text with bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Unable to generate analysis at this time. Please check your API key.";
  }
};

export const generateDailyInsight = async (transactions: Transaction[], products: Product[]) => {
    const ai = getAiClient();
    
    const recentSales = transactions.slice(0, 5).map(t => 
        `Date: ${t.date.split('T')[0]}, Total: RM ${t.totalAmount}, Method: ${t.paymentMethod}`
    ).join('\n');

    const prompt = `
        You are the financial controller for LKT Sport Academic (Malaysia).
        Recent transactions:
        ${recentSales}

        Provide a brief (2-3 sentences) daily summary. Highlight if there is a reliance on Cash vs Bank Transfer (which helps with bank reconciliation).
    `;

    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        return response.text;
      } catch (error) {
        console.error("Gemini Insight Error:", error);
        return "Insight unavailable.";
      }
}