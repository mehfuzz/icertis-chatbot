-- ============================================================
-- Airtel SCM RAG Chatbot - Supabase Schema
-- Run this in Supabase SQL Editor (once)
-- ============================================================

create extension if not exists vector;

-- ============================================================
-- ENUM TYPES
-- ============================================================
create type document_type as enum ('pdf', 'text', 'video');
create type module_type as enum ('icm', 'oracle', 'general');
create type response_type as enum ('custom_query', 'rag', 'agent', 'error');
create type feedback_type as enum ('positive', 'negative');
create type review_status as enum ('pending', 'resolved', 'dismissed');

-- ============================================================
-- TABLE: documents
-- ============================================================
create table documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  file_name   text not null,
  file_type   document_type not null,
  module      module_type not null default 'general',
  file_url    text,
  file_size   bigint,
  chunk_count integer default 0,
  status      text default 'processing',
  metadata    jsonb default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- TABLE: document_chunks
-- ============================================================
create table document_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  content     text not null,
  chunk_index integer not null,
  embedding   vector(768),
  module      module_type not null default 'general',
  metadata    jsonb default '{}',
  token_count integer,
  created_at  timestamptz default now()
);

-- HNSW index works on empty tables and has better recall than IVFFlat
create index document_chunks_embedding_idx
  on document_chunks using hnsw (embedding vector_cosine_ops);
create index document_chunks_document_id_idx on document_chunks(document_id);
create index document_chunks_module_idx on document_chunks(module);

-- ============================================================
-- TABLE: custom_queries
-- ============================================================
create table custom_queries (
  id              uuid primary key default gen_random_uuid(),
  query_text      text not null,
  answer_text     text not null,
  query_embedding vector(768),
  module          module_type not null default 'general',
  tags            text[] default '{}',
  is_active       boolean default true,
  hit_count       integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index custom_queries_embedding_idx
  on custom_queries using hnsw (query_embedding vector_cosine_ops);

-- ============================================================
-- TABLE: chat_sessions
-- ============================================================
create table chat_sessions (
  id            uuid primary key default gen_random_uuid(),
  session_token text unique not null,
  title         text,
  module        module_type default 'general',
  message_count integer default 0,
  created_at    timestamptz default now(),
  last_active   timestamptz default now()
);

create index chat_sessions_token_idx on chat_sessions(session_token);

-- ============================================================
-- TABLE: query_logs
-- ============================================================
create table query_logs (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references chat_sessions(id) on delete set null,
  query_text    text not null,
  response_text text,
  response_type response_type not null,
  sources       jsonb default '[]',
  feedback      feedback_type,
  feedback_note text,
  latency_ms    integer,
  tool_calls    jsonb default '[]',
  error_message text,
  created_at    timestamptz default now()
);

create index query_logs_session_idx on query_logs(session_id);
create index query_logs_created_at_idx on query_logs(created_at desc);
create index query_logs_response_type_idx on query_logs(response_type);

-- ============================================================
-- TABLE: review_queue
-- ============================================================
create table review_queue (
  id              uuid primary key default gen_random_uuid(),
  log_id          uuid references query_logs(id) on delete cascade,
  query_text      text not null,
  response_text   text,
  reason          text,
  status          review_status default 'pending',
  resolution_note text,
  resolved_by     text,
  created_at      timestamptz default now(),
  resolved_at     timestamptz
);

create index review_queue_status_idx on review_queue(status);
create index review_queue_created_at_idx on review_queue(created_at desc);

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

create or replace function match_custom_queries(
  query_embedding vector(768),
  match_threshold float,
  match_count     int,
  filter_module   module_type default null
)
returns table (
  id          uuid,
  query_text  text,
  answer_text text,
  module      module_type,
  tags        text[],
  similarity  float,
  hit_count   integer
)
language sql stable
as $$
  select
    cq.id,
    cq.query_text,
    cq.answer_text,
    cq.module,
    cq.tags,
    1 - (cq.query_embedding <=> query_embedding) as similarity,
    cq.hit_count
  from custom_queries cq
  where
    cq.is_active = true
    and (filter_module is null or cq.module = filter_module)
    and 1 - (cq.query_embedding <=> query_embedding) > match_threshold
  order by cq.query_embedding <=> query_embedding
  limit match_count;
$$;

create or replace function match_document_chunks(
  query_embedding vector(768),
  match_threshold float,
  match_count     int,
  filter_module   module_type default null
)
returns table (
  id          uuid,
  document_id uuid,
  content     text,
  chunk_index int,
  module      module_type,
  metadata    jsonb,
  similarity  float,
  doc_title   text,
  doc_type    document_type
)
language sql stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    dc.module,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.title as doc_title,
    d.file_type as doc_type
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where
    d.status = 'ready'
    and (filter_module is null or dc.module = filter_module)
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at();

create trigger custom_queries_updated_at
  before update on custom_queries
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- All server-side API routes use SUPABASE_SERVICE_ROLE_KEY
-- which bypasses RLS. Chat frontend uses anon key with RLS.
-- ============================================================
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table custom_queries enable row level security;
alter table chat_sessions enable row level security;
alter table query_logs enable row level security;
alter table review_queue enable row level security;

-- Service role has full access (used by API routes)
create policy "service_role_all" on documents for all to service_role using (true) with check (true);
create policy "service_role_all" on document_chunks for all to service_role using (true) with check (true);
create policy "service_role_all" on custom_queries for all to service_role using (true) with check (true);
create policy "service_role_all" on chat_sessions for all to service_role using (true) with check (true);
create policy "service_role_all" on query_logs for all to service_role using (true) with check (true);
create policy "service_role_all" on review_queue for all to service_role using (true) with check (true);

-- Anon can read documents list and custom queries (for chat UI)
create policy "anon_read_documents" on documents for select to anon using (status = 'ready');
create policy "anon_read_custom_queries" on custom_queries for select to anon using (is_active = true);
