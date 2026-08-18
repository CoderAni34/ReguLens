import io
import pytest
from pydantic import ValidationError

from app.schemas.obligation import ObligationCreate
from app.services import document_service, obligation_service


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
    file_content = b"%PDF-1.4 mock pdf content"
    files = {"file": (filename, io.BytesIO(file_content), "application/pdf")}
    response = client.post("/documents/upload", files=files)
    return response.json()["id"]


def test_upload_valid_pdf(client):
    file_content = b"%PDF-1.4 mock pdf content"
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

    # Test without trailing slash
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

    response = client.post(f"/documents/{doc_id}/analyze")
    assert response.status_code == 200
    data = response.json()

    # Check document updates
    doc_data = data["document"]
    assert doc_data["processing_status"] == "completed"
    assert doc_data["title"] == "Sample Mock Regulation Act 2026"
    assert doc_data["document_type"] == "regulation"
    assert doc_data["language"] == "en"
    assert doc_data["version"] == "1.0"

    # Check obligations created
    obs_data = data["obligations"]
    assert len(obs_data) == 2
    assert obs_data[0]["title"] == "Annual Compliance Report"
    assert obs_data[0]["document_id"] == doc_id
    assert obs_data[0]["responsible_unit"] == "Compliance Department"
    assert obs_data[0]["deadline"] == "2026-03-31"
    assert obs_data[0]["evidence_required"] == "Signed audit report"
    assert obs_data[0]["source_text"].startswith("Section 4(a):")
    assert obs_data[0]["source_page"] == 12
    assert obs_data[0]["confidence"] == 0.95
    assert obs_data[0]["status"] == "active"

    # Check second obligation with nullable fields
    assert obs_data[1]["title"] == "Data Privacy Audit"
    assert obs_data[1]["deadline"] is None
    assert obs_data[1]["source_page"] == 24
    assert obs_data[1]["confidence"] == 0.88

    # Verify obligations can be fetched by document
    response_obs = client.get(f"/obligations/document/{doc_id}")
    assert response_obs.status_code == 200
    fetched_obs = response_obs.json()
    assert len(fetched_obs) == 2


def test_analyze_not_found(client):
    response = client.post("/documents/999/analyze")
    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found"


