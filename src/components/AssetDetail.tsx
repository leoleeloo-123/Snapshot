import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, Plus, Edit2, Home, Car, TrendingUp, Wallet, DollarSign, Calendar, FileText } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Asset, AssetLog } from '../types';

const getAssetIcon = (type?: string) => {
  switch (type) {
    case 'Real Estate': return Home;
    case 'Vehicle': return Car;
    case 'Equity': return TrendingUp;
    case 'Other':
    default: return Wallet;
  }
};

interface AssetDetailProps {
  assetId: number | null;
  onBack: () => void;
}

const AssetDetail: React.FC<AssetDetailProps> = ({ assetId, onBack }) => {
  const { t, getAsset, addAsset, updateAsset, deleteAsset, owners, countries, currencies, addAssetLog, updateAssetLog, deleteAssetLog, language } = useAppContext();
  const [asset, setAsset] = useState<Partial<Asset>>({
    owner_id: owners[0]?.id,
    asset_type: 'Real Estate',
    currency: 'USD',
    country: 'USA',
    value: 0,
    logo_color: '#10b981'
  });
  const [isEditing, setIsEditing] = useState(!assetId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);

  const [localAssetId, setLocalAssetId] = useState<number | null>(assetId);

  useEffect(() => {
    if (localAssetId) {
      const existing = getAsset(localAssetId);
      if (existing) {
        setAsset(existing);
      }
    }
  }, [localAssetId, getAsset]);

  const handleSave = () => {
    if (localAssetId) {
      updateAsset(localAssetId, asset);
      setIsEditing(false);
    } else {
      const newId = addAsset(asset as Omit<Asset, 'id' | 'logs' | 'log_count'>);
      setLocalAssetId(newId);
      const newAsset = getAsset(newId);
      if (newAsset) {
        setAsset(newAsset);
      }
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (localAssetId) {
      deleteAsset(localAssetId);
      onBack();
    }
  };

  const handleAddLog = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!localAssetId) return;

    const formData = new FormData(e.currentTarget);
    const logData = {
      asset_id: localAssetId,
      type: formData.get('type') as string,
      amount: Number(formData.get('amount')),
      currency: asset.currency || 'USD',
      comment: formData.get('comment') as string,
      recorded_at: (formData.get('date') as string) + 'T00:00:00.000Z'
    };

    if (editingLogId) {
      updateAssetLog(editingLogId, logData);
      setEditingLogId(null);
    } else {
      addAssetLog(logData);
    }
    
    // Also update the current value of the asset if it's a Valuation log
    // We want to update the value to the most recent valuation date
    if (logData.type === 'Valuation') {
      const existingLogs = asset.logs || [];
      const allLogs = editingLogId 
        ? existingLogs.map(l => l.id === editingLogId ? { ...l, ...logData } : l)
        : [...existingLogs, { ...logData, id: Date.now() }];
      
      const valuations = allLogs.filter(l => l.type === 'Valuation');
      if (valuations.length > 0) {
        // Sort by date descending to find the most recent valuation
        valuations.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
        const mostRecentValuation = valuations[0].amount;
        updateAsset(localAssetId, { value: mostRecentValuation });
        setAsset(prev => ({ ...prev, value: mostRecentValuation }));
      }
    }

    e.currentTarget.reset();
  };

  const Icon = getAssetIcon(asset.asset_type);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Minimal Header - Aligned with content */}
      <div className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full hover:shadow-md transition-all text-[var(--text-primary)]">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                {localAssetId ? asset.name : t('addAsset')}
              </h1>
              {localAssetId && (
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                  {t(asset.asset_type?.toLowerCase().replace(' ', '') || 'asset')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-[var(--text-secondary)]">
              <Icon size={14} />
              <span>{t(asset.asset_type?.toLowerCase().replace(' ', '') || 'asset')}</span>
              <span className="mx-1">•</span>
              <span>{t('owner')}: {owners.find(o => o.id === asset.owner_id)?.name || asset.owner_name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {localAssetId && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-600 bg-[var(--bg-secondary)] border border-emerald-100 dark:border-emerald-900/30 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
            >
              <Edit2 size={18} />
              {t('editAsset')}
            </button>
          )}
          {localAssetId && (
            <button 
              onClick={() => setShowDeleteConfirm(true)} 
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-[var(--bg-secondary)] border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 size={18} />
              {t('delete')}
            </button>
          )}
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            <Save size={20} />
            {t('save')}
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="px-8 pb-4">
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center justify-between">
            <p className="text-red-600 dark:text-red-400 font-medium">{t('confirmDelete')}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1 text-sm rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-red-700 dark:text-red-300">Cancel</button>
              <button onClick={handleDelete} className="px-3 py-1 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="px-8 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          {/* Status Summary Card */}
          <div className="card p-6 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-6 flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-500" />
              {t('statusSummary')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">{t('currentValue')}</p>
                <p className="text-xl font-mono font-bold mt-1 text-[var(--text-primary)]">
                  {asset.currency} {asset.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{t('lastUpdate')}</p>
                <p className="text-sm font-bold mt-1 text-[var(--text-primary)]">
                  {asset.last_updated ? new Date(asset.last_updated).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { dateStyle: 'medium' }) : t('never')}
                </p>
              </div>
            </div>
          </div>

          {/* Asset Information Card */}
          <div className="card p-6 rounded-2xl shadow-sm relative overflow-hidden">
            {!isEditing && (
              <div 
                className="absolute top-0 left-0 w-full h-2" 
                style={{ backgroundColor: asset.logo_color || '#10b981' }} 
              />
            )}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                <Icon size={14} className="text-emerald-500" />
                {t('assetInformation')}
              </h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('name')}</label>
                  <input 
                    type="text" 
                    value={asset.name || ''} 
                    onChange={e => setAsset({...asset, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-[var(--text-primary)]"
                    placeholder="e.g. Downtown Apartment"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('owner')}</label>
                  <select 
                    value={asset.owner_id || ''} 
                    onChange={e => setAsset({...asset, owner_id: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-[var(--text-primary)]"
                  >
                    {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('assetType')}</label>
                  <select 
                    value={asset.asset_type || 'Real Estate'} 
                    onChange={e => setAsset({...asset, asset_type: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-[var(--text-primary)]"
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
                    value={asset.country || ''} 
                    onChange={e => setAsset({...asset, country: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-[var(--text-primary)]"
                  >
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('currency')}</label>
                  <select 
                    value={asset.currency || ''} 
                    onChange={e => setAsset({...asset, currency: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-[var(--text-primary)]"
                  >
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('logoColor')}</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={asset.logo_color || '#10b981'} 
                      onChange={e => setAsset({...asset, logo_color: e.target.value})}
                      className="w-12 h-12 rounded-xl border-0 p-0 cursor-pointer overflow-hidden"
                    />
                    <span className="text-sm font-mono text-[var(--text-secondary)] uppercase">{asset.logo_color || '#10b981'}</span>
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
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
                    <Icon size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[var(--text-primary)]">{asset.name || 'Unnamed Asset'}</h4>
                    <p className="text-sm text-[var(--text-secondary)]">{t(asset.asset_type?.toLowerCase().replace(' ', '') || 'asset')}</p>
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
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">{t('currency')}</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {asset.currency || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          {/* Asset Details Card */}
          <div className="card p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                <DollarSign size={14} className="text-emerald-500" />
                {t('assetDetails')}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">{t('purchasePrice')}</label>
                {isEditing ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">{asset.currency}</span>
                    <input 
                      type="number" 
                      value={asset.purchase_price || ''} 
                      onChange={e => setAsset({...asset, purchase_price: Number(e.target.value)})}
                      className="w-full pl-12 pr-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                      placeholder="0.00"
                    />
                  </div>
                ) : (
                  <p className="font-mono font-medium text-lg">
                    {asset.currency} {asset.purchase_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">{t('purchaseDate')}</label>
                {isEditing ? (
                  <input 
                    type="date" 
                    value={asset.purchase_date || ''} 
                    onChange={e => setAsset({...asset, purchase_date: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                ) : (
                  <p className="font-medium text-lg">
                    {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US') : '-'}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Notes</label>
                {isEditing ? (
                  <textarea 
                    value={asset.notes || ''} 
                    onChange={e => setAsset({...asset, notes: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[100px]"
                    placeholder="Additional details about this asset..."
                  />
                ) : (
                  <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{asset.notes || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Log History Card */}
          {localAssetId && !isEditing && (
            <div className="card p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                  <Calendar size={14} className="text-emerald-500" />
                  {t('logHistory')}
                </h3>
              </div>

              <form onSubmit={handleAddLog} className="mb-8 p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">{t('type')}</label>
                    <select 
                      name="type" 
                      defaultValue={editingLogId ? asset.logs?.find(l => l.id === editingLogId)?.type : 'Valuation'}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    >
                      <option value="Valuation">{t('valuation')}</option>
                      <option value="Dividend">{t('dividend')}</option>
                      <option value="Maintenance">{t('maintenance')}</option>
                      <option value="Other">{t('other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">{t('amount')}</label>
                    <input 
                      type="number" 
                      name="amount" 
                      defaultValue={editingLogId ? asset.logs?.find(l => l.id === editingLogId)?.amount : ''}
                      step="0.01" 
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">{t('date')}</label>
                    <input 
                      type="date" 
                      name="date" 
                      defaultValue={editingLogId ? asset.logs?.find(l => l.id === editingLogId)?.recorded_at.split('T')[0] : new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">{t('comment')}</label>
                    <input 
                      type="text" 
                      name="comment" 
                      defaultValue={editingLogId ? asset.logs?.find(l => l.id === editingLogId)?.comment : ''}
                      placeholder={t('optionalComment')}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      {editingLogId ? <Save size={16} /> : <Plus size={16} />}
                      {editingLogId ? t('save') : t('addLog')}
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-3">
                {asset.logs && asset.logs.length > 0 ? (
                  asset.logs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-color)] hover:border-emerald-500/30 transition-colors group bg-[var(--bg-primary)]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)]">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{t(log.type.toLowerCase()) || log.type}</span>
                            <span className="text-xs text-[var(--text-secondary)]">{new Date(log.recorded_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}</span>
                          </div>
                          {log.comment && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{log.comment}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-mono font-bold text-lg">
                            {log.currency} {log.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingLogId(log.id)} className="p-1.5 text-[var(--text-secondary)] hover:text-emerald-500 rounded-md hover:bg-[var(--bg-secondary)]">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => deleteAssetLog(log.id)} className="p-1.5 text-[var(--text-secondary)] hover:text-red-500 rounded-md hover:bg-[var(--bg-secondary)]">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)]">
                    {t('noLogs')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;
