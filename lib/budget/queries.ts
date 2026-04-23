import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category, Plan, Transaction } from './types';
import { monthRangeUTC, shiftMonth } from './utils';

type CategoryRow = {
  id: string;
  name: string;
  type: Category['type'];
  default_amount: number | string;
  sort_order: number;
};

type PlanRow = { category_id: string; planned_amount: number | string };

type TransactionRow = {
  id: string;
  date: string;
  category_id: string;
  amount: number | string;
  note: string | null;
};

export async function fetchCategories(db: SupabaseClient): Promise<Category[]> {
  const { data, error } = await db
    .from('categories')
    .select('id,name,type,default_amount,sort_order')
    .order('sort_order');
  if (error) throw error;
  return (data ?? []).map((r: CategoryRow) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    defaultAmount: Number(r.default_amount),
    sortOrder: r.sort_order,
  }));
}

export async function upsertCategory(db: SupabaseClient, c: Category) {
  const { error } = await db.from('categories').upsert(
    {
      id: c.id,
      name: c.name,
      type: c.type,
      default_amount: c.defaultAmount,
      sort_order: c.sortOrder,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,id' }
  );
  if (error) throw error;
}

export async function deleteCategory(db: SupabaseClient, id: string) {
  const { error } = await db.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchPlan(db: SupabaseClient, month: string): Promise<Plan | null> {
  const { data, error } = await db
    .from('budget_plans')
    .select('category_id,planned_amount')
    .eq('month', month);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  const out: Plan = {};
  for (const row of data as PlanRow[]) {
    out[row.category_id] = Number(row.planned_amount);
  }
  return out;
}

export async function fetchPlanWithFallback(db: SupabaseClient, month: string): Promise<Plan> {
  const current = await fetchPlan(db, month);
  if (current) return current;
  const prev = await fetchPlan(db, shiftMonth(month, -1));
  return prev ?? {};
}

export async function writePlan(db: SupabaseClient, month: string, plan: Plan) {
  const rows = Object.entries(plan).map(([category_id, planned_amount]) => ({
    month,
    category_id,
    planned_amount,
    updated_at: new Date().toISOString(),
  }));
  if (rows.length === 0) return;
  const { error } = await db.from('budget_plans').upsert(rows, {
    onConflict: 'user_id,month,category_id',
  });
  if (error) throw error;
}

export async function fetchTransactionsForMonth(
  db: SupabaseClient,
  month: string
): Promise<Transaction[]> {
  const { start, end } = monthRangeUTC(month);
  const { data, error } = await db
    .from('transactions')
    .select('id,date,category_id,amount,note')
    .gte('date', start)
    .lt('date', end)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: TransactionRow) => ({
    id: r.id,
    date: r.date,
    categoryId: r.category_id,
    amount: Number(r.amount),
    note: r.note,
  }));
}

export async function insertTransaction(db: SupabaseClient, t: Transaction) {
  const { error } = await db.from('transactions').insert({
    id: t.id,
    date: t.date,
    category_id: t.categoryId,
    amount: t.amount,
    note: t.note,
  });
  if (error) throw error;
}

export async function deleteTransaction(db: SupabaseClient, id: string) {
  const { error } = await db.from('transactions').delete().eq('id', id);
  if (error) throw error;
}
