"""
ReguLens Auth Service Module
============================
Handles user lookup, registration, authentication, and demo user seeding.
"""
import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.db.models.user import User
from app.schemas.auth import UserRegister
from app.core.security import hash_password, verify_password
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Find a user by normalized lowercase email."""
    if not email:
        return None
    return db.query(User).filter(User.email == email.strip().lower()).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Find a user by primary key ID."""
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user_data: UserRegister) -> User:
    """Create and persist a new user record with hashed password."""
    normalized_email = user_data.email.strip().lower()
    hashed_pwd = hash_password(user_data.password)

    user = User(
        email=normalized_email,
        hashed_password=hashed_pwd,
        full_name=user_data.full_name or "Compliance Officer",
        role=user_data.role or "Compliance Officer",
        is_active=True,
    )
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Created new user record for {normalized_email}")
        return user
    except Exception:
        db.rollback()
        raise


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Validates user credentials.
    Returns the User on success, or None on failure.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def seed_default_user(db: Session) -> Optional[User]:
    """
    Seeds a configurable default demo user for prototype demonstration
    if seed_demo_user is enabled in settings and user doesn't already exist.
    """
    if not getattr(settings, "seed_demo_user", True):
        return None

    demo_email = settings.demo_user_email.strip().lower()
    existing = get_user_by_email(db, demo_email)
    if existing:
        return existing

    try:
        demo_user = User(
            email=demo_email,
            hashed_password=hash_password(settings.demo_user_password),
            full_name=settings.demo_user_name,
            role="Compliance Officer",
            is_active=True,
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        logger.info(f"Successfully seeded demo user: {demo_email}")
        return demo_user
    except Exception as e:
        db.rollback()
        logger.warning(f"Demo user seeding skipped or deferred: {e}")
        return None
