import io
import pytest
from pydantic import ValidationError
from app.schemas.obligation import ObligationCreate
from app.services import document_service, obligation_service, task_service, evidence_service, conflict_service, report_service
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

def test_upload_invalid_extension_txt(client):
    file_content = b"sample text content"
    files = {"file": ("report.txt", io.BytesIO(file_content), "text/plain")}
    response = client.post("/documents/upload", files=files)
    assert response.status_code == 400
    assert "Only PDF files" in response.json()["detail"]

def upload_test_pdf(client, filename="test_doc.pdf"):
    file_content = create_mock_pdf_bytes()
    files = {"file": (filename, io.BytesIO(file_content), "application/pdf")}
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


def test_get_documents_empty(client):
    response = client.get("/documents")
    assert response.status_code == 200
    assert response.json() == []


def test_get_documents(client):
    doc_id = upload_test_pdf(client)
    
    response = client.get("/documents/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["id"] == doc_id

    response_no_slash = client.get("/documents")
    assert response_no_slash.status_code == 200
    assert len(response_no_slash.json()) >= 1


def test_get_document(client):
    doc_id = upload_test_pdf(client)
    
    response = client.get(f"/documents/{doc_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == doc_id
    assert data["filename"] == "test_doc.pdf"


def test_get_document_not_found(client):
    response = client.get("/documents/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found"


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

    with patch("app.services.ai_service.analyze_document", return_value=mock_ai_data):
        response = client.post(f"/documents/{doc_id}/analyze")
        assert response.status_code == 200
        data = response.json()

        doc_data = data["document"]
        assert doc_data["processing_status"] == "completed"
        assert doc_data["title"] == "Sample Mock Regulation Act 2026"

        obs_data = data["obligations"]
        assert len(obs_data) == 2
        assert obs_data[0]["title"] == "Annual Compliance Report"

        # Verify tasks and evidence were automatically derived
        tasks_resp = client.get("/tasks")
        assert tasks_resp.status_code == 200
        assert len(tasks_resp.json()) == 2

        evidence_resp = client.get("/evidence")
        assert evidence_resp.status_code == 200
        assert len(evidence_resp.json()) == 2


def test_tasks_endpoints_and_derivation_idempotency(client, db_session):
    doc = document_service.create_document(db=db_session, filename="task_test.pdf", file_path="uploads/task_test.pdf")
    obs = obligation_service.create_obligation(
        db=db_session,
        obligation_data=ObligationCreate(
            document_id=doc.id,
            title="Idempotent Task Obligation",
            description="Ensure task is derived once.",
            deadline="2026-12-31",
            priority="High",
            responsible_unit="Audit Unit",
            source_text="Clause 1: Task text",
            confidence=0.99
        )
    )

    # Derive tasks twice
    tasks1 = task_service.derive_tasks_from_obligations(db=db_session, obligations=[obs])
    assert len(tasks1) == 1

    tasks2 = task_service.derive_tasks_from_obligations(db=db_session, obligations=[obs])
    assert len(tasks2) == 1
    assert db_session.query(task_service.Task).count() == 1

    task_id = tasks1[0].id

    # GET /tasks
    get_resp = client.get(f"/tasks/{task_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["title"] == "Idempotent Task Obligation"

    # PATCH /tasks/{id}
    patch_resp = client.patch(f"/tasks/{task_id}", json={"status": "In Progress"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "In Progress"


def test_evidence_endpoints_and_derivation_idempotency(client, db_session):
    doc = document_service.create_document(db=db_session, filename="ev_test.pdf", file_path="uploads/ev_test.pdf")
    obs = obligation_service.create_obligation(
        db=db_session,
        obligation_data=ObligationCreate(
            document_id=doc.id,
            title="Evidence Test Obligation",
            description="Provide proof.",
            evidence_required="Quarterly Audit Certificate",
            source_text="Clause 2: Proof required.",
            confidence=0.95
        )
    )

    # Derive evidence twice
    ev1 = evidence_service.derive_evidence_from_obligations(db=db_session, obligations=[obs])
    assert len(ev1) == 1

    ev2 = evidence_service.derive_evidence_from_obligations(db=db_session, obligations=[obs])
    assert len(ev2) == 1
    assert db_session.query(evidence_service.Evidence).count() == 1

    ev_id = ev1[0].id

    # GET /evidence
    get_resp = client.get(f"/evidence/{ev_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["title"] == "Quarterly Audit Certificate"

    # PATCH /evidence/{id}
    patch_resp = client.patch(f"/evidence/{ev_id}", json={"status": "Verified"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "Verified"


def test_conflicts_endpoints_and_idempotency(client, db_session):
    doc_a = document_service.create_document(db=db_session, filename="doc_a.pdf", file_path="uploads/doc_a.pdf", processing_status="completed")
    doc_b = document_service.create_document(db=db_session, filename="doc_b.pdf", file_path="uploads/doc_b.pdf", processing_status="completed")

    obligation_service.create_obligation(
        db=db_session,
        obligation_data=ObligationCreate(
            document_id=doc_a.id,
            title="Doc A Obligation",
            description="Description A",
            source_text="Submit annual report by 10 Dec.",
            confidence=0.9
        )
    )
    obligation_service.create_obligation(
        db=db_session,
        obligation_data=ObligationCreate(
            document_id=doc_b.id,
            title="Doc B Obligation",
            description="Description B",
            source_text="Submit annual report by 31 Dec.",
            confidence=0.9
        )
    )

    mock_conflicts = [
        {
            "conflict_type": "Deadline Conflict",
            "title": "Reporting Deadline Contradiction",
            "description": "Doc A requires Dec 10, Doc B requires Dec 31.",
            "severity": "High",
            "page_a": 10,
            "page_b": 15,
            "source_text_a": "Submit annual report by 10 Dec.",
            "source_text_b": "Submit annual report by 31 Dec.",
            "recommendation": "Harmonize deadlines."
        }
    ]

    with patch("app.services.ai_service.run_ai_conflict_detection", return_value=mock_conflicts):
        # Run detection twice
        import asyncio
        asyncio.run(conflict_service.detect_and_save_conflicts(db=db_session, target_document_id=doc_b.id))
        asyncio.run(conflict_service.detect_and_save_conflicts(db=db_session, target_document_id=doc_b.id))

    # Should only have 1 conflict recorded due to fingerprint deduplication
    conflicts = conflict_service.get_conflicts(db=db_session)
    assert len(conflicts) == 1
    conflict_id = conflicts[0].id

    # GET /conflicts
    get_resp = client.get(f"/conflicts/{conflict_id}")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["severity"] == "High"
    assert data["source_text_a"] == "Submit annual report by 10 Dec."

    # PATCH /conflicts/{id}
    patch_resp = client.patch(f"/conflicts/{conflict_id}", json={"status": "Resolved"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "Resolved"



def test_reports_endpoints_and_snapshot_metrics(client, db_session):
    doc = document_service.create_document(db=db_session, filename="report_doc.pdf", file_path="uploads/report_doc.pdf", processing_status="completed")
    obs = obligation_service.create_obligation(
        db=db_session,
        obligation_data=ObligationCreate(
            document_id=doc.id,
            title="Report Obligation",
            description="Obligation for report testing.",
            source_text="Source text",
            confidence=0.9
        )
    )
    task_service.derive_tasks_from_obligations(db=db_session, obligations=[obs])

    with patch("app.services.ai_service.run_ai_executive_summary", return_value="Factual summary: 1 document analyzed and 1 task created."):
        resp = client.post("/reports/generate", json={"title": "Annual Compliance Report", "report_type": "Compliance", "period": "Annual"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Annual Compliance Report"
        assert data["executive_summary"] == "Factual summary: 1 document analyzed and 1 task created."
        assert "metrics_json" in data

    # GET /reports
    reports_resp = client.get("/reports")
    assert reports_resp.status_code == 200
    assert len(reports_resp.json()) == 1
