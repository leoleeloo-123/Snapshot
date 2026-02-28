import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Users, Database, Settings, ChevronRight, Globe, User, ChevronDown, Briefcase, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule }) => {
  const { t, displayCurrency, setDisplayCurrency, currencies, owners, selectedOwners, setSelectedOwners } = useAppContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'accounts', label: t('accounts'), icon: Users },
    { id: 'assets', label: t('assets'), icon: Briefcase },
    { id: 'data', label: t('dataManagement'), icon: Database },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <div className={cn(
      "border-[var(--border-color)] glass-panel flex transition-all duration-300 z-50",
      "fixed bottom-0 left-0 right-0 h-16 flex-row border-t md:relative md:h-screen md:flex-col md:border-r md:border-t-0",
      isCollapsed ? "md:w-20" : "md:w-64"
    )}>
      {/* Header - Hidden on mobile */}
      <div className={cn(
        "p-6 border-b border-[var(--border-color)] hidden md:flex items-center justify-between",
        isCollapsed && "justify-center px-4"
      )}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 shrink-0 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">AS</div>
          {!isCollapsed && <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">Asset Snapshot</h1>}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 flex flex-row md:flex-col p-2 md:p-4 gap-1 md:gap-2 overflow-x-auto md:overflow-y-auto justify-around md:justify-start items-center md:items-stretch">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center justify-center md:justify-between p-3 rounded-xl transition-all duration-200 group shrink-0",
                isCollapsed ? "w-12 h-12" : "w-auto md:w-full",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={cn(isActive ? "text-white" : "text-blue-500")} />
                {!isCollapsed && <span className="font-medium hidden md:block whitespace-nowrap">{item.label}</span>}
              </div>
              {!isCollapsed && isActive && <ChevronRight size={16} className="hidden md:block" />}
            </button>
          );
        })}
      </nav>
      
      {/* Footer / Filters - Hidden on mobile */}
      <div className="p-4 border-t border-[var(--border-color)] hidden md:flex flex-col gap-4">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-primary)]",
            isCollapsed ? "justify-center" : "justify-end"
          )}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
