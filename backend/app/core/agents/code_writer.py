from app.core.tools.repo_tool import get_repo_structure, get_repo_files_content
from app.core.tools.llm import get_llm


def code_writer_agent(state):
    llm = get_llm()

    issue = state["issue"]
    plan = state["plan"]

    # ✅ ALWAYS compute fresh inside function
    structure = get_repo_structure()
    files = get_repo_files_content()

    response = llm.invoke(f"""
You are a senior software engineer.

Your job is to APPLY REAL CODE CHANGES.

Issue:
{issue}

Plan:
{plan}

Repository structure:
{structure}

Relevant file content:
{files}

CRITICAL RULES:
- You can modify ANY relevant file (including README.md)
- DO NOT modify:
  - app/agents/*
  - app/tools/*
  - .venv
  - node_modules

IMPORTANT:
- README.md EXISTS in this repository
- You MUST modify existing file if present
- NEVER create README.md using /dev/null

OUTPUT RULES:
- Output ONLY valid git unified diff
- MUST start with: diff --git
- MUST include line numbers like: @@ -X,Y +X,Y @@
- MUST include at least 1 context line
- DO NOT explain anything
- DO NOT return markdown

If the issue clearly requires a change → YOU MUST generate the diff

Only return EXACTLY: NO_CHANGES if no modification is needed
""")

    return {
        "patch": response.content.strip()
    }