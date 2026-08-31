"""
Unit Tests for Provider-Independent AI Architecture
===================================================
Tests Gemini Primary, NVIDIA Nemotron fallback, provider selection, configuration,
and error handling without consuming live API quotas (using mocks).
"""
import pytest
from unittest.mock import patch, MagicMock

from app.core.config import settings
from app.services.ai_service import (
    RegulatoryAIEngine,
    AIProviderException,
    AIQuotaExceededException,
    EXTRACTION_PROMPT_TEMPLATE,
)
from app.schemas.ai import AIObligation, AIResponse


MOCK_GEMINI_SUCCESS_JSON = """[
  {
    "title": "Mandatory Data Protection Assessment",
    "description": "Organizations must conduct periodic data privacy impact assessments.",
    "deadline": "Annually",
    "responsible_unit": "Data Protection Officer",
    "evidence_required": "Assessment reports",
    "penalty": "Monetary fine",
    "source_text": "Section 1.1 Mandatory data privacy impact assessments must be executed annually.",
    "page_number": 1,
    "category": "Data Privacy",
    "priority": "High",
    "confidence": 0.96
  }
]"""

MOCK_NVIDIA_FALLBACK_JSON = """[
  {
    "title": "Mandatory AES-256 Encryption",
    "description": "Organizations must enforce AES-256 encryption for data at rest and in transit.",
    "deadline": "Immediate",
    "responsible_unit": "IT Security Lead",
    "evidence_required": "Encryption configuration logs",
    "penalty": "Regulatory suspension",
    "source_text": "Section 1.1 All sensitive records must be encrypted using AES-256.",
    "page_number": 1,
    "category": "Compliance",
    "priority": "High",
    "confidence": 0.98
  }
]"""


def test_gemini_provider_configuration_defaults():
    """1. Verify Gemini is the default primary provider in Settings."""
    engine = RegulatoryAIEngine()
    assert engine.provider == "gemini"
    assert engine.fallback_enabled is True


def test_gemini_success_does_not_call_nemotron():
    """2. Verify that Gemini success returns immediately and does NOT call NVIDIA Nemotron."""
    mock_gemini_resp = MagicMock()
    mock_gemini_resp.text = MOCK_GEMINI_SUCCESS_JSON

    with patch.object(settings, "ai_provider", "gemini"), \
         patch.object(settings, "gemini_api_key", "mock-gemini-key"), \
         patch.object(settings, "nvidia_api_key", "mock-nvidia-key"), \
         patch("google.generativeai.GenerativeModel.generate_content", return_value=mock_gemini_resp) as mock_gemini_call, \
         patch("httpx.Client.post") as mock_nvidia_call:

        engine = RegulatoryAIEngine()
        raw_text, provider_used = engine._execute_ai_call("prompt")

        assert provider_used == "gemini"
        assert "Mandatory Data Protection Assessment" in raw_text
        mock_gemini_call.assert_called_once()
        mock_nvidia_call.assert_not_called()


def test_gemini_503_triggers_nemotron_fallback():
    """3. Verify that transient 503 error on Gemini triggers exactly one Nemotron fallback."""
    mock_nvidia_resp = MagicMock()
    mock_nvidia_resp.status_code = 200
    mock_nvidia_resp.json.return_value = {
        "choices": [{"message": {"content": MOCK_NVIDIA_FALLBACK_JSON}}]
    }

    with patch.object(settings, "ai_provider", "gemini"), \
         patch.object(settings, "ai_fallback_enabled", True), \
         patch.object(settings, "gemini_api_key", "mock-gemini-key"), \
         patch.object(settings, "nvidia_api_key", "mock-nvidia-key"), \
         patch("google.generativeai.GenerativeModel.generate_content", side_effect=Exception("503 Service Unavailable")), \
         patch("httpx.Client.post", return_value=mock_nvidia_resp) as mock_nvidia_call:

        engine = RegulatoryAIEngine()
        raw_text, provider_used = engine._execute_ai_call("prompt")

        assert provider_used == "nvidia-fallback"
        assert "Mandatory AES-256 Encryption" in raw_text
        mock_nvidia_call.assert_called_once()


