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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'accounts', label: t('assets'), icon: Briefcase },
    { id: 'data', label: t('dataManagement'), icon: Database },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <div className={cn(
      "border-[var(--border-color)] glass-panel flex transition-all duration-300 z-50",
      "fixed bottom-0 left-0 right-0 flex-row border-t md:relative md:flex-col md:border-r md:border-t-0",
      "h-[calc(4rem_+_var(--sab))] md:h-[100dvh]",
      "pb-[var(--sab)] pl-[var(--sal)] pr-[var(--sar)] md:pr-0 md:pt-[var(--sat)]",
      isCollapsed ? "md:w-20" : "md:w-64"
    )}>
      {/* User Selector - Replaces Header */}
      <div className={cn(
        "p-2 md:p-6 border-r md:border-r-0 md:border-b border-[var(--border-color)] flex items-center justify-center md:justify-start relative",
        isCollapsed && "md:justify-center md:px-4"
      )} ref={userMenuRef}>
        <button 
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={cn(
            "flex items-center gap-3 transition-all duration-200 hover:opacity-80",
            isCollapsed ? "justify-center" : "w-full"
          )}
        >
          <div className="w-10 h-10 shrink-0 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
            {selectedOwners.length === 1 
              ? (owners.find(o => o.id === selectedOwners[0])?.name || 'U').substring(0, 2).toUpperCase() 
              : <Users size={20} />}
          </div>
          {!isCollapsed && (
            <div className="hidden md:flex flex-col items-start overflow-hidden flex-1">
              <span className="text-sm font-bold truncate w-full text-left">
                {selectedOwners.length === 1 ? owners.find(o => o.id === selectedOwners[0])?.name : t('allUsers')}
              </span>
              <span className="text-xs text-[var(--text-secondary)] truncate w-full text-left">
                {selectedOwners.length === 1 ? 'User' : 'Workspace'}
              </span>
            </div>
          )}
        </button>

        {showUserMenu && (
          <div className="absolute bottom-full left-2 mb-2 md:bottom-auto md:top-full md:mt-2 md:left-6 w-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xl p-2 backdrop-blur-xl z-[100]">
            <button
              onClick={() => { setSelectedOwners([]); setShowUserMenu(false); }}
              className={cn(
                "w-full text-left px-4 py-2 rounded-lg text-sm transition-colors",
                selectedOwners.length === 0 ? "bg-blue-600 text-white" : "hover:bg-[var(--bg-primary)] text-[var(--text-primary)]"
              )}
            >
              {t('allUsers')}
            </button>
            {owners.map(owner => (
              <button
                key={owner.id}
                onClick={() => { setSelectedOwners([owner.id]); setShowUserMenu(false); }}
                className={cn(
                  "w-full text-left px-4 py-2 rounded-lg text-sm transition-colors mt-1",
                  selectedOwners.length === 1 && selectedOwners[0] === owner.id ? "bg-blue-600 text-white" : "hover:bg-[var(--bg-primary)] text-[var(--text-primary)]"
                )}
              >
                {owner.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 flex flex-row md:flex-col py-2 px-6 md:p-4 gap-1 md:gap-2 overflow-x-auto md:overflow-y-auto justify-around md:justify-start items-center md:items-stretch">
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
