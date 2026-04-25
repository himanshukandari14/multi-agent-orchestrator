"""
API routes for managing auto-review settings per repository.
Handles enabling/disabling auto-review and automatically
installs/removes GitHub webhooks via the GitHub API.
"""
import os
import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.config import get_settings
from app.queue.redis import redis_conn

router = APIRouter(prefix="/review", tags=["review"])

REDIS_KEY = "autoreview:repos"  # Redis set of repo full_names with auto-review on


class ToggleRequest(BaseModel):
    repo_full_name: str
    enabled: bool


def _get_admin_token() -> str:
    """Get the server-side PAT that has full repo + webhook permissions."""
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise RuntimeError("GITHUB_TOKEN is not set")
    return token


def _webhook_url() -> str:
    """Build the public webhook URL from app settings."""
    base = get_settings().app_public_url.rstrip("/")
    return f"{base}/api/webhooks/github"


async def _find_existing_webhook(token: str, repo_full_name: str) -> int | None:
    """Find an existing PatchPilot webhook on a repo, return its ID or None."""
    webhook_url = _webhook_url()
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://api.github.com/repos/{repo_full_name}/hooks",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
            },
        )
    if res.status_code != 200:
        return None
    for hook in res.json():
        config = hook.get("config", {})
        if config.get("url", "") == webhook_url:
            return hook["id"]
    return None


async def _install_webhook(token: str, repo_full_name: str) -> dict:
    """Install a PatchPilot webhook on a GitHub repo."""
    webhook_url = _webhook_url()

    # Check if webhook already exists
    existing_id = await _find_existing_webhook(token, repo_full_name)
    if existing_id:
        print(f"⚡ Webhook already exists on {repo_full_name} (id={existing_id})")
        return {"status": "already_exists", "hook_id": existing_id}

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"https://api.github.com/repos/{repo_full_name}/hooks",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
            },
            json={
                "name": "web",
                "active": True,
                "events": ["pull_request"],
                "config": {
                    "url": webhook_url,
                    "content_type": "json",
                    "insecure_ssl": "0",
                },
            },
        )
    if res.status_code in (201, 200):
        hook_id = res.json().get("id")
        print(f"✅ Webhook installed on {repo_full_name} (id={hook_id})")
        return {"status": "created", "hook_id": hook_id}
    else:
        print(f"❌ Failed to install webhook: {res.status_code} {res.text}")
        return {"status": "error", "detail": res.text}


async def _remove_webhook(token: str, repo_full_name: str) -> dict:
    """Remove the PatchPilot webhook from a GitHub repo."""
    existing_id = await _find_existing_webhook(token, repo_full_name)
    if not existing_id:
        print(f"⚡ No webhook found on {repo_full_name} to remove")
        return {"status": "not_found"}

    async with httpx.AsyncClient() as client:
        res = await client.delete(
            f"https://api.github.com/repos/{repo_full_name}/hooks/{existing_id}",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
            },
        )
    if res.status_code == 204:
        print(f"✅ Webhook removed from {repo_full_name}")
        return {"status": "removed"}
    else:
        print(f"❌ Failed to remove webhook: {res.status_code} {res.text}")
        return {"status": "error", "detail": res.text}


@router.get("/autoreview/repos")
async def get_autoreview_repos(user=Depends(get_current_user)):
    """Return a list of repo full_names that have auto-review enabled."""
    members = redis_conn.smembers(REDIS_KEY)
    return {"repos": list(members)}


@router.post("/autoreview/toggle")
async def toggle_autoreview(body: ToggleRequest, user=Depends(get_current_user)):
    """Enable or disable auto-review for a specific repo."""
    token = _get_admin_token()
    repo = body.repo_full_name

    if body.enabled:
        # Install webhook and track in Redis
        result = await _install_webhook(token, repo)
        if result["status"] in ("created", "already_exists"):
            redis_conn.sadd(REDIS_KEY, repo)
            return {"enabled": True, "repo": repo, "webhook": result}
        else:
            return {"enabled": False, "repo": repo, "error": result.get("detail")}
    else:
        # Remove webhook and untrack from Redis
        result = await _remove_webhook(token, repo)
        redis_conn.srem(REDIS_KEY, repo)
        return {"enabled": False, "repo": repo, "webhook": result}

