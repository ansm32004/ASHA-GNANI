from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from contextlib import asynccontextmanager

from app.config import settings
from app.core.logging import logger
from app.core.exceptions import SahayikaException
from app.integrations.firebase.firebase_admin import firebase_manager
from app.workers.reminder_worker import reminder_worker
from app.workers.sync_worker import sync_worker

# API Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.households import router as households_router
from app.api.v1.visits import router as visits_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.requests import router as requests_router
from app.api.v1.claims import router as claims_router
from app.api.v1.sos import router as sos_router
from app.api.v1.ai import router as ai_router
from app.api.v1.notifications import router as notifications_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing SAHAYIKA Backend...")
    firebase_manager.initialize()
    from app.repositories.user_repository import user_repository
    user_repository._ensure_initialized()
    asyncio.create_task(reminder_worker.start(interval_seconds=3600))
    asyncio.create_task(sync_worker.start(interval_seconds=300))
    yield
    # Shutdown
    logger.info("Shutting down SAHAYIKA Backend...")
    reminder_worker.stop()
    sync_worker.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Operational Productivity & Voice-First Healthcare Platform for ASHA Community Workers",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS Configuration
# Standard W3C CORS forbids allow_credentials=True with wildcard allow_origins=["*"].
# In production, explicit origins are required. In development, explicit origins + LAN regex are supported.
if settings.ENVIRONMENT == "production":
    allowed_origins = [o.strip() for o in settings.CORS_ORIGINS if o.strip() and o != "*"]
    origin_regex = None
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:8081",
        "http://10.0.2.2:3000",
        "http://10.0.2.2:3001",
    ]
    for origin in settings.CORS_ORIGINS:
        if origin != "*" and origin not in allowed_origins:
            allowed_origins.append(origin)
    origin_regex = r"^https?://(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

from starlette.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Exception handlers
@app.exception_handler(SahayikaException)
async def sahayika_exception_handler(request: Request, exc: SahayikaException):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "An unexpected server error occurred.", "error": str(exc)}
    )

# Register API v1 Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(households_router, prefix=api_v1_prefix)
app.include_router(visits_router, prefix=api_v1_prefix)
app.include_router(tasks_router, prefix=api_v1_prefix)
app.include_router(requests_router, prefix=api_v1_prefix)
app.include_router(claims_router, prefix=api_v1_prefix)
app.include_router(sos_router, prefix=api_v1_prefix)
app.include_router(ai_router, prefix=api_v1_prefix)
app.include_router(notifications_router, prefix=api_v1_prefix)

@app.get("/", tags=["Health"])
def root():
    return {
        "app": "SAHAYIKA - ASHA Digital Companion API",
        "version": settings.VERSION,
        "status": "online",
        "demo_mode": settings.DEMO_MODE,
        "docs_url": f"{settings.API_V1_STR}/docs",
        "philosophy": "Spend less time managing records. Spend more time supporting people."
    }

@app.get("/health", tags=["Health"])
def health_check():
    connected = firebase_manager.is_connected
    storage_mode = "firestore" if connected else "memory"
    demo_mode_active = settings.DEMO_MODE if connected else True
    return {
        "status": "healthy",
        "firebase_connected": connected,
        "storage_mode": storage_mode,
        "demo_mode": demo_mode_active
    }

