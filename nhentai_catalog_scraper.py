#!/usr/bin/env python3
"""
Nhentai taxonomy scraper
- Scrapes categories: artists, tags, parodies, groups, characters
- Parses items from the tag container (supports both #tag-container and .tag-container selectors)
- Walks all pages via the pagination section (#content > section.pagination)
- Uploads consolidated classification (only name + type) to JSONStorage in a single request
- Compresses payload using LZString Base64

Usage:
  python nhentai_catalog_scraper.py --delay 0.8
  python nhentai_catalog_scraper.py --categories artists tags --delay 0.8 --max-pages 3

Notes:
- Tries to use cloudscraper to handle Cloudflare. Falls back to requests with a desktop User-Agent.
- Respects a small delay between requests; adjust via --delay to be kinder to the site.
"""

import argparse
import json
import time
import re
import sys
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Optional

BASE_URL = "https://nhentai.net"
DEFAULT_CATEGORIES = ["artists", "tags", "parodies", "groups", "characters"]

# JSONStorage public config (matches userscript publicConfig)
JSONSTORAGE_URL = "https://api.jsonstorage.net/v1/json"
JSONSTORAGE_API_KEY = "2f9e71c8-be66-4623-a2cc-a6f05e958563"
# Public bucket derived from userscript publicConfig.url
JSONSTORAGE_BUCKET_ID = "d206ce58-9543-48db-a5e4-997cfc745ef3"
# Dedicated taxonomy document (separate from user data)
JSONSTORAGE_TAXONOMY_DOC_ID = "8df52f74-3276-4244-9dc7-c0690412a40a"


def make_session():
    """Create an HTTP session. Prefer cloudscraper; fallback to requests."""
    try:
        import cloudscraper  # type: ignore
        scraper = cloudscraper.create_scraper(
            browser={"browser": "chrome", "platform": "windows", "mobile": False}
        )
        return scraper
    except Exception:
        import requests  # type: ignore
        s = requests.Session()
        s.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
            )
        })
        return s


def parse_count(text: str) -> Optional[int]:
    """Parse a count like '12', '1.2K', '3M' into an integer."""
    if not text:
        return None
    text = text.strip()
    m = re.match(r"([0-9]+(?:\.[0-9]+)?)([KkMm]?)", text)
    if not m:
        return None
    num = float(m.group(1))
    suffix = m.group(2).lower()
    mult = 1
    if suffix == "k":
        mult = 1000
    elif suffix == "m":
        mult = 1_000_000
    return int(num * mult)


def get_max_pages(html: str) -> int:
    """Find the maximum page number in the pagination section."""
    from bs4 import BeautifulSoup  # type: ignore
    soup = BeautifulSoup(html, "html.parser")
    pag = soup.select_one("#content > section.pagination") or soup.select_one("section.pagination")
    if not pag:
        return 1
    nums: List[int] = []
    for el in pag.select("a, span"):
        txt = el.get_text(strip=True)
        if txt.isdigit():
            nums.append(int(txt))
    return max(nums) if nums else 1


def parse_tag_items(html: str, category: str) -> List[Dict]:
    """Parse items from tag container(s) on a page, returning only name+type."""
    from bs4 import BeautifulSoup  # type: ignore

    soup = BeautifulSoup(html, "html.parser")

    # Prefer explicit tag container selectors; fallback to anchors if needed
    anchors = soup.select("#tag-container a.tag, div.tag-container a.tag")
    if not anchors:
        anchors = soup.select("#tag-container a, div.tag-container a")
    if not anchors:
        anchors = soup.select("a.tag")

    # Normalize type to singular for smart-tags usage
    type_map = {
        "artists": "artist",
        "tags": "tag",
        "parodies": "parody",
        "groups": "group",
        "characters": "character",
    }
    item_type = type_map.get(category, category.rstrip("s"))

    items: List[Dict] = []
    for a in anchors:
        name_el = a.select_one(".name")
        name = (name_el.get_text(strip=True) if name_el else a.get_text(strip=True)).strip()
        if not name:
            continue
        items.append({
            "type": item_type,
            "name": name,
        })
    return items


def scrape_category(session, category: str, delay: float, max_pages: Optional[int] = None) -> Tuple[List[Dict], int]:
    """Scrape one category by following the Next link until it disappears, with detailed logging."""
    from bs4 import BeautifulSoup  # type: ignore
    from urllib.parse import urljoin

    base_path = f"{BASE_URL}/{category}/"
    print(f"[{category}] Starting scrape at: {base_path}")
    r = session.get(base_path)
    r.raise_for_status()

    results = parse_tag_items(r.text, category)
    print(f"[{category}] Page 1 parsed: {len(results)} items")
    pages_visited = 1

    def get_next_url(html: str) -> Optional[str]:
        soup = BeautifulSoup(html, "html.parser")
        next_link = soup.select_one("section.pagination a.next")
        href = next_link.get("href") if next_link else None
        if href:
            full = urljoin(BASE_URL, href)
            print(f"[{category}] Next link found: {full}")
            return full
        print(f"[{category}] No next link; reached end at page {pages_visited}")
        return None

    next_url = get_next_url(r.text)
    while next_url and (not isinstance(max_pages, int) or pages_visited < max_pages):
        time.sleep(delay)
        rp = session.get(next_url)
        if rp.status_code >= 400:
            print(f"[{category}] Warning: failed page {pages_visited + 1}: HTTP {rp.status_code}", file=sys.stderr)
            break
        page_items = parse_tag_items(rp.text, category)
        pages_visited += 1
        print(f"[{category}] Page {pages_visited} parsed: {len(page_items)} items")
        results.extend(page_items)
        next_url = get_next_url(rp.text)

    # Deduplicate by (type, name)
    deduped: List[Dict] = []
    seen = set()
    for itm in results:
        key = (itm.get("type"), itm.get("name", "").lower())
        if key not in seen:
            seen.add(key)
            deduped.append(itm)
    print(f"[{category}] Done. Pages visited: {pages_visited}. Raw items: {len(results)}. Deduped: {len(deduped)}")
    return deduped, pages_visited


