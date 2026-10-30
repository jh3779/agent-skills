#!/usr/bin/env python3
"""Fetch and print entries from an RSS/Atom feed using only the standard library.
Usage: rss_fetch.py <feed-url> [max-entries]
"""
import sys
import urllib.request
import xml.etree.ElementTree as ET

ATOM_NS = "{http://www.w3.org/2005/Atom}"


def text(el):
    return (el.text or "").strip() if el is not None else ""


def parse_rss(root, limit):
    items = root.findall(".//item")[:limit]
    for item in items:
        title = text(item.find("title"))
        link = text(item.find("link"))
        pubdate = text(item.find("pubDate"))
        print(f"- {title}\n  {link}\n  {pubdate}\n")


def parse_atom(root, limit):
    entries = root.findall(f"{ATOM_NS}entry")[:limit]
    for entry in entries:
        title = text(entry.find(f"{ATOM_NS}title"))
        link_el = entry.find(f"{ATOM_NS}link")
        link = link_el.get("href") if link_el is not None else ""
        updated = text(entry.find(f"{ATOM_NS}updated"))
        print(f"- {title}\n  {link}\n  {updated}\n")


def main():
    if len(sys.argv) < 2:
        print("Usage: rss_fetch.py <feed-url> [max-entries]", file=sys.stderr)
        sys.exit(1)

    url = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 15

    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()

    root = ET.fromstring(data)

    if root.tag == "rss" or root.find("channel") is not None:
        parse_rss(root, limit)
    elif root.tag.endswith("feed"):
        parse_atom(root, limit)
    else:
        print("ERROR: unrecognized feed format", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
