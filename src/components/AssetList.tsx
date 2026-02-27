import React, { useState } from 'react';
import { Plus, Search, ArrowUpRight, Home, Car, TrendingUp, Wallet } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const getAssetIcon = (type?: string) => {
  switch (type) {
    case 'Real Estate': return Home;
    case 'Vehicle': return Car;
    case 'Equity': return TrendingUp;
    case 'Other':
    default: return Wallet;
  }
};

interface AssetListProps {
  onSelectAsset: (id: number | null) => void;
}

const AssetList: React.FC<AssetListProps> = ({ onSelectAsset }) => {
  const { t, assets, selectedOwners, displayCurrency } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = selectedOwners.length === 0 || selectedOwners.includes(asset.owner_id);
    return matchesSearch && matchesOwner;
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('assets')}</h2>
          <p className="text-[var(--text-secondary)] mt-1">Manage and track your physical and alternative assets.</p>
        </div>
        <button 
          onClick={() => onSelectAsset(null)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} />
          {t('addAsset')}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input 
            type="text" 
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAssets.map((asset) => {
          const Icon = getAssetIcon(asset.asset_type);
          return (
            <div 
              key={asset.id}
              onClick={() => onSelectAsset(asset.id)}
              className="card p-6 rounded-2xl hover:shadow-xl hover:border-emerald-500/50 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="min-w-[32px] h-8 px-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                  {asset.owner_name?.substring(0, 2).toUpperCase()}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={20} className="text-emerald-500" />
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
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold truncate leading-none">{asset.name}</h3>
                    <span className="shrink-0 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                      {t(asset.asset_type.toLowerCase().replace(' ', '')) || asset.asset_type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      {t('currentValue')}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-[var(--text-secondary)]">{asset.currency}</span>
                      <span className="text-2xl font-mono font-bold">
                        {asset.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      {t('lastUpdated')}
                    </p>
                    <p className="text-xs font-medium">
                      {asset.last_updated ? new Date(asset.last_updated).toLocaleDateString() : t('never')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAssets.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-secondary)]">
            <Wallet className="mx-auto h-12 w-12 text-[var(--text-secondary)] opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)]">No assets found</h3>
            <p className="text-[var(--text-secondary)] mt-1">Get started by adding a new asset.</p>
            <button 
              onClick={() => onSelectAsset(null)}
              className="mt-4 text-emerald-600 font-medium hover:text-emerald-700"
            >
              + {t('addAsset')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetList;
