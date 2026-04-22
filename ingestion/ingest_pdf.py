#!/usr/bin/env python3
"""
PDF Ingestion Script
Usage: python ingest_pdf.py --file path/to/doc.pdf --title "Doc Title" --module icm

Extracts text from PDF, chunks it, generates Gemini embeddings, and stores in Supabase.
"""

import os
import argparse
import pdfplumber
from pathlib import Path

from embedder import embed_batch
from chunker import chunk_text
from utils import get_supabase, insert_document, insert_chunks, mark_document_ready, mark_document_failed
from config import VALID_MODULES


def extract_pdf_text(file_path: str) -> str:
    """Extract all text from a PDF, preserving page structure."""
    full_text = ""
    with pdfplumber.open(file_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if text:
                full_text += f"\n[Page {page_num}]\n{text.strip()}\n"
    return full_text.strip()


def ingest_pdf(
    file_path: str,
    title: str,
    module: str,
    document_id: str | None = None,
) -> None:
    """Full ingestion pipeline for a PDF file."""
    print(f"Ingesting PDF: {file_path}")

    supabase = get_supabase()
    file_name = Path(file_path).name
    file_size = os.path.getsize(file_path)

    # Create or reuse document record
    if document_id is None:
        document_id = insert_document(supabase, {
            "title": title,
            "file_name": file_name,
            "file_type": "pdf",
            "module": module,
            "file_size": file_size,
            "status": "processing",
        })
        print(f"Created document record: {document_id}")
    else:
        print(f"Using existing document record: {document_id}")

    try:
        # Extract text
        print("Extracting text from PDF...")
        text = extract_pdf_text(file_path)

        if not text:
            raise ValueError("No text could be extracted from the PDF")

        print(f"Extracted {len(text)} characters")

        # Chunk text
        metadata = {
            "source_file": file_name,
            "module": module,
            "doc_type": "pdf",
        }
        chunks = chunk_text(text, metadata)
        print(f"Created {len(chunks)} chunks")

        # Generate embeddings
        print("Generating embeddings...")
        embeddings = embed_batch([c["content"] for c in chunks])

        # Store in Supabase
        print("Storing in Supabase...")
        insert_chunks(supabase, document_id, chunks, embeddings, module)
        mark_document_ready(supabase, document_id, len(chunks))

        print(f"Successfully ingested '{title}': {len(chunks)} chunks stored")

    except Exception as e:
        print(f"ERROR: {e}")
        mark_document_failed(supabase, document_id, str(e))
        raise


def main():
    parser = argparse.ArgumentParser(description="Ingest PDF into RAG knowledge base")
    parser.add_argument("--file", required=True, help="Path to PDF file")
    parser.add_argument("--title", required=True, help="Document title")
    parser.add_argument("--module", default="general", choices=list(VALID_MODULES), help="Knowledge module")
    parser.add_argument("--doc-id", help="Existing document ID to update (optional)")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"Error: File not found: {args.file}")
        exit(1)

    ingest_pdf(args.file, args.title, args.module, args.doc_id)


if __name__ == "__main__":
    main()
