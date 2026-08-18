from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_tasks() -> dict[str, str]:
    return {"message": "Tasks endpoint placeholder"}
