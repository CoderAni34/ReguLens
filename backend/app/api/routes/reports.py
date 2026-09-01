from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.report import ReportResponse, ReportGenerateRequest
from app.services import report_service

router = APIRouter()


@router.get("", response_model=List[ReportResponse])
@router.get("/", response_model=List[ReportResponse], include_in_schema=False)
def list_reports(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum items to return"),
    db: Session = Depends(get_db),
):
    return report_service.get_reports(db=db, skip=skip, limit=limit)


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = report_service.get_report_by_id(db=db, report_id=report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    return report


@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report_endpoint(
    request: ReportGenerateRequest,
    db: Session = Depends(get_db),
):
    try:
        return await report_service.generate_report(
            db=db,
            title=request.title,
            report_type=request.report_type or "Compliance",
            period=request.period or "Monthly",
            description=request.description,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {str(e)}",
        )
