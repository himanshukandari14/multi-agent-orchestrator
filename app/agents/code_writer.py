from app.tools.repo_tool import get_repo_files_content
from app.tools.llm import get_llm

def code_writer_agent(state):
    llm = get_llm()

    issue = state["issue"]
    plan = state["plan"]
    repo_files = get_repo_files_content()


    response = llm.invoke(
    f"""
You are a senior software engineer.

Your task is to MODIFY CODE FILES (not prompts, not system files).

Issue:
{issue}

Plan:
{plan}

Repo files:
{repo_files}

CRITICAL RULES:
- Only modify actual application files (like main.py, routes, UI files)
- NEVER modify:
  - app/agents/*
  - app/tools/*
  - prompt strings
- If task says "add comment", it means:
  → Add a Python comment (# ...) inside a code file

OUTPUT RULES:
- Output ONLY raw git diff
- No explanation
- No markdown
- Must start with: diff --git

If no valid file found → output: NO_CHANGES
"""
)

    return {
        "patch": response.content
    }