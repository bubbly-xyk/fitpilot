from pathlib import Path
import sys

SERVER_ROOT = Path(__file__).resolve().parents[1] / "server"
sys.path.insert(0, str(SERVER_ROOT))

from app.main import app  # noqa: E402
