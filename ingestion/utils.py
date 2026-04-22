"""Shared utilities: Supabase client and DB helpers."""

import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


def get_supabase() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def insert_document(supabase: Client, data: dict) -> str:
    """Insert a document record and return its UUID."""
    result = (
        supabase.table("documents")
        .insert(data)
        .execute()
    )
    return result.data[0]["id"]


def insert_chunks(
    supabase: Client,
    document_id: str,
    chunks: list[dict],
    embeddings: list[list[float]],
    module: str,
) -> None:
    """Batch-insert chunks with their embeddings."""
    rows = []
    for chunk, embedding in zip(chunks, embeddings):
        rows.append({
            "document_id": document_id,
            "content": chunk["content"],
            "chunk_index": chunk["chunk_index"],
            "embedding": embedding,
            "module": module,
            "metadata": chunk.get("metadata", {}),
            "token_count": len(chunk["content"].split()),
        })

    # Insert in batches of 50 to avoid request size limits
    batch_size = 50
    for i in range(0, len(rows), batch_size):
        supabase.table("document_chunks").insert(rows[i : i + batch_size]).execute()

    print(f"Inserted {len(rows)} chunks for document {document_id}")


def mark_document_ready(supabase: Client, document_id: str, chunk_count: int) -> None:
    supabase.table("documents").update(
        {"status": "ready", "chunk_count": chunk_count}
    ).eq("id", document_id).execute()


def mark_document_failed(supabase: Client, document_id: str, error: str) -> None:
    supabase.table("documents").update(
        {"status": "failed", "metadata": {"error": error}}
    ).eq("id", document_id).execute()
