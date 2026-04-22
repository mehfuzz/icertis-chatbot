'use client';

import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getOrCreateSessionId } from '@/lib/utils/session';
import type { Message, ModuleType, Source } from '@/types/chat';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [module, setModule] = useState<ModuleType>('general');
  const [useAgent, setUseAgent] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const sessionId = getOrCreateSessionId();
      const userMsgId = uuidv4();
      const assistantMsgId = uuidv4();

      // Add user message
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', content, timestamp: new Date() },
      ]);

      // Add empty assistant placeholder
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true,
        },
      ]);

      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const endpoint = useAgent ? '/api/agent' : '/api/chat';

      try {
        // Ensure session exists
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken: sessionId, module }),
        });

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content, sessionId, module }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error('Network response was not ok');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'text') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + (data.content ?? '') }
                      : m
                  )
                );
              } else if (data.type === 'sources') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, sources: (data.sources as Source[]) ?? [] }
                      : m
                  )
                );
              } else if (data.type === 'done') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          isStreaming: false,
                          logId: data.logId,
                          responseType: data.responseType,
                        }
                      : m
                  )
                );
              } else if (data.type === 'error') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: data.error ?? 'An error occurred',
                          isStreaming: false,
                          error: true,
                        }
                      : m
                  )
                );
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: 'Failed to get a response. Please check your connection and try again.',
                    isStreaming: false,
                    error: true,
                  }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, isStreaming: false } : m
          )
        );
      }
    },
    [isStreaming, module, useAgent]
  );

  const submitFeedback = useCallback(
    async (logId: string, feedback: 'positive' | 'negative') => {
      setMessages((prev) =>
        prev.map((m) => (m.logId === logId ? { ...m, feedback } : m))
      );

      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, feedback }),
      });
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    messages,
    isStreaming,
    module,
    setModule,
    useAgent,
    setUseAgent,
    sendMessage,
    submitFeedback,
    clearMessages,
    stopStreaming,
  };
}
