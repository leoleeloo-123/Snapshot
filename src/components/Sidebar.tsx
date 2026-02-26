import React from 'react';
import { LayoutDashboard, Users, Database, Settings, ChevronRight } from 'lucide-react';
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
  const { t } = useAppContext();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'accounts', label: t('accounts'), icon: Users },
    { id: 'data', label: t('dataManagement'), icon: Database },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <div className="w-64 h-screen border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col">
      <div className="p-6 border-b border-[var(--border-color)]">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">AS</div>
          Asset Snapshot
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={cn(isActive ? "text-white" : "text-blue-500")} />
                <span className="font-medium">{item.label}</span>
              </div>
              {isActive && <ChevronRight size={16} />}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-[var(--border-color)]">
        <div className="p-3 rounded-xl bg-[var(--bg-primary)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Admin User</p>
            <p className="text-xs text-[var(--text-secondary)] truncate">v1.0.0 MVP</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
