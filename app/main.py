from app.graph.workflow import build_graph

if __name__ == "__main__":
    graph = build_graph()

    result = graph.invoke({
        "issue": "Fix bug: user cannot upload profile image",
        "code_context": None,
        "plan": None,
        "patch": None,
        "tests": None,
        "pr_url": None
    })

    print("\n=== OUTPUT ===\n")
    print(result)