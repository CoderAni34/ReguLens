from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models.document import Document
from app.db.models.obligation import Obligation
from app.db.models.task import Task
from app.db.models.evidence import Evidence
from app.db.models.conflict import Conflict


def create_document(
    db: Session,
    filename: str,
    file_path: str,
    title: Optional[str] = None,
    document_type: Optional[str] = None,
    language: Optional[str] = None,
    version: Optional[str] = None,
    processing_status: str = "uploaded",
) -> Document:
    """Create and persist a new document record in the database."""
    db_document = Document(
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


def get_document_by_id(db: Session, document_id: int) -> Optional[Document]:
    """Retrieve a document by its primary key ID."""
    return db.query(Document).filter(Document.id == document_id).first()


def get_documents(db: Session, skip: int = 0, limit: int = 100) -> List[Document]:
    """Retrieve a list of documents with pagination."""
    return db.query(Document).offset(skip).limit(limit).all()


def update_processing_status(db: Session, document_id: int, status: str) -> Optional[Document]:
    """Update the processing status of a document."""
    document = get_document_by_id(db, document_id)
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
) -> Optional[Document]:
    """Update document metadata fields and status."""
    document = get_document_by_id(db, document_id)
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


def delete_document(db: Session, document_id: int) -> bool:
    """Delete a document and its cascade relations cleanly."""
    document = get_document_by_id(db, document_id)
    if not document:
        return False
    try:
        # 1. Delete conflicts involving this document (either as doc A or doc B)
        db.query(Conflict).filter(
            (Conflict.document_a_id == document_id) | (Conflict.document_b_id == document_id)
        ).delete(synchronize_session=False)

        # 2. Get obligation IDs belonging exclusively to this document
        obs_ids = [obs.id for obs in document.obligations]

        if obs_ids:
            # 3. Delete tasks derived from this document's obligations
            db.query(Task).filter(Task.obligation_id.in_(obs_ids)).delete(synchronize_session=False)

            # 4. Delete evidence requirements derived from this document's obligations or referencing it
            db.query(Evidence).filter(
                (Evidence.obligation_id.in_(obs_ids)) | (Evidence.source_document_id == document_id)
            ).delete(synchronize_session=False)

        # 5. Delete the document record itself (cascades to child obligations)
        db.delete(document)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
