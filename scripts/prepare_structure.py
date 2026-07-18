#!/usr/bin/env python3
"""Convert a Protenix mmCIF model into a compact browser trace.

Only C-alpha coordinates, confidence, and residue indices are retained by
default. Sparse long-range contacts are optional. This keeps unpublished
multi-megabyte atom files out of the website while preserving the geometry
used by the canvas drawing.
"""

from __future__ import annotations

import argparse
import json
import math
import tempfile
from pathlib import Path


def parse_ca_atoms(path: Path) -> list[dict[str, float | int]]:
    points: list[dict[str, float | int]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.startswith("ATOM "):
                continue
            fields = line.split()
            if len(fields) < 17 or fields[2] != "CA":
                continue
            try:
                points.append(
                    {
                        "residue": int(fields[7]),
                        "confidence": float(fields[13]),
                        "x": float(fields[14]),
                        "y": float(fields[15]),
                        "z": float(fields[16]),
                    }
                )
            except ValueError:
                continue
    if len(points) < 50:
        raise RuntimeError(f"Only {len(points)} C-alpha atoms parsed from {path}")
    return points


def normalize(points: list[dict[str, float | int]]) -> list[list[float | int]]:
    cx = sum(float(point["x"]) for point in points) / len(points)
    cy = sum(float(point["y"]) for point in points) / len(points)
    cz = sum(float(point["z"]) for point in points) / len(points)
    centered = [
        (
            float(point["x"]) - cx,
            float(point["y"]) - cy,
            float(point["z"]) - cz,
        )
        for point in points
    ]
    radius = max(math.sqrt(x * x + y * y + z * z) for x, y, z in centered)
    if radius == 0:
        raise RuntimeError("Degenerate coordinate set")

    return [
        [
            round(x / radius, 5),
            round(y / radius, 5),
            round(z / radius, 5),
            round(float(point["confidence"]), 2),
            int(point["residue"]),
        ]
        for point, (x, y, z) in zip(points, centered, strict=True)
    ]


def long_range_contacts(
    points: list[dict[str, float | int]],
    maximum_distance: float = 8.0,
    minimum_separation: int = 12,
    maximum_contacts: int = 12000,
) -> list[list[int]]:
    threshold = maximum_distance * maximum_distance
    contacts: list[list[int]] = []
    for i, first in enumerate(points):
        x1, y1, z1 = (
            float(first["x"]),
            float(first["y"]),
            float(first["z"]),
        )
        for j in range(i + minimum_separation, len(points)):
            second = points[j]
            dx = x1 - float(second["x"])
            dy = y1 - float(second["y"])
            dz = z1 - float(second["z"])
            if dx * dx + dy * dy + dz * dz <= threshold:
                contacts.append([i, j])
                if len(contacts) >= maximum_contacts:
                    return contacts
    return contacts


def atomic_write(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rendered = json.dumps(
        payload, ensure_ascii=False, separators=(",", ":")
    ) + "\n"
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=path.parent, delete=False
    ) as handle:
        handle.write(rendered)
        temporary = Path(handle.name)
    temporary.replace(path)
    path.chmod(0o644)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--id", required=True)
    parser.add_argument("--label", required=True)
    parser.add_argument("--segment", required=True)
    parser.add_argument(
        "--provenance",
        default="Protenix-predicted coordinates; Cα trace",
    )
    parser.add_argument(
        "--include-contacts",
        action="store_true",
        help="also calculate sparse long-range contacts",
    )
    args = parser.parse_args()

    atoms = parse_ca_atoms(args.input)
    confidence_values = [float(point["confidence"]) for point in atoms]
    payload = {
        "schemaVersion": 1,
        "id": args.id,
        "label": args.label,
        "segment": args.segment,
        "provenance": args.provenance,
        "residueCount": len(atoms),
        "confidence": {
            "minimum": round(min(confidence_values), 2),
            "mean": round(sum(confidence_values) / len(confidence_values), 2),
            "maximum": round(max(confidence_values), 2),
        },
        "points": normalize(atoms),
    }
    if args.include_contacts:
        payload["contacts"] = long_range_contacts(atoms)
    atomic_write(args.output, payload)
    contact_count = len(payload.get("contacts", []))
    print(f"{args.output}: {len(atoms)} Cα atoms, {contact_count} contacts")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
