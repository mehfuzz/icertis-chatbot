"""Shared configuration for all ingestion scripts."""

CHUNK_SIZE = 500
CHUNK_OVERLAP = 100
EMBEDDING_DELAY_SECONDS = 0.5  # Rate limit: Gemini free tier ~15 RPM
# Must match the JS server model (text-embedding-004 is v1-only; embedding-001 works on both)
EMBEDDING_MODEL = "models/embedding-001"
WHISPER_MODEL_SIZE = "base"  # Options: tiny, base, small, medium, large

VALID_MODULES = {"icm", "oracle", "general"}
