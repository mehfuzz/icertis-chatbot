"""Google Gemini embedding wrapper with rate limiting."""

import os
import time
import google.generativeai as genai
from dotenv import load_dotenv
from tqdm import tqdm
from config import EMBEDDING_MODEL, EMBEDDING_DELAY_SECONDS, EMBEDDING_OUTPUT_DIM

load_dotenv()

genai.configure(api_key=os.environ["GEMINI_API_KEY"])


def embed_document(text: str) -> list[float]:
    """Embed text stored in the knowledge base (retrieval_document task)."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_document",
        output_dimensionality=EMBEDDING_OUTPUT_DIM,
    )
    return result["embedding"]


def embed_query(text: str) -> list[float]:
    """Embed a search query (retrieval_query task)."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_query",
        output_dimensionality=EMBEDDING_OUTPUT_DIM,
    )
    return result["embedding"]


def embed_batch(
    texts: list[str],
    task_type: str = "retrieval_document",
    delay: float = EMBEDDING_DELAY_SECONDS,
) -> list[list[float]]:
    """
    Embed a list of texts with rate limiting.
    Uses delay to stay within Gemini free tier limits (~15 RPM).
    """
    embeddings = []
    for text in tqdm(texts, desc="Embedding"):
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type=task_type,
            output_dimensionality=EMBEDDING_OUTPUT_DIM,
        )
        embeddings.append(result["embedding"])
        if delay > 0:
            time.sleep(delay)

    return embeddings
