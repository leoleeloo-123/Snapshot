import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Users, Database, Settings, ChevronRight, Globe, User, ChevronDown } from 'lucide-react';
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
    <div className="w-64 h-screen border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col">
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
              className="bg-transparent text-sm font-bold text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="px-2 relative" ref={dropdownRef}>
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase flex items-center gap-1.5 mb-2">
              <User size={12} /> {t('filterUsers')}
            </span>
            
            <button 
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm hover:border-blue-500 transition-colors"
            >
              <span className="truncate">
                {selectedOwners.length === 0 
                  ? t('allUsers') 
                  : selectedOwners.map(id => owners.find(o => o.id === id)?.name).join(', ')}
              </span>
              <ChevronDown size={14} className={cn("text-[var(--text-secondary)] transition-transform", isUserDropdownOpen && "rotate-180")} />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute bottom-full left-2 right-2 mb-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden z-50 py-1">
                <label className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedOwners.length === 0}
                    onChange={() => setSelectedOwners([])}
                    className="rounded border-[var(--border-color)] text-blue-600 focus:ring-blue-500"
                  />
                  <span className={selectedOwners.length === 0 ? "font-bold" : ""}>{t('allUsers')}</span>
                </label>
                {owners.map(owner => (
                  <label key={owner.id} className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedOwners.includes(owner.id)}
                      onChange={() => handleOwnerToggle(owner.id)}
                      className="rounded border-[var(--border-color)] text-blue-600 focus:ring-blue-500"
                    />
                    <span className={selectedOwners.includes(owner.id) ? "font-bold" : ""}>{owner.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
