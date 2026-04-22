'use client';

import { useState, useCallback, useEffect } from 'react';
import type { DocumentRow } from '@/types/documents';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDocuments(data.documents ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const deleteDocument = useCallback(async (id: string) => {
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const createDocument = useCallback(async (data: Omit<DocumentRow, 'id' | 'created_at' | 'updated_at'>) => {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    setDocuments((prev) => [result.document, ...prev]);
    return result.document as DocumentRow;
  }, []);

  return { documents, loading, error, fetchDocuments, deleteDocument, createDocument };
}
