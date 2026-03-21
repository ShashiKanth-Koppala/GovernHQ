import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request

from fastapi.responses import JSONResponse

from agents.router import router as agents_router, _AuthError
from core.auth import AuthError
from gate.router import router as gate_router
from govern.router import router as govern_router

app = FastAPI(title="GovernHQ Backend")

app.include_router(agents_router)
app.include_router(gate_router)
app.include_router(govern_router)


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
    return {
        "data": {"ok": True, "service": "governhq-backend"},
        "error": None,
        "status": 200,
    }
