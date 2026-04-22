'use client';

import { useState, useRef, type DragEvent } from 'react';
import { Upload, X, FileText, FileVideo, File, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { formatBytes } from '@/lib/utils/format';
import type { ModuleType } from '@/lib/supabase/types';

const ACCEPTED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'text/plain': 'text',
};

function FileIcon({ type }: { type: string }) {
  if (type === 'video') return <FileVideo className="h-5 w-5 text-purple-500" />;
  if (type === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
  return <File className="h-5 w-5 text-blue-500" />;
}

type ProgressState = {
  step: string;
  percent: number;
} | null;

export function DocumentUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [module, setModule] = useState<ModuleType>('general');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(null);
  const [done, setDone] = useState<{ chunkCount: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  }

  function validateAndSetFile(file: File) {
    if (!ACCEPTED_TYPES[file.type] && !file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
      toast.error('Unsupported file type. Use PDF or TXT files.');
      return;
    }
    setSelectedFile(file);
    setDone(null);
    setUploadError(null);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
  }

  async function handleUpload() {
    if (!selectedFile || !title.trim()) {
      toast.error('Please select a file and enter a title');
      return;
    }

    setUploading(true);
    setDone(null);
    setUploadError(null);
    setProgress({ step: 'Preparing…', percent: 0 });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      formData.append('module', module);

      const res = await fetch('/api/ingest', { method: 'POST', body: formData });
      if (!res.ok || !res.body) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'progress') {
              setProgress({ step: event.step, percent: event.percent });
            } else if (event.type === 'done') {
              setDone({ chunkCount: event.chunk_count });
              setProgress({ step: 'Complete', percent: 100 });
              toast.success(`Ingested ${event.chunk_count} chunks successfully`);
              setSelectedFile(null);
              setTitle('');
              onUploadComplete?.();
            } else if (event.type === 'error') {
              throw new Error(event.error);
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
          uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          dragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        )}
      >
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Drop file here or click to browse
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Supported: PDF, TXT
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
        />
      </div>

      {/* Selected file info */}
      {selectedFile && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <FileIcon type={ACCEPTED_TYPES[selectedFile.type] ?? 'text'} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">{formatBytes(selectedFile.size)}</p>
          </div>
          {!uploading && (
            <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Metadata form */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Document Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading}
            placeholder="e.g., ICM Contract Creation SOP"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Module
          </label>
          <select
            value={module}
            onChange={(e) => setModule(e.target.value as ModuleType)}
            disabled={uploading}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="general">General SCM</option>
            <option value="icm">Icertis Contract Management</option>
            <option value="oracle">Oracle Fusion ERP</option>
          </select>
        </div>
      </div>

      {/* Progress bar */}
      {uploading && progress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{progress.step}</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Success state */}
      {done && !uploading && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Ingested successfully — {done.chunkCount} chunks stored and ready for search.
        </div>
      )}

      {/* Error state */}
      {uploadError && !uploading && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {uploadError}
        </div>
      )}

      <Button
        onClick={handleUpload}
        loading={uploading}
        disabled={!selectedFile || !title.trim() || uploading}
        className="w-full"
      >
        {uploading ? 'Processing…' : 'Upload & Ingest'}
      </Button>
    </div>
  );
}
