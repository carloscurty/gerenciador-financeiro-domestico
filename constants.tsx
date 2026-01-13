
import React from 'react';
import { Category, Transaction } from './types';

export const CATEGORIES: Category[] = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Salário',
  'Investimentos',
  'Outros'
];

export const CATEGORY_COLORS: Record<Category, string> = {
  'Alimentação': '#f59e0b',
  'Moradia': '#3b82f6',
  'Transporte': '#6366f1',
  'Lazer': '#ec4899',
  'Saúde': '#ef4444',
  'Educação': '#8b5cf6',
  'Salário': '#10b981',
  'Investimentos': '#06b6d4',
  'Outros': '#64748b'
};

export const INITIAL_DATA: Transaction[] = [
  { id: '1', description: 'Salário Mensal', amount: 5000, date: '2023-10-01', type: 'income', category: 'Salário' },
  { id: '2', description: 'Aluguel', amount: 1500, date: '2023-10-05', type: 'expense', category: 'Moradia' },
  { id: '3', description: 'Supermercado', amount: 800, date: '2023-10-10', type: 'expense', category: 'Alimentação' },
  { id: '4', description: 'Internet', amount: 100, date: '2023-10-12', type: 'expense', category: 'Outros' },
  { id: '5', description: 'Dividendos', amount: 250, date: '2023-10-15', type: 'income', category: 'Investimentos' },
  { id: '6', description: 'Cinema', amount: 60, date: '2023-10-20', type: 'expense', category: 'Lazer' },
];
