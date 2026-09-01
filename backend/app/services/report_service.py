import json
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.db.models.report import Report
from app.db.models.document import Document
from app.db.models.obligation import Obligation
from app.db.models.task import Task
from app.db.models.evidence import Evidence
from app.db.models.conflict import Conflict
from app.services import ai_service


def get_report_by_id(db: Session, report_id: int) -> Optional[Report]:
    """Retrieve a report by primary key ID."""
    return db.query(Report).filter(Report.id == report_id).first()


def get_reports(db: Session, skip: int = 0, limit: int = 100) -> List[Report]:
    """Retrieve all reports ordered by generation date descending."""
    return db.query(Report).order_by(Report.generated_at.desc()).offset(skip).limit(limit).all()


async def generate_report(
    db: Session,
    title: Optional[str] = None,
    report_type: str = "Compliance",
    period: str = "Monthly",
    description: Optional[str] = None,
    created_by: str = "Compliance Officer"
) -> Report:
    """
    Dynamically computes factual compliance database statistics snapshot
    and generates a report record with an AI executive summary.
    """
    total_docs = db.query(Document).count()
    completed_docs = db.query(Document).filter(Document.processing_status == "completed").count()

    total_obs = db.query(Obligation).count()
    completed_obs = db.query(Obligation).filter(Obligation.status == "completed").count()
    pending_obs = db.query(Obligation).filter(Obligation.status.in_(["active", "pending", "Pending"])).count()

    total_tasks = db.query(Task).count()
    todo_tasks = db.query(Task).filter(Task.status == "To Do").count()
    in_progress_tasks = db.query(Task).filter(Task.status == "In Progress").count()
    completed_tasks = db.query(Task).filter(Task.status == "Completed").count()

    total_ev = db.query(Evidence).count()
    verified_ev = db.query(Evidence).filter(Evidence.status == "Verified").count()
    pending_ev = db.query(Evidence).filter(Evidence.status == "Pending Review").count()

    total_conflicts = db.query(Conflict).filter(Conflict.status == "Unresolved").count()
    high_conflicts = db.query(Conflict).filter(Conflict.severity == "High", Conflict.status == "Unresolved").count()
    med_conflicts = db.query(Conflict).filter(Conflict.severity == "Medium", Conflict.status == "Unresolved").count()
    low_conflicts = db.query(Conflict).filter(Conflict.severity == "Low", Conflict.status == "Unresolved").count()

    metrics = {
        "report_title": title or f"{period} {report_type} Executive Summary",
        "period": period,
        "report_type": report_type,
        "documents": {
            "total_ingested": total_docs,
            "analyzed_completed": completed_docs,
        },
        "obligations": {
            "total_extracted": total_obs,
            "completed": completed_obs,
            "pending_action": pending_obs,
        },
        "tasks": {
            "total": total_tasks,
            "to_do": todo_tasks,
            "in_progress": in_progress_tasks,
            "completed": completed_tasks,
        },
        "evidence": {
            "total": total_ev,
            "verified": verified_ev,
            "pending_review": pending_ev,
        },
        "conflicts": {
            "total_active_unresolved": total_conflicts,
            "high_severity": high_conflicts,
            "medium_severity": med_conflicts,
            "low_severity": low_conflicts,
        },
    }

    metrics_json_str = json.dumps(metrics, indent=2)

    # Generate AI executive summary from metrics
    executive_summary = await ai_service.run_ai_executive_summary(metrics_json_str)

    report_title = title or f"{period} {report_type} Compliance Summary"
    report_desc = description or f"Factual snapshot of compliance obligations, tasks, evidence, and conflicts for {period} cycle."

    db_report = Report(
        title=report_title,
        description=report_desc,
        report_type=report_type,
        period=period,
        status="Ready",
        created_by=created_by,
        metrics_json=metrics_json_str,
        executive_summary=executive_summary,
    )

    try:
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        return db_report
    except Exception:
        db.rollback()
        raise
