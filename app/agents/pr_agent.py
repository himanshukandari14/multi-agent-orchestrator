import subprocess
from app.tools.patch_tool import apply_patch
import os


def update_file(repo, path, new_content, branch):
    contents = repo.get_contents(path, ref=branch)

    repo.update_file(
        path=path,
        message="AI Fix Applied",
        content=new_content,
        sha=contents.sha,
        branch=branch
    )

def pr_agent(state):
    patch = state["patch"]
    
    if "No changes needed" in patch or patch.strip() == "":
        return {
        "pr_url": None,
        "message": "No valid changes required for this issue"
        }

    success = apply_patch(patch)

    if not success:
        return {
            "pr_url": None,
            "error": "Patch_failed"
        }
    github = Github(os.getenv("GITHUB_TOKEN"))
    repo = github.get_repo(os.getenv("GITHUB_REPO"))

    branch_name = "ai-fix-real"

    try:
        repo.create_git_ref(
            ref = f"refs/heads/{branch_name}",
            sha=repo.get_branch("main").commit.sha
        )
    except:
        pass  #branch may already exist

    # commit local changes
    subprocess.run(["git", "add", "."])
    subprocess.run(["git", "commit", "-m", "AI Patch Applied"])
    subprocess.run(["git", "push", "origin", branch_name])

    pr = repo.create_pull(
        title="AI Fix (Diff Applied)",
        body="Generated via AI system",
        head=branch_name,
        base="main"
    )

    return {
        "pr_url": pr.html_url
    }


