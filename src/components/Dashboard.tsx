import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Bank } from '../types';
import { Wallet, TrendingUp, Users, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Dashboard: React.FC = () => {
  const { t, owners, fxRates, displayCurrency, setDisplayCurrency, currencies } = useAppContext();
  const [banks, setBanks] = useState<Bank[]>([]);

  useEffect(() => {
    fetch('/api/accounts')
      .then(res => res.json())
      .then(data => setBanks(data));
  }, []);

  const convertToDisplay = (amount: number, fromCurrency: string) => {
    if (fromCurrency === displayCurrency) return amount;
    
    // Find rate from USD to fromCurrency
    const usdToFrom = fxRates.find(r => r.base_currency === 'USD' && r.target_currency === fromCurrency)?.rate || 1;
    // Find rate from USD to displayCurrency
    const usdToDisplay = fxRates.find(r => r.base_currency === 'USD' && r.target_currency === displayCurrency)?.rate || 1;
    
    // Convert fromCurrency to USD, then to displayCurrency
    return (amount / usdToFrom) * usdToDisplay;
  };

  const totalAssets = banks.reduce((sum, bank) => {
    const balance = bank.total_balance || 0;
    return sum + convertToDisplay(balance, 'USD');
  }, 0);

  const ownerData = owners.map(owner => {
    const ownerBanks = banks.filter(bank => bank.owner_id === owner.id);
    const total = ownerBanks.reduce((sum, bank) => {
      const balance = bank.total_balance || 0;
      return sum + convertToDisplay(balance, 'USD');
    }, 0);
    return {
      name: owner.name,
      value: total,
      count: ownerBanks.length
    };
  }).filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('dashboard')}</h2>
          <p className="text-[var(--text-secondary)] mt-1">Overview of your total assets and distribution.</p>
        </div>
        <div className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2 shadow-sm">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{t('displayCurrency')}</span>
          <select 
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value)}
            className="bg-transparent text-sm font-bold focus:outline-none"
          >
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 rounded-2xl shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded">Total</span>
          </div>
          <div className="mt-8">
            <p className="text-sm font-medium opacity-80">{t('totalAssets')} ({displayCurrency})</p>
            <p className="text-4xl font-mono font-bold mt-1">
              {displayCurrency} {totalAssets.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="card p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Users size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded">Owners</span>
          </div>
          <div className="mt-8">
            <p className="text-sm font-medium text-[var(--text-secondary)]">Active Owners</p>
            <p className="text-4xl font-mono font-bold mt-1">{owners.length}</p>
          </div>
        </div>

        <div className="card p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2 py-1 rounded">Accounts</span>
          </div>
          <div className="mt-8">
            <p className="text-sm font-medium text-[var(--text-secondary)]">Tracked Banks</p>
            <p className="text-4xl font-mono font-bold mt-1">{banks.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-8 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <PieIcon size={20} className="text-blue-500" />
            Asset Distribution by Owner
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ownerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ownerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${displayCurrency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-8 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            Owner Summary
          </h3>
          <div className="space-y-4">
            {ownerData.map((data, idx) => (
              <div key={data.name} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <div>
                    <p className="font-bold">{data.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{data.count} banks</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold">{displayCurrency} {data.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">
                    {((data.value / totalAssets) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
            {ownerData.length === 0 && (
              <div className="text-center py-10 text-[var(--text-secondary)]">
                No data available. Add accounts with balances to see distribution.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
