'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, FileVideo, File } from 'lucide-react';
import { clsx } from 'clsx';
import type { Source } from '@/types/chat';

interface SourceCitationsProps {
  sources: Source[];
}

function SourceIcon({ type }: { type: string }) {
  if (type === 'video') return <FileVideo className="h-3.5 w-3.5 flex-shrink-0" />;
  if (type === 'pdf') return <FileText className="h-3.5 w-3.5 flex-shrink-0" />;
  return <File className="h-3.5 w-3.5 flex-shrink-0" />;
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="font-medium">
          {sources.length} source{sources.length !== 1 ? 's' : ''} referenced
        </span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {expanded && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {sources.map((source, i) => (
            <div key={i} className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 mb-1">
                <SourceIcon type={source.docType} />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  {source.docTitle}
                </span>
                <span className={clsx(
                  'ml-auto text-xs px-1.5 py-0.5 rounded',
                  source.similarity >= 0.85
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : source.similarity >= 0.75
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                )}>
                  {(source.similarity * 100).toFixed(0)}% match
                </span>
              </div>
              {source.excerpt && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 pl-5">
                  {source.excerpt}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
