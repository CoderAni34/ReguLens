import asyncio
from app.schemas.ai import AIResponse

async def analyze_document(document_id: int) -> AIResponse:
    """
    Mock AI integration layer.
    In the future, this will call the actual AI pipeline built by Anshuman.
    """
    # Simulate processing delay
    await asyncio.sleep(2)
    
    mock_data = {
        "document": {
            "title": "Sample Mock Regulation Act 2026",
            "document_type": "regulation",
            "language": "en",
            "version": "1.0"
        },
        "obligations": [
            {
                "title": "Annual Compliance Report",
                "description": "All educational institutions must submit an annual compliance report by end of Q1.",
                "responsible_unit": "Compliance Department",
                "deadline": "2026-03-31",
                "evidence_required": "Signed audit report",
                "source_text": "Section 4(a): All educational institutions must submit an annual compliance report by end of Q1.",
                "source_page": 12,
                "confidence": 0.95
            },
            {
                "title": "Data Privacy Audit",
                "description": "Conduct a bi-annual audit of student data privacy practices.",
                "responsible_unit": "IT Security",
                "deadline": None,
                "evidence_required": "Audit logs and certification",
                "source_text": "Section 9: Institutions shall conduct a bi-annual audit of student data privacy practices.",
                "source_page": 24,
                "confidence": 0.88
            }
        ]
    }
    
    return AIResponse(**mock_data)