def test_gemini_429_quota_falls_back_to_nemotron():
    """4. Verify that Gemini 429 quota exhaustion does NOT retry Gemini and falls back to Nemotron."""
    mock_nvidia_resp = MagicMock()
    mock_nvidia_resp.status_code = 200
    mock_nvidia_resp.json.return_value = {
        "choices": [{"message": {"content": MOCK_NVIDIA_FALLBACK_JSON}}]
    }

    with patch.object(settings, "ai_provider", "gemini"), \
         patch.object(settings, "ai_fallback_enabled", True), \
         patch.object(settings, "gemini_api_key", "mock-gemini-key"), \
         patch.object(settings, "nvidia_api_key", "mock-nvidia-key"), \
         patch("google.generativeai.GenerativeModel.generate_content", side_effect=Exception("429 ResourceExhausted: Quota exceeded")), \
         patch("httpx.Client.post", return_value=mock_nvidia_resp) as mock_nvidia_call:

        engine = RegulatoryAIEngine()
        raw_text, provider_used = engine._execute_ai_call("prompt")

        assert provider_used == "nvidia-fallback"
        assert "Mandatory AES-256 Encryption" in raw_text
        mock_nvidia_call.assert_called_once()


def test_malformed_gemini_response_triggers_nemotron_fallback():
    """5. Verify that malformed / unparseable output from Gemini triggers Nemotron fallback."""
    mock_gemini_resp = MagicMock()
    mock_gemini_resp.text = "This is not valid JSON and has no brackets at all."

    mock_nvidia_resp = MagicMock()
    mock_nvidia_resp.status_code = 200
    mock_nvidia_resp.json.return_value = {
        "choices": [{"message": {"content": MOCK_NVIDIA_FALLBACK_JSON}}]
    }

    with patch.object(settings, "ai_provider", "gemini"), \
         patch.object(settings, "ai_fallback_enabled", True), \
         patch.object(settings, "gemini_api_key", "mock-gemini-key"), \
         patch.object(settings, "nvidia_api_key", "mock-nvidia-key"), \
         patch("google.generativeai.GenerativeModel.generate_content", return_value=mock_gemini_resp), \
         patch("httpx.Client.post", return_value=mock_nvidia_resp) as mock_nvidia_call:

        engine = RegulatoryAIEngine()
        raw_text, provider_used = engine._execute_ai_call("prompt")

        assert provider_used == "nvidia-fallback"
        assert "Mandatory AES-256 Encryption" in raw_text
        mock_nvidia_call.assert_called_once()


def test_nemotron_fallback_success_parses_shared_schema():
    """6. Verify that Nemotron fallback output validates cleanly through shared Pydantic AIObligation."""
    engine = RegulatoryAIEngine()
    obligations = engine.sanitize_and_parse_json(MOCK_NVIDIA_FALLBACK_JSON)

    assert len(obligations) == 1
    obs_dto = AIObligation(
        title=obligations[0]["title"],
        description=obligations[0]["description"],
        responsible_unit=obligations[0]["responsible_unit"],
        deadline=obligations[0]["deadline"],
        evidence_required=obligations[0]["evidence_required"],
        penalty=obligations[0]["penalty"],
        category=obligations[0]["category"],
        priority=obligations[0]["priority"],
        source_text=obligations[0]["source_text"],
        source_page=obligations[0]["page_number"],
        confidence=obligations[0]["confidence"],
    )
    assert obs_dto.title == "Mandatory AES-256 Encryption"
    assert obs_dto.priority == "High"


def test_both_providers_unavailable_produces_clean_error():
    """7. Verify that when both Gemini and Nemotron fail, a clean AIProviderException is raised."""
    mock_nvidia_err = MagicMock()
    mock_nvidia_err.status_code = 500
    mock_nvidia_err.text = "Internal Server Error"

    with patch.object(settings, "ai_provider", "gemini"), \
         patch.object(settings, "ai_fallback_enabled", True), \
         patch.object(settings, "gemini_api_key", "mock-gemini-key"), \
         patch.object(settings, "nvidia_api_key", "mock-nvidia-key"), \
         patch("google.generativeai.GenerativeModel.generate_content", side_effect=Exception("503 Service Unavailable")), \
         patch("httpx.Client.post", return_value=mock_nvidia_err):

        engine = RegulatoryAIEngine()
        with pytest.raises(AIProviderException):
            engine._execute_ai_call("prompt")


def test_no_fake_obligations_generated_on_empty():
    """8. Verify that empty/failed extraction never generates fake/mock obligations."""
    engine = RegulatoryAIEngine()
    empty_result = engine.sanitize_and_parse_json("")
    assert empty_result == []
    assert len(empty_result) == 0
