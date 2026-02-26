import React, { useState } from 'react';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, ClipboardList, Trash2, Database, ArrowLeft, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import * as XLSX from 'xlsx';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DataManagement: React.FC = () => {
  const { t, owners, banks, countries, currencies, fxRates, resetAllData, importAllData } = useAppContext();
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading', message: string } | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'review_db' | 'preview_import'>('overview');
  const [activeTab, setActiveTab] = useState<'owners' | 'banks' | 'accounts' | 'logs' | 'config' | 'fxRates'>('owners');
  const [previewData, setPreviewData] = useState<any>(null);

  const handleExport = async () => {
    setStatus({ type: 'loading', message: 'Preparing export...' });
    try {
      // Get all raw data from localStorage via context
      const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      const logs = JSON.parse(localStorage.getItem('logs') || '[]');

      // Format dates for Excel (MM/DD/YYYY)
      const formatExcelDate = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
      };

      const formattedBanks = banks.map((bank: any) => ({
        ...bank,
        last_updated: formatExcelDate(bank.last_updated)
      }));

      const formattedLogs = logs.map((log: any) => ({
        ...log,
        recorded_at: formatExcelDate(log.recorded_at)
      }));

      const formattedFxRates = fxRates.map((rate: any) => ({
        ...rate,
        updated_at: formatExcelDate(rate.updated_at)
      }));

      const wb = XLSX.utils.book_new();
      
      // Owners Sheet
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(owners), "Owners");
      
      // Institutions Sheet
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formattedBanks), "Institutions");

      // Accounts Sheet
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(accounts), "Accounts");
      
      // Logs Sheet
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formattedLogs), "BalanceLogs");

      // Config Sheet
      const configRows = [
        ...countries.map((v: string) => ({ type: 'country', value: v })),
        ...currencies.map((v: string) => ({ type: 'currency', value: v }))
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(configRows), "ConfigOptions");

      // FX Rates Sheet
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formattedFxRates), "FXRates");

      XLSX.writeFile(wb, `AssetSnapshot_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      setStatus({ type: 'success', message: 'Data exported successfully!' });
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus({ type: 'error', message: 'Export failed. Please try again.' });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus({ type: 'loading', message: 'Parsing Excel file...' });
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        
        const importedOwners = XLSX.utils.sheet_to_json(wb.Sheets["Owners"] || wb.Sheets[wb.SheetNames[0]]);
        const importedBanks = XLSX.utils.sheet_to_json(wb.Sheets["Institutions"] || wb.Sheets["Banks"] || wb.Sheets[wb.SheetNames[1]]);
        const importedAccounts = XLSX.utils.sheet_to_json(wb.Sheets["Accounts"] || wb.Sheets[wb.SheetNames[2]]);
        const importedLogs = XLSX.utils.sheet_to_json(wb.Sheets["BalanceLogs"] || wb.Sheets[wb.SheetNames[3]]);
        const config = XLSX.utils.sheet_to_json(wb.Sheets["ConfigOptions"] || wb.Sheets[wb.SheetNames[4]]) as any[];
        const importedFxRates = XLSX.utils.sheet_to_json(wb.Sheets["FXRates"] || wb.Sheets[wb.SheetNames[5]]) as any[];

        const parseDate = (val: any) => {
          if (!val) return new Date().toISOString();
          if (val instanceof Date) {
            // Excel dates are parsed as UTC. To avoid timezone shift,
            // we construct the ISO string manually.
            const yyyy = val.getUTCFullYear();
            const mm = String(val.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(val.getUTCDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
          }
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
          }
          return new Date().toISOString();
        };

        const processedBanks = importedBanks.map((b: any) => ({ ...b, last_updated: parseDate(b.last_updated) }));
        const processedLogs = importedLogs.map((l: any) => ({ ...l, recorded_at: parseDate(l.recorded_at) }));
        const processedFxRates = importedFxRates.map((r: any) => ({ ...r, updated_at: parseDate(r.updated_at) }));

        setPreviewData({
          owners: importedOwners || [],
          banks: processedBanks || [],
          accounts: importedAccounts || [],
          logs: processedLogs || [],
          config: config || [],
          fxRates: processedFxRates || []
        });
        
        setViewMode('preview_import');
        setStatus(null);
      } catch (err: any) {
        setStatus({ type: 'error', message: `Parse failed: ${err.message}` });
      }
    };
    reader.readAsBinaryString(file);
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!previewData) return;
    
    try {
      const countries = previewData.config.filter((c: any) => c.type === 'country').map((c: any) => c.value);
      const currencies = previewData.config.filter((c: any) => c.type === 'currency').map((c: any) => c.value);

      importAllData({
        owners: previewData.owners,
        banks: previewData.banks,
        accounts: previewData.accounts,
        logs: previewData.logs,
        countries: countries.length > 0 ? countries : undefined,
        currencies: currencies.length > 0 ? currencies : undefined,
        fxRates: previewData.fxRates
      });

      setStatus({ type: 'success', message: 'Data imported successfully!' });
      setPreviewData(null);
      setViewMode('overview');
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setStatus({ type: 'error', message: `Import failed: ${err.message}` });
    }
  };

  const handleReset = () => {
    if (!confirm(t('resetWarning'))) return;
    resetAllData();
  };

  const getDisplayData = () => {
    const source = previewData || {
      owners,
      banks,
      accounts: JSON.parse(localStorage.getItem('accounts') || '[]'),
      logs: JSON.parse(localStorage.getItem('logs') || '[]'),
      config: [
        ...countries.map((v: string) => ({ type: 'country', value: v })),
        ...currencies.map((v: string) => ({ type: 'currency', value: v }))
      ],
      fxRates
    };

    switch (activeTab) {
      case 'owners': return source.owners;
      case 'banks': return source.banks;
      case 'accounts': return source.accounts;
      case 'logs': return source.logs;
      case 'config': return source.config;
      case 'fxRates': return source.fxRates;
      default: return [];
    }
  };

  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) return <div className="p-8 text-center text-[var(--text-secondary)]">No data available</div>;

    const headers = Object.keys(data[0]);

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--bg-secondary)]">
              {headers.map(h => <th key={h} className="p-4 font-bold whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-colors">
                {headers.map(h => (
                  <td key={h} className="p-4 text-sm text-[var(--text-primary)] whitespace-nowrap">
                    {typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-[var(--bg-primary)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)]">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase text-[var(--text-primary)]">Data Management</h2>
          <p className="text-sm font-bold text-[var(--text-secondary)] mt-1 uppercase tracking-wider">Bulk import and export tools for database management.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => { setViewMode(viewMode === 'review_db' ? 'overview' : 'review_db'); setPreviewData(null); }}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-xl border transition-all",
              viewMode === 'review_db' ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800/30 dark:text-blue-400" : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
            )}
            title="Review Database"
          >
            <ClipboardList size={20} />
          </button>
          
          <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 cursor-pointer">
            <Upload size={18} />
            UPLOAD EXCEL
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileSelect} />
          </label>

          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] px-6 py-3 rounded-xl font-bold transition-all"
          >
            <FileSpreadsheet size={18} />
            EXPORT EXCEL
          </button>

          <button 
            onClick={handleReset}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
          >
            <Trash2 size={18} />
            CLEAR DB
          </button>
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div className={cn(
          "p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4",
          status.type === 'success' ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : 
          status.type === 'error' ? "bg-red-500/10 text-red-600 border border-red-500/20" :
          "bg-blue-500/10 text-blue-600 border border-blue-500/20"
        )}>
          {status.type === 'loading' ? <Loader2 size={20} className="animate-spin" /> : 
           status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{status.message}</span>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === 'overview' && !previewData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overview Cards */}
          <div className="card p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Database size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">Database Status</h3>
                <p className="text-xs text-[var(--text-secondary)]">Local Storage</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] font-bold uppercase tracking-wider text-xs">Owners</span>
                <span className="font-mono font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] px-2 py-1 rounded border border-[var(--border-color)]">{owners.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] font-bold uppercase tracking-wider text-xs">Banks</span>
                <span className="font-mono font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] px-2 py-1 rounded border border-[var(--border-color)]">{banks.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] font-bold uppercase tracking-wider text-xs">Accounts</span>
                <span className="font-mono font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] px-2 py-1 rounded border border-[var(--border-color)]">{JSON.parse(localStorage.getItem('accounts') || '[]').length}</span>
              </div>
              <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] font-bold uppercase tracking-wider text-xs">Logs</span>
                <span className="font-mono font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] px-2 py-1 rounded border border-[var(--border-color)]">{JSON.parse(localStorage.getItem('logs') || '[]').length}</span>
              </div>
            </div>
          </div>
          
          <div className="card p-6 rounded-2xl shadow-sm md:col-span-2 flex flex-col justify-center items-center text-center border-dashed border-2 border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <ClipboardList size={48} className="text-[var(--text-secondary)] mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Review Database</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md">Click the review button in the top right to inspect your current database tables, or upload an Excel file to preview and import new data.</p>
            <button 
              onClick={() => setViewMode('review_db')}
              className="bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-blue-500 text-[var(--text-primary)] px-6 py-2 rounded-xl font-bold transition-all"
            >
              Open Review Mode
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-[var(--border-color)] hide-scrollbar">
            {[
              { id: 'owners', label: 'Owners', icon: '👥' },
              { id: 'banks', label: 'Banks', icon: '🏦' },
              { id: 'accounts', label: 'Accounts', icon: '💳' },
              { id: 'logs', label: 'Balance Logs', icon: '📈' },
              { id: 'config', label: 'Config', icon: '⚙️' },
              { id: 'fxRates', label: 'FX Rates', icon: '💱' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 font-bold text-sm uppercase tracking-wider whitespace-nowrap border-b-2 transition-all",
                  activeTab === tab.id 
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" 
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]"
                )}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Preview Banner */}
          {previewData && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-amber-800 dark:text-amber-300 text-lg">Previewing Import Data</h3>
                  <p className="text-sm text-amber-700/80 dark:text-amber-400/80">Review the parsed data below. Click confirm to overwrite your current database.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={() => { setPreviewData(null); setViewMode('overview'); }}
                  className="px-6 py-3 rounded-xl font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmImport}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-lg shadow-amber-500/20"
                >
                  <Check size={18} />
                  Confirm Import
                </button>
              </div>
            </div>
          )}

          {/* Table Card */}
          <div className="card rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden bg-[var(--bg-primary)]">
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-3">
                <Database size={20} className="text-blue-500" />
                <h3 className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  {previewData ? 'PREVIEW: ' : 'DATABASE REVIEW: '} {activeTab} ({getDisplayData().length})
                </h3>
              </div>
              {viewMode === 'review_db' && (
                <button 
                  onClick={() => setViewMode('overview')}
                  className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-color)] px-4 py-2 rounded-lg transition-all"
                >
                  Close Review
                </button>
              )}
            </div>
            {renderTable(getDisplayData())}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement;
