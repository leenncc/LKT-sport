import React, { useEffect, useState, useMemo } from 'react';
import { DashboardProps } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DollarSign, Package, AlertTriangle, Activity } from 'lucide-react';
import { generateDailyInsight } from '../services/geminiService';
import { THEME_COLORS } from '../constants';

export const Dashboard: React.FC<DashboardProps> = ({ products, transactions, theme }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const styles = THEME_COLORS[theme];
  
  // 1. Vibrant Multi-color Palette for Categories
  const PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#6366f1'];

  // Metrics (Safety Check: ensure values are numbers)
  const totalRevenue = transactions.reduce((acc, t) => acc + (Number(t.totalAmount) || 0), 0);
  const totalStockValue = products.reduce((acc, p) => acc + ((Number(p.costPrice) || 0) * (Number(p.quantity) || 0)), 0);
  
  // Identify stale inventory (> 120 days)
  const today = new Date();
  const staleItems = products.filter(p => {
    const d = new Date(p.dateAdded);
    if (isNaN(d.getTime())) return false; // Skip bad dates
    const days = (today.getTime() - d.getTime()) / (1000 * 3600 * 24);
    return days > 120;
  });

  useEffect(() => {
    const fetchInsight = async () => {
        setLoadingInsight(true);
        const text = await generateDailyInsight(transactions, products);
        setInsight(text);
        setLoadingInsight(false);
    };
    if (transactions.length > 0 && !insight) {
        fetchInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  // Data Preparation: Categories
  const categoryData = useMemo(() => {
    const data = products.reduce((acc: any[], curr) => {
      // Safety: Ensure quantity is number
      const qty = Number(curr.quantity) || 0;
      if (qty <= 0) return acc;

      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += qty;
      } else {
        acc.push({ name: curr.category, value: qty });
      }
      return acc;
    }, []);
    return data.sort((a, b) => b.value - a.value); // Sort by biggest category
  }, [products]);

  // Data Preparation: Obsolescence
  const obsolescenceData = useMemo(() => {
    let fresh = 0; // < 90 days
    let aging = 0; // 90 - 120 days
    let obsolete = 0; // > 120 days

    products.forEach(p => {
        const d = new Date(p.dateAdded);
        const qty = Number(p.quantity) || 0;
        
        if (isNaN(d.getTime()) || qty <= 0) return; // Skip bad data

        const diff = today.getTime() - d.getTime();
        const days = Math.floor(diff / (1000 * 3600 * 24));
        
        if (days > 120) obsolete += qty;
        else if (days > 90) aging += qty;
        else fresh += qty;
    });

    return [
        { name: 'Fresh (< 90 days)', value: fresh, color: '#10b981' }, // Emerald
        { name: 'Aging (90-120 days)', value: aging, color: '#f59e0b' }, // Amber
        { name: 'Obsolete (> 120 days)', value: obsolete, color: '#ef4444' } // Red
    ].filter(item => item.value > 0);
  }, [products]);

  const totalItems = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);

  // Helper to render percentages
  const renderCustomLegend = (data: any[]) => (
    <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500 mt-4">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || PALETTE[idx % PALETTE.length] }}></div>
          <span className="font-medium text-slate-700">{item.name}</span>
          <span className="text-slate-400">
            {totalItems > 0 ? Math.round((item.value / totalItems) * 100) : 0}%
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Business Overview</h2>
        <span className="text-sm text-slate-500">{new Date().toLocaleDateString()}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium">Total Revenue</span>
            <div className={`p-2 rounded-lg ${styles.bgLight}`}>
                <DollarSign className={`w-5 h-5 ${styles.text}`} />
            </div>
          </div>
          <span className="text-3xl font-bold text-slate-900">RM {totalRevenue.toLocaleString()}</span>
          <span className={`text-xs mt-2 font-medium ${styles.text}`}>Total Sales</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium">Inventory Value</span>
            <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <span className="text-3xl font-bold text-slate-900">RM {totalStockValue.toLocaleString()}</span>
          <span className="text-xs text-slate-400 mt-2">Cost basis</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium">Obsolescence Risk</span>
            <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <span className="text-3xl font-bold text-slate-900">{staleItems.length} Items</span>
          <span className="text-xs text-amber-600 mt-2 font-medium">In stock &gt; 120 days</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium">Sales Count</span>
            <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <span className="text-3xl font-bold text-slate-900">{transactions.length}</span>
          <span className="text-xs text-purple-600 mt-2 font-medium">Transactions recorded</span>
        </div>
      </div>

      {/* AI Insight Box */}
      <div className={`bg-gradient-to-r from-slate-50 to-white p-6 rounded-xl border ${styles.border}`}>
        <h3 className={`font-semibold flex items-center gap-2 mb-2 ${styles.text}`}>
            <Activity className="w-4 h-4" /> AI Financial Controller
        </h3>
        {loadingInsight ? (
            <p className={`text-sm animate-pulse ${styles.text}`}>Analyzing recent transactions...</p>
        ) : (
            <p className="text-slate-700 text-sm leading-relaxed">{insight || "No transactions to analyze yet."}</p>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[350px] flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Inventory by Category</h3>
          <div className="flex-1 min-h-[250px]">
             {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                    >
                        {categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} stroke="white" strokeWidth={2} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [`${value} units`, 'Quantity']}
                    />
                    </PieChart>
                </ResponsiveContainer>
             ) : (
                 <div className="flex items-center justify-center h-full text-slate-400">
                     No valid inventory data
                 </div>
             )}
          </div>
          {renderCustomLegend(categoryData)}
        </div>

        {/* Obsolescence Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[350px] flex flex-col">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-slate-800">Obsolescence Status</h3>
                <div className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Threshold: 120 Days</div>
            </div>
            
            <div className="flex-1 min-h-[250px]">
                {obsolescenceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={obsolescenceData}
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                dataKey="value"
                            >
                                {obsolescenceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value: number) => [`${value} units`, 'Count']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        No inventory data available
                    </div>
                )}
            </div>
            {renderCustomLegend(obsolescenceData)}
        </div>

      </div>
    </div>
  );
};