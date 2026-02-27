import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Users, Database, Settings, ChevronRight, Globe, User, ChevronDown, Briefcase } from 'lucide-react';
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
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'accounts', label: t('accounts'), icon: Users },
    { id: 'assets', label: t('assets'), icon: Briefcase },
    { id: 'data', label: t('dataManagement'), icon: Database },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const handleOwnerToggle = (ownerId: number) => {
    if (selectedOwners.includes(ownerId)) {
      setSelectedOwners(selectedOwners.filter(id => id !== ownerId));
    } else {
      setSelectedOwners([...selectedOwners, ownerId]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="w-64 h-screen border-r border-[var(--border-color)] glass-panel flex flex-col">
      <div className="p-6 border-b border-[var(--border-color)]">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">AS</div>
          Asset Snapshot
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
      
      <div className="p-4 border-t border-[var(--border-color)] space-y-4">
        {/* Global Filters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase flex items-center gap-1.5">
              <Globe size={12} /> {t('displayCurrency')}
            </span>
            <select 
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="bg-transparent text-sm font-bold text-[var(--text-primary)] focus:outline-none cursor-pointer text-right"
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase flex items-center gap-1.5">
              <User size={12} /> {t('filterUsers')}
            </span>
            <select 
              value={selectedOwners.length === 1 ? selectedOwners[0] : 'all'}
              onChange={(e) => {
                if (e.target.value === 'all') {
                  setSelectedOwners([]);
                } else {
                  setSelectedOwners([Number(e.target.value)]);
                }
              }}
              className="bg-transparent text-sm font-bold text-[var(--text-primary)] focus:outline-none cursor-pointer text-right max-w-[100px] truncate"
            >
              <option value="all">{t('allUsers')}</option>
              {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
