#!/usr/bin/env python3
"""OCR all PDF pages and extract weekly menu data."""
import base64
import json
import requests
import re
import sys

OCR_URL = "http://101.47.12.170:8080/layout-parsing"
PAGES_DIR = "/root/老人餐/pdf_pages"

def ocr_page(image_path):
    """Send image to OCR and return the table markdown."""
    with open(image_path, "rb") as f:
        img_data = base64.b64encode(f.read()).decode()

    payload = {
        "file": img_data,
        "fileType": 0,  # 0 for image
        "visualize": False
    }

    print(f"  Sending to OCR ({len(img_data)/1024:.0f}KB)...", end=" ", flush=True)
    try:
        resp = requests.post(OCR_URL, json=payload, timeout=120)
        data = resp.json()
    except Exception as e:
        print(f"ERROR: {e}")
        return None

    # Extract table markdown
    markdown = ""
    try:
        if data.get("result") and data["result"].get("layoutParsingResults"):
            for item in data["result"]["layoutParsingResults"]:
                if item.get("prunedResult") and item["prunedResult"].get("parsing_res_list"):
                    for block in item["prunedResult"]["parsing_res_list"]:
                        if block.get("block_label") == "table" and block.get("block_content"):
                            markdown = block["block_content"]
                            break
                if markdown:
                    break
    except:
        pass

    if not markdown:
        # Try other response formats
        if data.get("success") and data.get("data", {}).get("markdown"):
            markdown = data["data"]["markdown"]
        elif data.get("markdown"):
            markdown = data["markdown"]

    if markdown:
        print(f"OK ({len(markdown)} chars)")
        return markdown
    else:
        print(f"NO TABLE (keys: {list(data.keys())})")
        return None


def parse_markdown_table(markdown):
    """Parse markdown table into structured data.

    Expected format from OCR:
    | | WEEK X | MONDAY | | TUESDAY | | ... | SUNDAY | |
    | MAIN主餐(rows=4) | Regular Main | meal1 | | meal2 | | ... | meal7 | |
    | | Easy to Chew | ... |
    | | Vegetarian | ... |
    | | Main Meal (Farmdoor) | ... |
    | DESSERTS(rows=2) | Sweet | ... |
    | | Fruit + Dairy | ... |
    """
    lines = markdown.strip().split('\n')
    # Filter out separator lines (|---|)
    data_lines = [l for l in lines if not re.match(r'^\s*\|[\s\-:|]+\|', l)]

    print(f"  Table has {len(data_lines)} data lines")
    for i, line in enumerate(data_lines):
        print(f"    [{i}] {line[:200]}")

    return data_lines


def main():
    import os
    pages = sorted([
        f for f in os.listdir(PAGES_DIR)
        if f.endswith('.png')
    ], key=lambda x: int(x.replace('page-', '').replace('.png', '')))

    print(f"Found {len(pages)} pages: {pages}")

    all_results = {}
    for page in pages:
        path = os.path.join(PAGES_DIR, page)
        print(f"\nProcessing {page}...")
        markdown = ocr_page(path)
        if markdown:
            parse_markdown_table(markdown)
            all_results[page] = markdown
        else:
            print(f"  FAILED for {page}")

    # Save raw results for later parsing
    with open("/root/老人餐/pdf_pages/ocr_results.json", "w") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(all_results)} results to ocr_results.json")

if __name__ == "__main__":
    main()
