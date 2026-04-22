from app.tools.llm import get_llm

def test_writer(state):
    llm = get_llm()

    issue = state["issue"]
    patch = state["patch"]

    response = llm.invoke(
        f"""
        You are a senior QA engineer.

        Given this issue:
        {issue}

        And this code fix:
        {patch}

        Write test cases to verify this fix.

        Include:
        - Unit tests
        - Edge cases
        - Failure scenarios

        Keep it practical.
        """
    )

    return {
        "tests": response.content
    }