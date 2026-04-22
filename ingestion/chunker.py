"""Text chunking using LangChain's RecursiveCharacterTextSplitter."""

from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import CHUNK_SIZE, CHUNK_OVERLAP


def get_chunker() -> RecursiveCharacterTextSplitter:
    return RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
        length_function=len,
    )


def chunk_text(text: str, metadata: dict) -> list[dict]:
    """Split text into chunks with metadata attached."""
    chunker = get_chunker()
    texts = chunker.split_text(text)

    return [
        {
            "content": t.strip(),
            "chunk_index": i,
            "metadata": metadata,
        }
        for i, t in enumerate(texts)
        if t.strip()
    ]
