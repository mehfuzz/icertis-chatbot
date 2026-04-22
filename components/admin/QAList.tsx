'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { ModuleBadge, Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { QAEditor } from './QAEditor';
import { useCustomQueries } from '@/hooks/useCustomQueries';
import type { CustomQueryRow } from '@/lib/supabase/types';
import { truncate } from '@/lib/utils/format';

export function QAList() {
  const { queries, loading, error, fetchQueries, deleteQuery } = useCustomQueries();
  const [editingItem, setEditingItem] = useState<CustomQueryRow | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  async function handleDelete(q: CustomQueryRow) {
    if (!confirm('Delete this Q&A pair?')) return;
    try {
      await deleteQuery(q.id);
      toast.success('Q&A deleted');
    } catch {
      toast.error('Failed to delete');
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (error) return <div className="text-center py-8 text-red-500 text-sm">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{queries.length} Q&A pair{queries.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchQueries}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { setEditingItem(null); setShowEditor(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Q&A
          </Button>
        </div>
      </div>

      {queries.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No Q&A pairs yet. Add your first one above.
        </div>
      ) : (
        <div className="space-y-2">
          {queries.map((q) => (
            <div key={q.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ModuleBadge module={q.module} />
                    {q.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="error">Inactive</Badge>
                    )}
                    {q.hit_count > 0 && (
                      <span className="text-xs text-gray-500">{q.hit_count} hits</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {q.query_text}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {truncate(q.answer_text, 120)}
                  </p>
                  {q.tags && q.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {q.tags.map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditingItem(q); setShowEditor(true); }}
                    className="p-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(q)}
                    className="p-1.5 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <QAEditor
        open={showEditor}
        onClose={() => { setShowEditor(false); setEditingItem(null); }}
        editing={editingItem}
      />
    </div>
  );
}
