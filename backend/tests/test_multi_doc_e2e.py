"""
End-to-end Multi-Document Pipeline Test.
Verifies that Document A and Document B produce distinct extracted obligations,
properly persisted and retrievable via GET /obligations/document/{id}.
"""
import io
import os
import sys
import json
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from app.db.database import Base, engine, SessionLocal
from app.services import document_service, obligation_service
from app.schemas.ai import AIResponse, AIDocumentInfo, AIObligation

client = TestClient(app)

SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "sample-data", "documents")
DOC_A_PATH = os.path.join(SAMPLE_DIR, "regulens_security_compliance_policy_2026.pdf")
DOC_B_PATH = os.path.join(SAMPLE_DIR, "academic_research_ethics_guidelines_2026.pdf")


# Ground-truth simulated Gemini extraction for Doc A (Cybersecurity Framework)
DOC_A_EXTRACTED = [
    {
        "title": "Implement AES-256 encryption of sensitive records",
        "description": "All regulated organizations must implement AES-256 encryption of sensitive records both in transit and at rest.",
        "responsible_unit": "IT Security Team",
        "deadline": "31 March 2026",
        "evidence_required": "Cryptographic key management log",
        "penalty": "Immediate suspension of data processing authority",
        "category": "Compliance",
        "priority": "High",
        "source_text": "All regulated organizations must implement AES-256 encryption of sensitive records both in transit and at rest.",
        "source_page": 1,
        "confidence": 0.98
    },
    {
        "title": "Enforce role-based access control (RBAC)",
        "description": "Institutions shall enforce strict role-based access control (RBAC) across all compliance and administrative systems.",
        "responsible_unit": "System Administration",
        "deadline": "Within 30 days of circular issuance",
        "evidence_required": "Access control matrix and user privilege report",
        "penalty": "Not specified",
        "category": "Compliance",
        "priority": "High",
        "source_text": "Institutions shall enforce strict role-based access control (RBAC) across all compliance and administrative systems.",
        "source_page": 1,
        "confidence": 0.95
    },
    {
        "title": "Mandatory access reviews every 90 days",
        "description": "Mandatory access reviews must be conducted every 90 days for all privileged user accounts.",
        "responsible_unit": "Internal Audit",
        "deadline": "End of each financial quarter",
        "evidence_required": "Signed access review audit sign-off",
        "penalty": "Administrative penalty of INR 50,000 per violation",
        "category": "Compliance",
        "priority": "Medium",
        "source_text": "Mandatory access reviews must be conducted every 90 days for all privileged user accounts.",
        "source_page": 1,
        "confidence": 0.96
    },
    {
        "title": "Report security incidents within 24 hours",
        "description": "All security and compliance incidents must be reported to the central oversight authority within 24 hours of confirmation.",
        "responsible_unit": "Incident Response Team",
        "deadline": "Within 24 hours",
        "evidence_required": "Formal Incident Disclosure Ticket (Form IR-1)",
        "penalty": "Statutory fine of up to INR 5,00,000",
        "category": "Compliance",
        "priority": "High",
        "source_text": "All security and compliance incidents must be reported to the central oversight authority within 24 hours of confirmation.",
        "source_page": 1,
        "confidence": 0.99
    },
    {
        "title": "Maintain comprehensive incident register",
        "description": "The institution shall maintain a comprehensive incident register containing timestamps, severity classifications, and containment actions.",
        "responsible_unit": "Compliance Office",
        "deadline": "Continuous / Real-time",
        "evidence_required": "Central Incident Management Ledger",
        "penalty": "Not specified",
        "category": "Compliance",
        "priority": "Medium",
        "source_text": "The institution shall maintain a comprehensive incident register containing timestamps, severity classifications, and containment actions.",
        "source_page": 1,
        "confidence": 0.94
    },
    {
        "title": "Critical incident review within 2 business days",
        "description": "A critical incident review and root cause analysis report must be submitted within 2 business days following incident resolution.",
        "responsible_unit": "Chief Information Security Officer (CISO)",
        "deadline": "Within 2 business days",
        "evidence_required": "Post-Mortem Incident Summary",
        "penalty": "Not specified",
        "category": "Compliance",
        "priority": "High",
        "source_text": "A critical incident review and root cause analysis report must be submitted within 2 business days following incident resolution.",
        "source_page": 1,
        "confidence": 0.95
    },
    {
        "title": "Retain transaction logs and audit trails for 5 years",
        "description": "All regulatory transaction logs, audit trails, and compliance filings must be securely retained for a minimum period of 5 years.",
        "responsible_unit": "Records & Archival Unit",
        "deadline": "Ongoing 5-year retention cycle",
        "evidence_required": "Tamper-proof archival storage receipts",
        "penalty": "Not specified",
        "category": "Compliance",
        "priority": "Medium",
        "source_text": "All regulatory transaction logs, audit trails, and compliance filings must be securely retained for a minimum period of 5 years.",
        "source_page": 2,
        "confidence": 0.97
    },
    {
        "title": "Complete independent annual compliance audit",
        "description": "An independent third-party annual compliance audit must be completed by an accredited CERT-In auditor.",
        "responsible_unit": "Executive Board",
        "deadline": "31 December annually",
        "evidence_required": "Certified Independent Compliance Audit Report",
        "penalty": "Regulatory non-compliance notice and blacklisting",
        "category": "Compliance",
        "priority": "High",
        "source_text": "An independent third-party annual compliance audit must be completed by an accredited CERT-In auditor.",
        "source_page": 2,
        "confidence": 0.99
    },
    {
        "title": "Submit remediation plans within 15 calendar days",
        "description": "If audit non-conformities are identified, a formal remediation plan must be submitted within 15 calendar days of report receipt.",
        "responsible_unit": "Operations Compliance Lead",
        "deadline": "Within 15 calendar days",
        "evidence_required": "Remediation Roadmap and Action Plan",
        "penalty": "Not specified",
        "category": "Compliance",
        "priority": "High",
        "source_text": "If audit non-conformities are identified, a formal remediation plan must be submitted within 15 calendar days of report receipt.",
        "source_page": 2,
        "confidence": 0.93
    },
    {
        "title": "Undergo training before production access",
        "description": "All new employees and contractors must undergo compliance and data security training before obtaining production access.",
        "responsible_unit": "Human Resources & Security",
        "deadline": "Prior to credential provisioning",
        "evidence_required": "Training completion certificate",
        "penalty": "Not specified",
        "category": "HR",
        "priority": "Medium",
        "source_text": "All new employees and contractors must undergo compliance and data security training before obtaining production access.",
        "source_page": 2,
        "confidence": 0.95
    },
    {
        "title": "Annual refresher compliance training every 12 months",
        "description": "Annual refresher compliance training must be completed every 12 months by all active staff members.",
        "responsible_unit": "HR Department",
        "deadline": "Annual recurrence by Q4",
        "evidence_required": "Annual training attendance and assessment scores",
        "penalty": "Not specified",
        "category": "HR",
        "priority": "Low",
        "source_text": "Annual refresher compliance training must be completed every 12 months by all active staff members.",
        "source_page": 2,
        "confidence": 0.92
    },
    {
        "title": "Vendor risk assessments before system access",
        "description": "A comprehensive vendor risk assessment must be completed before granting any third-party access to internal systems.",
        "responsible_unit": "Vendor Management Office",
        "deadline": "Prior to contract execution",
        "evidence_required": "Completed Vendor Due Diligence Questionnaire",
        "penalty": "Not specified",
        "category": "Compliance",
        "priority": "High",
        "source_text": "A comprehensive vendor risk assessment must be completed before granting any third-party access to internal systems.",
        "source_page": 2,
        "confidence": 0.96
    },
    {
        "title": "Third-party vendor access reviews every 6 months",
        "description": "Regular third-party vendor access reviews must be conducted every 6 months to evaluate continuous necessity.",
        "responsible_unit": "Procurement & IT",
        "deadline": "Bi-annual (June 30 and December 31)",
        "evidence_required": "Vendor Access Recertification Sheet",
        "penalty": "Not specified",
        "category": "Compliance",
        "priority": "Medium",
        "source_text": "Regular third-party vendor access reviews must be conducted every 6 months to evaluate continuous necessity.",
        "source_page": 2,
        "confidence": 0.94
    },
    {
        "title": "Revocation of unnecessary vendor access within 5 business days",
        "description": "Unnecessary or terminated third-party vendor access must be revoked within 5 business days of contract conclusion.",
        "responsible_unit": "Identity Access Management",
        "deadline": "Within 5 business days",
        "evidence_required": "Access Deprovisioning Timestamped Log",
        "penalty": "Not specified",
        "category": "Compliance",
        "priority": "High",
        "source_text": "Unnecessary or terminated third-party vendor access must be revoked within 5 business days of contract conclusion.",
        "source_page": 2,
        "confidence": 0.97
    }
]


