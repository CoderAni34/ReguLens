from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models.obligation import Obligation
from app.schemas.obligation import ObligationCreate


def create_obligation(db: Session, obligation_data: ObligationCreate) -> Obligation:
    """Create and persist a single obligation in the database."""
    db_obligation = Obligation(
        document_id=obligation_data.document_id,
        title=obligation_data.title,
        description=obligation_data.description,
        responsible_unit=obligation_data.responsible_unit,
        deadline=obligation_data.deadline,
        evidence_required=obligation_data.evidence_required,
        penalty=obligation_data.penalty,
        category=obligation_data.category,
        priority=obligation_data.priority,
        source_text=obligation_data.source_text,
        source_page=obligation_data.source_page,
        confidence=obligation_data.confidence,
        status=obligation_data.status or "active",
    )
    try:
        db.add(db_obligation)
        db.commit()
        db.refresh(db_obligation)
        return db_obligation
    except Exception:
        db.rollback()
        raise


def create_obligations_bulk(db: Session, obligations_data: List[ObligationCreate]) -> List[Obligation]:
    """Bulk create and persist multiple obligations in the database atomically."""
    db_obligations = [
        Obligation(
            document_id=data.document_id,
            title=data.title,
            description=data.description,
            responsible_unit=data.responsible_unit,
            deadline=data.deadline,
            evidence_required=data.evidence_required,
            penalty=data.penalty,
            category=data.category,
            priority=data.priority,
            source_text=data.source_text,
            source_page=data.source_page,
            confidence=data.confidence,
            status=data.status or "active",
        )
        for data in obligations_data
    ]
    try:
        db.add_all(db_obligations)
        db.commit()
    except Exception:
        db.rollback()
        raise
    for obs in db_obligations:
        db.refresh(obs)
    return db_obligations


def get_obligation_by_id(db: Session, obligation_id: int) -> Optional[Obligation]:
    """Retrieve an obligation by its primary key ID."""
    return db.query(Obligation).filter(Obligation.id == obligation_id).first()


def get_obligations(db: Session, skip: int = 0, limit: int = 100) -> List[Obligation]:
    """Retrieve a list of all obligations with pagination."""
    return db.query(Obligation).offset(skip).limit(limit).all()


def get_obligations_by_document_id(db: Session, document_id: int) -> List[Obligation]:
    """Retrieve all obligations associated with a specific document ID."""
    return db.query(Obligation).filter(Obligation.document_id == document_id).all()

