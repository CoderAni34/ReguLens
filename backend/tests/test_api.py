import io
import pytest
from unittest.mock import patch
import pymupdf

from app.schemas.ai import AIResponse, AIDocumentInfo, AIObligation

def create_mock_pdf_bytes() -> bytes:
    """Generate minimal valid PDF bytes for test ingestion."""
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 50), "University Grants Commission Guidelines 2026.\nAll Higher Educational Institutions must submit an Annual Compliance Report by end of Q1.\nInstitutions shall conduct a bi-annual audit of student data privacy practices.")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_upload_invalid_file(client):
    file_content = b"fake image content"
    files = {"file": ("test.png", io.BytesIO(file_content), "image/png")}
    response = client.post("/documents/upload", files=files)
    assert response.status_code == 400
    assert "Only PDF files" in response.json()["detail"]

def upload_test_pdf(client):
    file_content = create_mock_pdf_bytes()
    files = {"file": ("test_doc.pdf", io.BytesIO(file_content), "application/pdf")}
    response = client.post("/documents/upload", files=files)
    return response.json()["id"]

def test_upload_valid_pdf(client):
    file_content = create_mock_pdf_bytes()
    files = {"file": ("test_doc.pdf", io.BytesIO(file_content), "application/pdf")}
    response = client.post("/documents/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "test_doc.pdf"
    assert data["processing_status"] == "uploaded"
    assert "id" in data

def test_get_documents(client):
    doc_id = upload_test_pdf(client)
    response = client.get("/documents/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["id"] == doc_id

def test_get_document(client):
    doc_id = upload_test_pdf(client)
    response = client.get(f"/documents/{doc_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == doc_id

def test_analyze_document(client):
    doc_id = upload_test_pdf(client)
    
    mock_ai_data = AIResponse(
        document=AIDocumentInfo(
            title="Sample Mock Regulation Act 2026",
            document_type="regulation",
            language="en",
            version="1.0"
        ),
        obligations=[
            AIObligation(
                title="Annual Compliance Report",
                description="All educational institutions must submit an annual compliance report by end of Q1.",
                responsible_unit="Compliance Department",
                deadline="2026-03-31",
                evidence_required="Signed audit report",
                penalty="Warning",
                category="Compliance",
                priority="High",
                source_text="Section 4(a): All educational institutions must submit an annual compliance report by end of Q1.",
                source_page=12,
                confidence=0.95
            ),
            AIObligation(
                title="Data Privacy Audit",
                description="Conduct a bi-annual audit of student data privacy practices.",
                responsible_unit="IT Security",
                deadline=None,
                evidence_required="Audit logs and certification",
                penalty=None,
                category="Security",
                priority="Medium",
                source_text="Section 9: Institutions shall conduct a bi-annual audit of student data privacy practices.",
                source_page=24,
                confidence=0.88
            )
        ]
    )

    with patch("app.api.routes.documents.analyze_document", return_value=mock_ai_data):
        response = client.post(f"/documents/{doc_id}/analyze")
        assert response.status_code == 200
        data = response.json()
        
        # Check document updates
        doc_data = data["document"]
        assert doc_data["processing_status"] == "completed"
        assert doc_data["title"] == "Sample Mock Regulation Act 2026"
        
        # Check obligations created
        obs_data = data["obligations"]
        assert len(obs_data) == 2
        assert obs_data[0]["title"] == "Annual Compliance Report"
        assert obs_data[0]["document_id"] == doc_id
        assert obs_data[0]["penalty"] == "Warning"
        assert obs_data[0]["category"] == "Compliance"
        assert obs_data[0]["priority"] == "High"

        assert obs_data[1]["penalty"] is None
        assert obs_data[1]["category"] == "Security"
        assert obs_data[1]["priority"] == "Medium"

        # Verify obligations can be fetched
        response_obs = client.get(f"/obligations/document/{doc_id}")
        assert response_obs.status_code == 200
        fetched_obs = response_obs.json()
        assert len(fetched_obs) == 2
        assert fetched_obs[0]["category"] == "Compliance"

def test_analyze_not_found(client):
    response = client.post("/documents/999/analyze")
    assert response.status_code == 404
