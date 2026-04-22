import { clsx } from 'clsx';
import { MODULE_COLORS, MODULES } from '@/lib/utils/constants';
import type { ModuleType } from '@/lib/supabase/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

export function ModuleBadge({ module }: { module: ModuleType }) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', MODULE_COLORS[module])}>
      {MODULES[module]}
    </span>
  );
}
