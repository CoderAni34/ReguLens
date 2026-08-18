from fastapi import FastAPI

from app.api.routes import documents, obligations, tasks, users

app = FastAPI(title="ReguLens API", version="0.1.0")

app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(obligations.router, prefix="/obligations", tags=["obligations"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
