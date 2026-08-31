"""
ReguLens PDF Validation Service
===============================
Provides multi-layer validation for uploaded PDF documents:
1. File extension check
2. Magic bytes (%PDF-) signature verification
3. Configurable file size enforcement
4. PyMuPDF document integrity and structure parsing
"""
import io
import logging
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
import pymupdf

from app.core.config import settings

logger = logging.getLogger(__name__)

# Standard PDF header signature
PDF_MAGIC_BYTES = b"%PDF-"


def validate_pdf_content(
    content: bytes,
    filename: str = "document.pdf",
    max_size_bytes: int | None = None,
) -> Tuple[bool, int]:
    """
    Validates raw bytes as a valid, non-empty PDF document.
    
    Args:
        content: Raw binary content of the file
        filename: Original filename for logging and extension validation
        max_size_bytes: Maximum allowed size in bytes (defaults to settings.max_upload_size_mb)
        
    Returns:
        Tuple of (is_valid: bool, page_count: int)
        
    Raises:
        HTTPException (400): If validation fails at any stage
    """
    max_limit = max_size_bytes or (getattr(settings, "max_upload_size_mb", 20) * 1024 * 1024)
    max_mb = max_limit // (1024 * 1024)

    # 1. Filename & extension check
    if not filename or not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed. Please upload a document with a .pdf extension.",
        )

    # 2. File size check (empty vs oversized)
    if not content or len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes). Please upload a valid PDF document.",
        )

    if len(content) > max_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size ({len(content) / (1024 * 1024):.2f} MB) exceeds maximum allowed limit of {max_mb} MB.",
        )

    # 3. Magic bytes (%PDF-) verification within initial header
    # Standard PDFs start with %PDF- within the first 1024 bytes
    header_chunk = content[:1024]
    if PDF_MAGIC_BYTES not in header_chunk:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PDF file. The file signature does not match a valid PDF document.",
        )

    # 4. PyMuPDF parsing and structure integrity validation
    try:
        doc = pymupdf.open(stream=content, filetype="pdf")
    except Exception as e:
        logger.warning(f"PyMuPDF failed to parse uploaded file '{filename}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted PDF file. The document structure could not be parsed.",
        )

    try:
        page_count = doc.page_count
        if page_count < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF document is empty and contains no readable pages.",
            )

        # Ensure first page is accessible and valid
        _ = doc[0].rect
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Error accessing pages in PDF '{filename}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded PDF document is corrupted and cannot be read.",
        )
    finally:
        doc.close()

    return True, page_count


async def validate_upload_file(file: UploadFile) -> Tuple[bytes, int]:
    """
    Reads and validates a FastAPI UploadFile.
    
    Returns:
        Tuple of (content_bytes: bytes, page_count: int)
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload request.",
        )

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read uploaded file: {str(e)}",
        )

    _, page_count = validate_pdf_content(content, filename=file.filename)
    return content, page_count
