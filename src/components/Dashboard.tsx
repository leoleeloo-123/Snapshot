import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Bank, Asset } from '../types';
import { Wallet, TrendingUp, Users, LineChart as LineChartIcon, Filter } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Dashboard: React.FC = () => {
  const { t, owners, fxRates, displayCurrency, banks, assets, selectedOwners, language, getBank, getAsset } = useAppContext();

  const [dashboardTypeFilter, setDashboardTypeFilter] = useState<'both' | 'accounts' | 'assets'>('accounts');
  const [chartUserFilter, setChartUserFilter] = useState<number | 'all'>('all');
  const [chartItemFilter, setChartItemFilter] = useState<string | 'all'>('all');
  const [chartTimeFilter, setChartTimeFilter] = useState<'all' | '1m' | '1y' | 'ytd'>('all');

  const convertToDisplay = (amount: number, fromCurrency: string) => {
    if (fromCurrency === displayCurrency) return amount;
    const usdToFrom = fxRates.find(r => r.base_currency === 'USD' && r.target_currency === fromCurrency)?.rate || 1;
    const usdToDisplay = fxRates.find(r => r.base_currency === 'USD' && r.target_currency === displayCurrency)?.rate || 1;
    return (amount / usdToFrom) * usdToDisplay;
  };

  const filteredBanks = (dashboardTypeFilter === 'both' || dashboardTypeFilter === 'accounts')
    ? (selectedOwners.length > 0 ? banks.filter(b => selectedOwners.includes(b.owner_id)) : banks)
    : [];

  const filteredAssets = (dashboardTypeFilter === 'both' || dashboardTypeFilter === 'assets')
    ? (selectedOwners.length > 0 ? assets.filter(a => selectedOwners.includes(a.owner_id)) : assets)
    : [];

  const totalAssets = filteredBanks.reduce((sum, bank) => {
    return sum + (bank.total_balance || 0); 
  }, 0) + filteredAssets.reduce((sum, asset) => {
    return sum + convertToDisplay(asset.value || 0, asset.currency || 'USD');
  }, 0);

  const filteredOwners = selectedOwners.length > 0
    ? owners.filter(o => selectedOwners.includes(o.id))
    : owners;

  const ownerData = filteredOwners.map(owner => {
    const ownerBanks = filteredBanks.filter(bank => bank.owner_id === owner.id);
    const ownerAssets = filteredAssets.filter(asset => asset.owner_id === owner.id);
    
    const bankTotal = ownerBanks.reduce((sum, bank) => {
      return sum + (bank.total_balance || 0);
    }, 0);
    
    const assetTotal = ownerAssets.reduce((sum, asset) => {
      return sum + convertToDisplay(asset.value || 0, asset.currency || 'USD');
    }, 0);

    return {
      name: owner.name,
      value: bankTotal + assetTotal,
      count: ownerBanks.length + ownerAssets.length
    };
  }).filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  // --- Trend Chart Data Preparation ---
  const availableOwners = filteredOwners;
  
  // Reset item filter if user filter changes and selected item doesn't belong to user
  useEffect(() => {
    if (chartUserFilter !== 'all' && chartItemFilter !== 'all') {
      const [type, idStr] = chartItemFilter.split('_');
      const id = Number(idStr);
      if (type === 'bank') {
        const bank = banks.find(b => b.id === id);
        if (bank && bank.owner_id !== chartUserFilter) setChartItemFilter('all');
      } else if (type === 'asset') {
        const asset = assets.find(a => a.id === id);
        if (asset && asset.owner_id !== chartUserFilter) setChartItemFilter('all');
      }
    }
  }, [chartUserFilter, banks, assets, chartItemFilter]);

  const availableChartBanks = filteredBanks.filter(b => {
    return chartUserFilter === 'all' || b.owner_id === chartUserFilter;
  });

  const availableChartAssets = filteredAssets.filter(a => {
    return chartUserFilter === 'all' || a.owner_id === chartUserFilter;
  });

  const chartBanks = availableChartBanks.filter(b => {
    return chartItemFilter === 'all' || chartItemFilter === `bank_${b.id}`;
  });

  const chartAssets = availableChartAssets.filter(a => {
    return chartItemFilter === 'all' || chartItemFilter === `asset_${a.id}`;
  });

  const displayChartData = useMemo(() => {
    const allLogs: { date: string, itemId: string, balance: number, currency: string }[] = [];
    
    // Fetch detailed bank data including accounts and logs
    const detailedBanks = chartBanks.map(b => getBank(b.id)).filter(Boolean) as Bank[];
    const detailedAssets = chartAssets.map(a => getAsset(a.id)).filter(Boolean) as Asset[];

    detailedBanks.forEach(bank => {
      bank.accounts?.forEach(acc => {
        acc.logs?.forEach(log => {
          allLogs.push({
            date: log.recorded_at.split('T')[0],
            itemId: `bank_${acc.id}`,
            balance: log.balance,
            currency: log.currency
          });
        });
      });
    });

    detailedAssets.forEach(asset => {
      const valuationLogs = asset.logs?.filter(l => l.type === 'Valuation') || [];
      valuationLogs.forEach(log => {
        allLogs.push({
          date: log.recorded_at.split('T')[0],
          itemId: `asset_${asset.id}`,
          balance: log.amount,
          currency: log.currency
        });
      });
    });

    // If no logs at all, return empty array
    if (allLogs.length === 0) return [];

    const uniqueDates = Array.from(new Set(allLogs.map(l => l.date))).sort();
    
    // We need to track the latest balance for each item as we iterate through dates
    const currentItemBalances: Record<string, { balance: number, currency: string }> = {};
    
    const chartData = uniqueDates.map(date => {
      // Update current balances with any logs from this date
      const logsOnDate = allLogs.filter(l => l.date === date);
      logsOnDate.forEach(log => {
        currentItemBalances[log.itemId] = { balance: log.balance, currency: log.currency };
      });

      let sum = 0;
      const itemTotals: Record<string, number> = {};
      
      detailedBanks.forEach(bank => {
        let bankTotal = 0;
        bank.accounts?.forEach(acc => {
          // Use the most recent balance we've seen for this account up to this date
          const accBal = currentItemBalances[`bank_${acc.id}`];
          if (accBal) {
            bankTotal += convertToDisplay(accBal.balance, accBal.currency);
          }
        });
        itemTotals[bank.name] = bankTotal;
        sum += bankTotal;
      });

      detailedAssets.forEach(asset => {
        let assetTotal = 0;
        const assetBal = currentItemBalances[`asset_${asset.id}`];
        if (assetBal) {
          assetTotal += convertToDisplay(assetBal.balance, assetBal.currency);
        }
        itemTotals[asset.name] = assetTotal;
        sum += assetTotal;
      });

      return {
        date,
        displayDate: new Date(date).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        Sum: sum,
        ...itemTotals
      };
    });

    const now = new Date();
    let startDate = new Date(0);
    if (chartTimeFilter === '1m') {
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 1);
    } else if (chartTimeFilter === '1y') {
      startDate = new Date();
      startDate.setFullYear(now.getFullYear() - 1);
    } else if (chartTimeFilter === 'ytd') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const filtered = chartData.filter(d => new Date(d.date) >= startDate);

    if (startDate > new Date(0) && uniqueDates.length > 0 && new Date(uniqueDates[0]) < startDate) {
      const beforeStartData = chartData.filter(d => new Date(d.date) < startDate);
      if (beforeStartData.length > 0) {
        const lastBeforeStart = beforeStartData[beforeStartData.length - 1];
        filtered.unshift({
          ...lastBeforeStart,
          date: startDate.toISOString().split('T')[0],
          displayDate: startDate.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
      }
    }

    if (filtered.length > 0) {
      const lastPoint = filtered[filtered.length - 1];
      const todayStr = now.toISOString().split('T')[0];
      if (lastPoint.date !== todayStr) {
        filtered.push({
          ...lastPoint,
          date: todayStr,
          displayDate: now.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
      }
    }

    return filtered;
  }, [chartBanks, chartAssets, chartTimeFilter, displayCurrency, fxRates, language, getBank, getAsset]);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('dashboard')}</h2>
          <p className="text-[var(--text-secondary)] mt-1">{t('dashboardDesc')}</p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-1">
          <select 
            value={dashboardTypeFilter}
            onChange={e => setDashboardTypeFilter(e.target.value as any)}
            className="bg-transparent text-sm font-bold text-[var(--text-primary)] outline-none py-1.5 px-3 cursor-pointer"
          >
            <option value="both">{language === 'zh' ? '全部' : 'Both'}</option>
            <option value="accounts">{t('accounts')}</option>
            <option value="assets">{t('assets')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 rounded-2xl shadow-sm bg-gradient-to-br from-blue-600/80 to-indigo-700/80 text-white border border-white/20">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded">{language === 'zh' ? '总计' : 'Total'}</span>
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
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded">{language === 'zh' ? '用户' : 'Owners'}</span>
          </div>
          <div className="mt-8">
            <p className="text-sm font-medium text-[var(--text-secondary)]">{language === 'zh' ? '活跃用户' : 'Active Owners'}</p>
            <p className="text-4xl font-mono font-bold mt-1">{filteredOwners.length}</p>
          </div>
        </div>

        <div className="card p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2 py-1 rounded">{language === 'zh' ? '项目' : 'Items'}</span>
          </div>
          <div className="mt-8">
            <p className="text-sm font-medium text-[var(--text-secondary)]">{language === 'zh' ? '追踪项目' : 'Tracked Items'}</p>
            <p className="text-4xl font-mono font-bold mt-1">{filteredBanks.length + filteredAssets.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="card p-8 rounded-2xl shadow-sm lg:col-span-8 flex flex-col min-h-[500px]">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2 shrink-0">
              <LineChartIcon size={20} className="text-blue-500" />
              {language === 'zh' ? '资产趋势' : 'Asset Trend'}
            </h3>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-1">
                <Filter size={14} className="text-[var(--text-secondary)] ml-2" />
                <select 
                  value={chartUserFilter}
                  onChange={e => setChartUserFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-[var(--text-primary)] outline-none py-1 pr-2 cursor-pointer"
                >
                  <option value="all">{t('allUsers')}</option>
                  {availableOwners.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-1">
                <select 
                  value={chartItemFilter}
                  onChange={e => setChartItemFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[var(--text-primary)] outline-none py-1 px-2 cursor-pointer max-w-[150px] truncate"
                >
                  <option value="all">{language === 'zh' ? '所有项目' : 'All Items'}</option>
                  {availableChartBanks.map(b => (
                    <option key={`bank_${b.id}`} value={`bank_${b.id}`}>🏦 {b.name}</option>
                  ))}
                  {availableChartAssets.map(a => (
                    <option key={`asset_${a.id}`} value={`asset_${a.id}`}>💎 {a.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-1">
                <button 
                  onClick={() => setChartTimeFilter('1m')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartTimeFilter === '1m' ? 'bg-[var(--bg-primary)] shadow-sm text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  1M
                </button>
                <button 
                  onClick={() => setChartTimeFilter('ytd')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartTimeFilter === 'ytd' ? 'bg-[var(--bg-primary)] shadow-sm text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  YTD
                </button>
                <button 
                  onClick={() => setChartTimeFilter('1y')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartTimeFilter === '1y' ? 'bg-[var(--bg-primary)] shadow-sm text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  1Y
                </button>
                <button 
                  onClick={() => setChartTimeFilter('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartTimeFilter === 'all' ? 'bg-[var(--bg-primary)] shadow-sm text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  ALL
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[350px]">
            {displayChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayChartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    {COLORS.map((color, idx) => (
                      <linearGradient key={`color-${idx}`} id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="var(--text-secondary)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    minTickGap={30}
                  />
                  <YAxis 
                    stroke="var(--text-secondary)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.toLocaleString(undefined, { notation: "compact", compactDisplay: "short" })}
                    dx={-10}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-primary)', 
                      borderColor: 'var(--border-color)',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ fontWeight: 'bold' }}
                    labelStyle={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
                    formatter={(value: number, name: string) => [
                      `${displayCurrency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  
                  {/* Render individual item lines if not too many, or if a specific item is selected */}
                  {chartItemFilter === 'all' && (chartBanks.length + chartAssets.length) <= 5 && (
                    <>
                      {chartBanks.map((bank, idx) => {
                        const colorIdx = (idx + 1) % COLORS.length;
                        return (
                          <Area 
                            key={`bank_${bank.id}`}
                            type="monotone" 
                            dataKey={bank.name} 
                            stroke={COLORS[colorIdx]} 
                            fillOpacity={1}
                            fill={`url(#color-${colorIdx})`}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                          />
                        );
                      })}
                      {chartAssets.map((asset, idx) => {
                        const colorIdx = (chartBanks.length + idx + 1) % COLORS.length;
                        return (
                          <Area 
                            key={`asset_${asset.id}`}
                            type="monotone" 
                            dataKey={asset.name} 
                            stroke={COLORS[colorIdx]} 
                            fillOpacity={1}
                            fill={`url(#color-${colorIdx})`}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                          />
                        );
                      })}
                    </>
                  )}
                  
                  {/* Always render the Sum line */}
                  <Area 
                    type="monotone" 
                    dataKey="Sum" 
                    name={language === 'zh' ? '总计' : 'Total Sum'}
                    stroke="#3b82f6" 
                    fillOpacity={1}
                    fill="url(#colorSum)"
                    strokeWidth={4}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
                {language === 'zh' ? '没有足够的数据来显示趋势' : 'Not enough data to display trend'}
              </div>
            )}
          </div>
        </div>

        <div className="card p-8 rounded-2xl shadow-sm lg:col-span-4">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            {language === 'zh' ? '用户概览' : 'Owner Summary'}
          </h3>
          <div className="space-y-4">
            {ownerData.map((data, idx) => (
              <div key={data.name} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <div>
                    <p className="font-bold">{data.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{data.count} {language === 'zh' ? '项' : 'items'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold">{displayCurrency} {data.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">
                    {totalAssets > 0 ? ((data.value / totalAssets) * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>
              </div>
            ))}
            {ownerData.length === 0 && (
              <div className="text-center py-10 text-[var(--text-secondary)]">
                {language === 'zh' ? '暂无数据。添加账户和余额以查看分布。' : 'No data available. Add accounts with balances to see distribution.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
