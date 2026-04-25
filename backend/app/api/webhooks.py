import os
import json
import traceback
from fastapi import APIRouter, Request
from github import Github
from app.core.agents.review_agent import generate_pr_review

router = APIRouter()

@router.post("/api/webhooks/github")
async def github_webhook(request: Request):
    content_type = request.headers.get("content-type", "")
    print(f"\n🔔 WEBHOOK HIT | Content-Type: {content_type}")

    try:
        if "application/x-www-form-urlencoded" in content_type:
            form = await request.form()
            payload_str = form.get("payload")
            payload = json.loads(payload_str) if payload_str else {}
        else:
            payload = await request.json()
    except Exception as e:
        print(f"❌ PAYLOAD PARSE ERROR: {e}")
        return {"msg": "Invalid payload format"}

    print(f"📦 Payload keys: {list(payload.keys())}")

    # Only process pull requests
    if "pull_request" not in payload:
        print("⏭️  Skipping: no 'pull_request' key in payload")
        return {"msg": "Not a pull request event"}

    action = payload.get("action")
    print(f"🎬 Action: {action}")
    if action not in ["opened", "synchronize"]:
        print(f"⏭️  Skipping action: {action}")
        return {"msg": f"Ignoring action: {action}"}

    repo_name = payload["repository"]["full_name"]
    pr_number = payload["pull_request"]["number"]
    title = payload["pull_request"]["title"]
    body = payload["pull_request"]["body"] or ""
    pr_author = payload["pull_request"]["user"]["login"]
    print(f"📋 PR #{pr_number} on {repo_name} by {pr_author}: {title}")

    # Simple check to prevent infinite loops if PatchPilot opens a PR
    if pr_author == "PatchPilot[bot]":
        print("⏭️  Skipping: PR author is PatchPilot[bot]")
        return {"msg": "Ignoring PRs created by PatchPilot to avoid feedback loops"}

    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("❌ GITHUB_TOKEN is not set!")
        return {"error": "GITHUB_TOKEN not set"}

    try:
        github = Github(token)
        repo = github.get_repo(repo_name)
        pr = repo.get_pull(pr_number)
        head_sha = payload["pull_request"]["head"]["sha"]
        print(f"✅ Fetched PR #{pr_number} from GitHub API (sha={head_sha[:8]})")

        # Set commit status to PENDING so it shows in the Checks section
        commit = repo.get_commit(head_sha)
        commit.create_status(
            state="pending",
            description="Review in progress",
            context="PatchPilot",
            target_url="",
        )
        print("⏳ Commit status set to PENDING")

        # Post a "loading" comment immediately
        logo_url = f"https://raw.githubusercontent.com/{repo_name}/master/client/public/logo.svg"
        loading_body = (
            f"<div align=\"center\">\n\n"
            f"<img src=\"{logo_url}\" width=\"42\" alt=\"PatchPilot\" />\n\n"
            f"### 🤖 PatchPilot Auto-Review\n\n"
            f"⏳ **Review in progress** — analyzing {pr.changed_files} changed file(s)…\n\n"
            f"</div>"
        )
        loading_comment = pr.create_issue_comment(loading_body)
        print(f"⏳ Loading comment posted (id={loading_comment.id})")

        diff = ""
        file_count = 0
        for file in pr.get_files():
            if file.patch:
                diff += f"File: {file.filename}\nPatch:\n{file.patch}\n\n"
                file_count += 1
        print(f"📝 Found {file_count} files with diffs ({len(diff)} chars)")

        if not diff.strip():
            loading_comment.edit(
                f"<div align=\"center\">\n\n"
                f"<img src=\"{logo_url}\" width=\"42\" alt=\"PatchPilot\" />\n\n"
                f"### 🤖 PatchPilot Auto-Review\n\n"
                f"No code changes detected in this PR.\n\n"
                f"</div>"
            )
            commit.create_status(
                state="success",
                description="No changes to review",
                context="PatchPilot",
            )
            print("⏭️  Skipping: no diff found")
            return {"msg": "No diff found to review"}

        # Generate review
        print("🤖 Generating AI review...")
        review_comment = generate_pr_review(diff, title, body)
        print(f"✅ Review generated ({len(review_comment)} chars)")

        # Edit the loading comment with the full review
        final_body = (
            f"<div align=\"center\">\n\n"
            f"<img src=\"{logo_url}\" width=\"42\" alt=\"PatchPilot\" />\n\n"
            f"### 🤖 PatchPilot Auto-Review\n\n"
            f"</div>\n\n"
            f"---\n\n"
            f"{review_comment}\n\n"
            f"---\n"
            f"<sub>🔍 Reviewed by <b>PatchPilot</b> — AI-powered code review</sub>"
        )
        loading_comment.edit(final_body)

        # Set commit status to SUCCESS
        commit.create_status(
            state="success",
            description="Review complete — no critical issues",
            context="PatchPilot",
        )
        print(f"✅ Review posted & status set to SUCCESS on PR #{pr_number}!")

        return {"msg": "Review posted successfully"}

    except Exception as e:
        print(f"❌ ERROR: {e}")
        traceback.print_exc()
        # Try to mark the check as failed so it's visible
        try:
            commit = repo.get_commit(payload["pull_request"]["head"]["sha"])
            commit.create_status(
                state="error",
                description="Review failed",
                context="PatchPilot",
            )
        except Exception:
            pass
        return {"error": str(e)}
