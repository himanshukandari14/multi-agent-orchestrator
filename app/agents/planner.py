from app.tools.llm import get_llm

def planner_agent(state):
    llm = get_llm()

    issue = state["issue"]
    context = state["code_context"]

    response = llm.invoke(
      f"""
        You are a senior software architect.

        Based on this GitHub issue:
        {issue}

        And this analysis:
        {context}

        Create a clear step-by-step plan to fix the issue.

        Output format:
        1. Step 1
        2. Step 2
        3. Step 3

        Keep it practical and actionable.
        """
    )

    return {
        "plan": response.content
    }