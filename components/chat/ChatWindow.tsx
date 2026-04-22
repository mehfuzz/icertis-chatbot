'use client';

import { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { useChat } from '@/hooks/useChat';

const WELCOME_SUGGESTIONS = [
  'How to create a contract in Icertis?',
  'Why is my PO stuck in approval in Oracle Fusion?',
  'Steps to onboard a new vendor?',
  'Common sourcing errors and fixes',
  'Where to find invoice status?',
];

export function ChatWindow() {
  const {
    messages,
    isStreaming,
    module,
    setModule,
    useAgent,
    setUseAgent,
    sendMessage,
    submitFeedback,
    stopStreaming,
  } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Airtel SCM Assistant
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Get instant answers about Icertis Contract Management and Oracle Fusion ERP.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full">
              {WELCOME_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onFeedback={submitFeedback}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <MessageInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        module={module}
        onModuleChange={setModule}
        useAgent={useAgent}
        onAgentToggle={setUseAgent}
      />
    </div>
  );
}