# Ground-truth simulated Gemini extraction for Doc B (Academic Research Ethics)
DOC_B_EXTRACTED = [
    {
        "title": "Institutional Ethics Committee (IEC) prior written approval",
        "description": "All human and animal subject research studies must receive prior written approval from the Institutional Ethics Committee (IEC).",
        "responsible_unit": "Principal Investigators & Research Dean",
        "deadline": "Prior to study commencement",
        "evidence_required": "Official IEC Approval Certificate",
        "penalty": "Revocation of research grant and publication invalidation",
        "category": "Academic",
        "priority": "High",
        "source_text": "All human and animal subject research studies must receive prior written approval from the Institutional Ethics Committee (IEC).",
        "source_page": 1,
        "confidence": 0.99
    },
    {
        "title": "Mandatory automated plagiarism screening below 10%",
        "description": "Every doctoral dissertation and postgraduate thesis must undergo mandatory automated plagiarism screening with similarity strictly below 10%.",
        "responsible_unit": "University Academic Cell",
        "deadline": "Before thesis submission",
        "evidence_required": "Certified Anti-Plagiarism Similarity Report",
        "penalty": "Rejection of dissertation submission",
        "category": "Academic",
        "priority": "High",
        "source_text": "Every doctoral dissertation and postgraduate thesis must undergo mandatory automated plagiarism screening with similarity strictly below 10%.",
        "source_page": 1,
        "confidence": 0.98
    },
    {
        "title": "Submit quarterly research progress and compliance reports",
        "description": "Higher education institutions must submit quarterly research progress and compliance reports for all government-funded projects.",
        "responsible_unit": "Directorate of Research",
        "deadline": "Within 15 days following quarter end",
        "evidence_required": "Quarterly Project Progress Docket",
        "penalty": "Not specified",
        "category": "Research",
        "priority": "Medium",
        "source_text": "Higher education institutions must submit quarterly research progress and compliance reports for all government-funded projects.",
        "source_page": 1,
        "confidence": 0.95
    },
    {
        "title": "Preserve laboratory research notebooks for 7 years",
        "description": "Physical and digital laboratory research notebooks must be preserved in immutable storage for a minimum of 7 years.",
        "responsible_unit": "Department Heads & Chief Archivist",
        "deadline": "Ongoing 7-year archival",
        "evidence_required": "Laboratory Log Register Index",
        "penalty": "Not specified",
        "category": "Research",
        "priority": "Medium",
        "source_text": "Physical and digital laboratory research notebooks must be preserved in immutable storage for a minimum of 7 years.",
        "source_page": 1,
        "confidence": 0.96
    },
    {
        "title": "Annual conflict of interest disclosure statement",
        "description": "All faculty members involved in sponsored research must submit an annual conflict of interest disclosure statement.",
        "responsible_unit": "Dean of Faculty Affairs",
        "deadline": "30 April annually",
        "evidence_required": "Signed Annual COI Disclosure Form",
        "penalty": "Disciplinary inquiry and suspension of research incentives",
        "category": "Academic",
        "priority": "High",
        "source_text": "All faculty members involved in sponsored research must submit an annual conflict of interest disclosure statement.",
        "source_page": 1,
        "confidence": 0.97
    }
]


