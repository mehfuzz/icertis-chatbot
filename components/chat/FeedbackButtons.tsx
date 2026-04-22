'use client';

import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import type { FeedbackType } from '@/types/chat';

interface FeedbackButtonsProps {
  logId: string;
  feedback?: FeedbackType;
  onFeedback: (logId: string, feedback: FeedbackType) => void;
}

export function FeedbackButtons({ logId, feedback, onFeedback }: FeedbackButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFeedback(logId, 'positive')}
        title="Helpful"
        className={clsx('p-1.5', feedback === 'positive' && 'text-green-500 bg-green-50 dark:bg-green-900/20')}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFeedback(logId, 'negative')}
        title="Not helpful"
        className={clsx('p-1.5', feedback === 'negative' && 'text-red-500 bg-red-50 dark:bg-red-900/20')}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
