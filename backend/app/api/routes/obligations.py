from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.models.obligation import Obligation
from app.schemas.obligation import ObligationResponse
from app.core.dependencies import get_db

router = APIRouter()

@router.get("/", response_model=List[ObligationResponse])
def list_obligations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    obligations = db.query(Obligation).offset(skip).limit(limit).all()
    return obligations

@router.get("/{obligation_id}", response_model=ObligationResponse)
def get_obligation(obligation_id: int, db: Session = Depends(get_db)):
    obligation = db.query(Obligation).filter(Obligation.id == obligation_id).first()
    if not obligation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obligation not found")
    return obligation

@router.get("/document/{document_id}", response_model=List[ObligationResponse])
def get_obligations_by_document(document_id: int, db: Session = Depends(get_db)):
    obligations = db.query(Obligation).filter(Obligation.document_id == document_id).all()
    return obligations
