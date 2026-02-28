import React, { useState } from 'react';
import { Plus, Search, ArrowUpRight, Home, Car, Briefcase, TrendingUp, Wallet } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Asset } from '../types';

const getAssetIcon = (type?: string) => {
  switch (type) {
    case 'Real Estate': return Home;
    case 'Vehicle': return Car;
    case 'Equity': return TrendingUp;
    case 'Other': return Wallet;
    default: return Briefcase;
  }
};

interface AssetListProps {
  onSelectAsset: (id: number | null) => void;
}

const AssetList: React.FC<AssetListProps> = ({ onSelectAsset }) => {
  const { t, assets, language, displayCurrency } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{language === 'zh' ? '资产' : 'Assets'}</h2>
          <p className="text-[var(--text-secondary)] mt-1">{language === 'zh' ? '管理和追踪您的所有资产。' : 'Manage and track all your assets.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onSelectAsset(null)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus size={20} />
            {t('addAsset')}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input 
            type="text" 
            placeholder={language === 'zh' ? '搜索资产...' : 'Search assets...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Render Assets */}
        {filteredAssets.map((asset) => {
          const Icon = getAssetIcon(asset.asset_type);
          return (
            <div 
              key={`asset-${asset.id}`}
              onClick={() => onSelectAsset(asset.id)}
              className="card p-6 rounded-2xl hover:shadow-xl hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="min-w-[32px] h-8 px-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                  {asset.owner_name?.substring(0, 2).toUpperCase()}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={20} className="text-blue-500" />
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
                      {t((asset.asset_type || 'Other').toLowerCase())}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[var(--border-color)] flex items-end justify-between">
                <div>
                  <p className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-widest">{t('currentValue')}</p>
                  <p className="text-2xl font-mono font-bold mt-1">
                    {displayCurrency} {(asset.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

        {filteredAssets.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={32} className="text-[var(--text-secondary)] opacity-20" />
            </div>
            <h3 className="text-xl font-bold">{language === 'zh' ? '未找到任何资产' : 'No assets found'}</h3>
            <p className="text-[var(--text-secondary)] mt-2">{language === 'zh' ? '尝试调整搜索词或添加新资产。' : 'Try adjusting your search or add a new asset.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetList;
