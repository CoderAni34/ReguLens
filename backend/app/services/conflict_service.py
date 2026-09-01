import hashlib
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db.models.conflict import Conflict
from app.db.models.document import Document
from app.db.models.obligation import Obligation
from app.schemas.conflict import ConflictCreate, ConflictUpdate
from app.services import ai_service


def get_conflict_by_id(db: Session, conflict_id: int) -> Optional[Conflict]:
    """Retrieve a conflict by primary key ID."""
    return db.query(Conflict).filter(Conflict.id == conflict_id).first()


def get_conflicts(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    severity: Optional[str] = None,
    status: Optional[str] = None
) -> List[Conflict]:
    """Retrieve list of conflicts with optional severity and status filtering."""
    query = db.query(Conflict)
    if severity and severity.lower() != "all":
        query = query.filter(Conflict.severity == severity)
    if status and status.lower() != "all":
        query = query.filter(Conflict.status == status)
    return query.offset(skip).limit(limit).all()


def update_conflict(db: Session, conflict_id: int, update_data: dict) -> Optional[Conflict]:
    """Update an existing conflict (e.g. resolve status)."""
    conflict = get_conflict_by_id(db, conflict_id)
    if not conflict:
        return None
    try:
        for key, value in update_data.items():
            if value is not None and hasattr(conflict, key):
                setattr(conflict, key, value)
        db.commit()
        db.refresh(conflict)
        return conflict
    except Exception:
        db.rollback()
        raise


def generate_conflict_fingerprint(
    doc_a_id: int,
    doc_b_id: int,
    title: str,
    source_a: str,
    source_b: str
) -> str:
    """Generate a deterministic SHA-256 fingerprint for conflict deduplication."""
    doc_min = min(doc_a_id, doc_b_id)
    doc_max = max(doc_a_id, doc_b_id)
    sorted_sources = sorted([source_a.strip().lower()[:50], source_b.strip().lower()[:50]])
    raw = f"{doc_min}:{doc_max}:{title.strip().lower()}:{sorted_sources[0]}:{sorted_sources[1]}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()



async def detect_and_save_conflicts(db: Session, target_document_id: int) -> List[Conflict]:
    """
    Runs cross-document conflict detection between target_document_id and all other completed documents.
    Persists non-duplicate conflict records with full source traceability.
    """
    target_doc = db.query(Document).filter(Document.id == target_document_id).first()
    if not target_doc:
        return []

    target_obs = db.query(Obligation).filter(Obligation.document_id == target_document_id).all()
    if not target_obs:
        return []

    target_obs_dicts = [
        {
            "id": o.id,
            "title": o.title,
            "description": o.description,
            "deadline": o.deadline,
            "responsible_unit": o.responsible_unit,
            "source_text": o.source_text,
            "source_page": o.source_page,
            "category": o.category,
        }
        for o in target_obs
    ]

    other_docs = (
        db.query(Document)
        .filter(Document.id != target_document_id, Document.processing_status == "completed")
        .all()
    )

    created_conflicts: List[Conflict] = []

    for other_doc in other_docs:
        other_obs = db.query(Obligation).filter(Obligation.document_id == other_doc.id).all()
        if not other_obs:
            continue

        other_obs_dicts = [
            {
                "id": o.id,
                "title": o.title,
                "description": o.description,
                "deadline": o.deadline,
                "responsible_unit": o.responsible_unit,
                "source_text": o.source_text,
                "source_page": o.source_page,
                "category": o.category,
            }
            for o in other_obs
        ]

        raw_conflicts = await ai_service.run_ai_conflict_detection(
            doc_a_id=target_doc.id,
            doc_a_title=target_doc.title or target_doc.filename,
            doc_a_obs=target_obs_dicts,
            doc_b_id=other_doc.id,
            doc_b_title=other_doc.title or other_doc.filename,
            doc_b_obs=other_obs_dicts,
        )

        for c_item in raw_conflicts:
            title = str(c_item.get("title") or "Regulatory Requirement Conflict").strip()
            desc = str(c_item.get("description") or "Conflicting requirements detected.").strip()
            severity = str(c_item.get("severity") or "Medium").capitalize()
            c_type = str(c_item.get("conflict_type") or "Requirement Conflict").strip()
            source_a = str(c_item.get("source_text_a") or "").strip()
            source_b = str(c_item.get("source_text_b") or "").strip()
            page_a = c_item.get("page_a") or 1
            page_b = c_item.get("page_b") or 1
            rec = c_item.get("recommendation") or "Review source circulars and consult compliance team."

            fingerprint = generate_conflict_fingerprint(
                target_doc.id, other_doc.id, title, source_a, source_b
            )

            existing = db.query(Conflict).filter(Conflict.fingerprint == fingerprint).first()
            if existing:
                created_conflicts.append(existing)
                continue

            db_conflict = Conflict(
                conflict_type=c_type,
                title=title,
                description=desc,
                severity=severity if severity in ["High", "Medium", "Low"] else "Medium",
                status="Unresolved",
                document_a_id=target_doc.id,
                document_b_id=other_doc.id,
                obligation_a_id=c_item.get("obligation_a_id"),
                obligation_b_id=c_item.get("obligation_b_id"),
                page_a=page_a,
                page_b=page_b,
                source_text_a=source_a,
                source_text_b=source_b,
                recommendation=rec,
                fingerprint=fingerprint,
            )
            db.add(db_conflict)
            created_conflicts.append(db_conflict)

    try:
        db.commit()
        for c in created_conflicts:
            db.refresh(c)
    except Exception:
        db.rollback()
        raise

    return created_conflicts
