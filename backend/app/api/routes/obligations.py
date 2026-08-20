from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.obligation import ObligationResponse
from app.services import obligation_service, document_service

router = APIRouter()


@router.get("", response_model=List[ObligationResponse])
@router.get("/", response_model=List[ObligationResponse], include_in_schema=False)
def list_obligations(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum items to return"),
    db: Session = Depends(get_db),
):
    return obligation_service.get_obligations(db=db, skip=skip, limit=limit)



@router.get("/{obligation_id}", response_model=ObligationResponse)
def get_obligation(obligation_id: int, db: Session = Depends(get_db)):
    obligation = obligation_service.get_obligation_by_id(db=db, obligation_id=obligation_id)
    if not obligation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Obligation not found",
        )
    return obligation


@router.get("/document/{document_id}", response_model=List[ObligationResponse])
def get_obligations_by_document(document_id: int, db: Session = Depends(get_db)):
    document = document_service.get_document_by_id(db=db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return obligation_service.get_obligations_by_document_id(db=db, document_id=document_id)

