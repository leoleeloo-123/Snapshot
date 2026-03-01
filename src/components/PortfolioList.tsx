import React, { useState, useMemo } from 'react';
import { Plus, Search, ArrowUpRight, Landmark, CreditCard, Shield, TrendingUp, Wallet, Briefcase, Home, Car, Filter, Layers, Globe, User, Tag } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Bank, Asset } from '../types';

const getInstitutionIcon = (type?: string) => {
  switch (type) {
    case 'Insurance': return Shield;
    case 'Investment': return TrendingUp;
    case 'Other': return Wallet;
    case 'Bank':
    default: return Landmark;
  }
};

const getAssetIcon = (type?: string) => {
  switch (type) {
    case 'Real Estate': return Home;
    case 'Vehicle': return Car;
    case 'Equity': return TrendingUp;
    case 'Other': return Wallet;
    default: return Briefcase;
  }
};

const getTranslationKey = (type: string) => {
  switch (type) {
    case 'Real Estate': return 'realEstate';
    case 'Credit Card': return 'credit';
    case 'Bank': return 'bank';
    case 'Investment': return 'investment';
    case 'Insurance': return 'insurance';
    case 'Vehicle': return 'vehicle';
    case 'Equity': return 'equity';
    case 'Other': return 'other';
    default: return type.toLowerCase();
  }
};

interface PortfolioListProps {
  onSelectAccount: (id: number | null) => void;
  onSelectAsset: (id: number | null) => void;
}

