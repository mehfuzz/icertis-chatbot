#!/usr/bin/env python3
"""
Video Ingestion Script (Whisper-based transcript extraction)
Usage: python ingest_video.py --file path/to/video.mp4 --title "Training Video" --module icm

Transcribes audio using OpenAI Whisper (local), chunks transcript, generates embeddings,
and stores in Supabase.

Requirements: pip install openai-whisper
Note: First run downloads the Whisper model (~150MB for 'base').
"""

import os
import argparse
from pathlib import Path

import whisper

from embedder import embed_batch
from chunker import chunk_text
from utils import get_supabase, insert_document, insert_chunks, mark_document_ready, mark_document_failed
from config import VALID_MODULES, WHISPER_MODEL_SIZE


def transcribe_video(file_path: str, model_size: str = WHISPER_MODEL_SIZE) -> tuple[str, list[dict]]:
    """
    Transcribe video/audio using Whisper.
    Returns (full_transcript, segments_with_timestamps).
    """
    print(f"Loading Whisper model ({model_size})...")
    model = whisper.load_model(model_size)

    print("Transcribing... (this may take a few minutes)")
    result = model.transcribe(file_path)

    # Build timestamped transcript
    segments = result.get("segments", [])
    timestamped_text = ""
    for segment in segments:
        start_secs = int(segment["start"])
        mins, secs = divmod(start_secs, 60)
        timestamp = f"{mins:02d}:{secs:02d}"
        timestamped_text += f"[{timestamp}] {segment['text'].strip()}\n"

    full_transcript = timestamped_text if timestamped_text else result.get("text", "")
    return full_transcript, segments


def ingest_video(
    file_path: str,
    title: str,
    module: str,
    document_id: str | None = None,
) -> None:
    """Full ingestion pipeline for a video file."""
    print(f"Ingesting video: {file_path}")

    supabase = get_supabase()
    file_name = Path(file_path).name
    file_size = os.path.getsize(file_path)

    if document_id is None:
        document_id = insert_document(supabase, {
            "title": title,
            "file_name": file_name,
            "file_type": "video",
            "module": module,
            "file_size": file_size,
            "status": "processing",
        })
        print(f"Created document record: {document_id}")

    try:
        # Transcribe
        transcript, segments = transcribe_video(file_path)

        if not transcript.strip():
            raise ValueError("No speech detected in video")

        print(f"Transcribed {len(segments)} segments, {len(transcript)} characters")

        # Chunk the transcript
        metadata = {
            "source_file": file_name,
            "module": module,
            "doc_type": "video",
            "total_segments": len(segments),
        }
        chunks = chunk_text(transcript, metadata)
        print(f"Created {len(chunks)} chunks")

        # Generate embeddings
        print("Generating embeddings...")
        embeddings = embed_batch([c["content"] for c in chunks])

        # Store
        print("Storing in Supabase...")
        insert_chunks(supabase, document_id, chunks, embeddings, module)
        mark_document_ready(supabase, document_id, len(chunks))

        print(f"Successfully ingested '{title}': {len(chunks)} chunks stored")

        # Save transcript to file for reference
        transcript_path = Path(file_path).with_suffix(".transcript.txt")
        with open(transcript_path, "w", encoding="utf-8") as f:
            f.write(f"Transcript: {title}\n")
            f.write("=" * 60 + "\n\n")
            f.write(transcript)
        print(f"Transcript saved to: {transcript_path}")

    except Exception as e:
        print(f"ERROR: {e}")
        mark_document_failed(supabase, document_id, str(e))
        raise


def main():
    parser = argparse.ArgumentParser(description="Ingest video transcript into RAG knowledge base")
    parser.add_argument("--file", required=True, help="Path to video file (MP4, MOV, AVI, etc.)")
    parser.add_argument("--title", required=True, help="Document title")
    parser.add_argument("--module", default="general", choices=list(VALID_MODULES))
    parser.add_argument("--model", default=WHISPER_MODEL_SIZE,
                        choices=["tiny", "base", "small", "medium", "large"],
                        help="Whisper model size (larger = more accurate but slower)")
    parser.add_argument("--doc-id", help="Existing document ID (optional)")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"Error: File not found: {args.file}")
        exit(1)

    ingest_video(args.file, args.title, args.module, args.doc_id)


if __name__ == "__main__":
    main()
