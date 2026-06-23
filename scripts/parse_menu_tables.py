#!/usr/bin/env python3
"""Parse OCR menu table HTML into structured JSON for all 4 weeks."""
import json, re, html as html_mod
from html.parser import HTMLParser

class MenuTableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []         # list of list of cell texts
        self.current_row = []
        self.current_cell = []
        self.in_td = False
        self.in_th = False
        self.skip_cell = False

    def handle_starttag(self, tag, attrs):
        if tag in ('td', 'th'):
            self.current_cell = []
            self.in_td = True if tag == 'td' else False
            self.in_th = True if tag == 'th' else False

    def handle_endtag(self, tag):
        if tag in ('td', 'th'):
            cell_text = ''.join(self.current_cell).strip()
            self.current_row.append(cell_text)
            self.in_td = False
            self.in_th = False
            self.current_cell = []
        elif tag == 'tr':
            if self.current_row:
                self.rows.append(self.current_row)
                self.current_row = []

    def handle_data(self, data):
        if self.in_td or self.in_th:
            self.current_cell.append(data)

# Days of week in order
DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

def parse_week_table(html_content):
    """Parse a menu table HTML and extract structured meal data."""
    parser = MenuTableParser()
    parser.feed(html_content)

    if not parser.rows:
        print("  No rows found!")
        return None

    # Find week number from header row
    week_num = None
    for row in parser.rows:
        for cell in row:
            m = re.search(r'WEEK\s*(\d)', cell, re.IGNORECASE)
            if m:
                week_num = int(m.group(1))
                break
        if week_num is not None:
            break

    if week_num is None:
        # Try page header
        week_num = "?"
        print("  WARNING: Could not determine week number")

    print(f"  Week {week_num}: {len(parser.rows)} rows")

    # Print row structure for debugging
    for i, row in enumerate(parser.rows):
        non_empty = [c[:80] for c in row if c]
        print(f"    Row {i}: {len(row)} cells, non-empty: {non_empty[:5]}...")

    # Identify meal rows - skip header rows (those with WEEK/MONDAY etc.)
    meal_rows = []
    for row in parser.rows:
        # Skip header rows
        if any('WEEK' in c.upper() or 'MONDAY' in c.upper() or 'TUESDAY' in c.upper() for c in row):
            continue
        # Skip empty rows
        if not any(c for c in row):
            continue
        # Check if it's a meal row (has sub category)
        meal_rows.append(row)

    print(f"    Meal rows: {len(meal_rows)}")

    # Parse each meal row
    categories = []
    for row in meal_rows:
        # Remove empty cells
        cells = [c for c in row if c]

        # Skip annotation/footnote rows
        first_cell = cells[0] if cells else ''
        if first_cell and ('LSF' in first_cell[:30] or 'DBF' in first_cell[:30] or 'Note' in first_cell[:30]):
            continue

        if len(cells) < 2:
            continue

        # First non-empty cell is either main category (MAIN/DESSERTS) or sub category
        # Second non-empty cell(s) are sub-category or meals
        cat_name = cells[0]
        sub_cat = cells[1] if len(cells) > 1 else ''

        # Detect if first cell is a main category (MAIN/DESSERTS) rather than sub-category
        is_main_cat = any(kw in cat_name for kw in ['MAIN', '主餐', 'DESSERT', '甜点'])

        # Collect meals (remaining cells after category info)
        meal_cells = cells[2:] if is_main_cat else cells[1:]

        # Remove separator/checkmark cells (just spaces, checkmarks, numbers)
        meals = []
        for m in meal_cells:
            # Skip separator cells
            if m in ('', '✓', '✗', '1', '2', '3') or m.strip() in ('', '✓', '✗', '1', '2', '3'):
                continue
            # Skip cells that are clearly not meals (too short, etc)
            if len(m) < 3:
                continue
            meals.append(html_mod.unescape(m))

        # Remove duplicates that might be checkmarks/annotations
        # Only keep meals (should have actual names)
        real_meals = []
        for m in meals:
            # Skip if it's just tags
            if re.match(r'^\(?(LSF|LS|GF|DF|DBF)\)?$', m.strip()):
                continue
            real_meals.append(m)

        cat_info = {
            'mainCategory': cat_name if is_main_cat else None,
            'subCategory': cat_name if not is_main_cat else sub_cat,
            'meals': real_meals[:7]  # Take at most 7 meals (Mon-Sun)
        }
        categories.append(cat_info)

    # Build the week data structure
    # Expected 6 categories: 4 MAIN + 2 DESSERTS
    result = {
        'week': week_num,
        'categories': categories
    }
    return result

def main():
    with open('/root/老人餐/pdf_pages/menu_tables.json', 'r') as f:
        tables = json.load(f)

    all_weeks = {}
    for page, html in sorted(tables.items()):
        print(f"\nParsing {page}...")
        week_data = parse_week_table(html)
        if week_data:
            all_weeks[f"week{week_data['week']}"] = week_data

    with open('/root/老人餐/pdf_pages/parsed_menu.json', 'w') as f:
        json.dump(all_weeks, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(all_weeks)} weeks to parsed_menu.json")

if __name__ == '__main__':
    main()
