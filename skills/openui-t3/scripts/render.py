#!/usr/bin/env python3
"""Wrap an OpenUI Lang file for T3 HTML artifacts; standard library only."""
import argparse
import html
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--title", default="OpenUI interface")
    args = parser.parse_args()
    template = (Path(__file__).resolve().parents[1] / "assets" / "wrapper.html").read_text()
    # Escape HTML-significant characters even inside inert JSON script content.
    program = json.dumps(args.input.read_text(), ensure_ascii=True).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    output = template.replace("__DOCUMENT_TITLE__", html.escape(args.title)).replace("__PROGRAM_JSON__", program)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(output)
    print(args.out.resolve())


if __name__ == "__main__":
    main()
