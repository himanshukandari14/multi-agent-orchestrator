from app.tools.repo_tool import get_repo_files_content
from app.tools.llm import get_llm

def code_writer_agent(state):
    llm = get_llm()

    issue = state["issue"]
    plan = state["plan"]
    repo_files = get_repo_files_content()


    response = llm.invoke(
        f"""
        You are a senior software engineer working on a REAL codebase.

        Issue:
        {issue}

        Plan:
        {plan}

        Here are actual files from the repo:
        {repo_files}

        IMPORTANT:
        - ONLY modify existing files
        - Use exact file paths from above
        - DO NOT hallucinate files
        - Generate valid git diff patch

        Output ONLY diff.
        """
    )

    return {
        "patch": response.content
    }