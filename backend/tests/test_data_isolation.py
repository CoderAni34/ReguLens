"""
Multi-User Security & Data Isolation Tests
==========================================
Verifies strict backend tenant/user isolation for documents and obligations.
Ensures that User A's data is never visible or accessible to User B.
"""
import io
import pytest
from unittest.mock import patch
import pymupdf

from app.core.security import hash_password, create_access_token
from app.db.models.user import User
from app.schemas.ai import AIResponse, AIDocumentInfo, AIObligation


def create_mock_pdf_bytes(title: str = "Test Policy 2026") -> bytes:
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 50), f"{title}\nMandatory compliance policy.")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


@pytest.fixture(scope="function")
def two_users(db_session):
    """Create two distinct users in the database."""
    user_a = User(
        id=101,
        email="usera@example.com",
        hashed_password=hash_password("PasswordA@123"),
        full_name="User Alpha",
        role="Auditor A",
        is_active=True,
    )
    user_b = User(
        id=102,
        email="userb@example.com",
        hashed_password=hash_password("PasswordB@123"),
        full_name="User Beta",
        role="Auditor B",
        is_active=True,
    )
    db_session.add(user_a)
    db_session.add(user_b)
    db_session.commit()
    db_session.refresh(user_a)
    db_session.refresh(user_b)
    return user_a, user_b


