from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models.document import Document


def create_document(
    db: Session,
    filename: str,
    file_path: str,
    user_id: int = 1,
    title: Optional[str] = None,
    document_type: Optional[str] = None,
    language: Optional[str] = None,
    version: Optional[str] = None,
    processing_status: str = "uploaded",
) -> Document:
    """Create and persist a new document record associated with a user."""
    db_document = Document(
        user_id=user_id,
        title=title if title is not None else filename,
        filename=filename,
        file_path=file_path,
        document_type=document_type,
        language=language,
        version=version,
        processing_status=processing_status,
    )
    try:
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        return db_document
    except Exception:
        db.rollback()
        raise


def get_document_by_id(db: Session, document_id: int, user_id: Optional[int] = None) -> Optional[Document]:
    """Retrieve a document by its primary key ID, optionally scoped to a user."""
    query = db.query(Document).filter(Document.id == document_id)
    if user_id is not None:
        query = query.filter(Document.user_id == user_id)
    return query.first()


def get_documents(db: Session, user_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Document]:
    """Retrieve a list of documents with pagination, optionally scoped to a user."""
    query = db.query(Document)
    if user_id is not None:
        query = query.filter(Document.user_id == user_id)
    return query.offset(skip).limit(limit).all()


def update_processing_status(db: Session, document_id: int, status: str, user_id: Optional[int] = None) -> Optional[Document]:
    """Update the processing status of a document."""
    document = get_document_by_id(db, document_id, user_id=user_id)
    if not document:
        return None
    try:
        document.processing_status = status
        db.commit()
        db.refresh(document)
        return document
    except Exception:
        db.rollback()
        raise


def update_document_metadata(
    db: Session,
    document_id: int,
    title: Optional[str] = None,
    document_type: Optional[str] = None,
    language: Optional[str] = None,
    version: Optional[str] = None,
    processing_status: Optional[str] = None,
    user_id: Optional[int] = None,
) -> Optional[Document]:
    """Update document metadata fields and status."""
    document = get_document_by_id(db, document_id, user_id=user_id)
    if not document:
        return None
    try:
        if title is not None:
            document.title = title
        if document_type is not None:
            document.document_type = document_type
        if language is not None:
            document.language = language
        if version is not None:
            document.version = version
        if processing_status is not None:
            document.processing_status = processing_status
        db.commit()
        db.refresh(document)
        return document
    except Exception:
        db.rollback()
        raise


def delete_document(db: Session, document_id: int, user_id: Optional[int] = None) -> bool:
    """Delete a document and its cascade relations."""
    document = get_document_by_id(db, document_id, user_id=user_id)
    if not document:
        return False
    try:
        db.delete(document)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
