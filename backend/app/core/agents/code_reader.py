from app.core.tools.llm import get_llm

def code_reader_agent(state):
    llm = get_llm()

    issue = state["issue"]

    response = llm.invoke(
        f"""
        You are a senior software engineer.

        Given this GitHub issue:
        {issue}

        Your job:
        - Identify what kind of problem this is
        - Which parts of codebase are likely involved
        - What should be investigated

        Keep it clear and structured.
        """
    )

    return {
        "code_context": response.content
    }