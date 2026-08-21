"""
Generate realistic regulatory compliance test PDFs for ReguLens end-to-end verification.
"""
import os
import pymupdf

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAMPLE_DIR = os.path.join(BASE_DIR, "sample-data", "documents")
os.makedirs(SAMPLE_DIR, exist_ok=True)


def generate_security_policy_pdf():
    """
    Document A: ReguLens Cybersecurity & Regulatory Compliance Framework 2026
    Contains 14 mandatory obligations.
    """
    doc = pymupdf.open()
    
    # Page 1
    page1 = doc.new_page()
    text_p1 = """REGULENS CYBERSECURITY & REGULATORY COMPLIANCE FRAMEWORK (CIRCULAR 2026/04)

SECTION 1: DATA PROTECTION & ACCESS GOVERNANCE
1.1 All regulated organizations must implement AES-256 encryption of sensitive records both in transit and at rest. Responsible Unit: IT Security Team. Deadline: 31 March 2026. Evidence: Cryptographic key management log. Penalty: Immediate suspension of data processing authority.
1.2 Institutions shall enforce strict role-based access control (RBAC) across all compliance and administrative systems. Responsible Unit: System Administration. Deadline: Within 30 days of circular issuance. Evidence: Access control matrix and user privilege report.
1.3 Mandatory access reviews must be conducted every 90 days for all privileged user accounts. Responsible Unit: Internal Audit. Deadline: End of each financial quarter. Evidence: Signed access review audit sign-off. Penalty: Administrative penalty of INR 50,000 per violation.

SECTION 2: INCIDENT RESPONSE & REPORTING
2.1 All security and compliance incidents must be reported to the central oversight authority within 24 hours of confirmation. Responsible Unit: Incident Response Team. Deadline: Within 24 hours. Evidence: Formal Incident Disclosure Ticket (Form IR-1). Penalty: Statutory fine of up to INR 5,00,000.
2.2 The institution shall maintain a comprehensive incident register containing timestamps, severity classifications, and containment actions. Responsible Unit: Compliance Office. Deadline: Continuous / Real-time. Evidence: Central Incident Management Ledger.
2.3 A critical incident review and root cause analysis report must be submitted within 2 business days following incident resolution. Responsible Unit: Chief Information Security Officer (CISO). Deadline: Within 2 business days. Evidence: Post-Mortem Incident Summary."""
    page1.insert_text((40, 40), text_p1, fontsize=10)

    # Page 2
    page2 = doc.new_page()
    text_p2 = """SECTION 3: RECORD RETENTION & AUDIT REQUIREMENTS
3.1 All regulatory transaction logs, audit trails, and compliance filings must be securely retained for a minimum period of 5 years. Responsible Unit: Records & Archival Unit. Deadline: Ongoing 5-year retention cycle. Evidence: Tamper-proof archival storage receipts.
3.2 An independent third-party annual compliance audit must be completed by an accredited CERT-In auditor. Responsible Unit: Executive Board. Deadline: 31 December annually. Evidence: Certified Independent Compliance Audit Report. Penalty: Regulatory non-compliance notice and blacklisting.
3.3 If audit non-conformities are identified, a formal remediation plan must be submitted within 15 calendar days of report receipt. Responsible Unit: Operations Compliance Lead. Deadline: Within 15 calendar days. Evidence: Remediation Roadmap and Action Plan.

SECTION 4: TRAINING & PERSONNEL COMPLIANCE
4.1 All new employees and contractors must undergo compliance and data security training before obtaining production access. Responsible Unit: Human Resources & Security. Deadline: Prior to credential provisioning. Evidence: Training completion certificate.
4.2 Annual refresher compliance training must be completed every 12 months by all active staff members. Responsible Unit: HR Department. Deadline: Annual recurrence by Q4. Evidence: Annual training attendance and assessment scores.

SECTION 5: THIRD-PARTY & VENDOR RISK GOVERNANCE
5.1 A comprehensive vendor risk assessment must be completed before granting any third-party access to internal systems. Responsible Unit: Vendor Management Office. Deadline: Prior to contract execution. Evidence: Completed Vendor Due Diligence Questionnaire.
5.2 Regular third-party vendor access reviews must be conducted every 6 months to evaluate continuous necessity. Responsible Unit: Procurement & IT. Deadline: Bi-annual (June 30 and December 31). Evidence: Vendor Access Recertification Sheet.
5.3 Unnecessary or terminated third-party vendor access must be revoked within 5 business days of contract conclusion. Responsible Unit: Identity Access Management. Deadline: Within 5 business days. Evidence: Access Deprovisioning Timestamped Log."""
    page2.insert_text((40, 40), text_p2, fontsize=10)

    filepath = os.path.join(SAMPLE_DIR, "regulens_security_compliance_policy_2026.pdf")
    doc.save(filepath)
    doc.close()
    print(f"Generated Document A: {filepath}")
    return filepath


def generate_academic_ethics_pdf():
    """
    Document B: UGC & National Research Ethics Directive 2026
    Contains distinct academic obligations.
    """
    doc = pymupdf.open()
    
    # Page 1
    page1 = doc.new_page()
    text_p1 = """NATIONAL COUNCIL FOR ACADEMIC INTEGRITY & RESEARCH ETHICS (DIRECTIVE 2026/08)

SECTION 1: ETHICAL CLEARANCE & PROTOCOLS
1. All human and animal subject research studies must receive prior written approval from the Institutional Ethics Committee (IEC). Responsible Unit: Principal Investigators & Research Dean. Deadline: Prior to study commencement. Evidence: Official IEC Approval Certificate. Penalty: Revocation of research grant and publication invalidation.
2. Every doctoral dissertation and postgraduate thesis must undergo mandatory automated plagiarism screening with similarity strictly below 10%. Responsible Unit: University Academic Cell. Deadline: Before thesis submission. Evidence: Certified Anti-Plagiarism Similarity Report. Penalty: Rejection of dissertation submission.

SECTION 2: PROGRESS MONITORING & LAB SAFETY
3. Higher education institutions must submit quarterly research progress and compliance reports for all government-funded projects. Responsible Unit: Directorate of Research. Deadline: Within 15 days following quarter end. Evidence: Quarterly Project Progress Docket.
4. Physical and digital laboratory research notebooks must be preserved in immutable storage for a minimum of 7 years. Responsible Unit: Department Heads & Chief Archivist. Deadline: Ongoing 7-year archival. Evidence: Laboratory Log Register Index.
5. All faculty members involved in sponsored research must submit an annual conflict of interest disclosure statement. Responsible Unit: Dean of Faculty Affairs. Deadline: 30 April annually. Evidence: Signed Annual COI Disclosure Form. Penalty: Disciplinary inquiry and suspension of research incentives."""
    page1.insert_text((40, 40), text_p1, fontsize=10)

    filepath = os.path.join(SAMPLE_DIR, "academic_research_ethics_guidelines_2026.pdf")
    doc.save(filepath)
    doc.close()
    print(f"Generated Document B: {filepath}")
    return filepath


if __name__ == "__main__":
    generate_security_policy_pdf()
    generate_academic_ethics_pdf()
