"""
ReguLens AI Service Module
==========================
Provider-independent regulatory compliance extraction engine.
Supports NVIDIA Nemotron as Primary AI provider and Google Gemini
as secondary fallback. Extracts regulatory compliance obligations,
deadlines, responsible units, evidence, and source references from PDF circulars.
"""
import asyncio
import os
import re
import json
import logging
from typing import List, Dict, Any, Optional, Tuple

import httpx
import pymupdf
import google.generativeai as genai

from app.schemas.ai import AIResponse, AIDocumentInfo, AIObligation
from app.core.config import settings

logger = logging.getLogger("ReguLens.AI")

# ==============================================================================
# DEFAULT MODEL CONFIGURATIONS
# ==============================================================================
DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_NVIDIA_MODEL = "nvidia/nemotron-3-ultra-550b-a55b"
DEFAULT_GEMINI_MODEL = "models/gemini-3.6-flash"

MAX_PDF_CHARS = 200000
MIN_PDF_CHARS = 500


class AIProviderException(Exception):
    """Base exception for AI provider invocation errors."""
    pass


class AIQuotaExceededException(AIProviderException):
    """Raised when an AI provider returns a 429 Quota Exceeded / Rate Limit error."""
    pass


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
    Provider-Independent Regulatory AI Extraction Engine.
    Coordinates between NVIDIA Nemotron (Primary) and Google Gemini (Fallback).
    """

    def __init__(
        self,
        provider: Optional[str] = None,
        fallback_enabled: Optional[bool] = None,
    ):
        self.provider = (
            provider
            or getattr(settings, "ai_provider", None)
            or os.getenv("AI_PROVIDER")
            or "gemini"
        ).lower()

        self.fallback_enabled = (
            fallback_enabled
            if fallback_enabled is not None
            else getattr(settings, "ai_fallback_enabled", True)
        )

        # Initialize Gemini SDK if Gemini key is configured
        gemini_key = getattr(settings, "gemini_api_key", None) or os.getenv("GEMINI_API_KEY") or getattr(settings, "gemini_api_key_rishav", None)
        if gemini_key:
            genai.configure(api_key=gemini_key)

    def extract_text_from_pdf(self, pdf_path: str) -> Tuple[str, int]:
        """
        Extracts UTF-8 text from PDF with per-page markers.
        Safely collapses redundant whitespace while preserving all content, page boundaries, and Unicode.
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found at: {pdf_path}")

        doc = pymupdf.open(pdf_path)
        page_count = doc.page_count
        pages_text = []
        for i in range(page_count):
            page_raw = doc[i].get_text()
            # Collapse excessive inline spaces and blank lines safely
            cleaned_lines = [
                re.sub(r"[ \t]+", " ", line).strip()
                for line in page_raw.splitlines()
                if line.strip()
            ]
            cleaned_page = "\n".join(cleaned_lines)
            pages_text.append(f"\n--- Page {i + 1} ---\n" + cleaned_page)
        doc.close()

        full_text = "\n".join(pages_text).strip()
        return full_text, page_count

    def _call_nvidia(self, prompt: str) -> str:
        """
        Executes a single, direct request to the NVIDIA Nemotron OpenAI-compatible endpoint.
        """
        api_key = getattr(settings, "nvidia_api_key", None) or os.getenv("NVIDIA_API_KEY")
        if not api_key:
            raise AIProviderException(
                "NVIDIA_API_KEY is not configured. Please set it in your environment or backend/.env file."
            )

        base_url = (
            getattr(settings, "nvidia_base_url", None)
            or os.getenv("NVIDIA_BASE_URL")
            or DEFAULT_NVIDIA_BASE_URL
        ).rstrip("/")

        model_name = (
            getattr(settings, "nvidia_model", None)
            or os.getenv("NVIDIA_MODEL")
            or DEFAULT_NVIDIA_MODEL
        )

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "max_tokens": 4096,
        }

        logger.info(f"Querying NVIDIA Nemotron model '{model_name}' via '{base_url}'...")

        try:
            with httpx.Client(timeout=120.0) as client:
                response = client.post(f"{base_url}/chat/completions", headers=headers, json=payload)

                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0] and "content" in choices[0]["message"]:
                        content = choices[0]["message"]["content"]
                        if content and content.strip():
                            logger.info(f"Successful extraction payload received from NVIDIA Nemotron ('{model_name}').")
                            return content
                    raise AIProviderException("Empty response payload received from NVIDIA Nemotron API.")

                # Quota / Rate limit (429)
                if response.status_code == 429:
                    logger.warning(f"NVIDIA API quota reached (429) on model '{model_name}'.")
                    raise AIQuotaExceededException(
                        "AI analysis quota is temporarily exhausted. Please try again later."
                    )

                # Service Overloaded (503)
                if response.status_code == 503:
                    logger.warning(f"NVIDIA API service temporarily overloaded (503) on model '{model_name}'.")
                    raise AIProviderException(
                        "NVIDIA AI service is temporarily overloaded (HTTP 503). Please try again shortly."
                    )

                # Auth failure (401/403)
                if response.status_code in (401, 403):
                    logger.error(f"NVIDIA API authentication failed ({response.status_code}).")
                    raise AIProviderException("NVIDIA API authentication failed. Please verify your NVIDIA_API_KEY.")

                # Other HTTP errors
                err_text = response.text[:300]
                logger.error(f"NVIDIA API request failed ({response.status_code}): {err_text}")
                raise AIProviderException(f"NVIDIA API error ({response.status_code}): {err_text}")

        except (AIProviderException, AIQuotaExceededException):
            raise
        except Exception as exc:
            logger.error(f"NVIDIA API connection error: {type(exc).__name__}: {str(exc)}")
            raise AIProviderException(f"NVIDIA API connection error: {str(exc)}") from exc

    def _call_gemini(self, prompt: str) -> str:
        """
        Executes a single, direct request to the Google Gemini model.
        Fast-fails on 429 quota exhaustion without triggering retry storms.
        """
        api_key = getattr(settings, "gemini_api_key", None) or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise AIProviderException("GEMINI_API_KEY is not configured.")

        genai.configure(api_key=api_key)

        model_name = (
            getattr(settings, "gemini_model", None)
            or os.getenv("GEMINI_MODEL")
            or DEFAULT_GEMINI_MODEL
        )

        logger.info(f"Querying Google Gemini model '{model_name}'...")

        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)

            if response and response.text:
                logger.info(f"Successful extraction payload received from Gemini ('{model_name}').")
                return response.text

            raise AIProviderException("Empty response payload received from Gemini API.")

        except Exception as exc:
            err_msg = str(exc)
            err_lower = err_msg.lower()

            if "429" in err_msg or "quota" in err_lower or "resourceexhausted" in err_lower:
                logger.warning(f"Gemini API quota reached (429) on model '{model_name}'.")
                raise AIQuotaExceededException(
                    "AI analysis quota is temporarily exhausted. Please try again later."
                ) from exc

            if "404" in err_msg or "not found" in err_lower:
                raise AIProviderException(f"Configured Gemini model '{model_name}' was not found.") from exc

            raise AIProviderException(f"Gemini analysis error: {err_msg}") from exc

    def _execute_ai_call(self, prompt: str) -> Tuple[str, str]:
        """
        Executes the AI call using the configured provider with automatic fallback if enabled.
        Returns: (raw_response_text, provider_used)
        """
        active_provider = (
            getattr(settings, "ai_provider", None)
            or os.getenv("AI_PROVIDER")
            or self.provider
            or "nvidia"
        ).lower()

        fallback_enabled = getattr(settings, "ai_fallback_enabled", self.fallback_enabled)

        if active_provider == "gemini":
            try:
                raw_text = self._call_gemini(prompt)
                # Verify parseability
                parsed = self.sanitize_and_parse_json(raw_text)
                if not parsed and fallback_enabled:
                    nvidia_key = getattr(settings, "nvidia_api_key", None) or os.getenv("NVIDIA_API_KEY")
                    if nvidia_key:
                        logger.warning(
                            "Primary AI provider 'gemini' returned unparseable JSON output. "
                            "Attempting controlled fallback to NVIDIA Nemotron Ultra (AI_FALLBACK_ENABLED=true)..."
                        )
                        try:
                            raw_text = self._call_nvidia(prompt)
                            return raw_text, "nvidia-fallback"
                        except Exception as fallback_exc:
                            logger.error(f"Fallback provider 'nvidia' also failed: {fallback_exc}")
                return raw_text, "gemini"

            except AIQuotaExceededException as quota_exc:
                if fallback_enabled:
                    nvidia_key = getattr(settings, "nvidia_api_key", None) or os.getenv("NVIDIA_API_KEY")
                    if nvidia_key:
                        logger.warning(
                            "Gemini API quota reached (429). Attempting controlled fallback to NVIDIA Nemotron Ultra..."
                        )
                        try:
                            raw_text = self._call_nvidia(prompt)
                            return raw_text, "nvidia-fallback"
                        except Exception as fallback_exc:
                            logger.error(f"Fallback provider 'nvidia' also failed: {fallback_exc}")
                            raise quota_exc
                raise quota_exc

            except Exception as primary_exc:
                if fallback_enabled:
                    nvidia_key = getattr(settings, "nvidia_api_key", None) or os.getenv("NVIDIA_API_KEY")
                    if nvidia_key:
                        logger.warning(
                            f"Primary AI provider 'gemini' failed: {primary_exc}. "
                            f"Attempting controlled fallback to NVIDIA Nemotron Ultra (AI_FALLBACK_ENABLED=true)..."
                        )
                        try:
                            raw_text = self._call_nvidia(prompt)
                            return raw_text, "nvidia-fallback"
                        except Exception as fallback_exc:
                            logger.error(f"Fallback provider 'nvidia' also failed: {fallback_exc}")
                            raise fallback_exc
                raise primary_exc

        elif active_provider == "nvidia":
            try:
                raw_text = self._call_nvidia(prompt)
                return raw_text, "nvidia"
            except AIQuotaExceededException as quota_exc:
                if fallback_enabled:
                    gemini_key = getattr(settings, "gemini_api_key", None) or os.getenv("GEMINI_API_KEY")
                    if gemini_key:
                        logger.warning(
                            "NVIDIA API quota reached (429). Attempting controlled fallback to Google Gemini..."
                        )
                        try:
                            raw_text = self._call_gemini(prompt)
                            return raw_text, "gemini-fallback"
                        except Exception as fallback_exc:
                            logger.error(f"Fallback provider 'gemini' also failed: {fallback_exc}")
                            raise fallback_exc
                raise quota_exc
            except Exception as primary_exc:
                if fallback_enabled:
                    gemini_key = getattr(settings, "gemini_api_key", None) or os.getenv("GEMINI_API_KEY")
                    if gemini_key:
                        logger.warning(
                            f"Primary AI provider 'nvidia' failed: {primary_exc}. "
                            f"Falling back to secondary provider 'gemini' (AI_FALLBACK_ENABLED=true)..."
                        )
                        try:
                            raw_text = self._call_gemini(prompt)
                            return raw_text, "gemini-fallback"
                        except Exception as fallback_exc:
                            logger.error(f"Fallback provider 'gemini' also failed: {fallback_exc}")
                            raise fallback_exc
                raise primary_exc

        else:
            raise AIProviderException(f"Unsupported AI_PROVIDER '{active_provider}'. Supported: 'gemini', 'nvidia'.")


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
            try:
                text_fixed = re.sub(r'[\x00-\x1f]', lambda m: ' ' if m.group(0) not in '\r\n\t' else m.group(0), text)
                data = json.loads(text_fixed)
            except Exception:
                return []

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
        raw_response, provider_used = self._execute_ai_call(prompt)
        logger.info(f"Obligation extraction completed using provider: '{provider_used}'")
        return self.sanitize_and_parse_json(raw_response)


