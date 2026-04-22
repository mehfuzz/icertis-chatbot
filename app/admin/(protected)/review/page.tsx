import { ReviewQueue } from '@/components/admin/ReviewQueue';

export const metadata = { title: 'Review Queue - Admin' };

export default function ReviewPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Review Queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Queries with negative feedback or low-confidence responses flagged for review. Resolve to improve the chatbot.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <ReviewQueue />
      </div>
    </div>
  );
}
