# Airtel SCM RAG Chatbot

A production-ready, AI-powered support chatbot for Airtel's Supply Chain Management vertical, covering:
- **Icertis Contract Management (ICM)**
- **Oracle Fusion ERP** (Procurement, Sourcing, Payables, Inventory)

## Features

- **ChatGPT-like UI** with streaming responses
- **Hybrid RAG Pipeline**: Custom FAQ memory → Document retrieval → Fallback
- **Intelligent Agent** using Gemini function calling with 4 specialized tools
- **Admin Panel**: Document management, Q&A CRUD, review queue
- **Feedback Loop**: Thumbs up/down → auto-flags for review
- **Knowledge Ingestion**: PDF, text files, video (Whisper transcription)
- **Completely Free**: Gemini free tier + Supabase free tier + Vercel hobby

---

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd icertis-chatbot
npm install
```

### 2. Set Up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Copy your project URL and API keys from **Settings > API**

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key (free tier: 15 RPM, 1M tokens/day)

### 4. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-key
ADMIN_SECRET_KEY=choose-a-strong-password
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the chat.

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin) (use your `ADMIN_SECRET_KEY`)

---

## Ingesting Documents

### Setup Python Environment

```bash
cd ingestion
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Gemini API key and Supabase credentials
```

### Ingest a PDF

```bash
python ingest_pdf.py --file docs/icm-user-guide.pdf --title "ICM User Guide" --module icm
```

### Ingest a Text File

```bash
python ingest_text.py --file docs/oracle-sop.txt --title "Oracle Procurement SOP" --module oracle
```

### Ingest a Video (Whisper transcription)

```bash
python ingest_video.py --file training/icm-demo.mp4 --title "ICM Training Video" --module icm
# First run downloads Whisper model (~150MB)
```

---

## Adding Custom Q&A (FAQ Memory)

Use the Admin Panel (`/admin/queries`) to add pre-defined answers that bypass RAG:

1. Go to Admin → Custom Q&A
2. Click "Add Q&A"
3. Enter the question and complete answer
4. Select module (ICM / Oracle / General)
5. Add relevant tags
6. Save — the embedding is generated automatically

Custom Q&A matches queries with **≥85% semantic similarity** and returns the stored answer instantly, without calling Gemini.

---

## Architecture

```
User Query
    │
    ▼
┌─────────────────────────────────────────┐
│           Next.js API Route              │
│     POST /api/chat (SSE streaming)       │
└────────────────┬────────────────────────┘
                 │
    ┌────────────▼────────────┐
    │   Gemini Embedding API   │
    │  text-embedding-004      │
    │  task_type=RETRIEVAL_QUERY│
    └────────────┬────────────┘
                 │ 768-dim vector
    ┌────────────▼────────────────────────┐
    │        Supabase pgvector             │
    │                                      │
    │  1. match_custom_queries (≥0.85)     │
    │     → If hit: return stored answer   │
    │                                      │
    │  2. match_document_chunks (≥0.70)    │
    │     → Return top-5 chunks            │
    └────────────┬────────────────────────┘
                 │
    ┌────────────▼────────────┐
    │     Context Builder      │
    │   + Re-ranking           │
    │   + Prompt assembly      │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │    Gemini 1.5 Flash      │
    │  generateContentStream() │
    └────────────┬────────────┘
                 │ SSE stream
    ┌────────────▼────────────┐
    │    Chat UI (Next.js)     │
    │  + Source citations      │
    │  + Feedback buttons      │
    └─────────────────────────┘
```

### Key Thresholds

| Setting | Default | Description |
|---|---|---|
| `CUSTOM_QUERY_THRESHOLD` | 0.85 | Minimum similarity to use FAQ cache |
| `RAG_THRESHOLD` | 0.70 | Minimum similarity for document chunks |
| `RAG_TOP_K` | 5 | Number of chunks to retrieve |

---

## Deployment on Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and import your repository
2. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `ADMIN_SECRET_KEY`
3. Deploy!

The `vercel.json` is already configured. The API routes have `maxDuration: 30` seconds.

---

## Google ADK Reference Implementation

A Python-based reference implementation using Google's Agent Development Kit is in `python-agent/`:

```bash
cd python-agent
pip install -r requirements.txt
cp .env.example .env
# Fill in credentials

# Interactive mode
python main.py --module icm

# Single query
python main.py --query "How to create a contract?" --module icm
```

The ADK agent uses the same 4 tools as the TypeScript implementation:
- `retrieve_documents` — general knowledge search
- `explain_sop` — step-by-step procedure retrieval
- `troubleshoot_issue` — error resolution search
- `navigate_workflow` — process flow guidance

---

## Database Schema

| Table | Purpose |
|---|---|
| `documents` | Source document metadata |
| `document_chunks` | Text chunks with 768-dim embeddings |
| `custom_queries` | FAQ/known issues with query embeddings |
| `chat_sessions` | User session tracking |
| `query_logs` | Full audit trail of all queries |
| `review_queue` | Flagged responses pending admin review |

---

## Sample Use Cases

The chatbot is designed to answer:

1. **"How to create a contract in Icertis?"** → Retrieves ICM SOP
2. **"Why is my PO stuck in approval in Oracle Fusion?"** → Troubleshoots approval workflow
3. **"Steps to onboard a new vendor?"** → Retrieves vendor onboarding process
4. **"Common sourcing errors and fixes"** → Returns troubleshooting guide
5. **"Where to find invoice status?"** → Navigation guide for Oracle Payables

---

## Free Tier Limits

| Service | Free Tier Limit | Impact |
|---|---|---|
| Gemini 1.5 Flash | 15 RPM, 1M tokens/day | Rate limit chat to ~1 msg/4s |
| Gemini text-embedding-004 | 1500 RPD | Ingestion: use delay in scripts |
| Supabase | 500MB DB, 1GB bandwidth | Sufficient for ~100K chunks |
| Vercel Hobby | 100GB bandwidth, 100 functions/day | Sufficient for internal use |

---

## Project Structure

```
icertis-chatbot/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (SSE streaming, CRUD)
│   ├── chat/              # Chat interface
│   └── admin/             # Admin dashboard
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Core libraries (RAG, Gemini, Supabase)
├── types/                 # TypeScript types
├── supabase/              # Database schema and seeds
├── ingestion/             # Python ingestion scripts
└── python-agent/          # Google ADK reference implementation
```

---

## Contributing

1. Add new SOPs/documents via ingestion scripts
2. Improve custom Q&A pairs via admin panel
3. Review and resolve flagged responses in the review queue
4. Monitor query logs for patterns and improve prompts

For issues or improvements, contact the Airtel IT/SCM COE team.