# Singleton AI engine
ai_engine = RegulatoryAIEngine()


async def analyze_document(
    document_id: int,
    file_path: Optional[str] = None,
    doc_title: Optional[str] = None,
) -> AIResponse:
    """
    Main endpoint integration called by POST /documents/{document_id}/analyze.
    Extracts text from the uploaded PDF, processes with the configured AI provider
    (NVIDIA Nemotron Primary / Gemini Fallback), and constructs an AIResponse.
    Does not generate mock obligations on failure.
    """
    # Resolve file path if not passed explicitly
    if not file_path:
        upload_dir = "uploads"
        if os.path.exists(upload_dir):
            files = [
                os.path.join(upload_dir, f)
                for f in os.listdir(upload_dir)
                if os.path.isfile(os.path.join(upload_dir, f))
            ]
            file_path = files[0] if files else None

    if not file_path or not os.path.exists(file_path):
        raise FileNotFoundError(
            f"PDF file for document ID {document_id} was not found on disk at '{file_path}'."
        )

    logger.info(f"Starting analysis for document #{document_id} ('{file_path}')")

    # 1. Extract text from PDF in worker thread
    text, page_count = await asyncio.to_thread(
        ai_engine.extract_text_from_pdf,
        file_path
    )

    logger.info(f"Extracted {len(text)} characters across {page_count} pages.")

    # 2. Extract obligations via configured AI provider in worker thread
    raw_obligations = await asyncio.to_thread(
        ai_engine.extract_obligations,
        text
    )

    logger.info(f"AI returned {len(raw_obligations)} structured obligations.")

    final_title = doc_title or (
        os.path.splitext(os.path.basename(file_path))[0].replace("_", " ")
    )

    doc_info = AIDocumentInfo(
        title=final_title,
        document_type="Regulatory Policy / Circular",
        language="en",
        version="1.0",
    )

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

        pydantic_obligations.append(
            AIObligation(
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
                confidence=confidence,
            )
        )

    return AIResponse(
        document=doc_info,
        obligations=pydantic_obligations,
    )