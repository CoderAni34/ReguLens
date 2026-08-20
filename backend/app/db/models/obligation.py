from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship

from app.db.database import Base


class Obligation(Base):
    __tablename__ = "obligations"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    responsible_unit = Column(String, nullable=True)
    deadline = Column(String, nullable=True)
    evidence_required = Column(Text, nullable=True)
    penalty = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    priority = Column(String, nullable=True)
    source_text = Column(Text, nullable=False)
    source_page = Column(Integer, nullable=True)
    confidence = Column(Float, nullable=False)
    status = Column(String, default="active", nullable=False)

    __table_args__ = (
        CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="check_confidence_range"),
    )

    document = relationship("Document", back_populates="obligations")

