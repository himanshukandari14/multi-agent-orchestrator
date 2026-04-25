"""
API routes for managing auto-review settings per repository.
Handles enabling/disabling auto-review and automatically
installs/removes GitHub webhooks via the GitHub API.
"""
import os
from urllib.parse import quote

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator

from app.core.auth import get_current_user
from app.core.config import get_settings
from app.queue.redis import redis_conn

router = APIRouter(prefix="/review", tags=["review"])

REDIS_KEY = "autoreview:repos"  # Redis set of repo full_names with auto-review on


class ToggleRequest(BaseModel):
    repo_full_name: str
    enabled: bool

    @field_validator("repo_full_name")
    @classmethod
    def strip_full_name(cls, v: str) -> str:
        v = (v or "").strip()
        if not v or v.count("/") != 1:
            raise ValueError("repo_full_name must look like owner/repo")
        a, b = v.split("/", 1)
        if not a or not b:
            raise ValueError("repo_full_name must look like owner/repo")
        return v


def _repos_path_segments(full_name: str) -> str:
    """Build api.github.com/repos/… path (percent-encode each segment for odd names)."""
    owner, name = full_name.split("/", 1)
    return f"{quote(owner, safe='')}/{quote(name, safe='')}"


def _gh_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _webhook_credential_tokens(user: dict) -> list[str]:
    """
    Webhook REST calls: prefer the user's login token, then an optional server PAT.

    GitHub *App* user tokens (OAuth to a GitHub App) are limited by the app's
    permissions, not by `write:repo_hook` in the authorize URL — that commonly
    yields 403 "Resource not accessible by integration". A classic PAT in
    GITHUB_TOKEN with `repo` + `admin:repo_hook` can install hooks as a
    fallback for the same account.
    """
    out: list[str] = []
    for raw in (user.get("github_token"), os.getenv("GITHUB_TOKEN")):
        t = (raw or "").strip()
        if t and t not in out:
            out.append(t)
    if not out:
        raise HTTPException(
            status_code=401,
            detail="No GitHub credential: sign in, or set GITHUB_TOKEN for the API server.",
        )
    return out


def _webhook_url() -> str:
    """Build the public webhook URL from app settings."""
    base = get_settings().app_public_url.rstrip("/")
    return f"{base}/api/webhooks/github"


def _which_credential(user: dict, token: str) -> str:
    u = (user.get("github_token") or "").strip()
    e = (os.getenv("GITHUB_TOKEN") or "").strip()
    if u and token == u:
        return "oauth"
    if e and token == e:
        return "env_pat"
    return "unknown"


async def _find_patchpilot_webhook(
    tokens: list[str], repo_full_name: str
) -> tuple[int | None, str | None]:
    """Return (hook_id, token that can see that hook) for our webhook URL, or (None, None)."""
    path = _repos_path_segments(repo_full_name)
    wh_url = _webhook_url()
    for token in tokens:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"https://api.github.com/repos/{path}/hooks",
                headers=_gh_headers(token),
            )
        if res.status_code != 200:
            continue
        for hook in res.json():
            if hook.get("config", {}).get("url", "") == wh_url:
                return int(hook["id"]), token
    return None, None


async def _install_webhook(user: dict, repo_full_name: str) -> dict:
    """Install a PatchPilot webhook; try each credential (OAuth, then GITHUB_TOKEN)."""
    tokens = _webhook_credential_tokens(user)
    wh_url = _webhook_url()
    existing_id, _ = await _find_patchpilot_webhook(tokens, repo_full_name)
    if existing_id is not None:
        print(f"⚡ Webhook already exists on {repo_full_name} (id={existing_id})")
        return {"status": "already_exists", "hook_id": existing_id}

    path = _repos_path_segments(repo_full_name)
    payload = {
        "name": "web",
        "active": True,
        "events": ["pull_request"],
        "config": {
            "url": wh_url,
            "content_type": "json",
            "insecure_ssl": "0",
        },
    }
    last_detail = ""
    for token in tokens:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"https://api.github.com/repos/{path}/hooks",
                headers=_gh_headers(token),
                json=payload,
            )
        if res.status_code in (201, 200):
            hook_id = res.json().get("id")
            src = _which_credential(user, token)
            print(
                f"✅ Webhook installed on {repo_full_name} (id={hook_id}, credential={src})"
            )
            return {
                "status": "created",
                "hook_id": hook_id,
                "credential": src,
            }
        last_detail = res.text
        if res.status_code == 404:
            print(f"❌ Failed to install webhook: 404 {res.text}")
            return {"status": "error", "detail": res.text}
        if res.status_code == 403:
            print(
                f"⚡ Webhook install 403 for credential={_which_credential(user, token)} — trying next if any"
            )
            continue
        print(f"❌ Failed to install webhook: {res.status_code} {res.text}")
        return {"status": "error", "detail": res.text}

    print(f"❌ Failed to install webhook: 403 (all credentials) {last_detail}")
    return {
        "status": "error",
        "detail": last_detail,
        "hint": (
            "GitHub App login: add “Repository webhooks: Read and write” on your GitHub App, "
            "or set GITHUB_TOKEN to a classic personal access token with the repo and admin:repo_hook "
            "scopes (same user as the repo owner)."
        ),
    }


async def _remove_webhook(user: dict, repo_full_name: str) -> dict:
    """Remove the PatchPilot webhook using whichever credential can see the hook."""
    tokens = _webhook_credential_tokens(user)
    existing_id, token = await _find_patchpilot_webhook(tokens, repo_full_name)
    if existing_id is None or token is None:
        print(f"⚡ No webhook found on {repo_full_name} to remove")
        return {"status": "not_found"}

    path = _repos_path_segments(repo_full_name)
    async with httpx.AsyncClient() as client:
        res = await client.delete(
            f"https://api.github.com/repos/{path}/hooks/{existing_id}",
            headers=_gh_headers(token),
        )
    if res.status_code == 204:
        print(f"✅ Webhook removed from {repo_full_name}")
        return {"status": "removed", "credential": _which_credential(user, token)}
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
    repo = body.repo_full_name

    if body.enabled:
        # Install webhook and track in Redis
        result = await _install_webhook(user, repo)
        if result["status"] in ("created", "already_exists"):
            redis_conn.sadd(REDIS_KEY, repo)
            return {"enabled": True, "repo": repo, "webhook": result}
        return {
            "enabled": False,
            "repo": repo,
            "error": result.get("detail"),
            "hint": result.get("hint"),
        }
    # Remove webhook and untrack from Redis
    result = await _remove_webhook(user, repo)
    redis_conn.srem(REDIS_KEY, repo)
    return {"enabled": False, "repo": repo, "webhook": result}

