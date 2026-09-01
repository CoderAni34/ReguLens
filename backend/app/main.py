import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import documents, obligations, tasks, evidence, conflicts, reports
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
    allow_origins=settings.cors_origins if settings.cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(obligations.router, prefix="/obligations", tags=["obligations"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(evidence.router, prefix="/evidence", tags=["evidence"])
app.include_router(conflicts.router, prefix="/conflicts", tags=["conflicts"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])


@app.get("/health", tags=["general"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
