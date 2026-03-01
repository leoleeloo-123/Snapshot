import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Trash2, Plus, Calendar, DollarSign, 
  History, Edit2, TrendingUp, ChevronDown, ChevronUp, Briefcase, Home, Car, Wallet
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Asset, AssetLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

interface AssetDetailProps {
  assetId: number | null;
  onBack: () => void;
}

const AssetDetail: React.FC<AssetDetailProps> = ({ assetId, onBack }) => {
  const { 
    t, owners, countries, currencies, language,
    getAsset, addAsset, updateAsset, deleteAsset,
    addAssetLog, updateAssetLog, deleteAssetLog,
    displayCurrency, fxRates
  } = useAppContext();
  
  const [asset, setAsset] = useState<Partial<Asset>>({
    name: '',
    owner_id: owners[0]?.id || 0,
    asset_type: 'Real Estate',
    value: 0,
    currency: 'USD',
    logo_color: '#10b981',
    country: 'USA',
  });

  const [newLog, setNewLog] = useState({
    id: null as number | null,
    amount: '',
    type: 'Valuation',
    currency: 'USD',
    comment: '',
    recorded_at: new Date().toISOString().split('T')[0]
  });

  const [showLogForm, setShowLogForm] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [isEditingAsset, setIsEditingAsset] = useState(!assetId);

  useEffect(() => {
    if (assetId) {
      const data = getAsset(assetId);
      if (data) {
        setAsset(data);
      }
    }
  }, [assetId, getAsset]);

  const handleSaveAsset = () => {
    if (assetId) {
      updateAsset(assetId, asset);
    } else {
      addAsset(asset as any);
    }
    onBack();
  };

  const handleDeleteAsset = () => {
    if (!confirm(t('confirmDelete')) || !assetId) return;
    deleteAsset(assetId);
    onBack();
  };

  const handleAddLog = () => {
    if (!newLog.amount || !assetId) return;
    
    const logData = {
      asset_id: assetId,
      amount: parseFloat(newLog.amount),
      type: newLog.type,
      currency: newLog.currency,
      comment: newLog.comment,
      recorded_at: newLog.recorded_at
    };

    if (newLog.id) {
      updateAssetLog(newLog.id, logData);
    } else {
      addAssetLog(logData);
    }
    
    // Update asset value if it's a valuation
    if (newLog.type === 'Valuation') {
      updateAsset(assetId, { value: parseFloat(newLog.amount), currency: newLog.currency });
    }
    
    const updated = getAsset(assetId);
    if (updated) setAsset(updated);
    
    setNewLog({ 
      id: null,
      amount: '', 
      type: 'Valuation',
      currency: 'USD',
      comment: '',
      recorded_at: new Date().toISOString().split('T')[0] 
    });
    setShowLogForm(false);
  };

  const handleEditLog = (log: AssetLog) => {
    setNewLog({
      id: log.id,
      amount: log.amount.toString(),
      type: log.type,
      currency: log.currency,
      comment: log.comment || '',
      recorded_at: log.recorded_at.split('T')[0]
    });
    setShowLogForm(true);
  };

  const handleDeleteLog = (logId: number) => {
    if (!confirm(t('confirmDelete')) || !assetId) return;
    deleteAssetLog(logId);
    const updated = getAsset(assetId);
    if (updated) setAsset(updated);
  };

  const convertToDisplay = (amount: number, fromCurrency: string) => {
    if (fromCurrency === displayCurrency) return amount;
    const usdToFrom = fxRates.find(r => r.base_currency === 'USD' && r.target_currency === fromCurrency)?.rate || 1;
    const usdToDisplay = fxRates.find(r => r.base_currency === 'USD' && r.target_currency === displayCurrency)?.rate || 1;
    return (amount / usdToFrom) * usdToDisplay;
  };

  const displayValue = convertToDisplay(asset.value || 0, asset.currency || 'USD');

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full hover:shadow-md transition-all text-[var(--text-primary)]">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                {assetId ? asset.name : t('addAsset')}
              </h1>
              {assetId && (
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                  {t(getTranslationKey(asset.asset_type || 'Other'))}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-[var(--text-secondary)]">
              {React.createElement(getAssetIcon(asset.asset_type), { size: 14 })}
              <span>{asset.asset_type || t('newAssetSetup')}</span>
              <span className="mx-1">•</span>
              <span>{t('owner')}: {owners.find(o => o.id === asset.owner_id)?.name || asset.owner_name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {assetId && (
            <button 
              onClick={() => setIsEditingAsset(true)} 
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 bg-[var(--bg-secondary)] border border-blue-100 dark:border-blue-900/30 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            >
              <Edit2 size={18} />
              {t('editAsset')}
            </button>
          )}
          {assetId && (
            <button 
              onClick={handleDeleteAsset} 
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-[var(--bg-secondary)] border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 size={18} />
              {t('delete')}
            </button>
          )}
          <button 
            onClick={handleSaveAsset}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            <Save size={20} />
            {t('save')}
          </button>
        </div>
      </div>

      <div className="px-8 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-6 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-6 flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-500" />
              {t('statusSummary')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{t('currentValue')}</p>
                <p className="text-xl font-mono font-bold mt-1 text-[var(--text-primary)]">
                  {displayCurrency} {displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">{t('lastUpdate')}</p>
                <p className="text-sm font-bold mt-1 text-[var(--text-primary)]">
                  {asset.last_updated ? new Date(asset.last_updated).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { dateStyle: 'medium' }) : t('never')}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 rounded-2xl shadow-sm relative overflow-hidden">
            {!isEditingAsset && (
              <div 
                className="absolute top-0 left-0 w-full h-2" 
                style={{ backgroundColor: asset.logo_color || '#10b981' }} 
              />
            )}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                {React.createElement(getAssetIcon(asset.asset_type), { size: 14, className: "text-blue-500" })}
                {t('assetInformation')}
              </h3>
              {!isEditingAsset && (
                <button 
                  onClick={() => setIsEditingAsset(true)}
                  className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
            
            {isEditingAsset ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('name')}</label>
                  <input 
                    type="text" 
                    value={asset.name}
                    onChange={e => setAsset({...asset, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                    placeholder="e.g. Downtown Apartment"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('owner')}</label>
                  <select 
                    value={asset.owner_id}
                    onChange={e => setAsset({...asset, owner_id: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                  >
                    {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('assetType')}</label>
                  <select 
                    value={asset.asset_type || 'Real Estate'}
                    onChange={e => setAsset({...asset, asset_type: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                  >
                    <option value="Real Estate">{t('realEstate')}</option>
                    <option value="Vehicle">{t('vehicle')}</option>
                    <option value="Equity">{t('equity')}</option>
                    <option value="Other">{t('other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('country')}</label>
                  <select 
                    value={asset.country}
                    onChange={e => setAsset({...asset, country: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                  >
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('logoColor')}</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={asset.logo_color}
                      onChange={e => setAsset({...asset, logo_color: e.target.value})}
                      className="w-12 h-12 rounded-xl border-0 p-0 cursor-pointer overflow-hidden"
                    />
                    <span className="text-sm font-mono text-[var(--text-secondary)] uppercase">{asset.logo_color}</span>
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={() => setIsEditingAsset(false)}
                    className="px-4 py-2 text-sm font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ backgroundColor: asset.logo_color || '#10b981' }}
                  >
                    {React.createElement(getAssetIcon(asset.asset_type), { size: 24 })}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[var(--text-primary)]">{asset.name || 'Unnamed Asset'}</h4>
                    <p className="text-sm text-[var(--text-secondary)]">{asset.asset_type}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-color)]">
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">{t('owner')}</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {owners.find(o => o.id === asset.owner_id)?.name || asset.owner_name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">{t('country')}</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {asset.country || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="card rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">{t('logHistory')}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{t('historicalSnapshots')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {assetId && (
                  <button 
                    onClick={() => {
                      if (!showLogForm) {
                        setNewLog({ 
                          id: null,
                          amount: '', 
                          type: 'Valuation',
                          currency: 'USD',
                          comment: '',
                          recorded_at: new Date().toISOString().split('T')[0] 
                        });
                      }
                      setShowLogForm(!showLogForm);
                    }}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-xl transition-colors"
                  >
                    <Plus size={18} />
                    {t('addLog')}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {showLogForm && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 mb-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1.5">{t('amount')}</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                          <input 
                            type="number" 
                            step="0.01"
                            value={newLog.amount}
                            onChange={e => setNewLog({...newLog, amount: e.target.value})}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800/30 bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1.5">{t('type')}</label>
                        <select 
                          value={newLog.type}
                          onChange={e => setNewLog({...newLog, type: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800/30 bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                        >
                          <option value="Valuation">{t('valuation')}</option>
                          <option value="Dividend">{t('dividend')}</option>
                          <option value="Maintenance">{t('maintenance')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1.5">{t('date')}</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                          <input 
                            type="date" 
                            value={newLog.recorded_at}
                            onChange={e => setNewLog({...newLog, recorded_at: e.target.value})}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800/30 bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1.5">{t('comment')}</label>
                        <input 
                          type="text" 
                          value={newLog.comment}
                          onChange={e => setNewLog({...newLog, comment: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800/30 bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                          placeholder={t('optionalComment')}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button 
                        onClick={() => setShowLogForm(false)}
                        className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-colors"
                      >
                        {t('cancel')}
                      </button>
                      <button 
                        onClick={handleAddLog}
                        className="px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                      >
                        {t('save')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {asset.logs && asset.logs.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[var(--border-color)]" />
                  <div className="space-y-8 relative">
                    {(showAllLogs ? asset.logs : asset.logs.slice(0, 5)).map((log, idx) => {
                      return (
                        <div key={log.id} className="flex items-start gap-6 group relative">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center z-10 shadow-sm border-4 border-[var(--bg-primary)] mt-1",
                            idx === 0 ? "bg-blue-600 text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                          )}>
                            <History size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                              {new Date(log.recorded_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { dateStyle: 'long' })}
                            </p>
                            <div className={cn(
                              "p-4 rounded-2xl border transition-all group-hover:shadow-md",
                              idx === 0 ? "bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30" : "bg-[var(--bg-primary)] border-[var(--border-color)]"
                            )}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                  <div>
                                    <p className="text-xl font-mono font-bold text-[var(--text-primary)]">
                                      {log.currency} {log.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs font-bold mt-1 text-[var(--text-secondary)]">
                                      {t(getTranslationKey(log.type))}
                                    </p>
                                  </div>
                                  {log.comment && (
                                    <div className="hidden md:block border-l border-[var(--border-color)] pl-6">
                                      <p className="text-xs text-[var(--text-secondary)] italic bg-[var(--bg-secondary)] px-3 py-2 rounded-lg border border-[var(--border-color)] inline-block">
                                        "{log.comment}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                  <button 
                                    onClick={() => handleEditLog(log)}
                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              {log.comment && (
                                <div className="mt-3 md:hidden">
                                  <p className="text-xs text-[var(--text-secondary)] italic bg-[var(--bg-secondary)] px-3 py-2 rounded-lg border border-[var(--border-color)] inline-block">
                                    "{log.comment}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {!showAllLogs && asset.logs.length > 5 && (
                    <div className="mt-6 ml-16">
                      <button 
                        onClick={() => setShowAllLogs(true)}
                        className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl transition-all"
                      >
                        {language === 'zh' ? `展开${asset.logs.length - 5}条历史记录` : `Show ${asset.logs.length - 5} more logs`}
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  )}
                  {showAllLogs && asset.logs.length > 5 && (
                    <div className="mt-6 ml-16">
                      <button 
                        onClick={() => setShowAllLogs(false)}
                        className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl transition-all"
                      >
                        {language === 'zh' ? '收起历史记录' : 'Show less'}
                        <ChevronUp size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                  <div className="w-16 h-16 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <History size={24} className="opacity-20" />
                  </div>
                  <p className="font-medium">{t('noLogs')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;
