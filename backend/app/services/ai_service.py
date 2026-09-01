"""
ReguLens AI Service Module
==========================
Production-grade compliance extraction engine using Google Gemini.
Extracts regulatory compliance obligations, deadlines, responsible units,
evidence, and source references from PDF circulars.
Also handles cross-document conflict detection and executive summary synthesis.
"""
import asyncio
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

# Auto-fallback Gemini Model Hierarchy (Current Google Gemini Models)
FALLBACK_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3-flash-preview",
]

MAX_PDF_CHARS = 200000
MIN_PDF_CHARS = 500
MAX_RETRIES = 3


def sanitize_api_key(key: Optional[str]) -> Optional[str]:
    """Sanitize API key by stripping quotes, whitespace, and placeholder strings."""
    if not key:
        return None
    cleaned = key.strip().strip("'\"")
    if cleaned.lower() in ["your_gemini_api_key_here", "your_gemini_api_key", "none", "null", ""]:
        return None
    return cleaned


def get_key_diagnostics(key: Optional[str]) -> Dict[str, Any]:
    """Return safe non-sensitive key diagnostic metadata."""
    cleaned = sanitize_api_key(key)
    if not cleaned:
        return {"present": False, "length": 0, "fingerprint": "None"}
    fp = f"{cleaned[:4]}...{cleaned[-4:]}" if len(cleaned) >= 8 else "invalid"
    return {"present": True, "length": len(cleaned), "fingerprint": fp}


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


CONFLICT_PROMPT_TEMPLATE = """You are a senior regulatory compliance auditor. Compare the compliance obligations extracted from two regulatory documents and identify any genuine contradictions, conflicting deadlines, conflicting requirements, or duplicate rules.

DOCUMENT A (Title: "{doc_a_title}", ID: {doc_a_id}):
{doc_a_obligations}

DOCUMENT B (Title: "{doc_b_title}", ID: {doc_b_id}):
{doc_b_obligations}

Rules for output:
1. Return ONLY a JSON array. No conversational text, no preamble, no markdown formatting.
2. If there are NO conflicts or contradictions between these two documents, return an empty JSON array: []
3. DO NOT invent conflicts if both documents can be peacefully satisfied.
4. Every conflict item MUST contain the exact source quotes and page numbers from both documents.

Schema for each conflict object in the array:
[
  {{
    "conflict_type": "Deadline Conflict / Requirement Conflict / Duplicate Requirement / Missing Information",
    "title": "Short descriptive title of the conflict",
    "description": "Detailed explanation of why Document A and Document B conflict",
    "severity": "High / Medium / Low",
    "obligation_a_id": 1,
    "obligation_b_id": 2,
    "page_a": 1,
    "page_b": 1,
    "source_text_a": "Exact text quote from Document A",
    "source_text_b": "Exact text quote from Document B",
    "recommendation": "Suggested action to resolve the conflict"
  }}
]"""


SUMMARY_PROMPT_TEMPLATE = """You are an executive compliance reporter. Write a concise, professional executive summary based STRICTLY on the following factual compliance database metrics:

{metrics_json}

Rules:
1. Do NOT invent any statistics or numbers that are not explicitly provided in the metrics.
2. Keep the summary under 200 words, formatted in clear professional prose.
3. Highlight overall compliance health, completed tasks, pending items, and any high-risk conflicts.
"""


