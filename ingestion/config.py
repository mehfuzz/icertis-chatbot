"""Shared configuration for all ingestion scripts."""

CHUNK_SIZE = 500
CHUNK_OVERLAP = 100
EMBEDDING_DELAY_SECONDS = 0.5  # Rate limit: Gemini free tier ~15 RPM
EMBEDDING_MODEL = "models/text-embedding-004"
WHISPER_MODEL_SIZE = "base"  # Options: tiny, base, small, medium, large

VALID_MODULES = {"icm", "oracle", "general"}
