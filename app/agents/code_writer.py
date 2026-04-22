from app.tools.llm import get_llm

def code_writer_agent(state):
    llm = get_llm()

    issue = state["issue"]
    plan = state["plan"]


    response = llm.invoke(
        f"""
        You are a senior software engineer.

        Given this issue:
        {issue}

        And this plan:
        {plan}

        Write the actual code fix.

        - Provide code snippets
        - Mention file names
        - Keep it practical
        """
    )

    return {
        "patch": response.content
    }