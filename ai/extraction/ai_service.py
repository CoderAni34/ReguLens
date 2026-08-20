"""
ReguLens Standalone AI Extraction CLI Module
============================================
Autonomous batch compliance intelligence for Indian institutional frameworks (UGC, AICTE, NAAC, MoE).
Extracts structured compliance obligations directly from regulatory PDF circulars.
"""

import os
import sys
import re
import json
import time
import argparse
import logging
from typing import List, Dict, Any, Optional, Tuple

import pymupdf
import google.generativeai as genai

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ReguLens.CLI")

FALLBACK_MODELS = [
    "models/gemini-3-flash-preview",
    "models/gemini-3.6-flash",
    "models/gemini-3.5-flash",
    "models/gemini-flash-latest"
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
    "obligation": "Clear sentence describing the rule/task",
    "deadline": "Date, timeline, or Not specified",
    "responsible_unit": "Person, Department, or Institution or Not specified",
    "evidence_required": "Proof needed or Not specified",
    "penalty": "Consequence if not done or Not specified",
    "source_text": "Exact quote from document",
    "page_number": 1,
    "category": "Academic/Financial/HR/Compliance/Research/Student Welfare/Other",
    "priority": "High/Medium/Low"
  }}
]

DOCUMENT:
{document_text}"""


class ComplianceExtractor:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is missing. Please set it before running.")
        genai.configure(api_key=self.api_key)

    def extract_text_from_pdf(self, pdf_path: str) -> Tuple[str, int]:
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        doc = pymupdf.open(pdf_path)
        page_count = doc.page_count
        pages_text = []
        for i in range(page_count):
            pages_text.append(f"\n--- Page {i + 1} ---\n" + doc[i].get_text())
        doc.close()

        full_text = "".join(pages_text)
        return full_text, page_count

    def _call_gemini_with_fallback(self, prompt: str) -> str:
        last_exception = None
        for model_name in FALLBACK_MODELS:
            try:
                model = genai.GenerativeModel(model_name)
                for attempt in range(1, MAX_RETRIES + 1):
                    try:
                        logger.info(f"Querying Gemini model '{model_name}' (attempt {attempt}/{MAX_RETRIES})...")
                        response = model.generate_content(prompt)
                        if response and response.text:
                            return response.text
                        raise ValueError("Empty response payload received from Gemini.")
                    except Exception as e:
                        err = str(e)
                        last_exception = e
                        logger.warning(f"Model '{model_name}' attempt {attempt} failed: {err[:150]}")
                        if "429" in err or "quota" in err.lower() or "ResourceExhausted" in err:
                            break
                        if "404" in err or "not found" in err.lower():
                            break
                        time.sleep(2 * attempt)
            except Exception as outer_e:
                last_exception = outer_e
                continue

        raise RuntimeError(f"All Gemini models failed. Last error: {last_exception}")

    def sanitize_and_parse_json(self, raw_response: str) -> List[Dict[str, Any]]:
        text = raw_response.strip()
        if "```" in text:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                text = match.group(1).strip()

        start_idx = text.find("[")
        end_idx = text.rfind("]")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            text = text[start_idx : end_idx + 1]

        text = re.sub(r'("page_number"\s*:\s*)(\d+)\s*[-–—]\s*\d+', r"\1\2", text)
        text = re.sub(r'("page_number"\s*:\s*)"(\d+)"', r"\1\2", text)
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

    def process_file(self, pdf_path: str, output_file: Optional[str] = None) -> List[Dict[str, Any]]:
        logger.info(f"Processing PDF: {pdf_path}")
        text, page_count = self.extract_text_from_pdf(pdf_path)
        logger.info(f"Loaded {len(text):,} chars across {page_count} pages.")

        if len(text.strip()) < MIN_PDF_CHARS:
            logger.warning(f"File {pdf_path} has < {MIN_PDF_CHARS} chars (scanned/empty PDF). Skipping.")
            return []

        if len(text) > MAX_PDF_CHARS:
            logger.info(f"Truncating text from {len(text):,} to {MAX_PDF_CHARS:,} chars.")
            text = text[:MAX_PDF_CHARS]

        prompt = EXTRACTION_PROMPT_TEMPLATE.format(document_text=text)
        raw = self._call_gemini_with_fallback(prompt)
        obligations = self.sanitize_and_parse_json(raw)
        logger.info(f"Successfully extracted {len(obligations)} compliance obligations.")

        if output_file:
            os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(obligations, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved output to: {output_file}")

        return obligations


def main():
    parser = argparse.ArgumentParser(description="ReguLens Standalone Compliance Extractor CLI")
    parser.add_argument("--input", "-i", required=True, help="Input PDF file path")
    parser.add_argument("--output", "-o", help="Output JSON file path")
    args = parser.parse_args()

    extractor = ComplianceExtractor()
    extractor.process_file(args.input, args.output)


if __name__ == "__main__":
    main()
