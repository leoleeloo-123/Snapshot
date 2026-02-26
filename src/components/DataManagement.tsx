import React, { useState } from 'react';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import * as XLSX from 'xlsx';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DataManagement: React.FC = () => {
  const { t } = useAppContext();
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading', message: string } | null>(null);

  const handleExport = async () => {
    setStatus({ type: 'loading', message: 'Preparing export...' });
    try {
      const res = await fetch('/api/export');
      const data = await res.json();

      const wb = XLSX.utils.book_new();
      
      // Owners Sheet
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.owners), "Owners");
      
      // Accounts Sheet
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.accounts), "Accounts");
      
      // Logs Sheet
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.logs), "BalanceLogs");

      // Config Sheet
      const configRes = await fetch('/api/config');
      const configData = await configRes.json();
      const configRows = [
        ...configData.countries.map((v: string) => ({ type: 'country', value: v })),
        ...configData.currencies.map((v: string) => ({ type: 'currency', value: v }))
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(configRows), "ConfigOptions");

      // FX Rates Sheet
      const fxRes = await fetch('/api/fx-rates');
      const fxData = await fxRes.json();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fxData), "FXRates");

      XLSX.writeFile(wb, `AssetSnapshot_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      setStatus({ type: 'success', message: 'Data exported successfully!' });
    } catch (e) {
      setStatus({ type: 'error', message: 'Export failed. Please try again.' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus({ type: 'loading', message: 'Importing data...' });
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        const owners = XLSX.utils.sheet_to_json(wb.Sheets["Owners"]);
        const accounts = XLSX.utils.sheet_to_json(wb.Sheets["Accounts"]);
        const logs = XLSX.utils.sheet_to_json(wb.Sheets["BalanceLogs"]);
        const config = XLSX.utils.sheet_to_json(wb.Sheets["ConfigOptions"]) as any[];
        const fxRates = XLSX.utils.sheet_to_json(wb.Sheets["FXRates"]) as any[];

        if (!owners || !accounts || !logs) {
          throw new Error("Invalid file structure. Missing required sheets.");
        }

        // Import main data
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owners, accounts, logs })
        });

        if (!res.ok) throw new Error("Server rejected main data import.");

        // Import config options
        if (config) {
          for (const opt of config) {
            await fetch('/api/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(opt)
            });
          }
        }

        // Import FX rates
        if (fxRates) {
          await fetch('/api/fx-rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rates: fxRates.map(r => ({ base: r.base_currency, target: r.target_currency, rate: r.rate })) })
          });
        }

        setStatus({ type: 'success', message: 'Data imported successfully! Page will refresh.' });
        setTimeout(() => window.location.reload(), 2000);
      } catch (err: any) {
        setStatus({ type: 'error', message: `Import failed: ${err.message}` });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleReset = async () => {
    if (!confirm(t('resetWarning'))) return;
    
    setStatus({ type: 'loading', message: t('resetting') });
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        setStatus({ type: 'success', message: t('resetSuccess') });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        throw new Error("Reset failed");
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Reset failed. Please try again.' });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('dataManagement')}</h2>
        <p className="text-[var(--text-secondary)] mt-1">Backup your data or migrate from another system using Excel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card p-8 rounded-2xl shadow-sm border-dashed border-2 flex flex-col items-center text-center group hover:border-blue-500 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
            <Download size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">{t('export')} Data</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            Download all your owners, accounts, and historical logs into a single structured Excel file.
          </p>
          <button 
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            <FileSpreadsheet size={20} />
            Generate Excel Backup
          </button>
        </div>

        <div className="card p-8 rounded-2xl shadow-sm border-dashed border-2 flex flex-col items-center text-center group hover:border-emerald-500 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
            <Upload size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">{t('import')} Data</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            Upload a previously exported Excel file to restore your data. <br/>
            <span className="text-red-500 font-bold">Warning: This will overwrite current data.</span>
          </p>
          <label className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer">
            <FileSpreadsheet size={20} />
            Select Excel File
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      <div className="card p-8 rounded-2xl shadow-sm border-dashed border-2 border-red-200 bg-red-50/30 flex flex-col items-center text-center group hover:border-red-500 transition-all">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 mb-6 group-hover:scale-110 transition-transform">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold mb-2 text-red-700">{t('resetDatabase')}</h3>
        <p className="text-sm text-red-600/70 mb-8 max-w-md">
          Permanently delete all owners, banks, accounts, and balance logs. This action is destructive and cannot be undone.
        </p>
        <button 
          onClick={handleReset}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
        >
          <AlertCircle size={20} />
          {t('resetDatabase')}
        </button>
      </div>

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

      <div className="card p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
        <h4 className="font-bold text-amber-700 flex items-center gap-2 mb-2">
          <AlertCircle size={16} />
          Important Note
        </h4>
        <p className="text-sm text-amber-800/80 leading-relaxed">
          The import process expects a specific Excel structure with three sheets: <b>Owners</b>, <b>Accounts</b>, and <b>BalanceLogs</b>. 
          The best way to ensure compatibility is to use a file previously exported from this application. 
          Manual edits to the Excel file may cause import failures if IDs or relationships are broken.
        </p>
      </div>
    </div>
  );
};

export default DataManagement;
