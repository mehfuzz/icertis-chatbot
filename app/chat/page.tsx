import { ChatWindow } from '@/components/chat/ChatWindow';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Bot, Settings } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Airtel SCM Assistant',
};

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white">
              Airtel SCM Assistant
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ICM &amp; Oracle Fusion Support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/admin"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Admin panel"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 overflow-hidden">
        <ChatWindow />
      </main>
    </div>
  );
}
