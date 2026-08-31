import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.db.models.user import User
from app.schemas.document import DocumentResponse, DocumentAnalysisResponse
from app.schemas.obligation import ObligationCreate
from app.services import document_service, obligation_service, ai_service
from app.services.ai_service import AIQuotaExceededException, AIProviderException
from app.services.pdf_validator import validate_upload_file

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Multi-layer PDF Validation (Extension, Signature/Magic Bytes, File-Size, PyMuPDF parser, non-empty check)
    content_bytes, page_count = await validate_upload_file(file)

    # 2. Safe server-side storage filename (preserves user Unicode filename for metadata/display)
    safe_storage_name = f"{uuid.uuid4().hex}.pdf"
    file_path = os.path.join(UPLOAD_DIR, safe_storage_name)

    try:
        with open(file_path, "wb") as buffer:
            buffer.write(content_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file to storage: {str(e)}",
        )

    # 3. Create document record bound strictly to authenticated current_user.id
    original_title = os.path.splitext(file.filename)[0].replace("_", " ")
    try:
        db_document = document_service.create_document(
            db=db,
            user_id=current_user.id,
            filename=file.filename,
            file_path=file_path,
            title=original_title,
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return document_service.get_documents(db=db, user_id=current_user.id, skip=skip, limit=limit)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = document_service.get_document_by_id(db=db, document_id=document_id, user_id=current_user.id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return document


@router.post("/{document_id}/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document_endpoint(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = document_service.get_document_by_id(db=db, document_id=document_id, user_id=current_user.id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    document_service.update_processing_status(db=db, document_id=document_id, status="processing", user_id=current_user.id)

    # Call AI extraction service
    try:
        ai_response = await ai_service.analyze_document(
            document_id,
            file_path=document.file_path,
            doc_title=document.title,
        )
    except AIQuotaExceededException as qe:
        document_service.update_processing_status(db=db, document_id=document_id, status="failed", user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI analysis quota is temporarily exhausted. Please try again later.",
        )
    except Exception as e:
        document_service.update_processing_status(db=db, document_id=document_id, status="failed", user_id=current_user.id)
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
        user_id=current_user.id,
    )

    # Save extracted obligations
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


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document_endpoint(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = document_service.get_document_by_id(db=db, document_id=document_id, user_id=current_user.id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    # Remove file from disk if it exists
    if document.file_path and os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except OSError:
            pass
    document_service.delete_document(db=db, document_id=document_id, user_id=current_user.id)
    return None
