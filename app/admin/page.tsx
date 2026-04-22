import { createServerClient } from '@/lib/supabase/server';
import { FileText, MessageSquare, AlertTriangle, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin Dashboard - Airtel SCM Assistant' };

async function getStats() {
  try {
    const supabase = createServerClient();

    const [docsResult, chunksResult, queriesResult, reviewResult, logsResult] =
      await Promise.all([
        supabase.from('documents').select('id', { count: 'exact', head: true }),
        supabase.from('document_chunks').select('id', { count: 'exact', head: true }),
        supabase.from('custom_queries').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('review_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('query_logs').select('id, response_type, feedback, created_at').order('created_at', { ascending: false }).limit(100),
      ]);

    const logs = logsResult.data ?? [];
    const positiveCount = logs.filter((l) => l.feedback === 'positive').length;
    const negativeCount = logs.filter((l) => l.feedback === 'negative').length;

    return {
      documents: docsResult.count ?? 0,
      chunks: chunksResult.count ?? 0,
      customQueries: queriesResult.count ?? 0,
      pendingReview: reviewResult.count ?? 0,
      recentLogs: logs.slice(0, 5),
      positiveCount,
      negativeCount,
    };
  } catch {
    return { documents: 0, chunks: 0, customQueries: 0, pendingReview: 0, recentLogs: [], positiveCount: 0, negativeCount: 0 };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { label: 'Documents', value: stats.documents, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Text Chunks', value: stats.chunks, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Custom Q&A', value: stats.customQueries, icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Pending Review', value: stats.pendingReview, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Knowledge base and system overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Feedback stats */}
      {(stats.positiveCount + stats.negativeCount > 0) && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Feedback (last 100 queries)</h2>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xl font-bold text-green-600">{stats.positiveCount}</p>
              <p className="text-xs text-gray-500">Positive</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">{stats.negativeCount}</p>
              <p className="text-xs text-gray-500">Negative</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                {stats.positiveCount + stats.negativeCount > 0
                  ? Math.round((stats.positiveCount / (stats.positiveCount + stats.negativeCount)) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500">Satisfaction</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          <a href="/admin/documents" className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <FileText className="h-4 w-4 text-blue-500" />
            Upload Documents
          </a>
          <a href="/admin/queries" className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <MessageSquare className="h-4 w-4 text-green-500" />
            Manage Q&A
          </a>
          <a href="/admin/review" className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Review Queue
            {stats.pendingReview > 0 && (
              <span className="ml-auto bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-xs px-1.5 py-0.5 rounded-full">
                {stats.pendingReview}
              </span>
            )}
          </a>
        </div>
      </div>
    </div>
  );
}
