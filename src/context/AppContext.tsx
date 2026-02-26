import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, Language, Owner, FXRate, Bank, Account, BalanceLog } from '../types';

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  owners: Owner[];
  addOwner: (name: string) => void;
  updateOwner: (id: number, name: string) => void;
  deleteOwner: (id: number) => void;
  banks: Bank[];
  getBank: (id: number) => Bank | undefined;
  addBank: (bank: Omit<Bank, 'id' | 'accounts' | 'total_balance'>) => number;
  updateBank: (id: number, bank: Partial<Bank>) => void;
  deleteBank: (id: number) => void;
  addSubAccount: (bankId: number, account: Omit<Account, 'id' | 'bank_id' | 'logs'>) => number;
  updateSubAccount: (id: number, account: Partial<Account>) => void;
  deleteSubAccount: (id: number) => void;
  addLog: (log: Omit<BalanceLog, 'id'>) => void;
  updateLog: (id: number, log: Partial<BalanceLog>) => void;
  deleteLog: (id: number) => void;
  countries: string[];
  addCountry: (name: string) => void;
  deleteCountry: (name: string) => void;
  currencies: string[];
  addCurrency: (name: string) => void;
  deleteCurrency: (name: string) => void;
  fxRates: FXRate[];
  updateFXRates: (rates: FXRate[]) => void;
  displayCurrency: string;
  setDisplayCurrency: (curr: string) => void;
  selectedOwners: number[];
  setSelectedOwners: (owners: number[]) => void;
  t: (key: string) => string;
  resetAllData: () => void;
  importAllData: (data: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const translations = {
  en: {
    dashboard: 'Dashboard',
    accounts: 'Accounts',
    dataManagement: 'Data Management',
    settings: 'Settings',
    addAccount: 'Add Account',
    owner: 'Owner',
    name: 'Name',
    type: 'Type',
    balance: 'Balance',
    lastUpdated: 'Last Updated',
    actions: 'Actions',
    bankName: 'Bank Name',
    accountNumber: 'Account Number',
    logoColor: 'Logo Color',
    logHistory: 'Log History',
    amount: 'Amount',
    date: 'Date',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    import: 'Import',
    export: 'Export',
    language: 'Language',
    theme: 'Theme',
    userManagement: 'User Management',
    addOwner: 'Add Owner',
    totalAssets: 'Total Assets',
    bankAccount: 'Bank Account',
    history: 'History',
    noLogs: 'No historical records found.',
    addLog: 'Add Log Entry',
    editLog: 'Edit Log Entry',
    confirmDelete: 'Are you sure you want to delete this?',
    country: 'Country/Region',
    currency: 'Currency',
    comment: 'Comment',
    fxRates: 'FX Rates',
    fetchFXRates: 'Fetch Latest FX Rates',
    displayCurrency: 'Display Currency',
    addOption: 'Add Option',
    manageCountries: 'Manage Countries',
    manageCurrencies: 'Manage Currencies',
    statusSummary: 'Status Summary',
    currentBalance: 'Current Balance',
    lastUpdate: 'Last Update',
    bankInformation: 'Bank Information',
    accountDetails: 'Account Details',
    accountName: 'Account Name',
    accountType: 'Account Type',
    never: 'Never',
    bank: 'Bank',
    credit: 'Credit Card',
    investment: 'Investment',
    other: 'Other',
    newAccountSetup: 'New Account Setup',
    historicalSnapshots: 'Historical balance snapshots',
    optionalComment: 'Optional comment...',
    total: 'Total',
    totalBalance: 'Total Balance',
    resetDatabase: 'Reset Database',
    resetWarning: 'Are you sure you want to delete ALL data? This action cannot be undone.',
    resetting: 'Resetting database...',
    resetSuccess: 'Database reset successfully!',
    displayName: 'Display Name',
    selectAccountToViewLogs: 'Select an account to view logs',
    editAccount: 'Edit Account',
    dashboardDesc: 'Overview of your total assets and distribution.',
    settingsDesc: 'Personalize your experience and manage users.',
  },
  zh: {
    dashboard: '仪表盘',
    accounts: '账户',
    dataManagement: '数据管理',
    settings: '设置',
    addAccount: '添加账户',
    owner: '所有人',
    name: '名称',
    type: '类型',
    balance: '余额',
    lastUpdated: '最后更新',
    actions: '操作',
    bankName: '银行名称',
    accountNumber: '账号',
    logoColor: '标志颜色',
    logHistory: '记录历史',
    amount: '金额',
    date: '日期',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    import: '导入',
    export: '导出',
    language: '语言',
    theme: '主题',
    userManagement: '用户管理',
    addOwner: '添加所有人',
    totalAssets: '总资产',
    bankAccount: '银行账户',
    history: '历史',
    noLogs: '未发现历史记录。',
    addLog: '添加记录',
    editLog: '编辑记录',
    confirmDelete: '您确定要删除吗？',
    country: '国家/地区',
    currency: '币种',
    comment: '备注',
    fxRates: '汇率',
    fetchFXRates: '获取最新汇率',
    displayCurrency: '显示币种',
    addOption: '添加选项',
    manageCountries: '管理国家/地区',
    manageCurrencies: '管理币种',
    statusSummary: '状态摘要',
    currentBalance: '当前余额',
    lastUpdate: '最后更新',
    bankInformation: '银行信息',
    accountDetails: '账户详情',
    accountName: '账户名称',
    accountType: '账户类型',
    never: '从未',
    bank: '银行账户',
    credit: '信用卡',
    investment: '投资',
    other: '其他',
    newAccountSetup: '新账户设置',
    historicalSnapshots: '历史余额快照',
    optionalComment: '可选备注...',
    total: '总计',
    totalBalance: '总余额',
    resetDatabase: '重置数据库',
    resetWarning: '您确定要删除所有数据吗？此操作无法撤销。',
    resetting: '正在重置数据库...',
    resetSuccess: '数据库重置成功！',
    displayName: '显示名称',
    selectAccountToViewLogs: '选择账户以查看记录',
    editAccount: '编辑账户',
    dashboardDesc: '您的总资产和分布概览。',
    settingsDesc: '个性化您的体验并管理用户。',
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'en');
  const [displayCurrency, setDisplayCurrency] = useState<string>(() => localStorage.getItem('displayCurrency') || 'USD');
  const [selectedOwners, setSelectedOwners] = useState<number[]>(() => JSON.parse(localStorage.getItem('selectedOwners') || '[]'));

  // Data States
  const [owners, setOwners] = useState<Owner[]>(() => JSON.parse(localStorage.getItem('owners') || '[]'));
  const [banks, setBanks] = useState<Bank[]>(() => JSON.parse(localStorage.getItem('banks') || '[]'));
  const [accounts, setAccounts] = useState<Account[]>(() => JSON.parse(localStorage.getItem('accounts') || '[]'));
  const [logs, setLogs] = useState<BalanceLog[]>(() => JSON.parse(localStorage.getItem('logs') || '[]'));
  const [countries, setCountries] = useState<string[]>(() => JSON.parse(localStorage.getItem('countries') || '[]'));
  const [currencies, setCurrencies] = useState<string[]>(() => JSON.parse(localStorage.getItem('currencies') || '[]'));
  const [fxRates, setFXRates] = useState<FXRate[]>(() => JSON.parse(localStorage.getItem('fxRates') || '[]'));

  // Persistence
  useEffect(() => { localStorage.setItem('theme', theme); document.documentElement.className = theme; }, [theme]);
  useEffect(() => { localStorage.setItem('language', language); }, [language]);
  useEffect(() => { localStorage.setItem('displayCurrency', displayCurrency); }, [displayCurrency]);
  useEffect(() => { localStorage.setItem('selectedOwners', JSON.stringify(selectedOwners)); }, [selectedOwners]);
  useEffect(() => { localStorage.setItem('owners', JSON.stringify(owners)); }, [owners]);
  useEffect(() => { localStorage.setItem('banks', JSON.stringify(banks)); }, [banks]);
  useEffect(() => { localStorage.setItem('accounts', JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem('logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('countries', JSON.stringify(countries)); }, [countries]);
  useEffect(() => { localStorage.setItem('currencies', JSON.stringify(currencies)); }, [currencies]);
  useEffect(() => { localStorage.setItem('fxRates', JSON.stringify(fxRates)); }, [fxRates]);

  // Initial Seeding
  useEffect(() => {
    if (owners.length === 0) {
      const defaultOwner = { id: Date.now(), name: 'Me' };
      setOwners([defaultOwner]);
      
      if (countries.length === 0) setCountries(['USA', 'China', 'Hong Kong']);
      if (currencies.length === 0) setCurrencies(['USD', 'CNY', 'HKD']);

      // Seed Demo Data
      const chaseBank: Bank = {
        id: Date.now() + 1,
        owner_id: defaultOwner.id,
        name: 'Chase Main',
        bank_name: 'Chase Bank',
        logo_color: '#117aca',
        country: 'USA',
        last_updated: new Date().toISOString()
      };
      
      const hsbcBank: Bank = {
        id: Date.now() + 2,
        owner_id: defaultOwner.id,
        name: 'HSBC HK',
        bank_name: 'HSBC',
        logo_color: '#db0011',
        country: 'Hong Kong',
        last_updated: new Date().toISOString()
      };

      const chaseAcc1: Account = { id: Date.now() + 3, bank_id: chaseBank.id, name: 'Checking', type: 'Bank', account_number: '**** 1234' };
      const chaseAcc2: Account = { id: Date.now() + 4, bank_id: chaseBank.id, name: 'Savings', type: 'Bank', account_number: '**** 5678' };
      const hsbcAcc1: Account = { id: Date.now() + 5, bank_id: hsbcBank.id, name: 'HKD Savings', type: 'Bank', account_number: '**** 9999' };

      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

      const demoLogs: BalanceLog[] = [
        { id: Date.now() + 6, account_id: chaseAcc1.id, balance: 5000, currency: 'USD', comment: 'Initial deposit', recorded_at: twoMonthsAgo },
        { id: Date.now() + 7, account_id: chaseAcc1.id, balance: 7500, currency: 'USD', comment: 'Salary', recorded_at: oneMonthAgo },
        { id: Date.now() + 8, account_id: chaseAcc1.id, balance: 8200, currency: 'USD', comment: 'Current balance', recorded_at: now.toISOString() },
        { id: Date.now() + 9, account_id: chaseAcc2.id, balance: 10000, currency: 'USD', comment: 'Initial savings', recorded_at: oneMonthAgo },
        { id: Date.now() + 10, account_id: chaseAcc2.id, balance: 10050, currency: 'USD', comment: 'Interest', recorded_at: now.toISOString() },
        { id: Date.now() + 11, account_id: hsbcAcc1.id, balance: 50000, currency: 'HKD', comment: 'Savings', recorded_at: now.toISOString() }
      ];

      setBanks([chaseBank, hsbcBank]);
      setAccounts([chaseAcc1, chaseAcc2, hsbcAcc1]);
      setLogs(demoLogs);
    }
  }, []);

  // CRUD Methods
  const addOwner = (name: string) => setOwners(prev => [...prev, { id: Date.now(), name }]);
  const updateOwner = (id: number, name: string) => setOwners(prev => prev.map(o => o.id === id ? { ...o, name } : o));
  const deleteOwner = (id: number) => setOwners(prev => prev.filter(o => o.id !== id));

  const addBank = (bank: Omit<Bank, 'id' | 'accounts' | 'total_balance'>) => {
    const id = Date.now();
    setBanks(prev => [...prev, { ...bank, id, last_updated: new Date().toISOString() }]);
    // Add default account
    addSubAccount(id, { name: 'Default Account', type: 'Bank' });
    return id;
  };

  const updateBank = (id: number, bank: Partial<Bank>) => {
    setBanks(prev => prev.map(b => b.id === id ? { ...b, ...bank, last_updated: new Date().toISOString() } : b));
  };

  const deleteBank = (id: number) => {
    setBanks(prev => prev.filter(b => b.id !== id));
    setAccounts(prev => prev.filter(a => a.bank_id !== id));
    // Logs are filtered by account_id which is already gone
  };

  const addSubAccount = (bankId: number, account: Omit<Account, 'id' | 'bank_id' | 'logs'>) => {
    const id = Date.now() + Math.random();
    setAccounts(prev => [...prev, { ...account, id, bank_id: bankId }]);
    return id;
  };

  const updateSubAccount = (id: number, account: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...account } : a));
  };

  const deleteSubAccount = (id: number) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    setLogs(prev => prev.filter(l => l.account_id !== id));
  };

  const addLog = (log: Omit<BalanceLog, 'id'>) => {
    setLogs(prev => [...prev, { ...log, id: Date.now() }]);
    // Update bank timestamp
    const account = accounts.find(a => a.id === log.account_id);
    if (account) updateBank(account.bank_id, {});
  };

  const updateLog = (id: number, log: Partial<BalanceLog>) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, ...log } : l));
    const existing = logs.find(l => l.id === id);
    if (existing) {
      const account = accounts.find(a => a.id === existing.account_id);
      if (account) updateBank(account.bank_id, {});
    }
  };

  const deleteLog = (id: number) => {
    const existing = logs.find(l => l.id === id);
    setLogs(prev => prev.filter(l => l.id !== id));
    if (existing) {
      const account = accounts.find(a => a.id === existing.account_id);
      if (account) updateBank(account.bank_id, {});
    }
  };

  const addCountry = (name: string) => setCountries(prev => Array.from(new Set([...prev, name])));
  const deleteCountry = (name: string) => setCountries(prev => prev.filter(c => c !== name));
  const addCurrency = (name: string) => setCurrencies(prev => Array.from(new Set([...prev, name])));
  const deleteCurrency = (name: string) => setCurrencies(prev => prev.filter(c => c !== name));

  const updateFXRates = (rates: FXRate[]) => setFXRates(rates);

  const resetAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const importAllData = (data: any) => {
    if (data.owners) setOwners(data.owners);
    if (data.banks) setBanks(data.banks);
    if (data.accounts) setAccounts(data.accounts);
    if (data.logs) setLogs(data.logs);
    if (data.countries) setCountries(data.countries);
    if (data.currencies) setCurrencies(data.currencies);
    if (data.fxRates) setFXRates(data.fxRates);
    setTimeout(() => window.location.reload(), 500);
  };

  const convertToDisplay = (amount: number, fromCurrency: string) => {
    if (fromCurrency === displayCurrency) return amount;
    const usdToFrom = fxRates.find(r => r.base_currency === 'USD' && r.target_currency === fromCurrency)?.rate || 1;
    const usdToDisplay = fxRates.find(r => r.base_currency === 'USD' && r.target_currency === displayCurrency)?.rate || 1;
    return (amount / usdToFrom) * usdToDisplay;
  };

  const getBank = (id: number) => {
    const bank = banks.find(b => b.id === id);
    if (!bank) return undefined;
    
    const owner = owners.find(o => o.id === bank.owner_id);
    const bankAccounts = accounts.filter(a => a.bank_id === id).map(acc => ({
      ...acc,
      logs: logs.filter(l => l.account_id === acc.id).sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
    }));

    // Calculate total balance
    let total_balance = 0;
    bankAccounts.forEach(acc => {
      if (acc.logs && acc.logs.length > 0) {
        total_balance += convertToDisplay(acc.logs[0].balance, acc.logs[0].currency);
      }
    });

    return {
      ...bank,
      owner_name: owner?.name,
      accounts: bankAccounts,
      total_balance
    };
  };

  // Aggregated Banks for List
  const aggregatedBanks = banks.map(b => {
    const owner = owners.find(o => o.id === b.owner_id);
    const bankAccounts = accounts.filter(a => a.bank_id === b.id);
    let total_balance = 0;
    bankAccounts.forEach(acc => {
      const accountLogs = logs.filter(l => l.account_id === acc.id).sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
      if (accountLogs.length > 0) {
        total_balance += convertToDisplay(accountLogs[0].balance, accountLogs[0].currency);
      }
    });
    return {
      ...b,
      owner_name: owner?.name,
      total_balance,
      account_count: bankAccounts.length
    };
  });

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <AppContext.Provider value={{ 
      theme, setTheme, 
      language, setLanguage, 
      owners, addOwner, updateOwner, deleteOwner,
      banks: aggregatedBanks, getBank, addBank, updateBank, deleteBank,
      addSubAccount, updateSubAccount, deleteSubAccount,
      addLog, updateLog, deleteLog,
      countries, addCountry, deleteCountry,
      currencies, addCurrency, deleteCurrency,
      fxRates, updateFXRates,
      displayCurrency, setDisplayCurrency,
      selectedOwners, setSelectedOwners,
      t, resetAllData, importAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
