import { TrendingUp, TrendingDown, PiggyBank, type LucideIcon } from 'lucide-react';
import type { CategoryType } from './types';

export const TYPE_META: Record<CategoryType, { label: string; color: string; icon: LucideIcon }> = {
  income: { label: 'Income', color: '#4A6741', icon: TrendingUp },
  expense: { label: 'Expenses', color: '#B54228', icon: TrendingDown },
  savings: { label: 'Savings', color: '#2E5266', icon: PiggyBank },
};

export const TYPE_ORDER: CategoryType[] = ['income', 'expense', 'savings'];
