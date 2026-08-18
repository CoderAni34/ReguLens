from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Obligation(Base):
    __tablename__ = "obligations"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    responsible_unit = Column(String, nullable=True)
    deadline = Column(String, nullable=True)
    evidence_required = Column(Text, nullable=True)
    source_text = Column(Text, nullable=False)
    source_page = Column(Integer, nullable=True)
    confidence = Column(Float, nullable=False)
    status = Column(String, default="active")

    document = relationship("Document", back_populates="obligations")
