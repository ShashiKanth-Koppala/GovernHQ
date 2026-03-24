import os
from typing import Any

from fastapi import Header
from supabase import Client, create_client


class AuthError(Exception):
    def __init__(self, detail: str, status: int = 401):
        self.detail = detail
        self.status = status
        super().__init__(detail)


_db: Client | None = None


def get_db() -> Client:
    global _db
    if _db is None:
        _db = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _db


def get_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise AuthError("Missing Authorization header", 401)

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise AuthError("Missing Bearer token", 401)

    return token.strip()


def resolve_user_and_org(authorization: str | None) -> dict[str, Any]:
    token = get_bearer_token(authorization)
    db = get_db()

    try:
        user_resp = db.auth.get_user(token)
    except Exception:
        raise AuthError("Invalid or expired token", 401)

    if not getattr(user_resp, "user", None) or not getattr(user_resp.user, "id", None):
        raise AuthError("User not found for token", 401)

    user_id = user_resp.user.id

    org_resp = (
        db.table("organizations")
        .select("id, owner_id")
        .eq("owner_id", user_id)
        .limit(1)
        .execute()
    )

    org_rows = org_resp.data or []
    if not org_rows:
        raise AuthError("No organization found for user", 403)

    org = org_rows[0]

    return {
        "user_id": user_id,
        "organization_id": org["id"],
        "role": "owner",
    }
    
def auth_context(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    return resolve_user_and_org(authorization)