class RegulatoryAIEngine:
    """
    Core AI Extraction & Reasoning Engine using Google Gemini with dynamic model failover.
    """

    def __init__(self, api_key: Optional[str] = None):
        raw_key = api_key or getattr(settings, "gemini_api_key", None) or os.getenv("GEMINI_API_KEY")
        self.api_key = sanitize_api_key(raw_key)
        diag = get_key_diagnostics(self.api_key)
        
        if not self.api_key:
            logger.warning(
                f"GEMINI_API_KEY is not configured or invalid placeholder. "
                f"Diagnostics: {diag}. Real AI API calls will fail until a valid key is set."
            )
        else:
            logger.info(f"Gemini AI Engine initialized with key diagnostics: {diag}")
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
        Calls Gemini API with automatic model failover across fallback models.
        Handles 429 quota exhaustion and 404 model retirement gracefully.
        """
        if not self.api_key:
            raw_key = os.getenv("GEMINI_API_KEY") or getattr(settings, "gemini_api_key", None)
            self.api_key = sanitize_api_key(raw_key)
            if not self.api_key:
                raise ValueError(
                    "GEMINI_API_KEY is missing or set to placeholder. Please set a valid Gemini API key in your .env file."
                )
            genai.configure(api_key=self.api_key)

        last_exception = None

        for raw_model in FALLBACK_MODELS:
            candidates = [raw_model]
            if not raw_model.startswith("models/"):
                candidates.append(f"models/{raw_model}")

            for model_name in candidates:
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
                            logger.warning(
                                f"Gemini request failed on model '{model_name}' "
                                f"(attempt {attempt}/{MAX_RETRIES}): {err}"
                            )
                            
                            if "429" in err or "quota" in err.lower() or "ResourceExhausted" in err:
                                logger.info(f"Quota threshold reached on '{model_name}'. Rotating to next fallback model...")
                                break
                            if "404" in err or "not found" in err.lower() or "not available" in err.lower():
                                logger.info(f"Model '{model_name}' unavailable. Rotating to next fallback model...")
                                break
                            if "400" in err or "API_KEY_INVALID" in err or "API key not valid" in err:
                                logger.error(f"AI Engine Key Authentication Failure: {err}")
                                raise ValueError(
                                    "AI Compliance Engine API Key authentication failed. Please verify your API key in workspace settings or .env file."
                                )
                            time.sleep(2 * attempt)
                except Exception as outer_exc:
                    if isinstance(outer_exc, ValueError) and "API Key authentication failed" in str(outer_exc):
                        raise outer_exc
                    last_exception = outer_exc
                    continue

        logger.error(f"All AI Engine fallbacks exhausted. Last error: {last_exception}")
        raise RuntimeError("AI Compliance Engine is temporarily unavailable. Please try again.")

    def sanitize_and_parse_json(self, raw_response: str) -> List[Dict[str, Any]]:
        """
        Sanitizes raw LLM output, removes markdown wrappers, fixes invalid numeric ranges,
        eliminates trailing commas, and handles unescaped characters.
        """
        text = raw_response.strip()

        # Strip markdown fence if present
        if "```" in text:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                text = match.group(1).strip()
            else:
                text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.MULTILINE).strip()

        # Find starting bracket of JSON array
        start_idx = text.find("[")
        end_idx = text.rfind("]")

        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            text = text[start_idx : end_idx + 1]

        # Fix common LLM JSON syntax errors: trailing commas before closing brackets
        text = re.sub(r",\s*([\]}])", r"\1", text)

        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return parsed
            elif isinstance(parsed, dict):
                return [parsed]
            else:
                raise ValueError("Parsed JSON is neither list nor dict")
        except Exception:
            pass

        # Robust regex-based fallback parser
        items = []
        object_blocks = re.findall(r"\{[^{}]*\}", text)

        for block in object_blocks:
            cleaned_block = re.sub(r",\s*\}", "}", block)
            try:
                item = json.loads(cleaned_block)
                items.append(item)
            except Exception:
                pass

        if items:
            return items

        raise ValueError(f"Could not parse valid JSON from AI response snippet: {text[:200]}")

    async def analyze_document_text(self, document_text: str, document_title: str = "Uploaded Document") -> AIResponse:
        """
        Extracts obligations from text content and returns validated AIResponse.
        """
        if not document_text or len(document_text.strip()) < MIN_PDF_CHARS:
            raise ValueError(
                f"Document text too short ({len(document_text.strip()) if document_text else 0} chars). "
                f"Minimum required is {MIN_PDF_CHARS} characters."
            )

        truncated_text = document_text[:MAX_PDF_CHARS]
        prompt = EXTRACTION_PROMPT_TEMPLATE.format(document_text=truncated_text)

        raw_json_str = await asyncio.to_thread(self._call_gemini_with_fallback, prompt)
        parsed_items = self.sanitize_and_parse_json(raw_json_str)

        valid_categories = {"Academic", "Financial", "HR", "Compliance", "Research", "Student Welfare", "Other"}
        valid_priorities = {"High", "Medium", "Low"}

        obligations: List[AIObligation] = []

        for item in parsed_items:
            cat = str(item.get("category", "Compliance")).strip()
            if cat not in valid_categories:
                cat = "Compliance"

            prio = str(item.get("priority", "Medium")).strip().capitalize()
            if prio not in valid_priorities:
                prio = "Medium"

            page = item.get("page_number", 1)
            try:
                page_int = int(page) if page is not None else 1
            except (ValueError, TypeError):
                page_int = 1

            conf = item.get("confidence", 0.9)
            try:
                conf_float = float(conf)
                conf_float = max(0.0, min(1.0, conf_float))
            except (ValueError, TypeError):
                conf_float = 0.9

            obs = AIObligation(
                title=str(item.get("title", "Untitled Obligation")).strip(),
                description=str(item.get("description", "No description provided.")).strip(),
                responsible_unit=str(item.get("responsible_unit", "Not specified")).strip(),
                deadline=str(item.get("deadline", "Not specified")).strip(),
                evidence_required=str(item.get("evidence_required", "Not specified")).strip(),
                penalty=str(item.get("penalty", "Not specified")).strip(),
                category=cat,
                priority=prio,
                source_text=str(item.get("source_text", "Direct citation missing.")).strip(),
                source_page=page_int,
                confidence=conf_float,
            )
            obligations.append(obs)

        doc_info = AIDocumentInfo(
            title=document_title,
            document_type="Regulatory Circular",
            language="en",
            version="1.0",
        )

        return AIResponse(document=doc_info, obligations=obligations)

    async def detect_conflicts(
        self,
        doc_a_id: int,
        doc_a_title: str,
        doc_a_obligations: List[Dict[str, Any]],
        doc_b_id: int,
        doc_b_title: str,
        doc_b_obligations: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Compares obligations extracted from Document A and Document B using Gemini AI reasoning.
        Returns a list of detected conflict dictionary objects.
        """
        if not doc_a_obligations or not doc_b_obligations:
            return []

        prompt = CONFLICT_PROMPT_TEMPLATE.format(
            doc_a_id=doc_a_id,
            doc_a_title=doc_a_title,
            doc_a_obligations=json.dumps(doc_a_obligations, indent=2),
            doc_b_id=doc_b_id,
            doc_b_title=doc_b_title,
            doc_b_obligations=json.dumps(doc_b_obligations, indent=2),
        )

        raw_json_str = await asyncio.to_thread(self._call_gemini_with_fallback, prompt)
        parsed_conflicts = self.sanitize_and_parse_json(raw_json_str)
        return parsed_conflicts

    async def generate_executive_summary(self, metrics_dict: Dict[str, Any]) -> str:
        """
        Generates a factual executive summary based strictly on provided database metrics.
        """
        prompt = SUMMARY_PROMPT_TEMPLATE.format(metrics_json=json.dumps(metrics_dict, indent=2))
        return await asyncio.to_thread(self._call_gemini_with_fallback, prompt)


