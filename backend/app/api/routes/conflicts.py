from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.conflict import ConflictResponse, ConflictUpdate
from app.services import conflict_service, document_service

router = APIRouter()


@router.get("", response_model=List[ConflictResponse])
@router.get("/", response_model=List[ConflictResponse], include_in_schema=False)
def list_conflicts(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum items to return"),
    severity: Optional[str] = Query(None, description="Filter by severity (High, Medium, Low, All)"),
    status: Optional[str] = Query(None, description="Filter by status (Unresolved, Resolved, All)"),
    db: Session = Depends(get_db),
):
    return conflict_service.get_conflicts(
        db=db, skip=skip, limit=limit, severity=severity, status=status
    )


@router.get("/{conflict_id}", response_model=ConflictResponse)
def get_conflict(conflict_id: int, db: Session = Depends(get_db)):
    conflict = conflict_service.get_conflict_by_id(db=db, conflict_id=conflict_id)
    if not conflict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conflict not found",
        )
    return conflict


@router.patch("/{conflict_id}", response_model=ConflictResponse)
@router.put("/{conflict_id}", response_model=ConflictResponse, include_in_schema=False)
def update_conflict_endpoint(
    conflict_id: int,
    conflict_in: ConflictUpdate,
    db: Session = Depends(get_db),
):
    update_data = conflict_in.model_dump(exclude_unset=True)
    conflict = conflict_service.update_conflict(db=db, conflict_id=conflict_id, update_data=update_data)
    if not conflict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conflict not found",
        )
    return conflict


@router.post("/detect", response_model=List[ConflictResponse])
async def trigger_conflict_detection(
    document_id: Optional[int] = Query(None, description="Optional document ID to compare across library"),
    db: Session = Depends(get_db),
):
    if document_id:
        doc = document_service.get_document_by_id(db=db, document_id=document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document ID #{document_id} not found",
            )
        return await conflict_service.detect_and_save_conflicts(db=db, target_document_id=document_id)
    else:
        # Run detection across all completed documents
        docs = document_service.get_documents(db=db)
        completed_docs = [d for d in docs if d.processing_status == "completed"]
        all_new_conflicts = []
        for d in completed_docs:
            new_conflicts = await conflict_service.detect_and_save_conflicts(db=db, target_document_id=d.id)
            all_new_conflicts.extend(new_conflicts)
        return conflict_service.get_conflicts(db=db)
