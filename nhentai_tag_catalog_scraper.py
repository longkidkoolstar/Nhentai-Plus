#!/usr/bin/env python3
"""
Nhentai tag ID catalog scraper (maintainer tool).

Builds slug/name -> numeric id maps via bulk API pagination:
  GET https://nhentai.net/api/v2/tags/{type}?page=N&per_page=M

Outputs tag_catalog/manifest.json and per-type JSON files for GitHub raw hosting.

Usage:
  python nhentai_tag_catalog_scraper.py --delay 2.0 --per-page 100
  python nhentai_tag_catalog_scraper.py --resume
  python nhentai_tag_catalog_scraper.py --types tag --max-pages 2
  python nhentai_tag_catalog_scraper.py --probe-per-page
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin

API_BASE = "https://nhentai.net/api/v2"
SITE_BASE = "https://nhentai.net"
USER_AGENT = "Nhentai-Plus-TagCatalog/1.0 (+https://github.com/longkidkoolstar/Nhentai-Plus)"

TAG_TYPES: List[str] = [
    "tag",
    "artist",
    "group",
    "character",
    "parody",
    "language",
    "category",
]

HTML_CATEGORY_MAP = {
    "tags": "tag",
    "artists": "artist",
    "groups": "group",
    "characters": "character",
    "parodies": "parody",
    "languages": "language",
    "categories": "category",
}


def make_session():
    try:
        import cloudscraper  # type: ignore

        return cloudscraper.create_scraper(
            browser={"browser": "chrome", "platform": "windows", "mobile": False}
        )
    except Exception:
        import requests  # type: ignore

        s = requests.Session()
        s.headers.update({"User-Agent": USER_AGENT})
        return s


def parse_retry_after_ms(response) -> Optional[int]:
    header = response.headers.get("Retry-After")
    if not header:
        return None
    try:
        return int(float(header)) * 1000
    except ValueError:
        pass
    try:
        from email.utils import parsedate_to_datetime

        dt = parsedate_to_datetime(header)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return max(0, int((dt - datetime.now(timezone.utc)).total_seconds() * 1000))
    except Exception:
        return None


def api_get(session, path: str, max_retries: int = 6) -> Dict[str, Any]:
    url = f"{API_BASE}{path}"
    last_err: Optional[Exception] = None
    for attempt in range(max_retries + 1):
        try:
            r = session.get(url, timeout=60, headers={"User-Agent": USER_AGENT})
            if r.status_code == 429:
                delay_ms = parse_retry_after_ms(r) or min(20000, 1000 * (2**attempt))
                delay_ms = min(delay_ms, 20000)
                print(f"[api] 429 on {path}, retry in {delay_ms}ms (attempt {attempt + 1})", file=sys.stderr)
                time.sleep(delay_ms / 1000.0)
                continue
            if r.status_code >= 400:
                raise RuntimeError(f"HTTP {r.status_code} for {url}: {r.text[:200]}")
            data = r.json()
            if isinstance(data, dict) and "result" in data:
                return data
            return {"result": data} if isinstance(data, list) else data
        except Exception as e:
            last_err = e
            if attempt < max_retries:
                time.sleep(min(60, 2**attempt))
            else:
                raise
    if last_err:
        raise last_err
    raise RuntimeError(f"Failed API GET {path}")


def normalize_name(name: str) -> str:
    return re.sub(r"\s+", " ", str(name or "").strip().lower())


def slug_from_tag(item: Dict[str, Any]) -> str:
    slug = str(item.get("slug") or "").strip().lower()
    if slug:
        return slug
    name = str(item.get("name") or "").strip().lower()
    return name.replace(" ", "-") if name else ""


def merge_tag_into_maps(
    item: Dict[str, Any],
    by_slug: Dict[str, int],
    by_name: Dict[str, int],
) -> None:
    tag_id = item.get("id")
    if tag_id is None:
        return
    try:
        num_id = int(tag_id)
    except (TypeError, ValueError):
        return
    slug = slug_from_tag(item)
    name = normalize_name(str(item.get("name") or ""))
    if slug and slug not in by_slug:
        by_slug[slug] = num_id
    if name and name not in by_name:
        by_name[name] = num_id


def load_type_file(path: Path) -> Tuple[Dict[str, int], Dict[str, int]]:
    if not path.exists():
        return {}, {}
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    by_slug = {str(k): int(v) for k, v in (data.get("bySlug") or {}).items()}
    by_name = {str(k): int(v) for k, v in (data.get("byName") or {}).items()}
    return by_slug, by_name


def save_type_file(
    output_dir: Path,
    tag_type: str,
    by_slug: Dict[str, int],
    by_name: Dict[str, int],
) -> None:
    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "type": tag_type,
        "count": len(by_slug),
        "bySlug": dict(sorted(by_slug.items())),
        "byName": dict(sorted(by_name.items())),
    }
    out_path = output_dir / f"{tag_type}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    print(f"[write] {out_path} ({len(by_slug)} slugs)")


def load_scrape_state(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {"completed": {}, "per_page": 100}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_scrape_state(path: Path, state: Dict[str, Any]) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


def probe_per_page(session, candidates: List[int]) -> int:
    best = 100
    for per_page in sorted(candidates, reverse=True):
        try:
            data = api_get(session, f"/tags/tag?page=1&per_page={per_page}")
            result = data.get("result") or []
            if isinstance(result, list) and len(result) > 0:
                print(f"[probe] per_page={per_page} OK ({len(result)} items on page 1)")
                best = per_page
            else:
                print(f"[probe] per_page={per_page} empty result, skipping")
        except Exception as e:
            print(f"[probe] per_page={per_page} failed: {e}")
    return best


def scrape_type_api(
    session,
    tag_type: str,
    output_dir: Path,
    state_path: Path,
    state: Dict[str, Any],
    per_page: int,
    delay: float,
    max_pages: Optional[int],
    resume: bool,
) -> None:
    completed = state.setdefault("completed", {})
    type_done = completed.get(tag_type, {})
    start_page = int(type_done.get("last_page", 0)) + 1 if resume else 1

    by_slug, by_name = load_type_file(output_dir / f"{tag_type}.json")

    page = start_page
    num_pages = int(type_done.get("num_pages", 0)) or 1

    while page <= num_pages:
        if max_pages is not None and page > max_pages:
            break
        if resume and page <= int(type_done.get("last_page", 0)):
            page += 1
            continue

        print(f"[{tag_type}] Fetching page {page}/{num_pages} (per_page={per_page})")
        data = api_get(session, f"/tags/{tag_type}?page={page}&per_page={per_page}")
        result = data.get("result") or []
        if not isinstance(result, list):
            print(f"[{tag_type}] Unexpected result shape on page {page}", file=sys.stderr)
            break

        num_pages = int(data.get("num_pages") or num_pages or 1)
        per_page_actual = int(data.get("per_page") or per_page)

        for item in result:
            if isinstance(item, dict):
                merge_tag_into_maps(item, by_slug, by_name)

        save_type_file(output_dir, tag_type, by_slug, by_name)
        completed[tag_type] = {
            "last_page": page,
            "num_pages": num_pages,
            "per_page": per_page_actual,
            "count": len(by_slug),
        }
        state["completed"] = completed
        save_scrape_state(state_path, state)

        if page >= num_pages:
            break
        page += 1
        time.sleep(delay)

    completed[tag_type] = {
        "last_page": num_pages,
        "num_pages": num_pages,
        "per_page": per_page,
        "count": len(by_slug),
        "finished": True,
    }
    state["completed"] = completed
    save_scrape_state(state_path, state)
    print(f"[{tag_type}] Done: {len(by_slug)} slugs")


def parse_html_tagchips(html: str) -> List[Dict[str, str]]:
    from bs4 import BeautifulSoup  # type: ignore

    soup = BeautifulSoup(html, "html.parser")
    items: List[Dict[str, str]] = []
    for a in soup.select("#tag-container a.tagchip, .tag-container a.tagchip, a.tagchip"):
        href = a.get("href") or ""
        m = re.search(r"/([^/]+)/([^/]+)/?", href)
        if not m:
            continue
        cat, slug = m.group(1), m.group(2)
        name_el = a.select_one(".name")
        name = (name_el.get_text(strip=True) if name_el else slug).strip()
        items.append({"category": cat, "slug": slug.lower(), "name": name})
    return items


def validate_html_listing(
    session,
    tag_type: str,
    delay: float,
    max_pages: Optional[int],
    by_slug: Dict[str, int],
) -> None:
    cat = {v: k for k, v in HTML_CATEGORY_MAP.items()}.get(tag_type, f"{tag_type}s")
    base = f"{SITE_BASE}/{cat}/?sort=popular"
    page = 1
    missing = 0
    checked = 0
    while True:
        url = base if page == 1 else f"{base}&page={page}"
        print(f"[validate-html] {url}")
        r = session.get(url, timeout=60)
        r.raise_for_status()
        chips = parse_html_tagchips(r.text)
        if not chips:
            break
        for chip in chips:
            slug = chip["slug"]
            checked += 1
            if slug not in by_slug:
                missing += 1
        if max_pages is not None and page >= max_pages:
            break
        from bs4 import BeautifulSoup  # type: ignore

        soup = BeautifulSoup(r.text, "html.parser")
        if not soup.select_one("section.pagination a.next"):
            break
        page += 1
        time.sleep(delay)
    print(f"[validate-html] {tag_type}: checked {checked} chips, {missing} slugs missing from API catalog")


def write_manifest(output_dir: Path, types: List[str]) -> None:
    discovered = sorted(
        p.stem
        for p in output_dir.glob("*.json")
        if p.name != "manifest.json" and p.stem in TAG_TYPES
    )
    all_types = sorted(set(types) | set(discovered), key=lambda t: TAG_TYPES.index(t) if t in TAG_TYPES else 99)
    manifest = {
        "version": "catalog_v1",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "baseUrl": "https://raw.githubusercontent.com/longkidkoolstar/Nhentai-Plus/refs/heads/main/tag_catalog",
        "types": all_types,
        "files": {t: f"{t}.json" for t in all_types},
    }
    path = output_dir / "manifest.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"[write] {path}")


def main():
    ap = argparse.ArgumentParser(description="Build nhentai tag ID catalog via API v2 pagination")
    ap.add_argument("--output-dir", default="tag_catalog", help="Output directory")
    ap.add_argument("--types", nargs="*", default=TAG_TYPES, help="Tag types to scrape")
    ap.add_argument("--delay", type=float, default=2.0, help="Delay between API pages (seconds)")
    ap.add_argument("--per-page", type=int, default=100, help="Items per API page")
    ap.add_argument("--max-pages", type=int, default=None, help="Cap pages per type (testing)")
    ap.add_argument("--resume", action="store_true", help="Resume from .scrape_state.json")
    ap.add_argument("--probe-per-page", action="store_true", help="Probe 250/500/100 and use largest OK")
    ap.add_argument("--validate-html", action="store_true", help="Cross-check slugs vs HTML tagchip listings")
    args = ap.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    state_path = output_dir / ".scrape_state.json"
    state = load_scrape_state(state_path) if args.resume else {"completed": {}, "per_page": args.per_page}

    session = make_session()
    types = [t for t in (args.types or TAG_TYPES) if t in TAG_TYPES]
    per_page = int(args.per_page)

    if args.probe_per_page:
        per_page = probe_per_page(session, [500, 250, 100])
        state["per_page"] = per_page

    print(f"Starting tag catalog scrape at {datetime.now(timezone.utc).isoformat()}")
    print(f"Types: {', '.join(types)} | per_page={per_page} | delay={args.delay}")

    for tag_type in types:
        scrape_type_api(
            session,
            tag_type,
            output_dir,
            state_path,
            state,
            per_page,
            args.delay,
            args.max_pages,
            args.resume,
        )
        if args.validate_html:
            by_slug, _ = load_type_file(output_dir / f"{tag_type}.json")
            validate_html_listing(session, tag_type, args.delay, args.max_pages, by_slug)

    write_manifest(output_dir, types)
    print("Tag catalog scrape complete.")


if __name__ == "__main__":
    main()
