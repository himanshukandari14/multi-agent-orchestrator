from app.graph.workflow import build_graph

if __name__ == "__main__":
    graph = build_graph()

    # himanshu is pro
    result = graph.invoke({
        "issue": "Fix bug: write a comment - himanshu is pro",
        "code_context": None,
        "plan": None,
        "patch": None,
        "tests": None,
        "pr_url": None
    })

    print("\n=== OUTPUT ===\n")
    print(result)

    with open("output_patch.txt", "w") as f:
        f.write(result["patch"] or "")
    
    with open("output_tests.txt", "w") as f:
        f.write(result["tests"] or "")