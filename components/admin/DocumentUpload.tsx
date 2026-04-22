'use client';

import { useState, useRef, type DragEvent } from 'react';
import { Upload, X, FileText, FileVideo, File } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { formatBytes } from '@/lib/utils/format';
import type { ModuleType } from '@/lib/supabase/types';
import { useDocuments } from '@/hooks/useDocuments';

const ACCEPTED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'text/plain': 'text',
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'video/x-msvideo': 'video',
};

function FileIcon({ type }: { type: string }) {
  if (type === 'video') return <FileVideo className="h-5 w-5 text-purple-500" />;
  if (type === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
  return <File className="h-5 w-5 text-blue-500" />;
}

export function DocumentUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [module, setModule] = useState<ModuleType>('general');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { createDocument } = useDocuments();

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  }

  function validateAndSetFile(file: File) {
    if (!ACCEPTED_TYPES[file.type]) {
      toast.error('Unsupported file type. Use PDF, TXT, or video files.');
      return;
    }
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
  }

  async function handleUpload() {
    if (!selectedFile || !title.trim()) {
      toast.error('Please select a file and enter a title');
      return;
    }

    setUploading(true);
    try {
      const fileType = ACCEPTED_TYPES[selectedFile.type] as 'pdf' | 'text' | 'video';

      await createDocument({
        title: title.trim(),
        file_name: selectedFile.name,
        file_type: fileType,
        module,
        file_size: selectedFile.size,
        chunk_count: 0,
        status: 'processing',
        metadata: {},
      });

      toast.success('Document registered. Run Python ingestion script to process it.');
      setSelectedFile(null);
      setTitle('');
      onUploadComplete?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
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
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
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
          Supported: PDF, TXT, MP4, MOV, AVI
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.mp4,.mov,.avi"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
        />
      </div>

      {/* Selected file info */}
      {selectedFile && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <FileIcon type={ACCEPTED_TYPES[selectedFile.type]} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">{formatBytes(selectedFile.size)}</p>
          </div>
          <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
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
            placeholder="e.g., ICM Contract Creation SOP"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Module
          </label>
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
      </div>

      <Button
        onClick={handleUpload}
        loading={uploading}
        disabled={!selectedFile || !title.trim()}
        className="w-full"
      >
        Register Document
      </Button>

      <p className="text-xs text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <strong>Note:</strong> After registering, run the Python ingestion script on the server to extract text, create chunks, and generate embeddings. The document will show as &ldquo;processing&rdquo; until then.
      </p>
    </div>
  );
}
