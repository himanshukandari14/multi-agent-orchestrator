from functools import lru_cache

from app.core.config import get_settings
from dodopayments import DodoPayments


@lru_cache
def get_dodo_client() -> DodoPayments:
    s = get_settings()
    if not s.dodo_payments_api_key:
        raise RuntimeError("DODO_PAYMENTS_API_KEY is not configured")
    env: str = s.dodo_environment
    if env not in ("test_mode", "live_mode"):
        env = "test_mode"
    return DodoPayments(
        bearer_token=s.dodo_payments_api_key,
        webhook_key=s.dodo_webhook_key,
        environment=env,  # type: ignore[arg-type]
    )
