import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.document import DocumentResponse, DocumentAnalysisResponse
from app.schemas.obligation import ObligationCreate
from app.services import document_service, obligation_service, ai_service

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

    # Call AI extraction service
    try:
        # Use the real Gemini AI service which takes file_path
        ai_response = await ai_service.analyze_document(document_id, file_path=document.file_path)
    except Exception as e:
        document_service.update_processing_status(db=db, document_id=document_id, status="failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}",
        )

    # Update document metadata
    document = document_service.update_document_metadata(
        db=db,
        document_id=document_id,
        title=ai_response.document.title,
        document_type=ai_response.document.document_type,
        language=ai_response.document.language,
        version=ai_response.document.version,
        processing_status="completed",
    )

    # Save extracted obligations using the new service layer
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

    return {
        "document": document,
        "obligations": obligations,
    }

