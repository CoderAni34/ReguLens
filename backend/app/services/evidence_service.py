from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models.evidence import Evidence
from app.db.models.obligation import Obligation
from app.schemas.evidence import EvidenceCreate, EvidenceUpdate


def create_evidence(db: Session, evidence_data: EvidenceCreate) -> Evidence:
    """Create a single evidence requirement manually or programmatically."""
    existing = db.query(Evidence).filter(Evidence.obligation_id == evidence_data.obligation_id).first()
    if existing:
        return existing

    db_evidence = Evidence(
        obligation_id=evidence_data.obligation_id,
        title=evidence_data.title,
        description=evidence_data.description,
        evidence_type=evidence_data.evidence_type or "Document",
        status=evidence_data.status or "Pending Review",
        source_document_id=evidence_data.source_document_id,
    )
    try:
        db.add(db_evidence)
        db.commit()
        db.refresh(db_evidence)
        return db_evidence
    except Exception:
        db.rollback()
        raise


def derive_evidence_from_obligations(db: Session, obligations: List[Obligation]) -> List[Evidence]:
    """
    Idempotently derive Evidence requirement records from a list of Obligation database instances.
    """
    created_items = []
    for obs in obligations:
        existing = db.query(Evidence).filter(Evidence.obligation_id == obs.id).first()
        if existing:
            created_items.append(existing)
            continue

        evidence_req = (obs.evidence_required or "").strip()
        if not evidence_req or evidence_req.lower() == "not specified":
            title = f"Compliance Proof: {obs.title}"
        else:
            title = evidence_req

        cat_lower = (obs.category or "").lower()
        if "policy" in cat_lower or "policy" in obs.title.lower():
            e_type = "Policy"
        elif "report" in cat_lower or "report" in obs.title.lower():
            e_type = "Report"
        else:
            e_type = "Document"

        new_evidence = Evidence(
            obligation_id=obs.id,
            title=title,
            description=obs.description,
            evidence_type=e_type,
            status="Pending Review",
            source_document_id=obs.document_id,
        )
        db.add(new_evidence)
        created_items.append(new_evidence)

    try:
        db.commit()
        for ev in created_items:
            db.refresh(ev)
    except Exception:
        db.rollback()
        raise

    return created_items


def get_evidence_by_id(db: Session, evidence_id: int) -> Optional[Evidence]:
    """Retrieve an evidence record by primary key ID."""
    return db.query(Evidence).filter(Evidence.id == evidence_id).first()


def get_evidence_list(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    evidence_type: Optional[str] = None,
    status: Optional[str] = None
) -> List[Evidence]:
    """Retrieve evidence items with optional type and status filtering."""
    query = db.query(Evidence)
    if evidence_type and evidence_type.lower() != "all":
        query = query.filter(Evidence.evidence_type == evidence_type)
    if status and status.lower() != "all":
        query = query.filter(Evidence.status == status)
    return query.offset(skip).limit(limit).all()


def update_evidence(db: Session, evidence_id: int, update_data: dict) -> Optional[Evidence]:
    """Update an existing evidence record."""
    evidence = get_evidence_by_id(db, evidence_id)
    if not evidence:
        return None
    try:
        for key, value in update_data.items():
            if value is not None and hasattr(evidence, key):
                setattr(evidence, key, value)
        db.commit()
        db.refresh(evidence)
        return evidence
    except Exception:
        db.rollback()
        raise


def delete_evidence(db: Session, evidence_id: int) -> bool:
    """Delete an evidence record."""
    evidence = get_evidence_by_id(db, evidence_id)
    if not evidence:
        return False
    try:
        db.delete(evidence)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
