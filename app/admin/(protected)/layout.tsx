import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Bot, FileText, MessageSquare, AlertTriangle, LayoutDashboard } from 'lucide-react';
import { LogoutButton } from '@/components/admin/LogoutButton';

export const dynamic = 'force-dynamic';

function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const adminToken = cookieStore.get('admin_token');
  const adminKey = process.env.ADMIN_SECRET_KEY;

  if (!adminKey || adminToken?.value !== adminKey) {
    redirect('/admin/login');
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">Admin Panel</p>
              <p className="text-xs text-gray-500">SCM Assistant</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink href="/admin" icon={LayoutDashboard} label="Dashboard" />
          <NavLink href="/admin/documents" icon={FileText} label="Documents" />
          <NavLink href="/admin/queries" icon={MessageSquare} label="Custom Q&A" />
          <NavLink href="/admin/review" icon={AlertTriangle} label="Review Queue" />
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <Link
            href="/chat"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Bot className="h-4 w-4" />
            Back to Chat
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
