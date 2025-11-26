import React from 'react';
import { LayoutDashboard, ShoppingBag, Archive, FileText, Settings } from 'lucide-react';
import { SidebarProps, ThemeColor } from '../types';
import { THEME_COLORS } from '../constants';

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, theme, setTheme }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales Register', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory', icon: Archive },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const themeStyles = THEME_COLORS[theme];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-slate-800">
        <h1 className={`text-xl font-bold tracking-tight ${themeStyles.text.replace('text-', 'text-') === 'text-white' ? 'text-white' : themeStyles.text.replace('text', 'text').replace('600','400')}`}>LKT Sport</h1>
        <p className="text-xs text-slate-400 mt-1">Academic AIS System</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? `${themeStyles.primary} text-white shadow-lg` 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">System Theme</span>
            <div className="flex gap-2">
                {(Object.keys(THEME_COLORS) as ThemeColor[]).map((color) => (
                    <button
                        key={color}
                        onClick={() => setTheme(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${theme === color ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        style={{ backgroundColor: THEME_COLORS[color].hex }}
                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                    />
                ))}
            </div>
        </div>
        <p className="text-xs text-slate-600 text-center mt-2">v1.2.0 • Malaysia</p>
      </div>
    </div>
  );
};
