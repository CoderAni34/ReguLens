# Rishav — Backend Contribution

## Role

**Backend Development & AI Integration Support**

My contribution to the ReguLens prototype focuses on the backend foundation, database layer, service-layer architecture, REST APIs, validation, reliability, testing, and preparation of the backend for integration with the real AI/NLP pipeline.

The real AI/NLP pipeline is owned by the AI team. My responsibility is to provide a stable backend interface through which the AI pipeline can return structured regulatory obligations and persist them safely.

---

## 1. Database & Data Model Implementation

Implemented and strengthened the SQLAlchemy database layer for regulatory documents and extracted obligations.

### Document Model

Configured the `Document` model with:

- `id`
- `title`
- `filename`
- `file_path`
- `document_type`
- `language`
- `version`
- `uploaded_at`
- `processing_status`

### Obligation Model

Configured the `Obligation` model with:

- `id`
- `document_id`
- `title`
- `description`
- `responsible_unit`
- `deadline`
- `evidence_required`
- `source_text`
- `source_page`
- `confidence`
- `status`

### Document–Obligation Relationship

Implemented the one-to-many relationship:

```text
Document
   │
   ├── Obligation
   ├── Obligation
   └── Obligation
