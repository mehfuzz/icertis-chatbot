'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useCustomQueries } from '@/hooks/useCustomQueries';
import type { CustomQueryRow, ModuleType } from '@/lib/supabase/types';
import { COMMON_TAGS } from '@/lib/utils/constants';

interface QAEditorProps {
  open: boolean;
  onClose: () => void;
  editing?: CustomQueryRow | null;
}

export function QAEditor({ open, onClose, editing }: QAEditorProps) {
  const { createQuery, updateQuery } = useCustomQueries();
  const [queryText, setQueryText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [module, setModule] = useState<ModuleType>('general');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setQueryText(editing.query_text);
      setAnswerText(editing.answer_text);
      setModule(editing.module);
      setTags(editing.tags ?? []);
    } else {
      setQueryText('');
      setAnswerText('');
      setModule('general');
      setTags([]);
    }
  }, [editing, open]);

  function addTag(tag: string) {
    const clean = tag.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
    }
    setTagInput('');
  }

  async function handleSave() {
    if (!queryText.trim() || !answerText.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateQuery(editing.id, {
          query_text: queryText.trim(),
          answer_text: answerText.trim(),
          module,
          tags,
        });
        toast.success('Q&A updated');
      } else {
        await createQuery({
          query_text: queryText.trim(),
          answer_text: answerText.trim(),
          module,
          tags,
        });
        toast.success('Q&A created');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Q&A Pair' : 'Add Q&A Pair'} maxWidth="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Question / Query
          </label>
          <textarea
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            rows={2}
            placeholder="e.g., How do I create a contract in Icertis?"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Answer
          </label>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={6}
            placeholder="Provide the complete answer. Supports markdown formatting."
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Add Tags</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder="Type tag + Enter"
              list="tag-suggestions"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="tag-suggestions">
              {COMMON_TAGS.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                {tag}
                <button onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} className="hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
        </div>
      </div>
    </Modal>
  );
}
