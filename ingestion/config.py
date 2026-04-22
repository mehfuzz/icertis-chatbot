"""Shared configuration for all ingestion scripts."""

CHUNK_SIZE = 500
CHUNK_OVERLAP = 100
EMBEDDING_DELAY_SECONDS = 0.5  # Rate limit: Gemini free tier ~15 RPM
EMBEDDING_MODEL = "models/gemini-embedding-001"
EMBEDDING_OUTPUT_DIM = 768  # must match supabase schema vector(768)
WHISPER_MODEL_SIZE = "base"  # Options: tiny, base, small, medium, large

VALID_MODULES = {"icm", "oracle", "general"}
