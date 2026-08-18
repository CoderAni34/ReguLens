from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_users() -> dict[str, str]:
    return {"message": "Users endpoint placeholder"}
