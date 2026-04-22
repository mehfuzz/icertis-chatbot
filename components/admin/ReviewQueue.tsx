'use client';

import { useState } from 'react';
import { Check, X, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { useReviewQueue } from '@/hooks/useReviewQueue';
import type { ReviewQueueRow, ModuleType } from '@/lib/supabase/types';
import { formatRelativeTime, truncate } from '@/lib/utils/format';

interface ResolveModalProps {
  item: ReviewQueueRow;
  onResolve: (payload: {
    status: 'resolved' | 'dismissed';
    resolution_note?: string;
    push_to_custom_queries?: boolean;
    correct_answer?: string;
    module?: string;
  }) => Promise<void>;
  onClose: () => void;
}

function ResolveModal({ item, onResolve, onClose }: ResolveModalProps) {
  const [correctAnswer, setCorrectAnswer] = useState(item.response_text ?? '');
  const [note, setNote] = useState('');
  const [pushToFAQ, setPushToFAQ] = useState(false);
  const [module, setModule] = useState<ModuleType>('general');
  const [saving, setSaving] = useState(false);

  async function handleResolve() {
    setSaving(true);
    try {
      await onResolve({
        status: 'resolved',
        resolution_note: note,
        push_to_custom_queries: pushToFAQ,
        correct_answer: pushToFAQ ? correctAnswer : undefined,
        module: pushToFAQ ? module : undefined,
      });
      toast.success(pushToFAQ ? 'Resolved and added to FAQ' : 'Marked as resolved');
      onClose();
    } catch {
      toast.error('Failed to resolve');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Resolve Review Item" maxWidth="lg">
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-1">Original Query</p>
          <p className="text-sm">{item.query_text}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Correct Answer
          </label>
          <textarea
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Resolution Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Updated answer with correct steps"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={pushToFAQ}
            onChange={(e) => setPushToFAQ(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium">Add to Custom Q&A (FAQ Memory)</span>
        </label>

        {pushToFAQ && (
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Module</label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value as ModuleType)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">General SCM</option>
              <option value="icm">Icertis Contract Management</option>
              <option value="oracle">Oracle Fusion ERP</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleResolve} loading={saving}>
            <Check className="h-3.5 w-3.5 mr-1" />
            Resolve
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ReviewQueue() {
  const { items, loading, error, fetchItems, resolveItem, dismissItem } = useReviewQueue();
  const [resolvingItem, setResolvingItem] = useState<ReviewQueueRow | null>(null);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (error) return <div className="text-center py-8 text-red-500 text-sm">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {items.length} pending item{items.length !== 1 ? 's' : ''}
        </p>
        <Button variant="ghost" size="sm" onClick={() => fetchItems('pending')}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No pending items in the review queue.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border border-orange-200 dark:border-orange-800 rounded-xl p-4 bg-orange-50 dark:bg-orange-900/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                      {item.reason ?? 'Flagged for review'}
                    </p>
                    <span className="text-xs text-gray-400">{formatRelativeTime(item.created_at)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {item.query_text}
                  </p>
                  {item.response_text && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Generated: {truncate(item.response_text, 150)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setResolvingItem(item)}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Resolve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissItem(item.id).then(() => toast.success('Dismissed'))}
                    className="text-gray-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolvingItem && (
        <ResolveModal
          item={resolvingItem}
          onResolve={(payload) => resolveItem(resolvingItem.id, payload)}
          onClose={() => setResolvingItem(null)}
        />
      )}
    </div>
  );
}
