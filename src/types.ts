export type Theme = 'light' | 'dark' | 'dark-green';
export type Language = 'en' | 'zh';

export interface Owner {
  id: number;
  name: string;
}

export interface Bank {
  id: number;
  owner_id: number;
  owner_name?: string;
  name: string;
  bank_name?: string;
  institution_type?: string;
  logo_color?: string;
  country?: string;
  last_updated?: string;
  total_balance?: number;
  accounts?: Account[];
  account_count?: number;
}

export interface Account {
  id: number;
  bank_id: number;
  name: string;
  type: string;
  account_number?: string;
  logs?: BalanceLog[];
}

export interface BalanceLog {
  id: number;
  account_id: number;
  balance: number;
  currency: string;
  comment?: string;
  recorded_at: string;
}

export interface Asset {
  id: number;
  owner_id: number;
  owner_name?: string;
  name: string;
  asset_type: string;
  value: number;
  currency: string;
  purchase_price?: number;
  purchase_date?: string;
  country?: string;
  notes?: string;
  logo_color?: string;
  last_updated?: string;
  logs?: AssetLog[];
  log_count?: number;
}

export interface AssetLog {
  id: number;
  asset_id: number;
  type: string; // e.g., 'Valuation', 'Dividend', 'Maintenance'
  amount: number;
  currency: string;
  comment?: string;
  recorded_at: string;
}

export interface FXRate {
  base_currency: string;
  target_currency: string;
  rate: number;
  updated_at: string;
}
