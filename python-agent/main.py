#!/usr/bin/env python3
"""
Google ADK Agent CLI for Airtel SCM Assistant
Reference implementation - can be run standalone or as a microservice.

Usage:
  python main.py                         # Interactive CLI mode
  python main.py --query "How to create a contract?" --module icm

Setup:
  pip install -r requirements.txt
  cp .env.example .env  # Fill in your credentials
"""

import os
import argparse
from dotenv import load_dotenv

load_dotenv()

from agent.root_agent import create_agent


def interactive_mode(module: str) -> None:
    """Run an interactive chat session."""
    print(f"\nAirtel SCM Assistant (ADK Agent) - Module: {module.upper()}")
    print("Type 'exit' to quit, 'clear' to reset, 'module <name>' to switch module")
    print("-" * 60)

    agent = create_agent(module)

    while True:
        try:
            user_input = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not user_input:
            continue
        if user_input.lower() == "exit":
            break
        if user_input.lower() == "clear":
            agent = create_agent(module)
            print("Session cleared.")
            continue
        if user_input.lower().startswith("module "):
            new_module = user_input.split(" ", 1)[1].strip()
            if new_module in ("icm", "oracle", "general"):
                module = new_module
                agent = create_agent(module)
                print(f"Switched to module: {module.upper()}")
            else:
                print("Unknown module. Use: icm, oracle, general")
            continue

        try:
            print("\nAssistant: ", end="", flush=True)
            response = agent.run(user_input)
            print(response)
        except Exception as e:
            print(f"Error: {e}")


def single_query_mode(query: str, module: str) -> None:
    """Run a single query and print the result."""
    agent = create_agent(module)
    print(f"Query: {query}")
    print(f"Module: {module.upper()}")
    print("-" * 60)

    response = agent.run(query)
    print(f"\nResponse:\n{response}")


def main():
    parser = argparse.ArgumentParser(
        description="Airtel SCM Assistant - Google ADK Agent"
    )
    parser.add_argument(
        "--query",
        help="Single query to answer (omit for interactive mode)",
    )
    parser.add_argument(
        "--module",
        default="general",
        choices=["icm", "oracle", "general"],
        help="Knowledge module to use (default: general)",
    )
    args = parser.parse_args()

    if not os.getenv("GEMINI_API_KEY"):
        print("Error: GEMINI_API_KEY not set. Copy .env.example to .env and fill in your keys.")
        exit(1)

    if args.query:
        single_query_mode(args.query, args.module)
    else:
        interactive_mode(args.module)


if __name__ == "__main__":
    main()
