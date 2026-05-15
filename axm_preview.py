#!/usr/bin/env python3
"""Compatibility launcher for the Axiom Preview localhost viewer."""

from pathlib import Path
import os
import sys


def main() -> None:
    skill_root = Path(__file__).resolve().parent
    script = skill_root / "scripts" / "preview.mjs"
    os.execvp("node", ["node", str(script), *sys.argv[1:]])


if __name__ == "__main__":
    main()
