#!/usr/bin/env python3
"""
Text File Ingestion Script
Usage: python ingest_text.py --file path/to/doc.txt --title "Doc Title" --module oracle

Reads a plain text file, chunks it, generates Gemini embeddings, and stores in Supabase.
"""

import os
import argparse
from pathlib import Path

from embedder import embed_batch
from chunker import chunk_text
from utils import get_supabase, insert_document, insert_chunks, mark_document_ready, mark_document_failed
from config import VALID_MODULES


def ingest_text(
    file_path: str,
    title: str,
    module: str,
    document_id: str | None = None,
) -> None:
    """Full ingestion pipeline for a plain text file."""
    print(f"Ingesting text file: {file_path}")

    supabase = get_supabase()
    file_name = Path(file_path).name
    file_size = os.path.getsize(file_path)

    if document_id is None:
        document_id = insert_document(supabase, {
            "title": title,
            "file_name": file_name,
            "file_type": "text",
            "module": module,
            "file_size": file_size,
            "status": "processing",
        })
        print(f"Created document record: {document_id}")

    try:
        # Read file with encoding detection
        for encoding in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
            try:
                with open(file_path, "r", encoding=encoding) as f:
                    text = f.read()
                break
            except UnicodeDecodeError:
                continue
        else:
            raise ValueError("Could not decode file with any supported encoding")

        if not text.strip():
            raise ValueError("File is empty")

        print(f"Read {len(text)} characters")

        # Chunk
        metadata = {
            "source_file": file_name,
            "module": module,
            "doc_type": "text",
        }
        chunks = chunk_text(text, metadata)
        print(f"Created {len(chunks)} chunks")

        # Embed
        print("Generating embeddings...")
        embeddings = embed_batch([c["content"] for c in chunks])

        # Store
        print("Storing in Supabase...")
        insert_chunks(supabase, document_id, chunks, embeddings, module)
        mark_document_ready(supabase, document_id, len(chunks))

        print(f"Successfully ingested '{title}': {len(chunks)} chunks stored")

    except Exception as e:
        print(f"ERROR: {e}")
        mark_document_failed(supabase, document_id, str(e))
        raise


def main():
    parser = argparse.ArgumentParser(description="Ingest text file into RAG knowledge base")
    parser.add_argument("--file", required=True, help="Path to text file")
    parser.add_argument("--title", required=True, help="Document title")
    parser.add_argument("--module", default="general", choices=list(VALID_MODULES))
    parser.add_argument("--doc-id", help="Existing document ID (optional)")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"Error: File not found: {args.file}")
        exit(1)

    ingest_text(args.file, args.title, args.module, args.doc_id)


if __name__ == "__main__":
    main()
