import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PortfolioList from './components/PortfolioList';
import AccountDetail from './components/AccountDetail';
import DataManagement from './components/DataManagement';
import Settings from './components/Settings';
import { motion, AnimatePresence } from 'motion/react';

const AppContent: React.FC = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null | undefined>(undefined);

  const renderModule = () => {
    if (selectedAccountId !== undefined) {
      return (
        <AccountDetail 
          accountId={selectedAccountId} 
          onBack={() => setSelectedAccountId(undefined)} 
        />
      );
    }

    switch (activeModule) {
      case 'dashboard': return <Dashboard />;
      case 'portfolio': return <PortfolioList onSelectAccount={(id) => setSelectedAccountId(id)} />;
      case 'data': return <DataManagement />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--bg-primary)]">
      <Sidebar activeModule={activeModule} setActiveModule={(m) => {
        setActiveModule(m);
        setSelectedAccountId(undefined);
      }} />
      <main className="flex-1 overflow-y-auto h-screen pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedAccountId !== undefined ? `account-${selectedAccountId}` : activeModule}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderModule()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
