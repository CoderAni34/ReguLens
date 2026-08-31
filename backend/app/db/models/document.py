from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, index=True, nullable=True)
    filename = Column(String, index=True, nullable=False)
    file_path = Column(String, nullable=False)
    document_type = Column(String, nullable=True)
    language = Column(String, nullable=True)
    version = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    processing_status = Column(String, default="uploaded", nullable=False)

    user = relationship("User", back_populates="documents")
    obligations = relationship("Obligation", back_populates="document", cascade="all, delete-orphan")

