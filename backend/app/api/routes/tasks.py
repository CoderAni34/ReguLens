from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.task import TaskResponse, TaskCreate, TaskUpdate
from app.services import task_service

router = APIRouter()


@router.get("", response_model=List[TaskResponse])
@router.get("/", response_model=List[TaskResponse], include_in_schema=False)
def list_tasks(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum items to return"),
    status: Optional[str] = Query(None, description="Filter by status (To Do, In Progress, Completed, All)"),
    db: Session = Depends(get_db),
):
    return task_service.get_tasks(db=db, skip=skip, limit=limit, status=status)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = task_service.get_task_by_id(db=db, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_task_endpoint(task_in: TaskCreate, db: Session = Depends(get_db)):
    try:
        return task_service.create_task(db=db, task_data=task_in)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create task: {str(e)}",
        )


@router.patch("/{task_id}", response_model=TaskResponse)
@router.put("/{task_id}", response_model=TaskResponse, include_in_schema=False)
def update_task_endpoint(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
):
    update_data = task_in.model_dump(exclude_unset=True)
    task = task_service.update_task(db=db, task_id=task_id, update_data=update_data)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_endpoint(task_id: int, db: Session = Depends(get_db)):
    success = task_service.delete_task(db=db, task_id=task_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return None
