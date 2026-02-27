import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Trash2, Plus, Calendar, DollarSign, 
  Landmark, History, ExternalLink, Info, CreditCard, Clock, Edit2, TrendingUp, ChevronDown, ChevronUp, List, LineChart as LineChartIcon, Shield, Wallet
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Bank, Account, BalanceLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getInstitutionIcon = (type?: string) => {
  switch (type) {
    case 'Insurance': return Shield;
    case 'Investment': return TrendingUp;
    case 'Other': return Wallet;
    case 'Bank':
    default: return Landmark;
  }
};

interface AccountDetailProps {
  accountId: number | null;
  onBack: () => void;
}

const AccountDetail: React.FC<AccountDetailProps> = ({ accountId: bankId, onBack }) => {
  const { 
    t, owners, countries, currencies, language,
    getBank, addBank, updateBank, deleteBank,
    addSubAccount, updateSubAccount, deleteSubAccount,
    addLog, updateLog, deleteLog,
    displayCurrency, fxRates
  } = useAppContext();
  
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
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(!bankId);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [logViewMode, setLogViewMode] = useState<'list' | 'trend'>('list');

  useEffect(() => {
    if (bankId) {
      const data = getBank(bankId);
      if (data) {
        setBank(data);
        if (data.accounts && data.accounts.length > 0 && selectedAccountId === null) {
          setSelectedAccountId(data.accounts[0].id);
        }
      }
    }
  }, [bankId, getBank]);

  const handleSaveBank = () => {
    if (bankId) {
      updateBank(bankId, bank);
    } else {
      addBank(bank as any);
    }
    onBack();
  };

  const handleDeleteBank = () => {
    if (!confirm(t('confirmDelete')) || !bankId) return;
    deleteBank(bankId);
    onBack();
  };

  const handleSaveSubAccount = () => {
    if (!editingAccount || !bankId) return;
    
    if (editingAccount.id) {
      updateSubAccount(editingAccount.id, editingAccount);
    } else {
      addSubAccount(bankId, editingAccount as any);
    }
    setEditingAccount(null);
    const updated = getBank(bankId);
    if (updated) setBank(updated);
  };

  const handleDeleteSubAccount = (id: number) => {
    if (!confirm(t('confirmDelete')) || !bankId) return;
    deleteSubAccount(id);
    if (selectedAccountId === id) setSelectedAccountId(null);
    const updated = getBank(bankId);
    if (updated) setBank(updated);
  };

  const handleAddLog = () => {
    if (!selectedAccountId || !newLog.balance || !bankId) return;
    
    const logData = {
      account_id: selectedAccountId,
      balance: parseFloat(newLog.balance),
      currency: newLog.currency,
      comment: newLog.comment,
      recorded_at: newLog.recorded_at
    };

    if (newLog.id) {
      updateLog(newLog.id, logData);
    } else {
      addLog(logData);
    }
    
    const updated = getBank(bankId);
    if (updated) setBank(updated);
    
    setNewLog({ 
      id: null,
      balance: '', 
      currency: 'USD',
      comment: '',
      recorded_at: new Date().toISOString().split('T')[0] 
    });
    setShowLogForm(false);
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

  const handleDeleteLog = (logId: number) => {
    if (!confirm(t('confirmDelete')) || !bankId) return;
    deleteLog(logId);
    const updated = getBank(bankId);
    if (updated) setBank(updated);
  };

  const selectedAccount = bank.accounts?.find(a => a.id === selectedAccountId);
  
  const convertToDisplay = (amount: number, fromCurrency: string) => {
    if (fromCurrency === displayCurrency) return amount;
    const usdToFrom = fxRates.find(r => r.base_currency === 'USD' && r.target_currency === fromCurrency)?.rate || 1;
    const usdToDisplay = fxRates.find(r => r.base_currency === 'USD' && r.target_currency === displayCurrency)?.rate || 1;
    return (amount / usdToFrom) * usdToDisplay;
  };

  const totalBalance = bank.accounts?.reduce((sum, acc) => {
    const lastLog = acc.logs?.[0];
    if (!lastLog) return sum;
    return sum + convertToDisplay(lastLog.balance, lastLog.currency);
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Minimal Header - Aligned with content */}
      <div className="max-w-[1600px] mx-auto px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full hover:shadow-md transition-all text-[var(--text-primary)]">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                {bankId ? bank.name : t('addAccount')}
              </h1>
              {bankId && (
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                  {t((bank.institution_type || 'Bank').toLowerCase())}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-[var(--text-secondary)]">
              {React.createElement(getInstitutionIcon(bank.institution_type), { size: 14 })}
              <span>{bank.bank_name || t('newAccountSetup')}</span>
              <span className="mx-1">•</span>
              <span>{t('owner')}: {owners.find(o => o.id === bank.owner_id)?.name || bank.owner_name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {bankId && (
            <button 
              onClick={() => setIsEditingBank(true)} 
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 bg-[var(--bg-secondary)] border border-blue-100 dark:border-blue-900/30 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            >
              <Edit2 size={18} />
              {t('editInstitution')}
            </button>
          )}
          {bankId && (
            <button 
              onClick={handleDeleteBank} 
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-[var(--bg-secondary)] border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
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
          <div className="card p-6 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-6 flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-500" />
              {t('statusSummary')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{t('totalBalance')}</p>
                <p className="text-xl font-mono font-bold mt-1 text-[var(--text-primary)]">
                  {displayCurrency} {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">{t('lastUpdate')}</p>
                <p className="text-sm font-bold mt-1 text-[var(--text-primary)]">
                  {bank.last_updated ? new Date(bank.last_updated).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { dateStyle: 'medium' }) : t('never')}
                </p>
              </div>
            </div>
          </div>

          {/* Bank Information Card */}
          <div className="card p-6 rounded-2xl shadow-sm relative overflow-hidden">
            {!isEditingBank && (
              <div 
                className="absolute top-0 left-0 w-full h-2" 
                style={{ backgroundColor: bank.logo_color || '#3b82f6' }} 
              />
            )}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                {React.createElement(getInstitutionIcon(bank.institution_type), { size: 14, className: "text-blue-500" })}
                {t(`${(bank.institution_type || 'Bank').toLowerCase()}Information`)}
              </h3>
              {!isEditingBank && (
                <button 
                  onClick={() => setIsEditingBank(true)}
                  className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
            
            {isEditingBank ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('bankName')}</label>
                  <input 
                    type="text" 
                    value={bank.bank_name}
                    onChange={e => setBank({...bank, bank_name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                    placeholder="e.g. Bank of America"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('displayName')}</label>
                  <input 
                    type="text" 
                    value={bank.name}
                    onChange={e => setBank({...bank, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                    placeholder="e.g. BoA"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('owner')}</label>
                  <select 
                    value={bank.owner_id}
                    onChange={e => setBank({...bank, owner_id: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                  >
                    {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('institutionType')}</label>
                  <select 
                    value={bank.institution_type || 'Bank'}
                    onChange={e => setBank({...bank, institution_type: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                  >
                    <option value="Bank">{t('bank')}</option>
                    <option value="Insurance">{t('insurance')}</option>
                    <option value="Investment">{t('investment')}</option>
                    <option value="Other">{t('other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('country')}</label>
                  <select 
                    value={bank.country}
                    onChange={e => setBank({...bank, country: e.target.value})}
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
                      value={bank.logo_color}
                      onChange={e => setBank({...bank, logo_color: e.target.value})}
                      className="w-12 h-12 rounded-xl border-0 p-0 cursor-pointer overflow-hidden"
                    />
                    <span className="text-sm font-mono text-[var(--text-secondary)] uppercase">{bank.logo_color}</span>
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={() => setIsEditingBank(false)}
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
                    style={{ backgroundColor: bank.logo_color || '#3b82f6' }}
                  >
                    {React.createElement(getInstitutionIcon(bank.institution_type), { size: 24 })}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[var(--text-primary)]">{bank.bank_name || 'Unnamed Bank'}</h4>
                    <p className="text-sm text-[var(--text-secondary)]">{bank.name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-color)]">
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">{t('owner')}</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {owners.find(o => o.id === bank.owner_id)?.name || bank.owner_name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">{t('country')}</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {bank.country || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Details Card (List of Sub-Accounts) */}
          <div className="card p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                <CreditCard size={14} className="text-blue-500" />
                {t('accountDetails')}
              </h3>
              {bankId && (
                <button 
                  onClick={() => setEditingAccount({ name: '', type: 'Bank', account_number: '' })}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  {t('addAccount')}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {(showAllAccounts ? bank.accounts : bank.accounts?.slice(0, 2))?.map(acc => (
                <div 
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                    selectedAccountId === acc.id ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30" : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[var(--text-secondary)]"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      selectedAccountId === acc.id ? "bg-blue-600 text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                    )}>
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[var(--text-primary)]">{acc.name}</p>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                          {t(acc.type.toLowerCase())}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{acc.account_number || 'No Number'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingAccount(acc); }}
                      className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSubAccount(acc.id); }}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {!showAllAccounts && bank.accounts && bank.accounts.length > 2 && (
                <div className="pt-2">
                  <button 
                    onClick={() => setShowAllAccounts(true)}
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl transition-all"
                  >
                    {language === 'zh' ? `展开${bank.accounts.length - 2}个账户` : `Show ${bank.accounts.length - 2} more accounts`}
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}
              {showAllAccounts && bank.accounts && bank.accounts.length > 2 && (
                <div className="pt-2">
                  <button 
                    onClick={() => setShowAllAccounts(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl transition-all"
                  >
                    {language === 'zh' ? '收起账户' : 'Show less'}
                    <ChevronUp size={16} />
                  </button>
                </div>
              )}

              {(!bank.accounts || bank.accounts.length === 0) && (
                <div className="text-center py-8 text-[var(--text-secondary)]">
                  <p className="text-sm">No accounts added yet.</p>
                </div>
              )}
            </div>

            {/* Sub-Account Edit Form Modal/Overlay */}
            <AnimatePresence>
              {editingAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[var(--bg-primary)] rounded-2xl p-6 shadow-2xl border border-[var(--border-color)] w-full max-w-md"
                  >
                    <h4 className="text-lg font-bold mb-6 text-[var(--text-primary)]">{editingAccount.id ? t('editAccount') : t('addAccount')}</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('accountName')}</label>
                        <input 
                          type="text" 
                          value={editingAccount.name}
                          onChange={e => setEditingAccount({...editingAccount, name: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                          placeholder="e.g. Savings Account"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('accountNumber')}</label>
                        <input 
                          type="text" 
                          value={editingAccount.account_number}
                          onChange={e => setEditingAccount({...editingAccount, account_number: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                          placeholder="**** 1234"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5">{t('accountType')}</label>
                        <select 
                          value={editingAccount.type}
                          onChange={e => setEditingAccount({...editingAccount, type: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
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
                        className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-colors"
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
        </div>

        {/* Right Column (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Log History Card */}
          <div className="card rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">{t('logHistory')}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{selectedAccount ? `${selectedAccount.name} - ${t('historicalSnapshots')}` : t('selectAccountToViewLogs')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {selectedAccountId && (
                  <div className="flex bg-[var(--bg-primary)] rounded-lg p-1 border border-[var(--border-color)]">
                    <button
                      onClick={() => setLogViewMode('list')}
                      className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all",
                        logViewMode === 'list' 
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm" 
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <List size={14} />
                      {t('listView')}
                    </button>
                    <button
                      onClick={() => setLogViewMode('trend')}
                      className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all",
                        logViewMode === 'trend' 
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm" 
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <LineChartIcon size={14} />
                      {t('trendView')}
                    </button>
                  </div>
                )}
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
                            value={newLog.balance}
                            onChange={e => setNewLog({...newLog, balance: e.target.value})}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800/30 bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1.5">{t('currency')}</label>
                        <select 
                          value={newLog.currency}
                          onChange={e => setNewLog({...newLog, currency: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800/30 bg-[var(--bg-primary)] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-[var(--text-primary)]"
                        >
                          {currencies.map(c => <option key={c} value={c}>{c}</option>)}
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

              {selectedAccount && selectedAccount.logs && selectedAccount.logs.length > 0 ? (
                logViewMode === 'list' ? (
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[var(--border-color)]" />
                    <div className="space-y-8 relative">
                      {(showAllLogs ? selectedAccount.logs : selectedAccount.logs.slice(0, 3)).map((log, idx) => {
                        const realIdx = selectedAccount.logs!.findIndex(l => l.id === log.id);
                        const actualPreviousLog = selectedAccount.logs![realIdx + 1];
                        
                        let diffString = null;
                        let isPositive = true;
                        if (actualPreviousLog) {
                          const diff = log.balance - actualPreviousLog.balance;
                          isPositive = diff >= 0;
                          const diffSign = diff > 0 ? '+' : diff < 0 ? '-' : '';
                          const diffAmount = Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2 });
                          const daysDiff = Math.max(0, Math.round((new Date(log.recorded_at).getTime() - new Date(actualPreviousLog.recorded_at).getTime()) / (1000 * 3600 * 24)));
                          diffString = `${diffSign} ${diffAmount} ${log.currency} in ${daysDiff} days`;
                        }

                        return (
                          <div key={log.id} className="flex items-start gap-6 group relative">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center z-10 shadow-sm border-4 border-[var(--bg-primary)] mt-1",
                              realIdx === 0 ? "bg-blue-600 text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                            )}>
                              <Clock size={16} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                {new Date(log.recorded_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { dateStyle: 'long' })}
                              </p>
                              <div className={cn(
                                "p-4 rounded-2xl border transition-all group-hover:shadow-md",
                                realIdx === 0 ? "bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30" : "bg-[var(--bg-primary)] border-[var(--border-color)]"
                              )}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-6">
                                    <div>
                                      <p className="text-xl font-mono font-bold text-[var(--text-primary)]">
                                        {log.currency} {log.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </p>
                                      {diffString && (
                                        <p className={cn(
                                          "text-xs font-bold mt-1",
                                          isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                        )}>
                                          {diffString}
                                        </p>
                                      )}
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
                                {/* Mobile comment view */}
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
                    {!showAllLogs && selectedAccount.logs.length > 3 && (
                      <div className="mt-6 ml-16">
                        <button 
                          onClick={() => setShowAllLogs(true)}
                          className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl transition-all"
                        >
                          {language === 'zh' ? `展开${selectedAccount.logs.length - 3}条历史记录` : `Show ${selectedAccount.logs.length - 3} more logs`}
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    )}
                    {showAllLogs && selectedAccount.logs.length > 3 && (
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
                  <div className="h-[400px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[...selectedAccount.logs].reverse().map(log => ({
                          date: new Date(log.recorded_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                          balance: log.balance,
                          currency: log.currency
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="var(--text-secondary)" 
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="var(--text-secondary)" 
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => value.toLocaleString()}
                          dx={-10}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--bg-primary)', 
                            borderColor: 'var(--border-color)',
                            borderRadius: '0.75rem',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                          }}
                          itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                          labelStyle={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
                          formatter={(value: number, name: string, props: any) => [
                            `${props.payload.currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
                            t('balance')
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: 'var(--bg-primary)' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                  <History size={48} className="mb-4 text-[var(--text-secondary)]" />
                  <p className="text-lg font-medium text-[var(--text-primary)]">{selectedAccountId ? t('noLogs') : t('selectAccountToViewLogs')}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{selectedAccountId ? 'Start by adding your first balance snapshot.' : 'Please select an account from the list above.'}</p>
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
