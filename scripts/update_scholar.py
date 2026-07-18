#!/usr/bin/env python3
"""Refresh the site's checked-in Google Scholar snapshot.

Google Scholar does not expose a supported public profile API. This script
fetches one public profile page, validates the response, and writes an atomic
JSON snapshot. The website reads that local snapshot, so a Scholar outage or
rate limit never affects visitors.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import tempfile
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


PROFILE_ID = "AqcNAskAAAAJ"
PROFILE_URL = (
    "https://scholar.google.com/citations"
    f"?user={PROFILE_ID}&hl=en&pagesize=100"
)
USER_AGENT = (
    "Mozilla/5.0 (compatible; jwestrob.github.io citation refresh; "
    "+https://jwestrob.github.io)"
)


def clean_markup(value: str) -> str:
    """Convert Scholar's small inline HTML fragments to normalized text."""
    value = re.sub(r"<[^>]+>", "", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def first_match(pattern: str, value: str) -> re.Match[str] | None:
    return re.search(pattern, value, flags=re.DOTALL)


def fetch_profile(timeout: float) -> str:
    request = urllib.request.Request(
        PROFILE_URL,
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        if response.status != 200:
            raise RuntimeError(f"Scholar returned HTTP {response.status}")
        body = response.read().decode("utf-8", errors="strict")
    if PROFILE_ID not in body or "gsc_a_tr" not in body:
        raise RuntimeError("Scholar response did not contain the expected profile")
    return body


def parse_metrics(body: str) -> dict[str, dict[str, int]]:
    raw = [
        clean_markup(value)
        for value in re.findall(
            r'<td class="gsc_rsb_std">(.*?)</td>', body, flags=re.DOTALL
        )
    ]
    if len(raw) < 6 or not all(value.isdigit() for value in raw[:6]):
        raise RuntimeError("Scholar metrics table was missing or malformed")
    values = [int(value) for value in raw[:6]]
    return {
        "citations": {"all": values[0], "since2021": values[1]},
        "hIndex": {"all": values[2], "since2021": values[3]},
        "i10Index": {"all": values[4], "since2021": values[5]},
    }


def parse_publications(body: str) -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    rows = re.findall(
        r'<tr class="gsc_a_tr">(.*?)</tr>', body, flags=re.DOTALL
    )
    for row in rows:
        title_match = first_match(
            r'<a href="([^"]*)" class="gsc_a_at">(.*?)</a>', row
        )
        if not title_match:
            continue

        gray_fields = re.findall(
            r'<div class="gs_gray">(.*?)</div>', row, flags=re.DOTALL
        )
        cited_match = first_match(
            r'<a href="([^"]*)" class="gsc_a_ac[^"]*">(.*?)</a>', row
        )
        year_match = first_match(
            r'<span class="gsc_a_h[^"]*">(.*?)</span>', row
        )

        detail_url = urllib.parse.urljoin(
            "https://scholar.google.com", html.unescape(title_match.group(1))
        )
        cited_url = ""
        cited_by = 0
        if cited_match:
            cited_url = urllib.parse.urljoin(
                "https://scholar.google.com",
                html.unescape(cited_match.group(1)),
            )
            cited_text = clean_markup(cited_match.group(2))
            if cited_text.isdigit():
                cited_by = int(cited_text)

        year_text = clean_markup(year_match.group(1)) if year_match else ""
        year = int(year_text) if year_text.isdigit() else None
        query = urllib.parse.parse_qs(urllib.parse.urlparse(detail_url).query)
        citation_id = query.get("citation_for_view", [detail_url])[0]

        records.append(
            {
                "id": citation_id,
                "title": clean_markup(title_match.group(2)),
                "authors": clean_markup(gray_fields[0]) if gray_fields else "",
                "venue": clean_markup(gray_fields[1])
                if len(gray_fields) > 1
                else "",
                "year": year,
                "citations": cited_by,
                "scholarUrl": detail_url,
                "citedByUrl": cited_url or None,
            }
        )

    if len(records) < 20:
        raise RuntimeError(
            f"Scholar returned only {len(records)} publication rows; refusing update"
        )
    return records


def build_snapshot(body: str) -> dict[str, object]:
    publications = parse_publications(body)
    metrics = parse_metrics(body)
    return {
        "schemaVersion": 1,
        "source": {
            "name": "Google Scholar",
            "profileId": PROFILE_ID,
            "profileUrl": PROFILE_URL,
            "fetchedAt": datetime.now(timezone.utc)
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z"),
            "recordCount": len(publications),
            "note": (
                "Raw public-profile records. Scholar may list preprints, "
                "published versions, and supplements separately."
            ),
        },
        "metrics": metrics,
        "publications": publications,
    }


def atomic_write(path: Path, snapshot: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rendered = json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n"
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=path.parent, delete=False
    ) as handle:
        handle.write(rendered)
        temporary = Path(handle.name)
    temporary.replace(path)
    path.chmod(0o644)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "scholar.json",
    )
    parser.add_argument("--timeout", type=float, default=25.0)
    args = parser.parse_args()

    snapshot = build_snapshot(fetch_profile(args.timeout))
    atomic_write(args.output, snapshot)
    metrics = snapshot["metrics"]
    print(
        "Scholar snapshot updated: "
        f"{snapshot['source']['recordCount']} records, "
        f"{metrics['citations']['all']} citations"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
