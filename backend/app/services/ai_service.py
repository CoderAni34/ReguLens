"""
ReguLens AI Service Module
==========================
Production-grade compliance extraction engine using Google Gemini.
Extracts regulatory compliance obligations, deadlines, responsible units,
evidence, and source references from PDF circulars.
"""

import os
import re
import json
import time
import logging
from typing import List, Dict, Any, Optional, Tuple

import pymupdf
import google.generativeai as genai

from app.schemas.ai import AIResponse, AIDocumentInfo, AIObligation
from app.core.config import settings

logger = logging.getLogger("ReguLens.AI")

# Auto-fallback Gemini Model Hierarchy
FALLBACK_MODELS = [
    "models/gemini-3.6-flash",
    "models/gemini-3.7-flash",
    "models/gemini-3.5-flash",
    "models/gemini-flash-latest",
    "models/gemini-3-flash-preview",
]

MAX_PDF_CHARS = 200000
MIN_PDF_CHARS = 500
MAX_RETRIES = 3

EXTRACTION_PROMPT_TEMPLATE = """You are an expert compliance analyst for Indian regulatory frameworks (UGC, AICTE, NAAC, Ministry of Education).

Analyze the following document and extract every single compliance obligation, rule, requirement, or mandatory task mentioned.

Return the result as a strictly valid JSON array.

Rules for output:
1. Return ONLY the JSON array. No conversational text, no preamble, no markdown formatting, no backticks.
2. If info is missing, use 'Not specified'.
3. 'page_number' must be a single integer (e.g. 1). If an obligation spans multiple pages, use the starting page number as an integer.
4. 'source_text' must be the exact quote from the document.
5. 'category' must strictly be one of: Academic, Financial, HR, Compliance, Research, Student Welfare, Other.
6. 'priority' must strictly be one of: High, Medium, Low.

Use this JSON schema for every obligation found:
[
  {{
    "title": "Short descriptive title of the obligation",
    "description": "Clear sentence describing what must be done",
    "deadline": "Date, timeline, or Not specified",
    "responsible_unit": "Person, Department, or Institution or Not specified",
    "evidence_required": "Proof needed or Not specified",
    "penalty": "Consequence if not done or Not specified",
    "source_text": "Exact quote from document",
    "page_number": 1,
    "category": "Academic/Financial/HR/Compliance/Research/Student Welfare/Other",
    "priority": "High/Medium/Low",
    "confidence": 0.95
  }}
]

DOCUMENT:
{document_text}"""


class RegulatoryAIEngine:
    """
    Core AI Extraction Engine using Google Gemini with dynamic model failover.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "gemini_api_key", None) or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not configured. Real API calls will fail unless provided.")
        else:
            genai.configure(api_key=self.api_key)

    def extract_text_from_pdf(self, pdf_path: str) -> Tuple[str, int]:
        """
        Extracts text from PDF with per-page markers.
        Safely records page_count before closing document handle.
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found at: {pdf_path}")

        doc = pymupdf.open(pdf_path)
        page_count = doc.page_count
        pages_text = []
        for i in range(page_count):
            pages_text.append(f"\n--- Page {i + 1} ---\n" + doc[i].get_text())
        doc.close()

        full_text = "".join(pages_text)
        return full_text, page_count

    def _call_gemini_with_fallback(self, prompt: str) -> str:
        """
        Calls Gemini API with automatic model failover across:
        gemini-3-flash-preview -> gemini-3.6-flash -> gemini-3.5-flash -> gemini-flash-latest
        Handles 429 quota exhaustion and 404 model retirement gracefully.
        """
        if not self.api_key:
            self.api_key = os.getenv("GEMINI_API_KEY") or getattr(settings, "gemini_api_key", None)
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY is missing. Please set it in your environment or .env file.")
            genai.configure(api_key=self.api_key)

        last_exception = None

        for model_name in FALLBACK_MODELS:
            try:
                model = genai.GenerativeModel(model_name)
                for attempt in range(1, MAX_RETRIES + 1):
                    try:
                        logger.info(f"Querying Gemini model '{model_name}' (attempt {attempt}/{MAX_RETRIES})...")
                        response = model.generate_content(prompt)
                        if response and response.text:
                            logger.info(f"Successful response received from '{model_name}'.")
                            return response.text
                        raise ValueError("Empty response payload from Gemini API.")
                    except Exception as exc:
                        err = str(exc)
                        last_exception = exc
                        logger.warning(f"Attempt {attempt} failed on '{model_name}': {err[:150]}")
                        
                        # Handle 429 rate limit or 404 retired model by failing over to next model
                        if "429" in err or "quota" in err.lower() or "ResourceExhausted" in err:
                            logger.info(f"Quota threshold reached on '{model_name}'. Rotating to next fallback model...")
                            break
                        if "404" in err or "not found" in err.lower():
                            logger.info(f"Model '{model_name}' unavailable. Rotating to next fallback model...")
                            break
                        time.sleep(2 * attempt)
            except Exception as outer_exc:
                last_exception = outer_exc
                continue

        raise RuntimeError(f"All Gemini model fallbacks exhausted. Last error: {last_exception}")

    def sanitize_and_parse_json(self, raw_response: str) -> List[Dict[str, Any]]:
        """
        Sanitizes raw LLM output, removes markdown wrappers, fixes invalid numeric ranges
        like '34-35', eliminates trailing commas, and handles unescaped characters.
        """
        text = raw_response.strip()

        # Strip markdown fence if present
        if "```" in text:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                text = match.group(1).strip()

        # Extract JSON array boundaries
        start_idx = text.find("[")
        end_idx = text.rfind("]")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            text = text[start_idx : end_idx + 1]

        # Fix unquoted page ranges: "page_number": 34-35 -> "page_number": 34
        text = re.sub(r'("page_number"\s*:\s*)(\d+)\s*[-–—]\s*\d+', r"\1\2", text)
        # Fix string numbers: "page_number": "34" -> "page_number": 34
        text = re.sub(r'("page_number"\s*:\s*)"(\d+)"', r"\1\2", text)
        # Fix trailing commas before closing braces/brackets
        text = re.sub(r',\s*([\]\}])', r"\1", text)

        try:
            data = json.loads(text)
        except Exception:
            text_fixed = re.sub(r'[\x00-\x1f]', lambda m: ' ' if m.group(0) not in '\r\n\t' else m.group(0), text)
            data = json.loads(text_fixed)

        if not isinstance(data, list):
            if isinstance(data, dict):
                for v in data.values():
                    if isinstance(v, list):
                        return v
                return [data]
            return []

        return data

    def extract_obligations(self, pdf_text: str) -> List[Dict[str, Any]]:
        """
        Core extraction interface taking document text and returning structured obligation dictionaries.
        """
        if len(pdf_text.strip()) < MIN_PDF_CHARS:
            raise ValueError(f"Extracted text too short ({len(pdf_text)} chars). Document may be a scanned image.")

        if len(pdf_text) > MAX_PDF_CHARS:
            pdf_text = pdf_text[:MAX_PDF_CHARS]

        prompt = EXTRACTION_PROMPT_TEMPLATE.format(document_text=pdf_text)
        raw_response = self._call_gemini_with_fallback(prompt)
        return self.sanitize_and_parse_json(raw_response)


