#!/usr/bin/env python3
"""Load verified seed data (sources, holidays, lunar reference dates) into the database.

Usage (from the repository root):
    python scripts/seed_database.py                 # uses DATABASE_URL / SEED_DATA_DIR
    python scripts/seed_database.py --seed-dir path/to/seeds

Inside Docker: docker compose exec backend python -m app.db.seed
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.db.seed import main  # noqa: E402

if __name__ == "__main__":
    main()
