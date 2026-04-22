"""
Google ADK tool functions for the Airtel SCM Agent.
Each function is a tool that the agent can call to retrieve information.
"""

import os
import google.generativeai as genai
from supabase import create_client


def _get_supabase():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def _embed_query(text: str) -> list[float]:
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="retrieval_query",
    )
    return result["embedding"]


def _search_chunks(query: str, module: str | None = None) -> dict:
    """Internal helper: embed query and search Supabase."""
    supabase = _get_supabase()
    embedding = _embed_query(query)

    result = supabase.rpc(
        "match_document_chunks",
        {
            "query_embedding": embedding,
            "match_threshold": 0.70,
            "match_count": 5,
            "filter_module": None if module in (None, "general") else module,
        },
    ).execute()

    if not result.data:
        return {"found": False, "message": "No relevant documents found", "chunks": []}

    chunks = [
        {
            "content": r["content"],
            "source": r["doc_title"],
            "similarity": round(r["similarity"], 3),
        }
        for r in result.data
    ]

    return {"found": True, "chunks": chunks}


def retrieve_documents(query: str, module: str = "general") -> dict:
    """
    Search and retrieve relevant documentation from the knowledge base.

    Args:
        query: The search query to find relevant documents
        module: Filter by system module (icm, oracle, or general)

    Returns:
        Dictionary with found status and list of relevant chunks
    """
    return _search_chunks(query, module)


def explain_sop(topic: str, module: str = "general") -> dict:
    """
    Retrieve step-by-step Standard Operating Procedure (SOP) for a topic.

    Args:
        topic: The SOP topic or process name to explain
        module: The system module (icm, oracle, or general)

    Returns:
        Dictionary with SOP steps from matching documents
    """
    return _search_chunks(
        f"Standard Operating Procedure steps how to: {topic}",
        module,
    )


def troubleshoot_issue(error_description: str, module: str = "general") -> dict:
    """
    Find resolution steps for a described error or issue.

    Args:
        error_description: Description of the error or issue the user is experiencing
        module: The system module where the issue occurs (icm, oracle, or general)

    Returns:
        Dictionary with troubleshooting steps from matching documents
    """
    return _search_chunks(
        f"Error troubleshooting fix resolution: {error_description}",
        module,
    )


def navigate_workflow(workflow_name: str, module: str = "general") -> dict:
    """
    Retrieve workflow navigation steps for a named business process.

    Args:
        workflow_name: The name of the workflow or business process
        module: The system module (icm, oracle, or general)

    Returns:
        Dictionary with workflow steps from matching documents
    """
    return _search_chunks(
        f"Workflow process approval steps navigation: {workflow_name}",
        module,
    )