def test_get_obligations_list(client):
    doc_id = upload_test_pdf(client)
    client.post(f"/documents/{doc_id}/analyze")

    response = client.get("/obligations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    # Test with trailing slash
    response_slash = client.get("/obligations/")
    assert response_slash.status_code == 200
    assert len(response_slash.json()) == 2


def test_get_obligation_by_id(client):
    doc_id = upload_test_pdf(client)
    analyze_resp = client.post(f"/documents/{doc_id}/analyze")
    obs_id = analyze_resp.json()["obligations"][0]["id"]

    response = client.get(f"/obligations/{obs_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == obs_id
    assert data["document_id"] == doc_id
    assert data["title"] == "Annual Compliance Report"
    assert data["source_text"] is not None
    assert data["confidence"] > 0


def test_get_obligation_not_found(client):
    response = client.get("/obligations/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Obligation not found"


def test_get_obligations_by_document_not_found(client):
    response = client.get("/obligations/document/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found"


def test_document_service_crud(db_session):
    doc = document_service.create_document(
        db=db_session,
        filename="policy.pdf",
        file_path="uploads/policy.pdf",
        title="Policy Document",
    )
    assert doc.id is not None
    assert doc.title == "Policy Document"
    assert doc.processing_status == "uploaded"

    # Get by ID
    fetched = document_service.get_document_by_id(db=db_session, document_id=doc.id)
    assert fetched is not None
    assert fetched.id == doc.id

    # List
    all_docs = document_service.get_documents(db=db_session)
    assert len(all_docs) == 1

    # Update metadata
    updated = document_service.update_document_metadata(
        db=db_session,
        document_id=doc.id,
        title="Updated Title",
        processing_status="completed",
    )
    assert updated.title == "Updated Title"
    assert updated.processing_status == "completed"

    # Delete
    deleted = document_service.delete_document(db=db_session, document_id=doc.id)
    assert deleted is True
    assert document_service.get_document_by_id(db=db_session, document_id=doc.id) is None


def test_obligation_service_crud(db_session):
    doc = document_service.create_document(
        db=db_session,
        filename="test.pdf",
        file_path="uploads/test.pdf",
    )

    # Create single obligation
    obs_in = ObligationCreate(
        document_id=doc.id,
        title="Test Obligation",
        description="Must comply with guidelines.",
        source_text="Exact text here",
        confidence=0.92,
    )
    obs = obligation_service.create_obligation(db=db_session, obligation_data=obs_in)
    assert obs.id is not None
    assert obs.title == "Test Obligation"
    assert obs.status == "active"

    # Get by ID
    fetched = obligation_service.get_obligation_by_id(db=db_session, obligation_id=obs.id)
    assert fetched is not None
    assert fetched.id == obs.id

    # Bulk create
    bulk_in = [
        ObligationCreate(
            document_id=doc.id,
            title="Bulk Obligation 1",
            description="Desc 1",
            source_text="Source 1",
            confidence=0.85,
        ),
        ObligationCreate(
            document_id=doc.id,
            title="Bulk Obligation 2",
            description="Desc 2",
            source_text="Source 2",
            confidence=0.90,
        ),
    ]
    bulk_obs = obligation_service.create_obligations_bulk(db=db_session, obligations_data=bulk_in)
    assert len(bulk_obs) == 2

    # Get by document
    doc_obs = obligation_service.get_obligations_by_document_id(db=db_session, document_id=doc.id)
    assert len(doc_obs) == 3


def test_cascade_delete(db_session):
    doc = document_service.create_document(
        db=db_session,
        filename="cascade_test.pdf",
        file_path="uploads/cascade_test.pdf",
    )
    obligation_service.create_obligation(
        db=db_session,
        obligation_data=ObligationCreate(
            document_id=doc.id,
            title="Cascade Obligation",
            description="Description",
            source_text="Source",
            confidence=0.99,
        ),
    )
    assert len(obligation_service.get_obligations_by_document_id(db=db_session, document_id=doc.id)) == 1

    # Delete parent document
    document_service.delete_document(db=db_session, document_id=doc.id)
    # Child obligations should be deleted
    assert len(obligation_service.get_obligations_by_document_id(db=db_session, document_id=doc.id)) == 0


def test_obligation_schema_validation():
    # Valid
    obs = ObligationCreate(
        document_id=1,
        title="Valid Obligation",
        description="Description",
        source_text="Source text",
        confidence=0.5,
    )
    assert obs.confidence == 0.5

    # Invalid confidence > 1
    with pytest.raises(ValidationError):
        ObligationCreate(
            document_id=1,
            title="Invalid Obligation",
            description="Description",
            source_text="Source text",
            confidence=1.5,
        )

    # Invalid confidence < 0
    with pytest.raises(ValidationError):
        ObligationCreate(
            document_id=1,
            title="Invalid Obligation",
            description="Description",
            source_text="Source text",
            confidence=-0.1,
        )


def test_pagination_validation_invalid_skip(client):
    response = client.get("/documents?skip=-1")
    assert response.status_code == 422

    response_obs = client.get("/obligations?skip=-5")
    assert response_obs.status_code == 422


def test_pagination_validation_invalid_limit(client):
    response = client.get("/documents?limit=0")
    assert response.status_code == 422

    response_large = client.get("/documents?limit=9999")
    assert response_large.status_code == 422

    response_obs = client.get("/obligations?limit=0")
    assert response_obs.status_code == 422


def test_analyze_document_ai_failure(client, monkeypatch):
    doc_id = upload_test_pdf(client, filename="failure_test.pdf")

    async def mock_failing_ai(doc_id):
        raise RuntimeError("Simulated AI extraction failure")

    monkeypatch.setattr("app.services.ai_service.analyze_document", mock_failing_ai)

    response = client.post(f"/documents/{doc_id}/analyze")
    assert response.status_code == 500
    assert "AI analysis failed" in response.json()["detail"]

    # Verify document status transitioned to failed
    doc_resp = client.get(f"/documents/{doc_id}")
    assert doc_resp.status_code == 200
    assert doc_resp.json()["processing_status"] == "failed"


def test_analyze_document_invalid_ai_response(client, monkeypatch):
    doc_id = upload_test_pdf(client, filename="invalid_ai_test.pdf")

    async def mock_invalid_ai(doc_id):
        raise ValidationError.from_exception_data(
            "AIResponse",
            [{"type": "greater_than_equal", "loc": ("obligations", 0, "confidence"), "input": 1.5, "ctx": {"ge": 0}}],
        )

    monkeypatch.setattr("app.services.ai_service.analyze_document", mock_invalid_ai)

    response = client.post(f"/documents/{doc_id}/analyze")
    assert response.status_code == 500
    assert "AI analysis failed" in response.json()["detail"]

    # Verify document status transitioned to failed and no obligations were persisted
    doc_resp = client.get(f"/documents/{doc_id}")
    assert doc_resp.status_code == 200
    assert doc_resp.json()["processing_status"] == "failed"

    obs_resp = client.get(f"/obligations/document/{doc_id}")
    assert obs_resp.status_code == 200
    assert obs_resp.json() == []


def test_upload_file_cleanup_on_db_error(client, monkeypatch):
    file_content = b"%PDF-1.4 sample content"
    files = {"file": ("orphan_test.pdf", io.BytesIO(file_content), "application/pdf")}

    def mock_failing_create_document(*args, **kwargs):
        raise RuntimeError("Simulated DB Insert Failure")

    monkeypatch.setattr("app.services.document_service.create_document", mock_failing_create_document)

    response = client.post("/documents/upload", files=files)
    assert response.status_code == 500
    assert "Failed to create document record" in response.json()["detail"]


