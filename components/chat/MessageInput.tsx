'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { Send, Square, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import type { ModuleType } from '@/types/chat';
import { MODULES } from '@/lib/utils/constants';

interface MessageInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  module: ModuleType;
  onModuleChange: (m: ModuleType) => void;
  useAgent: boolean;
  onAgentToggle: (v: boolean) => void;
  disabled?: boolean;
}

const MODULE_OPTIONS: Array<{ value: ModuleType; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'icm', label: 'ICM' },
  { value: 'oracle', label: 'Oracle' },
];

export function MessageInput({
  onSend,
  onStop,
  isStreaming,
  module,
  onModuleChange,
  useAgent,
  onAgentToggle,
  disabled,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    if (!text.trim() || isStreaming) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      {/* Module selector */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">Module:</span>
        <div className="flex gap-1">
          {MODULE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onModuleChange(opt.value)}
              className={clsx(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                module === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onAgentToggle(!useAgent)}
          className={clsx(
            'ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
            useAgent
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
          title={useAgent ? 'Agent mode active (multi-tool reasoning)' : 'Switch to agent mode'}
        >
          <Zap className="h-3 w-3" />
          {useAgent ? 'Agent' : 'RAG'}
        </button>
      </div>

      {/* Text input */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={`Ask about ${MODULES[module]}...`}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-white disabled:opacity-50"
            style={{ minHeight: '48px', maxHeight: '160px' }}
          />
        </div>

        {isStreaming ? (
          <Button
            variant="danger"
            size="md"
            onClick={onStop}
            className="rounded-xl px-3 py-3 flex-shrink-0"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={handleSend}
            disabled={!text.trim() || disabled}
            className="rounded-xl px-3 py-3 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center">
        Press Enter to send · Shift+Enter for new line · {useAgent ? 'Agent uses multi-step reasoning' : 'RAG uses document retrieval'}
      </p>
    </div>
  );
}
