"""Load backend configuration consistently, preserving deployment overrides."""
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ENV_FILE = Path(__file__).resolve().parent / ".env"


def load_environment():
    """Read the backend .env regardless of cwd; existing variables take priority."""
    load_dotenv(BACKEND_ENV_FILE, override=False)