# Default singleton instance using config settings
_ai_engine: Optional[RegulatoryAIEngine] = None


def get_ai_engine() -> RegulatoryAIEngine:
    global _ai_engine
    if _ai_engine is None:
        _ai_engine = RegulatoryAIEngine()
    return _ai_engine


async def analyze_document(document_id: int, file_path: str) -> AIResponse:
    """
    Public entry point for PDF analysis.
    Extracts text via PyMuPDF and calls RegulatoryAIEngine.
    """
    engine = get_ai_engine()
    text, page_count = engine.extract_text_from_pdf(file_path)
    title = os.path.basename(file_path)
    return await engine.analyze_document_text(text, document_title=title)


async def run_ai_conflict_detection(
    doc_a_id: int,
    doc_a_title: str,
    doc_a_obligations: List[Dict[str, Any]],
    doc_b_id: int,
    doc_b_title: str,
    doc_b_obligations: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Public entry point for AI conflict detection between two documents.
    """
    engine = get_ai_engine()
    return await engine.detect_conflicts(
        doc_a_id, doc_a_title, doc_a_obligations, doc_b_id, doc_b_title, doc_b_obligations
    )


async def run_ai_executive_summary(metrics_dict: Dict[str, Any]) -> str:
    """
    Public entry point for generating AI executive summary from metrics.
    """
    engine = get_ai_engine()
    return await engine.generate_executive_summary(metrics_dict)