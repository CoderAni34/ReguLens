import os
import shutil
import logging
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.document import DocumentResponse, DocumentAnalysisResponse
from app.schemas.obligation import ObligationCreate
from app.services import (
    document_service,
    obligation_service,
    ai_service,
    task_service,
    evidence_service,
    conflict_service,
)

logger = logging.getLogger(__name__)

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed",
        )

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}",
        )

    try:
        db_document = document_service.create_document(
            db=db,
            filename=file.filename,
            file_path=file_path,
            title=file.filename,
            processing_status="uploaded",
        )
    except Exception as e:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create document record: {str(e)}",
        )

    return db_document


@router.get("", response_model=List[DocumentResponse])
@router.get("/", response_model=List[DocumentResponse], include_in_schema=False)
def list_documents(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum items to return"),
    db: Session = Depends(get_db),
):
    return document_service.get_documents(db=db, skip=skip, limit=limit)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    document = document_service.get_document_by_id(db=db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return document


@router.post("/{document_id}/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document_endpoint(document_id: int, db: Session = Depends(get_db)):
    document = document_service.get_document_by_id(db=db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    document_service.update_processing_status(db=db, document_id=document_id, status="processing")

    # 1. Call AI extraction service
    try:
        ai_response = await ai_service.analyze_document(document_id, file_path=document.file_path)
    except Exception as e:
        document_service.update_processing_status(db=db, document_id=document_id, status="failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}",
        )

    # 2. Update document metadata
    document = document_service.update_document_metadata(
        db=db,
        document_id=document_id,
        title=ai_response.document.title,
        document_type=ai_response.document.document_type,
        language=ai_response.document.language,
        version=ai_response.document.version,
        processing_status="completed",
    )

    # 3. Save extracted obligations
    obligations_to_create = [
        ObligationCreate(
            document_id=document.id,
            title=obs.title,
            description=obs.description,
            responsible_unit=obs.responsible_unit,
            deadline=obs.deadline,
            evidence_required=obs.evidence_required,
            penalty=obs.penalty,
            category=obs.category,
            priority=obs.priority,
            source_text=obs.source_text,
            source_page=obs.source_page,
            confidence=obs.confidence,
        )
        for obs in ai_response.obligations
    ]
    obligations = obligation_service.create_obligations_bulk(db=db, obligations_data=obligations_to_create)

    # 4. Automatically derive Tasks from extracted obligations
    try:
        task_service.derive_tasks_from_obligations(db=db, obligations=obligations)
    except Exception as exc:
        logger.warning(f"Task derivation notice for document {document_id}: {exc}")

    # 5. Automatically derive Evidence requirements from extracted obligations
    try:
        evidence_service.derive_evidence_from_obligations(db=db, obligations=obligations)
    except Exception as exc:
        logger.warning(f"Evidence derivation notice for document {document_id}: {exc}")

    # 6. Run cross-document conflict detection against previously ingested documents
    try:
        await conflict_service.detect_and_save_conflicts(db=db, target_document_id=document.id)
    except Exception as exc:
        logger.warning(f"Cross-document conflict detection notice for document {document_id}: {exc}")

    return {
        "document": document,
        "obligations": obligations,
    }


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document_endpoint(document_id: int, db: Session = Depends(get_db)):
    document = document_service.get_document_by_id(db=db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    if document.file_path and os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except OSError:
            pass
    document_service.delete_document(db=db, document_id=document_id)
    return None
