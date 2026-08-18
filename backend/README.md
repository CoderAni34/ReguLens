# ReguLens Backend

This is the FastAPI backend for the ReguLens prototype, an AI-powered regulatory compliance document intelligence system.

This codebase has been strictly cleaned and refactored. It contains exactly what is required to demonstrate the core workflow: Document Upload, Mock AI Analysis, and Obligation Extraction. Unused placeholders (such as RBAC, tasks, and authentication) have been completely removed to provide a clean slate for integration.

## Technology Stack
- **Python 3.12**
- **FastAPI**: High-performance web framework.
- **PostgreSQL**: Relational database for persistent storage.
- **SQLAlchemy**: ORM for database management.
- **Pydantic**: Data validation and serialization.
- **Docker Compose**: Container orchestration for database and services.

## Folder Structure
```
backend/
├── app/
│   ├── api/
│   │   └── routes/      # FastAPI endpoint definitions
│   ├── core/            # Application config and dependencies
│   ├── db/              # Database setup and SQLAlchemy models
│   ├── schemas/         # Pydantic validation schemas
│   └── services/        # Business logic (e.g., Mock AI integration)
├── tests/               # Pytest suite for API testing
├── uploads/             # Directory for storing uploaded PDF files (created dynamically)
├── requirements.txt     # Python dependencies
└── README.md            # This documentation
```

## Database Structure
The prototype implements the following minimal schema using PostgreSQL:

1. **Documents**: Stores uploaded regulations/policies.
   - `id`, `title`, `filename`, `file_path`, `document_type`, `language`, `version`, `uploaded_at`, `processing_status`.

2. **Obligations**: Stores compliance requirements extracted from documents.
   - `id`, `document_id`, `title`, `description`, `responsible_unit`, `deadline`, `evidence_required`, `source_text`, `source_page`, `confidence`, `status`.

## AI Integration Contract
The `POST /documents/{id}/analyze` endpoint triggers the extraction process. Currently, it uses a mock service. In the future, Anshuman's AI module should return JSON conforming to this contract:

```json
{
  "document": {
    "title": "string",
    "document_type": "string",
    "language": "string",
    "version": "string"
  },
  "obligations": [
    {
      "title": "string",
      "description": "string",
      "responsible_unit": "string or null",
      "deadline": "YYYY-MM-DD or null",
      "evidence_required": "string or null",
      "source_text": "exact source passage",
      "source_page": 12,
      "confidence": 0.95
    }
  ]
}
```

## How to Run the Backend

1. **Start PostgreSQL Database**
   Using Docker Compose from the root directory (`ReguLens`):
   ```bash
   docker-compose up db -d
   ```

2. **Install Dependencies**
   Inside the `backend/` directory:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start FastAPI Development Server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Access Swagger UI**
   Open your browser and navigate to: [http://localhost:8000/docs](http://localhost:8000/docs)

## API Endpoints

### General
- `GET /health` - Health check.

### Documents
- `POST /documents/upload` - Upload a PDF document (multipart/form-data).
- `GET /documents` - List uploaded documents.
- `GET /documents/{document_id}` - Retrieve details for a specific document.
- `POST /documents/{document_id}/analyze` - Analyze the document and extract obligations (mock AI).

### Obligations
- `GET /obligations` - List all extracted obligations.
- `GET /obligations/{obligation_id}` - Retrieve details for a specific obligation.
- `GET /obligations/document/{document_id}` - Get obligations extracted from a specific document.
