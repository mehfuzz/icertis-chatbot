'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ReviewQueueRow } from '@/lib/supabase/types';

export function useReviewQueue() {
  const [items, setItems] = useState<ReviewQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async (status = 'pending') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/review-queue?status=${status}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resolveItem = useCallback(async (id: string, payload: {
    status: 'resolved' | 'dismissed';
    resolution_note?: string;
    push_to_custom_queries?: boolean;
    correct_answer?: string;
    module?: string;
    tags?: string[];
  }) => {
    const res = await fetch(`/api/review-queue/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setItems((prev) => prev.filter((i) => i.id !== id));
    return data.item;
  }, []);

  const dismissItem = useCallback(async (id: string) => {
    return resolveItem(id, { status: 'dismissed' });
  }, [resolveItem]);

  return { items, loading, error, fetchItems, resolveItem, dismissItem };
}
