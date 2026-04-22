from github import Github
import subprocess
import os
from app.tools.patch_tool import apply_patch


def clean_patch(patch: str) -> str:
    if not patch:
        return ""

    lines = patch.splitlines()

    cleaned = []
    for line in lines:
        # ❌ remove markdown
        if line.strip().startswith("```"):
            continue

        # ❌ remove index lines (CAUSE OF ERROR)
        if line.startswith("index "):
            continue

        cleaned.append(line)

    # 🔥 find actual diff start
    for i, line in enumerate(cleaned):
        if line.startswith("diff --git"):
            return "\n".join(cleaned[i:]).strip()

    return ""
    if not patch:
        return ""

    lines = patch.splitlines()

    # ❌ remove markdown fences
    lines = [line for line in lines if not line.strip().startswith("```")]

    # 🔥 find actual diff start
    for i, line in enumerate(lines):
        if line.startswith("diff --git"):
            return "\n".join(lines[i:]).strip()

    return ""


def pr_agent(state):
    patch = state.get("patch", "")

    # 🛑 STEP 1: Clean patch properly
    patch = clean_patch(patch)

    # 🛑 STEP 2: Handle NO_CHANGES
    if patch == "NO_CHANGES" or patch == "":
        return {
            "pr_url": None,
            "message": "No valid changes required"
        }

    # 🛑 STEP 3: Validate format
    if not patch.startswith("diff --git"):
        return {
            "pr_url": None,
            "error": "Invalid patch format"
        }

    # 🛑 STEP 4: Block dangerous edits
    if any(x in patch for x in [
        "app/agents",
        "app/tools",
        ".venv",
        "site-packages",
        "node_modules"
    ]):
        return {
            "pr_url": None,
            "error": "AI tried to modify restricted files"
        }

    # 🛑 DEBUG (VERY IMPORTANT)
    print("\n=== FINAL CLEAN PATCH ===\n")
    print(patch)
    print("\n=========================\n")

    # 🛑 STEP 5: Apply patch
    success = apply_patch(patch)

    if not success:
        return {
            "pr_url": None,
            "error": "Patch_failed"
        }

    # 🔥 STEP 6: GitHub setup
    github = Github(os.getenv("GITHUB_TOKEN"))
    repo = github.get_repo(os.getenv("GITHUB_REPO"))

    branch_name = "ai-fix-real"

    # 🔁 create branch if not exists
    try:
        repo.create_git_ref(
            ref=f"refs/heads/{branch_name}",
            sha=repo.get_branch("main").commit.sha
        )
    except Exception:
        pass

    # 🛑 STEP 7: Commit local changes
    subprocess.run(["git", "checkout", "-B", branch_name])
    subprocess.run(["git", "add", "."])
    subprocess.run(["git", "commit", "-m", "AI Patch Applied"], check=False)
    subprocess.run(["git", "push", "-u", "origin", branch_name], check=False)

    # 🚀 STEP 8: Create PR
    pr = repo.create_pull(
        title="AI Fix (Auto Generated)",
        body="This PR was created automatically by the AI agent.",
        head=branch_name,
        base=repo.default_branch
    )

    return {
        "pr_url": pr.html_url
    }