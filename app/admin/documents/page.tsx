import { DocumentUpload } from '@/components/admin/DocumentUpload';
import { DocumentList } from '@/components/admin/DocumentList';

export const metadata = { title: 'Documents - Admin' };

export default function DocumentsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Knowledge Base Documents</h1>
        <p className="text-sm text-gray-500 mt-1">
          Register documents here, then run Python ingestion scripts to process them.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Upload Document</h2>
          <DocumentUpload />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Document Library</h2>
          <DocumentList />
        </div>
      </div>
    </div>
  );
}
