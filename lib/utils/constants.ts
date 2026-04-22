export const MODULES = {
  icm: 'Icertis Contract Management',
  oracle: 'Oracle Fusion ERP',
  general: 'General SCM',
} as const;

export const MODULE_COLORS = {
  icm: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  oracle: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  general: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
} as const;

export const CUSTOM_QUERY_THRESHOLD = parseFloat(
  process.env.CUSTOM_QUERY_THRESHOLD ?? '0.85'
);

export const RAG_THRESHOLD = parseFloat(
  process.env.RAG_THRESHOLD ?? '0.70'
);

export const RAG_TOP_K = parseInt(
  process.env.RAG_TOP_K ?? '5',
  10
);

export const MAX_CONTEXT_TOKENS = 3000;
export const AGENT_MAX_ITERATIONS = 5;

export const DOCUMENT_TYPES = ['pdf', 'text', 'video'] as const;

export const COMMON_TAGS = [
  'approval',
  'vendor-onboarding',
  'invoice',
  'purchase-order',
  'contract',
  'sourcing',
  'troubleshooting',
  'sop',
  'workflow',
  'configuration',
];
