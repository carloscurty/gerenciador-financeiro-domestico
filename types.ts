
export type TransactionType = 'income' | 'expense';

export type Category = 
  | 'Alimentação' 
  | 'Moradia' 
  | 'Transporte' 
  | 'Lazer' 
  | 'Saúde' 
  | 'Educação' 
  | 'Salário' 
  | 'Investimentos' 
  | 'Outros';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  category: Category;
}

export interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface MonthlyReportData {
  month: string;
  income: number;
  expense: number;
  savings: number;
}

export interface CategoryReportData {
  name: string;
  value: number;
  percentage: number;
}
