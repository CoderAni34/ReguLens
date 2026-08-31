import io
import pytest
from app.services.pdf_validator import validate_pdf_content
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
import pymupdf


def create_multilingual_pdf_bytes(title: str, text: str) -> bytes:
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 50), f"{title}\n\n{text}")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


# ==============================================================================
# Security & Auth Unit Tests
# ==============================================================================

def test_password_hashing():
    pwd = "SecretPassword123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert "$" in hashed
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_token_creation_and_validation():
    payload = {"sub": "42", "email": "test@regulens.ai"}
    token = create_access_token(payload)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "42"
    assert decoded["email"] == "test@regulens.ai"
    assert "exp" in decoded


def test_auth_flow(client):
    # 1. Register new user
    reg_payload = {
        "email": "officer@example.com",
        "password": "Password@123",
        "full_name": "Senior Compliance Lead",
        "role": "Lead Auditor"
    }
    reg_resp = client.post("/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "officer@example.com"
    token = reg_data["access_token"]

    # 2. Duplicate registration rejected
    dup_resp = client.post("/auth/register", json=reg_payload)
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.json()["detail"]

    # 3. Valid Login
    login_resp = client.post("/auth/login", json={
        "email": "officer@example.com",
        "password": "Password@123"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["user"]["email"] == "officer@example.com"
    login_token = login_data["access_token"]

    # 4. Invalid Password Login
    wrong_pwd_resp = client.post("/auth/login", json={
        "email": "officer@example.com",
        "password": "IncorrectPassword"
    })
    assert wrong_pwd_resp.status_code == 401
    assert "Invalid email or password" in wrong_pwd_resp.json()["detail"]

    # 5. Nonexistent User Login
    nonexistent_resp = client.post("/auth/login", json={
        "email": "nobody@example.com",
        "password": "Password@123"
    })
    assert nonexistent_resp.status_code == 401

    # 6. GET /auth/me with valid Bearer token
    me_resp = client.get("/auth/me", headers={"Authorization": f"Bearer {login_token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "officer@example.com"
    assert me_data["full_name"] == "Senior Compliance Lead"

    # 7. GET /auth/me without token -> 401
    unauth_resp = client.get("/auth/me", headers={"Authorization": ""})
    assert unauth_resp.status_code == 401

    # 8. POST /auth/logout
    logout_resp = client.post("/auth/logout")
    assert logout_resp.status_code == 200
    assert "Logged out successfully" in logout_resp.json()["message"]


# ==============================================================================
# PDF Validation Tests
# ==============================================================================

def test_upload_non_pdf_renamed_rejected(client):
    # A text file renamed to .pdf
    fake_pdf = b"This is just a text file with a fake .pdf name."
    files = {"file": ("malicious_doc.pdf", io.BytesIO(fake_pdf), "application/pdf")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 400
    assert "signature does not match" in resp.json()["detail"]


def test_upload_corrupted_pdf_rejected(client):
    # Valid header but corrupted body
    corrupt_pdf = b"%PDF-1.5 \x00\xff\xfe corrupted garbage bytes with no trailer"
    files = {"file": ("corrupt.pdf", io.BytesIO(corrupt_pdf), "application/pdf")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 400
    assert "Invalid or corrupted PDF" in resp.json()["detail"] or "could not be parsed" in resp.json()["detail"]


def test_upload_empty_file_rejected(client):
    files = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 400
    assert "empty" in resp.json()["detail"].lower()


def test_upload_oversized_pdf_rejected(client):
    pdf_bytes = create_multilingual_pdf_bytes("Large Document", "Some content")
    # Test validator with small size threshold
    with pytest.raises(Exception) as excinfo:
        validate_pdf_content(pdf_bytes, filename="large.pdf", max_size_bytes=10)
    assert "exceeds maximum allowed limit" in str(excinfo.value.detail)


# ==============================================================================
# Multilingual Filename & Content Upload Tests
# ==============================================================================

def test_upload_multilingual_hindi_filename(client):
    hindi_title = "विश्वविद्यालय_अनुदान_आयोग_विनियम_2026"
    hindi_content = "सभी उच्च शिक्षण संस्थानों को साइबर सुरक्षा नियमों का कड़ाई से पालन करना होगा।"
    pdf_bytes = create_multilingual_pdf_bytes(hindi_title, hindi_content)

    filename = "नियम_दस्तावेज.pdf"
    files = {"file": (filename, io.BytesIO(pdf_bytes), "application/pdf")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 201
    data = resp.json()
    assert data["filename"] == filename
    assert data["processing_status"] == "uploaded"
    assert "id" in data


def test_upload_multilingual_japanese_filename(client):
    jp_title = "規制コンプライアンス指針2026"
    jp_content = "すべての教育機関はデータプライバシー監査を実施しなければならない。"
    pdf_bytes = create_multilingual_pdf_bytes(jp_title, jp_content)

    filename = "規制文書.pdf"
    files = {"file": (filename, io.BytesIO(pdf_bytes), "application/pdf")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 201
    data = resp.json()
    assert data["filename"] == filename
    assert data["processing_status"] == "uploaded"


def test_upload_multilingual_portuguese_filename(client):
    pt_title = "Regulamento de Conformidade e Proteção de Dados 2026"
    pt_content = "Todas as organizações regulamentadas devem implementar criptografia AES-256."
    pdf_bytes = create_multilingual_pdf_bytes(pt_title, pt_content)

    filename = "regulamento_política_geral.pdf"
    files = {"file": (filename, io.BytesIO(pdf_bytes), "application/pdf")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 201
    data = resp.json()
    assert data["filename"] == filename
