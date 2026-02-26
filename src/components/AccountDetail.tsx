import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Trash2, Plus, Calendar, DollarSign, 
  Landmark, History, ExternalLink, Info, CreditCard, Clock, Edit2, TrendingUp
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Bank, Account, BalanceLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AccountDetailProps {
  accountId: number | null;
  onBack: () => void;
}

const AccountDetail: React.FC<AccountDetailProps> = ({ accountId: bankId, onBack }) => {
  const { t, owners, countries, currencies, language } = useAppContext();
  const [loading, setLoading] = useState(!!bankId);
  const [bank, setBank] = useState<Partial<Bank>>({
    name: '',
    owner_id: owners[0]?.id || 0,
    bank_name: '',
    logo_color: '#3b82f6',
    country: 'USA',
    accounts: []
  });

  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [editingAccount, setEditingAccount] = useState<Partial<Account> | null>(null);

  const [newLog, setNewLog] = useState({
    id: null as number | null,
    balance: '',
    currency: 'USD',
    comment: '',
    recorded_at: new Date().toISOString().split('T')[0]
  });

  const [showLogForm, setShowLogForm] = useState(false);

  const fetchBankData = async () => {
    if (bankId) {
      const res = await fetch(`/api/accounts/${bankId}`);
      const data = await res.json();
      setBank(data);
      if (data.accounts && data.accounts.length > 0 && selectedAccountId === null) {
        setSelectedAccountId(data.accounts[0].id);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankData();
  }, [bankId]);

  const handleSaveBank = async () => {
    const method = bankId ? 'PUT' : 'POST';
    const url = bankId ? `/api/accounts/${bankId}` : '/api/accounts';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bank)
    });
    
    if (res.ok) {
      onBack();
    }
  };

  const handleDeleteBank = async () => {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`/api/accounts/${bankId}`, { method: 'DELETE' });
    if (res.ok) onBack();
  };

  const handleSaveSubAccount = async () => {
    if (!editingAccount || !bankId) return;
    
    const method = editingAccount.id ? 'PUT' : 'POST';
    const url = editingAccount.id ? `/api/sub-accounts/${editingAccount.id}` : '/api/sub-accounts';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editingAccount, bank_id: bankId })
    });
    
    if (res.ok) {
      setEditingAccount(null);
      fetchBankData();
    }
  };

  const handleDeleteSubAccount = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`/api/sub-accounts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      if (selectedAccountId === id) setSelectedAccountId(null);
      fetchBankData();
    }
  };

  const handleAddLog = async () => {
    if (!selectedAccountId || !newLog.balance) return;
    
    const method = newLog.id ? 'PUT' : 'POST';
    const url = newLog.id ? `/api/logs/${newLog.id}` : '/api/logs';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_id: selectedAccountId,
        balance: parseFloat(newLog.balance),
        currency: newLog.currency,
        comment: newLog.comment,
        recorded_at: newLog.recorded_at
      })
    });
    
    if (res.ok) {
      fetchBankData();
      setNewLog({ 
        id: null,
        balance: '', 
        currency: 'USD',
        comment: '',
        recorded_at: new Date().toISOString().split('T')[0] 
      });
      setShowLogForm(false);
    }
  };

  const handleEditLog = (log: BalanceLog) => {
    setNewLog({
      id: log.id,
      balance: log.balance.toString(),
      currency: log.currency,
      comment: log.comment || '',
      recorded_at: log.recorded_at.split('T')[0]
    });
    setShowLogForm(true);
  };

  const handleDeleteLog = async (logId: number) => {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`/api/logs/${logId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchBankData();
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const selectedAccount = bank.accounts?.find(a => a.id === selectedAccountId);
  
  const totalBalance = bank.accounts?.reduce((sum, acc) => {
    const lastLog = acc.logs?.[0];
    return sum + (lastLog?.balance || 0);
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Minimal Header - Aligned with content */}
      <div className="max-w-[1600px] mx-auto px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:shadow-md transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {bankId ? bank.name : t('addAccount')}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <Landmark size={14} />
              <span>{bank.bank_name || t('newAccountSetup')}</span>
              <span className="mx-1">•</span>
              <span>{t('owner')}: {owners.find(o => o.id === bank.owner_id)?.name || bank.owner_name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {bankId && (
            <button 
              onClick={handleDeleteBank} 
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-white border border-red-100 rounded-xl hover:bg-red-50 transition-all"
            >
              <Trash2 size={18} />
              {t('delete')}
            </button>
          )}
          <button 
            onClick={handleSaveBank}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            <Save size={20} />
            {t('save')}
          </button>
        </div>
      </div>

      <div className="px-8 pb-12 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Summary Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-500" />
              {t('statusSummary')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase">{t('totalBalance')}</p>
                <p className="text-xl font-mono font-bold mt-1">
                  USD {totalBalance.toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">{t('lastUpdate')}</p>
                <p className="text-sm font-bold mt-1">
                  {bank.last_updated ? new Date(bank.last_updated).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { dateStyle: 'medium' }) : t('never')}
                </p>
              </div>
            </div>
          </div>

          {/* Bank Information Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <Landmark size={14} className="text-blue-500" />
              {t('bankInformation')}
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">{t('bankName')}</label>
                <input 
                  type="text" 
                  value={bank.bank_name}
                  onChange={e => setBank({...bank, bank_name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="e.g. Bank of America"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">{t('displayName')}</label>
                <input 
                  type="text" 
                  value={bank.name}
                  onChange={e => setBank({...bank, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="e.g. BoA"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">{t('owner')}</label>
                <select 
                  value={bank.owner_id}
                  onChange={e => setBank({...bank, owner_id: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                >
                  {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">{t('country')}</label>
                <select 
                  value={bank.country}
                  onChange={e => setBank({...bank, country: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                >
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">{t('logoColor')}</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={bank.logo_color}
                    onChange={e => setBank({...bank, logo_color: e.target.value})}
                    className="w-12 h-12 rounded-xl border-0 p-0 cursor-pointer overflow-hidden"
                  />
                  <span className="text-sm font-mono text-gray-500 uppercase">{bank.logo_color}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Account Details Card (List of Sub-Accounts) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <CreditCard size={14} className="text-blue-500" />
                {t('accountDetails')}
              </h3>
              {bankId && (
                <button 
                  onClick={() => setEditingAccount({ name: '', type: 'Bank', account_number: '' })}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  {t('addAccount')}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {bank.accounts?.map(acc => (
                <div 
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                    selectedAccountId === acc.id ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100 hover:border-gray-200"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      selectedAccountId === acc.id ? "bg-blue-600 text-white" : "bg-white text-gray-400 border border-gray-100"
                    )}>
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{acc.name}</p>
                      <p className="text-xs text-gray-500">{acc.account_number || 'No Number'} • {t(acc.type.toLowerCase())}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingAccount(acc); }}
                      className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSubAccount(acc.id); }}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {(!bank.accounts || bank.accounts.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No accounts added yet.</p>
                </div>
              )}
            </div>

            {/* Sub-Account Edit Form Modal/Overlay */}
            <AnimatePresence>
              {editingAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 w-full max-w-md"
                  >
                    <h4 className="text-lg font-bold mb-6">{editingAccount.id ? t('editAccount') : t('addAccount')}</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">{t('accountName')}</label>
                        <input 
                          type="text" 
                          value={editingAccount.name}
                          onChange={e => setEditingAccount({...editingAccount, name: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          placeholder="e.g. Savings Account"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">{t('accountNumber')}</label>
                        <input 
                          type="text" 
                          value={editingAccount.account_number}
                          onChange={e => setEditingAccount({...editingAccount, account_number: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          placeholder="**** 1234"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">{t('accountType')}</label>
                        <select 
                          value={editingAccount.type}
                          onChange={e => setEditingAccount({...editingAccount, type: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        >
                          <option value="Bank">{t('bank')}</option>
                          <option value="Credit">{t('credit')}</option>
                          <option value="Investment">{t('investment')}</option>
                          <option value="Other">{t('other')}</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                      <button 
                        onClick={() => setEditingAccount(null)}
                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        {t('cancel')}
                      </button>
                      <button 
                        onClick={handleSaveSubAccount}
                        className="px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                      >
                        {t('save')}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Log History Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t('logHistory')}</h3>
                  <p className="text-xs text-gray-400">{selectedAccount ? `${selectedAccount.name} - ${t('historicalSnapshots')}` : t('selectAccountToViewLogs')}</p>
                </div>
              </div>
              {selectedAccountId && (
                <button 
                  onClick={() => {
                    if (!showLogForm) {
                      setNewLog({ 
                        id: null,
                        balance: '', 
                        currency: 'USD',
                        comment: '',
                        recorded_at: new Date().toISOString().split('T')[0] 
                      });
                    }
                    setShowLogForm(!showLogForm);
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                >
                  <Plus size={18} />
                  {t('addLog')}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {showLogForm && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-6 rounded-2xl bg-blue-50 border border-blue-100 mb-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1.5">{t('amount')}</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                          <input 
                            type="number" 
                            step="0.01"
                            value={newLog.balance}
                            onChange={e => setNewLog({...newLog, balance: e.target.value})}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1.5">{t('currency')}</label>
                        <select 
                          value={newLog.currency}
                          onChange={e => setNewLog({...newLog, currency: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        >
                          {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1.5">{t('date')}</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                          <input 
                            type="date" 
                            value={newLog.recorded_at}
                            onChange={e => setNewLog({...newLog, recorded_at: e.target.value})}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1.5">{t('comment')}</label>
                        <input 
                          type="text" 
                          value={newLog.comment}
                          onChange={e => setNewLog({...newLog, comment: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          placeholder={t('optionalComment')}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button 
                        onClick={() => setShowLogForm(false)}
                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
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

              {selectedAccount && selectedAccount.logs && selectedAccount.logs.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
                  <div className="space-y-6 relative">
                    {selectedAccount.logs.map((log, idx) => (
                      <div key={log.id} className="flex items-start gap-6 group">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center z-10 shadow-sm border-4 border-white",
                          idx === 0 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
                        )}>
                          <Clock size={16} />
                        </div>
                        <div className={cn(
                          "flex-1 p-5 rounded-2xl border transition-all group-hover:shadow-md",
                          idx === 0 ? "bg-blue-50/30 border-blue-100" : "bg-white border-gray-100"
                        )}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                {new Date(log.recorded_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { dateStyle: 'long' })}
                              </p>
                              <p className="text-xl font-mono font-bold mt-1 text-gray-900">
                                {log.currency} {log.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                              {log.comment && (
                                <p className="text-xs text-gray-500 mt-2 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                                  "{log.comment}"
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => handleEditLog(log)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                  <History size={48} className="mb-4" />
                  <p className="text-lg font-medium">{selectedAccountId ? t('noLogs') : t('selectAccountToViewLogs')}</p>
                  <p className="text-sm">{selectedAccountId ? 'Start by adding your first balance snapshot.' : 'Please select an account from the list above.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetail;
