"""
Google ADK root agent for Airtel SCM Assistant.
This is the reference Python implementation using Google's Agent Development Kit.
"""

import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Import ADK Agent
try:
    from google.adk.agents import Agent
    ADK_AVAILABLE = True
except ImportError:
    ADK_AVAILABLE = False
    print("Warning: google-adk not installed. Using fallback Gemini function calling.")

from .tools import retrieve_documents, explain_sop, troubleshoot_issue, navigate_workflow
from .prompts import PROMPTS


def create_agent(module: str = "general"):
    """Create an ADK agent for the given module."""
    system_prompt = PROMPTS.get(module, PROMPTS["general"])

    if ADK_AVAILABLE:
        return Agent(
            model="gemini-1.5-flash",
            name="airtel_scm_agent",
            description="Intelligent assistant for Airtel SCM systems (Icertis and Oracle Fusion)",
            instruction=system_prompt,
            tools=[retrieve_documents, explain_sop, troubleshoot_issue, navigate_workflow],
        )
    else:
        # Fallback: use Gemini with manual function calling
        return _create_fallback_agent(system_prompt)


def _create_fallback_agent(system_prompt: str):
    """Fallback implementation using raw Gemini function calling."""
    from google.generativeai.types import FunctionDeclaration, Tool
    import inspect

    tools_funcs = [retrieve_documents, explain_sop, troubleshoot_issue, navigate_workflow]

    class FallbackAgent:
        def __init__(self):
            self.model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_prompt,
                tools=[{
                    "function_declarations": [
                        {
                            "name": fn.__name__,
                            "description": fn.__doc__ or "",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    k: {"type": "string", "description": f"Parameter {k}"}
                                    for k in inspect.signature(fn).parameters
                                },
                                "required": [
                                    k for k, v in inspect.signature(fn).parameters.items()
                                    if v.default == inspect.Parameter.empty
                                ],
                            },
                        }
                        for fn in tools_funcs
                    ]
                }],
            )

        def run(self, query: str) -> str:
            chat = self.model.start_chat()
            tools_map = {fn.__name__: fn for fn in tools_funcs}

            result = chat.send_message(query)
            max_iter = 5

            for _ in range(max_iter):
                calls = [
                    p.function_call
                    for p in result.candidates[0].content.parts
                    if hasattr(p, "function_call") and p.function_call
                ]

                if not calls:
                    return result.text

                responses = []
                for call in calls:
                    fn = tools_map.get(call.name)
                    if fn:
                        tool_result = fn(**dict(call.args))
                        responses.append({
                            "function_response": {
                                "name": call.name,
                                "response": {"content": str(tool_result)},
                            }
                        })

                result = chat.send_message(responses)

            return result.text

    return FallbackAgent()