def compress_items_base64(items: List[Dict]) -> str:
    """Compress taxonomy using LZString Base64. Store byType arrays to reduce JSON overhead."""
    from lzstring import LZString  # type: ignore
    lz = LZString()

    by_type: Dict[str, List[str]] = {"artist": [], "tag": [], "parody": [], "group": [], "character": []}
    seen: Dict[str, set] = {t: set() for t in by_type.keys()}
    for itm in items:
        t = str(itm.get("type", "")).lower()
        n = str(itm.get("name", "")).strip()
        if t in by_type and n and n.lower() not in seen[t]:
            seen[t].add(n.lower())
            by_type[t].append(n)

    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "byType": by_type,
    }
    return lz.compressToBase64(json.dumps(payload, ensure_ascii=False))


def single_upload_to_jsonstorage(session, base64_payload: str) -> Dict:
    """Upload taxonomy to dedicated document. Replaces document content with taxonomy wrapper."""
    print(f"[upload] Target: bucket={JSONSTORAGE_BUCKET_ID} doc={JSONSTORAGE_TAXONOMY_DOC_ID}")

    put_url = f"{JSONSTORAGE_URL}/{JSONSTORAGE_BUCKET_ID}/{JSONSTORAGE_TAXONOMY_DOC_ID}?apiKey={JSONSTORAGE_API_KEY}"
    body = {
        "taxonomy": {
            "isCompressed": True,
            "version": "taxonomy_v1",
            "compressedData": base64_payload,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    }
    # We use requests-like session; depending on backend, set header
    try:
        r_put = session.put(put_url, json=body, headers={"Content-Type": "application/json"})
        print(f"[upload] PUT status: {getattr(r_put, 'status_code', 'unknown')}")
        # cloudscraper returns requests.Response; fallback: assume requests
        if hasattr(r_put, "raise_for_status"):
            r_put.raise_for_status()
        try:
            data = r_put.json() if hasattr(r_put, "json") else {}
        except Exception:
            data = {"status": getattr(r_put, 'status_code', None), "text": getattr(r_put, 'text', '')}
    except Exception as e:
        print(f"[upload] PUT failed: {e}")
        raise

    data = data or {}
    data["uri"] = f"{JSONSTORAGE_URL}/{JSONSTORAGE_BUCKET_ID}/{JSONSTORAGE_TAXONOMY_DOC_ID}"
    return data


def main():
    ap = argparse.ArgumentParser(description="Scrape nhentai taxonomy and save to a local JSON file")
    ap.add_argument("--categories", nargs="*", default=DEFAULT_CATEGORIES, help="Categories to scrape")
    ap.add_argument("--delay", type=float, default=0.8, help="Delay between page requests in seconds")
    ap.add_argument("--max-pages", type=int, default=None, help="Optional cap on pages per category for testing")
    ap.add_argument("--output-file", default="nhentai_taxonomy.json", help="Path to write taxonomy JSON (default: nhentai_taxonomy.json)")
    args = ap.parse_args()

    cats = args.categories or DEFAULT_CATEGORIES
    session = make_session()

    print(f"Starting taxonomy scrape at {datetime.now(timezone.utc).isoformat()}")
    print(f"Categories: {', '.join(cats)} | delay={args.delay} | max_pages={args.max_pages if args.max_pages else 'unlimited'}")

    all_items: List[Dict] = []

    for cat in cats:
        try:
            items, pages = scrape_category(session, cat, args.delay, args.max_pages)
            all_items.extend(items)
            print(f"Scraped {cat}: {len(items)} items across {pages} pages")
        except Exception as e:
            print(f"Error scraping {cat}: {e}", file=sys.stderr)

    print(f"Building byType for {len(all_items)} consolidated items")
    by_type: Dict[str, List[str]] = {"artist": [], "tag": [], "parody": [], "group": [], "character": []}
    seen: Dict[str, set] = {t: set() for t in by_type.keys()}
    for itm in all_items:
        t = str(itm.get("type", "")).lower()
        n = str(itm.get("name", "")).strip()
        if t in by_type and n:
            nl = n.lower()
            if nl not in seen[t]:
                seen[t].add(nl)
                by_type[t].append(n)

    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "byType": by_type,
    }
    out_path = getattr(args, "output_file", "nhentai_taxonomy.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"Wrote taxonomy JSON to {out_path}")


if __name__ == "__main__":
    main()