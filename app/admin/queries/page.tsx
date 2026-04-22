import { QAList } from '@/components/admin/QAList';

export const metadata = { title: 'Custom Q&A - Admin' };

export default function QueriesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Custom Q&A Memory</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pre-defined answers returned instantly when queries match above 85% similarity. Takes priority over RAG.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <QAList />
      </div>
    </div>
  );
}
