from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models.task import Task
from app.db.models.obligation import Obligation
from app.schemas.task import TaskCreate, TaskUpdate


def create_task(db: Session, task_data: TaskCreate) -> Task:
    """Create a single task manually or programmatically."""
    # Check if task already exists for this obligation
    existing = db.query(Task).filter(Task.obligation_id == task_data.obligation_id).first()
    if existing:
        return existing

    db_task = Task(
        obligation_id=task_data.obligation_id,
        title=task_data.title,
        description=task_data.description,
        deadline=task_data.deadline,
        responsible_unit=task_data.responsible_unit,
        priority=task_data.priority or "Medium",
        status=task_data.status or "To Do",
    )
    try:
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task
    except Exception:
        db.rollback()
        raise


def derive_tasks_from_obligations(db: Session, obligations: List[Obligation]) -> List[Task]:
    """
    Idempotently derive Task records from a list of Obligation database instances.
    Prevents duplicate Task creation if a document is re-analyzed.
    """
    created_tasks = []
    for obs in obligations:
        existing = db.query(Task).filter(Task.obligation_id == obs.id).first()
        if existing:
            created_tasks.append(existing)
            continue

        priority_val = obs.priority or "Medium"
        if priority_val.lower() not in ["high", "medium", "low"]:
            priority_val = "Medium"

        status_val = "To Do"
        if (obs.status or "").lower() == "completed":
            status_val = "Completed"

        new_task = Task(
            obligation_id=obs.id,
            title=obs.title,
            description=obs.description,
            deadline=obs.deadline or "Not specified",
            responsible_unit=obs.responsible_unit or "Not specified",
            priority=priority_val,
            status=status_val,
        )
        db.add(new_task)
        created_tasks.append(new_task)

    try:
        db.commit()
        for t in created_tasks:
            db.refresh(t)
    except Exception:
        db.rollback()
        raise

    return created_tasks


def get_task_by_id(db: Session, task_id: int) -> Optional[Task]:
    """Retrieve a task by its primary key ID."""
    return db.query(Task).filter(Task.id == task_id).first()


def get_tasks(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
) -> List[Task]:
    """Retrieve all tasks with pagination and optional status filtering."""
    query = db.query(Task)
    if status and status.lower() != "all":
        query = query.filter(Task.status == status)
    return query.offset(skip).limit(limit).all()


def update_task(db: Session, task_id: int, update_data: dict) -> Optional[Task]:
    """Update an existing task."""
    task = get_task_by_id(db, task_id)
    if not task:
        return None
    try:
        for key, value in update_data.items():
            if value is not None and hasattr(task, key):
                setattr(task, key, value)
        db.commit()
        db.refresh(task)
        return task
    except Exception:
        db.rollback()
        raise


def delete_task(db: Session, task_id: int) -> bool:
    """Delete a task by ID."""
    task = get_task_by_id(db, task_id)
    if not task:
        return False
    try:
        db.delete(task)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
