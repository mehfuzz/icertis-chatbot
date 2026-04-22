'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { SourceCitations } from './SourceCitations';
import { FeedbackButtons } from './FeedbackButtons';
import { CopyButton } from './CopyButton';
import { TypingIndicator } from './TypingIndicator';
import { Badge } from '@/components/ui/Badge';
import type { Message, FeedbackType } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  onFeedback?: (logId: string, feedback: FeedbackType) => void;
}

const RESPONSE_TYPE_LABELS: Record<string, string> = {
  custom_query: 'FAQ',
  rag: 'RAG',
  agent: 'Agent',
  error: 'Fallback',
};

export function MessageBubble({ message, onFeedback }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-fade-in">
        <div className="flex items-end gap-2 max-w-[80%]">
          <div className="chat-message-user">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4 animate-fade-in">
      <div className="flex items-start gap-2 max-w-[85%]">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mt-1">
          <Bot className="h-4 w-4 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {message.isStreaming && !message.content ? (
            <div className="chat-message-assistant">
              <TypingIndicator />
            </div>
          ) : (
            <div className={clsx(
              'chat-message-assistant',
              message.error && 'border border-red-200 dark:border-red-800'
            )}>
              {message.error && (
                <div className="flex items-center gap-2 mb-2 text-red-500 text-xs">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Error generating response</span>
                </div>
              )}
              <div className="markdown-content text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
              {message.isStreaming && (
                <span className="inline-block w-1 h-4 bg-gray-400 animate-typing ml-0.5" />
              )}
            </div>
          )}

          {/* Sources and actions */}
          {!message.isStreaming && !message.error && (
            <div className="mt-1.5">
              {message.sources && message.sources.length > 0 && (
                <SourceCitations sources={message.sources} />
              )}

              <div className="flex items-center gap-2 mt-1.5 pl-1">
                {message.responseType && RESPONSE_TYPE_LABELS[message.responseType] && (
                  <Badge variant="default" className="text-xs">
                    {RESPONSE_TYPE_LABELS[message.responseType]}
                  </Badge>
                )}

                <div className="ml-auto flex items-center gap-0.5">
                  <CopyButton text={message.content} />
                  {message.logId && onFeedback && (
                    <FeedbackButtons
                      logId={message.logId}
                      feedback={message.feedback}
                      onFeedback={onFeedback}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