@pytest.fixture(scope="function")
def user_a_headers(two_users):
    user_a, _ = two_users
    token = create_access_token({"sub": str(user_a.id), "email": user_a.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def user_b_headers(two_users):
    _, user_b = two_users
    token = create_access_token({"sub": str(user_b.id), "email": user_b.email})
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# Security Tests
# ==============================================================================

def test_unauthenticated_requests_rejected(client):
    """1. Verify unauthenticated requests to documents/obligations are rejected with 401."""
    unauth_headers = {"Authorization": ""}

    resp_list_docs = client.get("/documents", headers=unauth_headers)
    assert resp_list_docs.status_code == 401

    resp_doc_detail = client.get("/documents/1", headers=unauth_headers)
    assert resp_doc_detail.status_code == 401

    resp_analyze = client.post("/documents/1/analyze", headers=unauth_headers)
    assert resp_analyze.status_code == 401

    resp_delete = client.delete("/documents/1", headers=unauth_headers)
    assert resp_delete.status_code == 401

    resp_list_obs = client.get("/obligations", headers=unauth_headers)
    assert resp_list_obs.status_code == 401

    resp_get_obs = client.get("/obligations/1", headers=unauth_headers)
    assert resp_get_obs.status_code == 401


def test_user_a_uploads_document_user_b_cannot_see_or_access(client, user_a_headers, user_b_headers):
    """
    2-6. User A uploads Document A.
    Verify User B cannot see it in list, cannot GET, cannot analyze, cannot delete.
    """
    pdf_bytes = create_mock_pdf_bytes("Alpha Document")
    files = {"file": ("alpha_policy.pdf", io.BytesIO(pdf_bytes), "application/pdf")}

    # User A uploads
    upload_resp = client.post("/documents/upload", files=files, headers=user_a_headers)
    assert upload_resp.status_code == 201
    doc_a_id = upload_resp.json()["id"]

    # User A sees Document A
    list_a = client.get("/documents", headers=user_a_headers)
    assert list_a.status_code == 200
    assert len(list_a.json()) == 1
    assert list_a.json()[0]["id"] == doc_a_id

    # User B's list does NOT contain Document A
    list_b = client.get("/documents", headers=user_b_headers)
    assert list_b.status_code == 200
    assert len(list_b.json()) == 0
    assert list_b.json() == []

    # User B cannot GET Document A (Returns 404, not 403, preventing ID enumeration)
    get_b = client.get(f"/documents/{doc_a_id}", headers=user_b_headers)
    assert get_b.status_code == 404
    assert get_b.json()["detail"] == "Document not found"

    # User B cannot trigger analyze on Document A
    analyze_b = client.post(f"/documents/{doc_a_id}/analyze", headers=user_b_headers)
    assert analyze_b.status_code == 404
    assert analyze_b.json()["detail"] == "Document not found"

    # User B cannot delete Document A
    del_b = client.delete(f"/documents/{doc_a_id}", headers=user_b_headers)
    assert del_b.status_code == 404
    assert del_b.json()["detail"] == "Document not found"

    # User A can still access Document A
    get_a = client.get(f"/documents/{doc_a_id}", headers=user_a_headers)
    assert get_a.status_code == 200
    assert get_a.json()["id"] == doc_a_id


def test_obligations_isolated_between_users(client, user_a_headers, user_b_headers):
    """
    7-10. Verify extracted obligations are strictly scoped to the document owner.
    User B cannot list or view User A's obligations.
    """
    pdf_bytes = create_mock_pdf_bytes("Alpha Document")
    files = {"file": ("alpha_policy.pdf", io.BytesIO(pdf_bytes), "application/pdf")}

    upload_resp = client.post("/documents/upload", files=files, headers=user_a_headers)
    doc_a_id = upload_resp.json()["id"]

    mock_ai_data = AIResponse(
        document=AIDocumentInfo(title="Alpha Policy", document_type="Policy", language="en", version="1.0"),
        obligations=[
            AIObligation(
                title="Confidential Obligation A",
                description="Only for User A",
                responsible_unit="Unit A",
                source_text="Secret text",
                confidence=0.99,
                deadline=None,
                evidence_required=None,
                penalty=None,
                category="Security",
                priority="High",
            )
        ]
    )

    # User A analyzes document
    with patch("app.services.ai_service.analyze_document", return_value=mock_ai_data):
        analyze_resp = client.post(f"/documents/{doc_a_id}/analyze", headers=user_a_headers)
        assert analyze_resp.status_code == 200
        obs_id = analyze_resp.json()["obligations"][0]["id"]

    # User A can list obligations
    obs_list_a = client.get("/obligations", headers=user_a_headers)
    assert obs_list_a.status_code == 200
    assert len(obs_list_a.json()) == 1
    assert obs_list_a.json()[0]["id"] == obs_id

    # User A can get obligations by document
    doc_obs_a = client.get(f"/obligations/document/{doc_a_id}", headers=user_a_headers)
    assert doc_obs_a.status_code == 200
    assert len(doc_obs_a.json()) == 1

    # User B cannot list User A's obligations
    obs_list_b = client.get("/obligations", headers=user_b_headers)
    assert obs_list_b.status_code == 200
    assert len(obs_list_b.json()) == 0

    # User B cannot get obligation by ID (returns 404)
    obs_get_b = client.get(f"/obligations/{obs_id}", headers=user_b_headers)
    assert obs_get_b.status_code == 404

    # User B cannot get obligations by document ID (returns 404)
    doc_obs_b = client.get(f"/obligations/document/{doc_a_id}", headers=user_b_headers)
    assert doc_obs_b.status_code == 404

    # User B cannot update or delete User A's obligation
    patch_b = client.patch(f"/obligations/{obs_id}", json={"status": "completed"}, headers=user_b_headers)
    assert patch_b.status_code == 404

    del_obs_b = client.delete(f"/obligations/{obs_id}", headers=user_b_headers)
    assert del_obs_b.status_code == 404


def test_independent_multi_user_documents_and_dashboard_counts(client, user_a_headers, user_b_headers):
    """
    11. User A has 2 documents; User B has 1 document.
    Verify dashboard counts are isolated per user.
    """
    # User A uploads 2 docs
    files1 = {"file": ("doc_a1.pdf", io.BytesIO(create_mock_pdf_bytes("A1")), "application/pdf")}
    files2 = {"file": ("doc_a2.pdf", io.BytesIO(create_mock_pdf_bytes("A2")), "application/pdf")}
    client.post("/documents/upload", files=files1, headers=user_a_headers)
    client.post("/documents/upload", files=files2, headers=user_a_headers)

    # User B uploads 1 doc
    files3 = {"file": ("doc_b1.pdf", io.BytesIO(create_mock_pdf_bytes("B1")), "application/pdf")}
    client.post("/documents/upload", files=files3, headers=user_b_headers)

    # User A count = 2
    docs_a = client.get("/documents", headers=user_a_headers).json()
    assert len(docs_a) == 2

    # User B count = 1
    docs_b = client.get("/documents", headers=user_b_headers).json()
    assert len(docs_b) == 1
    assert docs_b[0]["filename"] == "doc_b1.pdf"
