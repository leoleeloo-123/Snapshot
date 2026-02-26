import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Languages, Palette, Users, Plus, Trash2, Check, TrendingUp, Landmark, DollarSign, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Settings: React.FC = () => {
  const { 
    t, theme, setTheme, 
    language, setLanguage, 
    owners, addOwner, deleteOwner,
    countries, currencies, addCountry, deleteCountry, addCurrency, deleteCurrency,
    fxRates, updateFXRates
  } = useAppContext();
  
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newCurrency, setNewCurrency] = useState('');
  const [isFetchingFX, setIsFetchingFX] = useState(false);

  const handleAddOwner = () => {
    if (!newOwnerName.trim()) return;
    addOwner(newOwnerName);
    setNewOwnerName('');
  };

  const handleDeleteOwner = (id: number) => {
    if (!confirm(t('confirmDelete'))) return;
    deleteOwner(id);
  };

  const handleAddConfig = (type: 'country' | 'currency', value: string) => {
    if (!value.trim()) return;
    if (type === 'country') {
      addCountry(value);
      setNewCountry('');
    } else {
      addCurrency(value);
      setNewCurrency('');
    }
  };

  const handleDeleteConfig = (type: 'country' | 'currency', value: string) => {
    if (!confirm(t('confirmDelete'))) return;
    if (type === 'country') deleteCountry(value);
    else deleteCurrency(value);
  };

  const fetchLatestFXRates = async () => {
    setIsFetchingFX(true);
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD');
      const data = await res.json();
      
      const ratesToStore = Object.entries(data.rates).map(([target, rate]) => ({
        base_currency: 'USD',
        target_currency: target,
        rate: rate as number,
        updated_at: new Date().toISOString()
      }));
      
      ratesToStore.push({ base_currency: 'USD', target_currency: 'USD', rate: 1, updated_at: new Date().toISOString() });

      updateFXRates(ratesToStore);
      alert('FX Rates updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to fetch FX rates.');
    } finally {
      setIsFetchingFX(false);
    }
  };

  return (
    <div className="p-8 space-y-10 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('settings')}</h2>
        <p className="text-[var(--text-secondary)] mt-1">Personalize your experience and manage users.</p>
      </div>

      <div className="space-y-8">
        {/* Language & Theme Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-6 flex items-center gap-2">
              <Languages size={16} className="text-blue-500" />
              {t('language')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'en', label: 'English' },
                { id: 'zh', label: '中文' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id as any)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all flex items-center justify-between",
                    language === lang.id 
                      ? "border-blue-500 bg-blue-50 text-blue-700" 
                      : "border-[var(--border-color)] hover:border-blue-200"
                  )}
                >
                  <span className="font-bold">{lang.label}</span>
                  {language === lang.id && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-6 flex items-center gap-2">
              <Palette size={16} className="text-blue-500" />
              {t('theme')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Light', color: 'bg-white' },
                { id: 'dark', label: 'Dark', color: 'bg-gray-900' },
                { id: 'dark-green', label: 'Forest', color: 'bg-emerald-900' }
              ].map((th) => (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id as any)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                    theme === th.id 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-[var(--border-color)] hover:border-blue-200"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-full border border-black/10 shadow-inner", th.color)} />
                  <span className="text-xs font-bold">{th.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FX Rates Section */}
        <div className="card p-8 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />
              {t('fxRates')}
            </h3>
            <button 
              onClick={fetchLatestFXRates}
              disabled={isFetchingFX}
              className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {isFetchingFX ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              {t('fetchFXRates')}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fxRates.filter(r => ['CNY', 'HKD', 'EUR', 'GBP'].includes(r.target_currency)).map(r => (
              <div key={r.target_currency} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-center">
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">1 USD to {r.target_currency}</p>
                <p className="text-lg font-mono font-bold mt-1">{r.rate.toFixed(4)}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] mt-4">
            Last updated: {fxRates.length > 0 ? new Date(fxRates[0].updated_at).toLocaleString() : 'Never'}
          </p>
        </div>

        {/* User Management Section */}
        <div className="card p-8 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-6 flex items-center gap-2">
            <Users size={16} className="text-blue-500" />
            {t('userManagement')}
          </h3>
          
          <div className="flex gap-3 mb-8">
            <input 
              type="text" 
              value={newOwnerName}
              onChange={(e) => setNewOwnerName(e.target.value)}
              placeholder="Enter owner name..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
            <button 
              onClick={handleAddOwner}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus size={20} />
              {t('addOwner')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {owners.map((owner) => (
              <div key={owner.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">
                    {owner.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold">{owner.name}</span>
                </div>
                <button 
                  onClick={() => handleDeleteOwner(owner.id)}
                  className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Country & Currency Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card p-8 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-6 flex items-center gap-2">
              <Landmark size={16} className="text-blue-500" />
              {t('manageCountries')}
            </h3>
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                placeholder="New country..."
                className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm outline-none"
              />
              <button onClick={() => handleAddConfig('country', newCountry)} className="p-2 bg-blue-600 text-white rounded-xl">
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {countries.map(c => (
                <div key={c} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm font-medium">
                  {c}
                  <button onClick={() => handleDeleteConfig('country', c)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-8 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-6 flex items-center gap-2">
              <DollarSign size={16} className="text-blue-500" />
              {t('manageCurrencies')}
            </h3>
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value)}
                placeholder="New currency..."
                className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm outline-none"
              />
              <button onClick={() => handleAddConfig('currency', newCurrency)} className="p-2 bg-blue-600 text-white rounded-xl">
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {currencies.map(c => (
                <div key={c} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm font-medium">
                  {c}
                  <button onClick={() => handleDeleteConfig('currency', c)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
