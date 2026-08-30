import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models.document import Document
from app.db.models.obligation import Obligation
from app.schemas.document import DocumentResponse
from app.core.dependencies import get_db
from app.services.ai_service import analyze_document

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db_document = Document(
        title=file.filename,
        filename=file.filename,
        file_path=file_path,
        processing_status="uploaded"
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    return db_document


@router.get("/", response_model=List[DocumentResponse])
def list_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    documents = db.query(Document).offset(skip).limit(limit).all()
    return documents


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


@router.post("/{document_id}/analyze")
async def analyze_document_endpoint(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    document.processing_status = "processing"
    db.commit()

    # Call the AI service
    try:
        ai_response = await analyze_document(document_id, file_path=document.file_path)
    except Exception as e:
        document.processing_status = "failed"
        db.commit()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    # Update document info
    document.title = ai_response.document.title
    document.document_type = ai_response.document.document_type
    document.language = ai_response.document.language
    document.version = ai_response.document.version
    document.processing_status = "completed"

    # Save obligations
    for obs_data in ai_response.obligations:
        db_obligation = Obligation(
            document_id=document.id,
            title=obs_data.title,
            description=obs_data.description,
            responsible_unit=obs_data.responsible_unit,
            deadline=obs_data.deadline,
            evidence_required=obs_data.evidence_required,
            penalty=obs_data.penalty,
            category=obs_data.category,
            priority=obs_data.priority,
            source_text=obs_data.source_text,
            source_page=obs_data.source_page,
            confidence=obs_data.confidence
        )
        db.add(db_obligation)

    db.commit()
    db.refresh(document)
    
    obligations = db.query(Obligation).filter(Obligation.document_id == document.id).all()

    return {
        "document": document,
        "obligations": obligations
    }
