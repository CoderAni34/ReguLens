from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.evidence import EvidenceResponse, EvidenceUpdate
from app.services import evidence_service

router = APIRouter()


@router.get("", response_model=List[EvidenceResponse])
@router.get("/", response_model=List[EvidenceResponse], include_in_schema=False)
def list_evidence(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum items to return"),
    evidence_type: Optional[str] = Query(None, description="Filter by type (Document, Policy, Report, All)"),
    status: Optional[str] = Query(None, description="Filter by status (Pending Review, Verified, All)"),
    db: Session = Depends(get_db),
):
    return evidence_service.get_evidence_list(
        db=db, skip=skip, limit=limit, evidence_type=evidence_type, status=status
    )


@router.get("/{evidence_id}", response_model=EvidenceResponse)
def get_evidence(evidence_id: int, db: Session = Depends(get_db)):
    item = evidence_service.get_evidence_by_id(db=db, evidence_id=evidence_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence requirement not found",
        )
    return item


@router.patch("/{evidence_id}", response_model=EvidenceResponse)
@router.put("/{evidence_id}", response_model=EvidenceResponse, include_in_schema=False)
def update_evidence_endpoint(
    evidence_id: int,
    evidence_in: EvidenceUpdate,
    db: Session = Depends(get_db),
):
    update_data = evidence_in.model_dump(exclude_unset=True)
    item = evidence_service.update_evidence(db=db, evidence_id=evidence_id, update_data=update_data)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence requirement not found",
        )
    return item


@router.delete("/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_evidence_endpoint(evidence_id: int, db: Session = Depends(get_db)):
    success = evidence_service.delete_evidence(db=db, evidence_id=evidence_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence requirement not found",
        )
    return None
