from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_obligations() -> dict[str, str]:
    return {"message": "Obligations endpoint placeholder"}
