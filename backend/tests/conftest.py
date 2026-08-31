import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base
from app.db.models.user import User
from app.core.dependencies import get_db, get_current_user
from app.core.security import hash_password, create_access_token

# SQLite in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    # Seed default user for test consistency
    default_user = User(
        id=1,
        email="admin@regulens.ai",
        hashed_password=hash_password("Admin@123"),
        full_name="Compliance Officer",
        role="Compliance Officer",
        is_active=True,
    )
    session.add(default_user)
    session.commit()
    session.refresh(default_user)

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def default_user(db_session):
    return db_session.query(User).filter(User.email == "admin@regulens.ai").first()


@pytest.fixture(scope="function")
def auth_headers(default_user):
    token = create_access_token({"sub": str(default_user.id), "email": default_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def client(db_session, auth_headers):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, headers=auth_headers) as c:
        yield c
    app.dependency_overrides.clear()