def test_multi_document_end_to_end():
    # 1. Initialize DB tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 2. Upload Document A
    with open(DOC_A_PATH, "rb") as f:
        resp_upload_a = client.post("/documents/upload", files={"file": ("regulens_security_compliance_policy_2026.pdf", f, "application/pdf")})
    assert resp_upload_a.status_code == 201
    doc_a_id = resp_upload_a.json()["id"]
    assert doc_a_id is not None

    # 3. Analyze Document A with mock AI extraction matching PDF A text
    ai_resp_a = AIResponse(
        document=AIDocumentInfo(
            title="ReguLens Cybersecurity & Regulatory Compliance Framework 2026",
            document_type="Regulation",
            language="en",
            version="1.0"
        ),
        obligations=[AIObligation(**item) for item in DOC_A_EXTRACTED]
    )

    with patch("app.services.ai_service.analyze_document", return_value=ai_resp_a):
        resp_analyze_a = client.post(f"/documents/{doc_a_id}/analyze")
    assert resp_analyze_a.status_code == 200
    assert len(resp_analyze_a.json()["obligations"]) == 14

    # 4. Fetch obligations for Document A
    resp_obs_a = client.get(f"/obligations/document/{doc_a_id}")
    assert resp_obs_a.status_code == 200
    obs_a_list = resp_obs_a.json()
    assert len(obs_a_list) == 14
    titles_a = [o["title"] for o in obs_a_list]
    assert any("encryption of sensitive records" in t.lower() for t in titles_a)
    assert any("incident" in t.lower() for t in titles_a)
    assert any("vendor" in t.lower() for t in titles_a)

    # 5. Upload Document B
    with open(DOC_B_PATH, "rb") as f:
        resp_upload_b = client.post("/documents/upload", files={"file": ("academic_research_ethics_guidelines_2026.pdf", f, "application/pdf")})
    assert resp_upload_b.status_code == 201
    doc_b_id = resp_upload_b.json()["id"]
    assert doc_b_id is not None
    assert doc_b_id != doc_a_id

    # 6. Analyze Document B with mock AI extraction matching PDF B text
    ai_resp_b = AIResponse(
        document=AIDocumentInfo(
            title="National Council for Academic Integrity & Research Ethics 2026",
            document_type="Directive",
            language="en",
            version="1.0"
        ),
        obligations=[AIObligation(**item) for item in DOC_B_EXTRACTED]
    )

    with patch("app.services.ai_service.analyze_document", return_value=ai_resp_b):
        resp_analyze_b = client.post(f"/documents/{doc_b_id}/analyze")
    assert resp_analyze_b.status_code == 200
    assert len(resp_analyze_b.json()["obligations"]) == 5

    # 7. Fetch obligations for Document B
    resp_obs_b = client.get(f"/obligations/document/{doc_b_id}")
    assert resp_obs_b.status_code == 200
    obs_b_list = resp_obs_b.json()
    assert len(obs_b_list) == 5
    titles_b = [o["title"] for o in obs_b_list]
    assert any("plagiarism" in t.lower() for t in titles_b)
    assert any("ethics committee" in t.lower() for t in titles_b)
    assert any("conflict of interest" in t.lower() for t in titles_b)

    # 8. CRITICAL VERIFICATION: Document A and Document B obligations MUST be completely distinct!
    assert set(titles_a).isdisjoint(set(titles_b)), "Obligations for Document A and Document B must not overlap!"

    # 9. Verify GET /obligations (all) contains both sets
    all_obs_resp = client.get("/obligations")
    assert all_obs_resp.status_code == 200
    all_obs = all_obs_resp.json()
    assert len(all_obs) >= 19

    print(f"\n[PASS] Multi-Document E2E Test Succeeded!")
    print(f"Document A (ID #{doc_a_id}): {len(obs_a_list)} obligations extracted (Cybersecurity Framework)")
    print(f"Document B (ID #{doc_b_id}): {len(obs_b_list)} obligations extracted (Academic Ethics Directive)")
    print(f"Distinct Obligation Sets Confirmed: Zero intersection between Document A and Document B titles.")


if __name__ == "__main__":
    test_multi_document_end_to_end()