# Singleton AI engine
ai_engine = RegulatoryAIEngine()


async def analyze_document(document_id: int, file_path: Optional[str] = None) -> AIResponse:
    """
    Main endpoint integration called by POST /documents/{document_id}/analyze.
    Extracts text from the uploaded PDF, processes with Gemini, and constructs an AIResponse.
    """
    # Resolve file path if not passed explicitly
    if not file_path:
        upload_dir = "uploads"
        if os.path.exists(upload_dir):
            files = [os.path.join(upload_dir, f) for f in os.listdir(upload_dir) if os.path.isfile(os.path.join(upload_dir, f))]
            file_path = files[0] if files else None

    if not file_path or not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file for document ID {document_id} was not found on disk at '{file_path}'.")

    # 1. Extract text
    text, page_count = ai_engine.extract_text_from_pdf(file_path)

    # 2. Extract obligations via Gemini
    raw_obligations = ai_engine.extract_obligations(text)

    # 3. Build AIDocumentInfo
    doc_title = os.path.splitext(os.path.basename(file_path))[0].replace("_", " ")
    doc_info = AIDocumentInfo(
        title=doc_title,
        document_type="Regulatory Policy / Circular",
        language="en",
        version="1.0"
    )

    # 4. Construct AIObligation schemas
    pydantic_obligations: List[AIObligation] = []
    for item in raw_obligations:
        desc = str(item.get("description") or item.get("obligation") or "Not specified").strip()
        title = str(item.get("title") or (desc[:60] + "..." if len(desc) > 60 else desc)).strip()
        resp_unit = item.get("responsible_unit") or "Not specified"
        deadline = item.get("deadline") or "Not specified"
        evidence = item.get("evidence_required") or "Not specified"
        penalty = item.get("penalty")
        if penalty and str(penalty).lower() == "not specified":
            penalty = None
        
        category = item.get("category")
        if category and str(category).lower() == "not specified":
            category = None
            
        priority = item.get("priority")
        if priority and str(priority).lower() == "not specified":
            priority = None
            
        source_text = item.get("source_text") or desc

        p_val = item.get("page_number") or item.get("source_page") or 1
        try:
            match = re.search(r"\d+", str(p_val))
            source_page = int(match.group(0)) if match else 1
        except Exception:
            source_page = 1

        try:
            confidence = float(item.get("confidence", 0.95))
            confidence = max(0.0, min(1.0, confidence))
        except Exception:
            confidence = 0.95

        obligation_obj = AIObligation(
            title=title,
            description=desc,
            responsible_unit=resp_unit,
            deadline=deadline,
            evidence_required=evidence,
            penalty=penalty,
            category=category,
            priority=priority,
            source_text=source_text,
            source_page=source_page,
            confidence=confidence
        )
        pydantic_obligations.append(obligation_obj)

    return AIResponse(
        document=doc_info,
        obligations=pydantic_obligations
    )
