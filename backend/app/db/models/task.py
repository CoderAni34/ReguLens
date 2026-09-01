from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship, backref

from app.db.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    obligation_id = Column(Integer, ForeignKey("obligations.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    deadline = Column(String, nullable=True)
    responsible_unit = Column(String, nullable=True)
    priority = Column(String, nullable=True, default="Medium")
    status = Column(String, nullable=False, default="To Do", index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    obligation = relationship("Obligation", backref=backref("tasks", cascade="all, delete-orphan"))