const PortfolioList: React.FC<PortfolioListProps> = ({ onSelectAccount, onSelectAsset }) => {
  const { t, banks, assets, language, displayCurrency } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');

  // Extract unique values for filters
  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    banks.forEach(b => b.country && countries.add(b.country));
    assets.forEach(a => a.country && countries.add(a.country));
    return Array.from(countries).sort();
  }, [banks, assets]);

  const uniqueUsers = useMemo(() => {
    const users = new Set<string>();
    banks.forEach(b => b.owner_name && users.add(b.owner_name));
    assets.forEach(a => a.owner_name && users.add(a.owner_name));
    return Array.from(users).sort();
  }, [banks, assets]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    banks.forEach(b => b.institution_type && tags.add(b.institution_type));
    assets.forEach(a => a.asset_type && tags.add(a.asset_type));
    return Array.from(tags).sort();
  }, [banks, assets]);

  const filteredBanks = banks.filter(bank => {
    const matchesSearch = bank.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          bank.bank_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || selectedType === 'account';
    const matchesCountry = selectedCountry === 'all' || bank.country === selectedCountry;
    const matchesUser = selectedUser === 'all' || bank.owner_name === selectedUser;
    const matchesTag = selectedTag === 'all' || bank.institution_type === selectedTag;
    
    return matchesSearch && matchesType && matchesCountry && matchesUser && matchesTag;
  });

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || selectedType === 'asset';
    const matchesCountry = selectedCountry === 'all' || asset.country === selectedCountry;
    const matchesUser = selectedUser === 'all' || asset.owner_name === selectedUser;
    const matchesTag = selectedTag === 'all' || asset.asset_type === selectedTag;
    
    return matchesSearch && matchesType && matchesCountry && matchesUser && matchesTag;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{language === 'zh' ? '账户与资产' : 'Accounts & Assets'}</h2>
          <p className="text-[var(--text-secondary)] mt-1">{language === 'zh' ? '管理和追踪您的所有账户和资产。' : 'Manage and track all your accounts and assets.'}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => onSelectAccount(null)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus size={20} />
            {t('addAccount')}
          </button>
          <button 
            onClick={() => onSelectAsset(null)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={20} />
            {t('addAsset')}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input 
            type="text" 
            placeholder={language === 'zh' ? '搜索...' : 'Search...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        
        <div className="flex items-center justify-between md:justify-start gap-2 md:gap-4 w-full md:w-auto">
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Filter size={16} className="text-[var(--text-secondary)]" />
            <span className="text-sm font-medium text-[var(--text-secondary)]">{language === 'zh' ? '筛选:' : 'Filters:'}</span>
          </div>
          
          {/* Type Filter */}
          <div className="relative flex items-center flex-1 md:flex-none justify-center">
            {/* Mobile */}
            <div className="md:hidden w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] relative shadow-sm">
              <Layers size={18} />
              {selectedType !== 'all' && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[var(--bg-secondary)]"></div>}
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 appearance-none cursor-pointer"
              >
                <option value="all">{language === 'zh' ? '所有类型' : 'All Types'}</option>
                <option value="account">{language === 'zh' ? '账户' : 'Accounts'}</option>
                <option value="asset">{language === 'zh' ? '资产' : 'Assets'}</option>
              </select>
            </div>
            {/* Desktop */}
            <div className="hidden md:flex items-center relative">
              <div className="absolute left-3 pointer-events-none text-[var(--text-secondary)]">
                <Layers size={16} />
              </div>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="shrink-0 pl-9 pr-8 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none shadow-sm"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="all">{language === 'zh' ? '所有类型' : 'All Types'}</option>
                <option value="account">{language === 'zh' ? '账户' : 'Accounts'}</option>
                <option value="asset">{language === 'zh' ? '资产' : 'Assets'}</option>
              </select>
            </div>
          </div>
          
          {/* Country Filter */}
          <div className="relative flex items-center flex-1 md:flex-none justify-center">
            {/* Mobile */}
            <div className="md:hidden w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] relative shadow-sm">
              <Globe size={18} />
              {selectedCountry !== 'all' && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[var(--bg-secondary)]"></div>}
              <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 appearance-none cursor-pointer"
              >
                <option value="all">{language === 'zh' ? '所有地区' : 'All Regions'}</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            {/* Desktop */}
            <div className="hidden md:flex items-center relative">
              <div className="absolute left-3 pointer-events-none text-[var(--text-secondary)]">
                <Globe size={16} />
              </div>
              <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="shrink-0 pl-9 pr-8 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none shadow-sm"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="all">{language === 'zh' ? '所有地区' : 'All Regions'}</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* User Filter */}
          <div className="relative flex items-center flex-1 md:flex-none justify-center">
            {/* Mobile */}
            <div className="md:hidden w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] relative shadow-sm">
              <User size={18} />
              {selectedUser !== 'all' && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[var(--bg-secondary)]"></div>}
              <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 appearance-none cursor-pointer"
              >
                <option value="all">{language === 'zh' ? '所有用户' : 'All Users'}</option>
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            {/* Desktop */}
            <div className="hidden md:flex items-center relative">
              <div className="absolute left-3 pointer-events-none text-[var(--text-secondary)]">
                <User size={16} />
              </div>
              <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="shrink-0 pl-9 pr-8 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none shadow-sm"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="all">{language === 'zh' ? '所有用户' : 'All Users'}</option>
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Tag Filter */}
          <div className="relative flex items-center flex-1 md:flex-none justify-center">
            {/* Mobile */}
            <div className="md:hidden w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] relative shadow-sm">
              <Tag size={18} />
              {selectedTag !== 'all' && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[var(--bg-secondary)]"></div>}
              <select 
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 appearance-none cursor-pointer"
              >
                <option value="all">{language === 'zh' ? '所有标签' : 'All Tags'}</option>
                {uniqueTags.map(tag => (
                  <option key={tag} value={tag}>{t(getTranslationKey(tag))}</option>
                ))}
              </select>
            </div>
            {/* Desktop */}
            <div className="hidden md:flex items-center relative">
              <div className="absolute left-3 pointer-events-none text-[var(--text-secondary)]">
                <Tag size={16} />
              </div>
              <select 
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="shrink-0 pl-9 pr-8 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none shadow-sm"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="all">{language === 'zh' ? '所有标签' : 'All Tags'}</option>
                {uniqueTags.map(tag => (
                  <option key={tag} value={tag}>{t(getTranslationKey(tag))}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Render Banks */}
        {filteredBanks.map((bank) => {
          const Icon = getInstitutionIcon(bank.institution_type);
          return (
            <div 
              key={`bank-${bank.id}`}
              onClick={() => onSelectAccount(bank.id)}
              className="card p-6 rounded-2xl hover:shadow-xl hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 flex items-center">
                <div className="min-w-[32px] h-8 px-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                  {bank.owner_name?.substring(0, 2).toUpperCase()}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-inner shrink-0"
                  style={{ backgroundColor: bank.logo_color || '#3b82f6' }}
                >
                  <Icon size={28} />
                </div>
                <div className="flex-1 min-w-0 pr-16">
                  <div className="flex flex-col items-start justify-center h-14 gap-2">
                    <h3 className="text-2xl font-bold truncate leading-none">{bank.name}</h3>
                    <span className="shrink-0 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                      {t(getTranslationKey(bank.institution_type || 'Bank'))}
                    </span>
                  </div>
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
                  <span>{bank.account_count || 0} {language === 'zh' ? '项' : 'Accounts'}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Render Assets */}
        {filteredAssets.map((asset) => {
          const Icon = getAssetIcon(asset.asset_type);
          return (
            <div 
              key={`asset-${asset.id}`}
              onClick={() => onSelectAsset(asset.id)}
              className="card p-6 rounded-2xl hover:shadow-xl hover:border-emerald-500/50 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 flex items-center">
                <div className="min-w-[32px] h-8 px-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                  {asset.owner_name?.substring(0, 2).toUpperCase()}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-inner shrink-0"
                  style={{ backgroundColor: asset.logo_color || '#10b981' }}
                >
                  <Icon size={28} />
                </div>
                <div className="flex-1 min-w-0 pr-16">
                  <div className="flex flex-col items-start justify-center h-14 gap-2">
                    <h3 className="text-2xl font-bold truncate leading-none">{asset.name}</h3>
                    <span className="shrink-0 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                      {t(getTranslationKey(asset.asset_type || 'Other'))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[var(--border-color)] flex items-end justify-between">
                <div>
                  <p className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-widest">{t('currentValue')}</p>
                  <p className="text-2xl font-mono font-bold mt-1">
                    {asset.currency || displayCurrency} {(asset.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">{t('lastUpdate')}</p>
                  <p className="text-xs font-medium mt-0.5">
                    {asset.last_updated ? new Date(asset.last_updated).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-sm text-[var(--text-secondary)]">
                <div className="flex items-center gap-1.5">
                  <Briefcase size={14} />
                  <span>{asset.log_count || 0} {language === 'zh' ? '条记录' : 'Logs'}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredBanks.length === 0 && filteredAssets.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Landmark size={32} className="text-[var(--text-secondary)] opacity-20" />
            </div>
            <h3 className="text-xl font-bold">{language === 'zh' ? '未找到任何项目' : 'No items found'}</h3>
            <p className="text-[var(--text-secondary)] mt-2">{language === 'zh' ? '尝试调整搜索词或添加新项目。' : 'Try adjusting your search or add a new item.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioList;
