'use client';

import { useState, useCallback, useEffect } from 'react';
import type { CustomQueryRow } from '@/lib/supabase/types';

export function useCustomQueries() {
  const [queries, setQueries] = useState<CustomQueryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/custom-queries?active=false');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQueries(data.queries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueries(); }, [fetchQueries]);

  const createQuery = useCallback(async (payload: {
    query_text: string;
    answer_text: string;
    module: string;
    tags?: string[];
  }) => {
    const res = await fetch('/api/custom-queries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setQueries((prev) => [data.query, ...prev]);
    return data.query as CustomQueryRow;
  }, []);

  const updateQuery = useCallback(async (id: string, payload: Partial<CustomQueryRow>) => {
    const res = await fetch(`/api/custom-queries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setQueries((prev) => prev.map((q) => (q.id === id ? data.query : q)));
    return data.query as CustomQueryRow;
  }, []);

  const deleteQuery = useCallback(async (id: string) => {
    const res = await fetch(`/api/custom-queries/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    setQueries((prev) => prev.filter((q) => q.id !== id));
  }, []);

  return { queries, loading, error, fetchQueries, createQuery, updateQuery, deleteQuery };
}
