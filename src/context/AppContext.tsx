import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, Language, Owner, FXRate } from '../types';

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  owners: Owner[];
  refreshOwners: () => Promise<void>;
  countries: string[];
  currencies: string[];
  refreshConfig: () => Promise<void>;
  fxRates: FXRate[];
  refreshFXRates: () => Promise<void>;
  displayCurrency: string;
  setDisplayCurrency: (curr: string) => void;
  t: (key: string) => string;
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
  const [owners, setOwners] = useState<Owner[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [fxRates, setFXRates] = useState<FXRate[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<string>(() => localStorage.getItem('displayCurrency') || 'USD');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.remove('light', 'dark', 'dark-green');
    document.documentElement.classList.add(theme);
    if (theme === 'dark' || theme === 'dark-green') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('displayCurrency', displayCurrency);
  }, [displayCurrency]);

  const refreshOwners = async () => {
    const res = await fetch('/api/owners');
    const data = await res.json();
    setOwners(data);
  };

  const refreshConfig = async () => {
    const res = await fetch('/api/config');
    const data = await res.json();
    setCountries(data.countries);
    setCurrencies(data.currencies);
  };

  const refreshFXRates = async () => {
    const res = await fetch('/api/fx-rates');
    const data = await res.json();
    setFXRates(data);
  };

  useEffect(() => {
    refreshOwners();
    refreshConfig();
    refreshFXRates();
  }, []);

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <AppContext.Provider value={{ 
      theme, setTheme, 
      language, setLanguage, 
      owners, refreshOwners,
      countries, currencies, refreshConfig,
      fxRates, refreshFXRates,
      displayCurrency, setDisplayCurrency,
      t 
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
