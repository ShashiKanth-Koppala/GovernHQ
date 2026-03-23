from fastapi import FastAPI, HTTPException, Request
from starlette.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.agents.router import router as agents_router, _AuthError
from backend.core.auth import AuthError
from backend.gate.router import router as gate_router
from backend.monitoring.router import router as monitoring_router
from backend.settings.router import router as settings_router
from backend.webhooks.router import router as webhooks_router
from backend.shield.router import router as shield_router

app = FastAPI(title="GovernHQ Backend")
# Dev-only: permissive CORS so the frontend and test clients can reach the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents_router)
app.include_router(gate_router)
app.include_router(monitoring_router)
app.include_router(settings_router)
app.include_router(webhooks_router)
app.include_router(shield_router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        {"data": None, "error": str(exc.detail), "status": exc.status_code},
        status_code=exc.status_code,
    )


@app.exception_handler(_AuthError)
async def legacy_auth_error_handler(request: Request, exc: _AuthError):
    return JSONResponse(
        {"data": None, "error": exc.detail, "status": exc.status},
        status_code=exc.status,
    )


@app.exception_handler(AuthError)
async def auth_error_handler(request: Request, exc: AuthError):
    return JSONResponse(
        {"data": None, "error": exc.detail, "status": exc.status},
        status_code=exc.status,
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
