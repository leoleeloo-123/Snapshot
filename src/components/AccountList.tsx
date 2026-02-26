import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, ArrowUpRight, Landmark, CreditCard } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Bank } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AccountListProps {
  onSelectAccount: (id: number | null) => void;
}

const AccountList: React.FC<AccountListProps> = ({ onSelectAccount }) => {
  const { t, owners, banks, selectedOwners, displayCurrency } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBanks = banks.filter(bank => {
    const matchesSearch = bank.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          bank.bank_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = selectedOwners.length === 0 || selectedOwners.includes(bank.owner_id);
    return matchesSearch && matchesOwner;
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('accounts')}</h2>
          <p className="text-[var(--text-secondary)] mt-1">Manage and track assets across all owners.</p>
        </div>
        <button 
          onClick={() => onSelectAccount(null)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} />
          {t('addAccount')}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input 
            type="text" 
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBanks.map((bank) => (
          <div 
            key={bank.id}
            onClick={() => onSelectAccount(bank.id)}
            className="card p-6 rounded-2xl hover:shadow-xl hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight size={20} className="text-blue-500" />
            </div>
            
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-inner"
                style={{ backgroundColor: bank.logo_color || '#3b82f6' }}
              >
                <Landmark size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {bank.owner_name}
                  </span>
                </div>
                <h3 className="text-lg font-bold mt-1 truncate">{bank.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] truncate">{bank.bank_name}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--border-color)] flex items-end justify-between">
              <div>
                <p className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-widest">{t('totalBalance')}</p>
                <p className="text-2xl font-mono font-bold mt-1">
                  {displayCurrency} {(bank.total_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">{t('lastUpdate')}</p>
                <p className="text-xs font-medium mt-0.5">
                  {bank.last_updated ? new Date(bank.last_updated).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5">
                <CreditCard size={14} />
                <span>{bank.account_count || 0} Accounts</span>
              </div>
            </div>
          </div>
        ))}
        
        {filteredBanks.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Landmark size={32} className="text-[var(--text-secondary)] opacity-20" />
            </div>
            <h3 className="text-xl font-bold">No accounts found</h3>
            <p className="text-[var(--text-secondary)] mt-2">Try adjusting your search or add a new account.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountList;
