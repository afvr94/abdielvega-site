export type CategoryType = 'income' | 'expense' | 'savings';

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  defaultAmount: number;
  sortOrder: number;
};

export type Transaction = {
  id: string;
  date: string; // ISO
  categoryId: string;
  amount: number;
  note: string | null;
};

/** Map of categoryId → planned amount for a given month */
export type Plan = Record<string, number>;

export type Totals = {
  income: { planned: number; tracked: number };
  expense: { planned: number; tracked: number };
  savings: { planned: number; tracked: number };
  toAllocate: number;
  netTracked: number;
};
