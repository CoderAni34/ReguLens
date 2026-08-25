import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import documents, obligations
from app.core.config import settings
from app.db.database import engine, Base
import app.db.models  # ensure models are registered on Base.metadata

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables at startup
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.warning(f"Database initialization deferred or skipped: {e}")
    yield


app = FastAPI(
    title="ReguLens API",
    description="Multilingual Regulatory Document Intelligence and Compliance Workflow Engine API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    # allow_origins=settings.cors_origins,
    allow_origins=[
    "https://regu-lens.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(obligations.router, prefix="/obligations", tags=["obligations"])


@app.get("/health", tags=["general"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


