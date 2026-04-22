'use client';

import { Trash2, RefreshCw, FileText, FileVideo, File } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge, ModuleBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate, formatBytes } from '@/lib/utils/format';
import { useDocuments } from '@/hooks/useDocuments';
import type { DocumentRow } from '@/types/documents';

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
    ready: 'success',
    processing: 'warning',
    failed: 'error',
  };
  return <Badge variant={variants[status] ?? 'default'}>{status}</Badge>;
}

function FileIcon({ type }: { type: string }) {
  if (type === 'video') return <FileVideo className="h-4 w-4 text-purple-500" />;
  if (type === 'pdf') return <FileText className="h-4 w-4 text-red-500" />;
  return <File className="h-4 w-4 text-blue-500" />;
}

export function DocumentList() {
  const { documents, loading, error, fetchDocuments, deleteDocument } = useDocuments();

  async function handleDelete(doc: DocumentRow) {
    if (!confirm(`Delete "${doc.title}"? This will also remove all its chunks.`)) return;
    try {
      await deleteDocument(doc.id);
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    }
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <Spinner />
    </div>
  );

  if (error) return (
    <div className="text-center py-8 text-red-500 text-sm">{error}</div>
  );

  if (documents.length === 0) return (
    <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
      No documents yet. Upload your first document above.
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={fetchDocuments}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Refresh
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Document</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Module</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Chunks</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Added</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <FileIcon type={doc.file_type} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{doc.title}</p>
                      <p className="text-xs text-gray-500">{doc.file_name}{doc.file_size ? ` · ${formatBytes(doc.file_size)}` : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3"><ModuleBadge module={doc.module} /></td>
                <td className="py-3 px-3"><StatusBadge status={doc.status} /></td>
                <td className="py-3 px-3 text-gray-500">{doc.chunk_count}</td>
                <td className="py-3 px-3 text-gray-500 text-xs">{formatDate(doc.created_at)}</td>
                <td className="py-3 px-3">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(doc)} className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
