#!/usr/bin/env python3
"""Fail when provider credentials appear in client or extension artifacts."""

from __future__ import annotations

import re
import sys
import zipfile
from pathlib import Path


PATTERNS = (
    ("provider-key variable name", re.compile(rb"\b(?:GEMINI_API_KEY|OPENAI_API_KEY|VITE_[A-Z0-9_]*(?:GEMINI|OPENAI)[A-Z0-9_]*)\b")),
    ("Google API key shape", re.compile(rb"AIza[0-9A-Za-z_-]{30,}")),
    ("OpenAI API key shape", re.compile(rb"sk-[A-Za-z0-9_-]{20,}")),
)

DEFAULT_TARGETS = (
    Path("client/.env.example"),
    Path("client/src"),
    Path("client/dist"),
    Path("extension"),
    Path("arrakis-extension.zip"),
)


def _scan_bytes(data: bytes) -> list[str]:
    return [label for label, pattern in PATTERNS if pattern.search(data)]


def scan_targets(targets: tuple[Path, ...] | list[Path]) -> list[tuple[str, str]]:
    findings: list[tuple[str, str]] = []

    for target in targets:
        if not target.exists():
            continue
        files = sorted(path for path in target.rglob("*") if path.is_file()) if target.is_dir() else [target]
        for path in files:
            relative = path.as_posix()
            if path.suffix.lower() == ".zip" and zipfile.is_zipfile(path):
                with zipfile.ZipFile(path) as archive:
                    for member in archive.infolist():
                        if member.is_dir():
                            continue
                        for label in _scan_bytes(archive.read(member)):
                            findings.append((f"{relative}:{member.filename}", label))
            else:
                for label in _scan_bytes(path.read_bytes()):
                    findings.append((relative, label))

    return findings


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    findings = scan_targets([root / target for target in DEFAULT_TARGETS])
    if findings:
        for filename, label in findings:
            print(f"Potential {label} found in {filename}", file=sys.stderr)
        return 1
    print("No provider keys found in client or extension artifacts.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
