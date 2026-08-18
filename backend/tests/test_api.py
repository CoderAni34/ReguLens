import io
import pytest

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
    file_content = b"%PDF-1.4 mock pdf content"
    files = {"file": ("test_doc.pdf", io.BytesIO(file_content), "application/pdf")}
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

def test_get_documents(client):
    # Upload first
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

    # Verify obligations can be fetched
    response_obs = client.get(f"/obligations/document/{doc_id}")
    assert response_obs.status_code == 200
    fetched_obs = response_obs.json()
    assert len(fetched_obs) == 2

def test_analyze_not_found(client):
    response = client.post("/documents/999/analyze")
    assert response.status_code == 404
