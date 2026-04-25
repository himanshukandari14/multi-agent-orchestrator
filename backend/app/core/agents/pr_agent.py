from github import Github
import os
import re
import subprocess
import uuid

from app.core.tools.patch_tool import apply_patch


def _git_origin_url() -> str | None:
    r = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        capture_output=True,
        text=True,
        check=False,
    )
    if r.returncode != 0:
        return None
    return (r.stdout or "").strip()


def _parse_github_owner_repo(remote_url: str) -> tuple[str, str] | None:
    u = remote_url.strip().removesuffix(".git")
    m = re.search(r"(?:github\.com[/:]|@github\.com:)([^/]+)/([^/\s?#]+)", u)
    if not m:
        return None
    return m.group(1), m.group(2)


def _github_repo_full_name(clone_url: str) -> str | None:
    pair = _parse_github_owner_repo(clone_url)
    if not pair:
        return None
    return f"{pair[0]}/{pair[1]}"


def _pull_request_head_candidates(repo_full_name: str, branch: str, github: Github) -> list[str]:
    """
    GitHub returns head=invalid if the branch lives on a fork but we pass an
    unqualified branch name while opening the PR on the upstream repo.
    Try owner:branch when git origin differs from the PR target repo.
    """
    target_owner, target_repo = repo_full_name.split("/", 1)
    origin = _git_origin_url()
    origin_pair = _parse_github_owner_repo(origin) if origin else None

    candidates: list[str] = []
    if origin_pair:
        o_owner, o_repo = origin_pair
        if (o_owner.lower(), o_repo.lower()) != (
            target_owner.lower(),
            target_repo.lower(),
        ):
            candidates.append(f"{o_owner}:{branch}")

    candidates.append(branch)

    try:
        auth = github.get_user().login
        qualified = f"{auth}:{branch}"
        if qualified not in candidates:
            candidates.append(qualified)
    except Exception:
        pass

    # Preserve order, drop duplicates
    seen: set[str] = set()
    out: list[str] = []
    for h in candidates:
        if h not in seen:
            seen.add(h)
            out.append(h)
    return out


def clean_patch(patch: str) -> str:
    if not patch:
        return ""

    lines = patch.splitlines()

    cleaned = []
    for line in lines:
        if line.strip().startswith("```"):
            continue
        if line.startswith("index "):
            continue
        cleaned.append(line)

    for i, line in enumerate(cleaned):
        if line.startswith("diff --git"):
            return "\n".join(cleaned[i:]).strip()

    return ""

def pr_agent(state):
    patch = state.get("patch", "")

    # 🛑 STEP 1: Clean patch properly
    patch = clean_patch(patch)

    # 🛑 STEP 2: Handle NO_CHANGES
    if patch == "NO_CHANGES" or patch == "":
        return {
            "pr_url": None,
            "error": None,
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
            "error": (
                "Git could not apply the generated patch. "
                "The repo on disk may differ from what the model expected (e.g. README or line endings)."
            ),
        }

    # 🔥 STEP 6: GitHub setup (repo from job repo_url; optional GITHUB_REPO fallback)
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        return {"pr_url": None, "error": "GITHUB_TOKEN is not set"}

    repo_slug = _github_repo_full_name((state.get("repo_url") or "").strip())
    if not repo_slug:
        repo_slug = (os.getenv("GITHUB_REPO") or "").strip()
    if not repo_slug:
        return {
            "pr_url": None,
            "error": "Could not parse owner/repo from repo_url; set GITHUB_REPO as fallback",
        }

    github = Github(token)
    repo = github.get_repo(repo_slug)
    base_branch = repo.default_branch

    # Fresh branch per run avoids stale ai-fix-* matching base after merges (422: no commits).
    branch_name = f"ai-agent-{uuid.uuid4().hex[:12]}"

    def _run_git(args, check=True):
        return subprocess.run(
            args,
            capture_output=True,
            text=True,
            check=check,
        )

    try:
        _run_git(["git", "config", "user.name", "PatchPilot[bot]"])
        _run_git(["git", "config", "user.email", "bot@patchpilot.app"])
        _run_git(["git", "checkout", "-B", branch_name])
        _run_git(["git", "add", "-A"])
        commit = _run_git(
            ["git", "commit", "-m", "AI Fix (Auto Generated)\n\nSigned-off-by: PatchPilot <bot@patchpilot.app>"],
            check=False,
        )
        if commit.returncode != 0:
            msg = (commit.stderr or commit.stdout or "").strip() or "nothing to commit"
            raise RuntimeError(f"git commit failed: {msg}")

        push = _run_git(
            ["git", "push", "-u", "origin", branch_name],
            check=False,
        )
        if push.returncode != 0:
            raise RuntimeError(
                f"git push failed: {(push.stderr or push.stdout or '').strip()}"
            )
    except Exception as e:
        print("❌ JOB FAILED:", str(e))
        return {"pr_url": None, "error": str(e)}

    last_err: Exception | None = None
    for head in _pull_request_head_candidates(repo.full_name, branch_name, github):
        try:
            pr = repo.create_pull(
                title="AI Fix (Auto Generated)",
                body="This PR was created automatically by the AI agent.",
                head=head,
                base=base_branch,
            )
            return {"pr_url": pr.html_url, "error": None}
        except Exception as e:
            last_err = e
            continue

    print("❌ JOB FAILED:", str(last_err))
    return {"pr_url": None, "error": str(last_err) if last_err else "create_pull failed"}