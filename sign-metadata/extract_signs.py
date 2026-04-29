# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""
Oklahoma Driver Manual — Sign Image Extractor
==============================================
Extracts all traffic sign images from the Oklahoma Driver Manual PDF
and saves them as individual PNG files alongside a JSON database.

Usage:
    pip install pymupdf pillow
    python extract_signs.py

Output:
    signs_output/
    ├── signs/              ← Individual sign PNG images (34 signs)
    │   ├── reg_no_right_turn.png
    │   ├── warn_deer_crossing.png
    │   └── ...
    └── signs_metadata.json ← JSON database of all signs + meanings

Database Schema (signs_metadata.json):
    [
      {
        "id":          "warn_deer_crossing",     # unique key for your DB
        "label":       "Deer Crossing",          # short display name
        "meaning":     "Deer crossing area...",  # full explanation
        "chapter":     4,                        # manual chapter
        "category":    "warning",                # regulatory/warning/construction/signal
        "image_path":  "signs_output/signs/warn_deer_crossing.png"
      },
      ...
    ]

Next steps for your database:
    - Import signs_metadata.json into Supabase (or SQLite)
    - Upload PNG files to Supabase Storage (or serve locally)
    - Build image-based quiz questions that reference image_path / image_url
"""

import os, json
import fitz          # pip install pymupdf
from PIL import Image  # pip install pillow

# ── Config ────────────────────────────────────────────────────────────────────
PDF_PATH    = "OklahomaDriverManual.pdf"
OUTPUT_DIR  = "signs_output"
SIGNS_DIR   = os.path.join(OUTPUT_DIR, "signs")
SCALE       = 3   # render at 3× for crisp images (higher = bigger files)
PADDING     = 8   # px padding around each cropped sign

# ── Helpers ───────────────────────────────────────────────────────────────────
def render_page(doc, page_index, scale=SCALE):
    """Render a PDF page to a PIL Image at the given scale."""
    page = doc[page_index]
    mat  = fitz.Matrix(scale, scale)
    pix  = page.get_pixmap(matrix=mat)
    img_path = os.path.join(OUTPUT_DIR, f"_page_{page_index+1}.png")
    pix.save(img_path)
    return img_path

def crop_sign(page_img_path, bbox_pts, out_path, padding=PADDING):
    """
    Crop a sign region from a full-page rendered image.
    bbox_pts: (x0, y0, x1, y1) in PDF points (612×792 coordinate space)
    """
    img = Image.open(page_img_path)
    x0, y0, x1, y1 = bbox_pts
    px0 = max(0,          int(x0 * SCALE) - padding)
    py0 = max(0,          int(y0 * SCALE) - padding)
    px1 = min(img.width,  int(x1 * SCALE) + padding)
    py1 = min(img.height, int(y1 * SCALE) + padding)
    img.crop((px0, py0, px1, py1)).save(out_path)
    return out_path

# ── Sign definitions ──────────────────────────────────────────────────────────
# Each entry:  (id, category, label, meaning, chapter, page_index_0based, bbox)
# bbox = (x0, y0, x1, y1) in PDF points on a 612×792 page

SIGN_DEFS = [

    # ── REGULATORY SIGNS — black & white rectangles (page 20 = index 19) ─────
    ("reg_lane_left",       "regulatory", "Lane Direction: Left Only",
     "Lane 1 must turn left. Lane 2 is optional (left or straight).",
     4, 19, (36, 265, 120, 375)),

    ("reg_lane_straight",   "regulatory", "Lane Direction: Straight",
     "Lane 1 must go straight. Lane 2 is optional (right or straight).",
     4, 19, (130, 265, 215, 375)),

    ("reg_turn_left_only",  "regulatory", "Turn Left Only",
     "Must turn left from this lane. No straight or right turns allowed.",
     4, 19, (230, 268, 315, 358)),

    ("reg_straight_only",   "regulatory", "No Turns — Straight Only",
     "No turns from this lane. Go straight only.",
     4, 19, (345, 268, 430, 358)),

    ("reg_speed_65",        "regulatory", "Speed Limit Sign",
     "Maximum speed is 65 mph under ideal conditions on this road.",
     4, 19, (236, 426, 326, 565)),

    ("reg_do_not_enter",    "regulatory", "Do Not Enter",
     "One-way traffic is coming toward you. Do not drive into it.",
     4, 19, (338, 426, 448, 565)),

    ("reg_no_passing_zone", "regulatory", "No Passing Zone",
     "Do not pass. Do not cross yellow lines. You cannot see far enough ahead.",
     4, 19, (232, 570, 360, 705)),

    ("reg_do_not_pass",     "regulatory", "Do Not Pass",
     "Passing is not allowed in this zone.",
     4, 19, (348, 570, 462, 702)),

    ("reg_center_lane",     "regulatory", "Center Lane Only",
     "Enter this lane only for a left turn. You must not pass in this lane.",
     4, 19, (36, 440, 128, 580)),

    ("reg_keep_right",      "regulatory", "Keep Right",
     "Keep right of an object or center divider.",
     4, 19, (132, 540, 230, 638)),

    ("reg_no_right_turn",   "regulatory", "No Right Turn",
     "Right turns are prohibited at this intersection.",
     4, 19, (36, 680, 126, 769)),

    ("reg_no_u_turn",       "regulatory", "No U-Turn",
     "U-turns are not permitted. Do not turn around in the street or intersection.",
     4, 19, (132, 680, 228, 769)),

    ("reg_no_trucks",       "regulatory", "No Trucks",
     "Trucks are prohibited from using this road.",
     4, 19, (236, 680, 330, 769)),

    ("reg_no_bicycles",     "regulatory", "No Bicycles",
     "Bicycles are not permitted on this roadway.",
     4, 19, (340, 680, 430, 769)),

    # ── WARNING SIGNS — yellow diamonds (page 21 = index 20) ─────────────────
    ("warn_signal_ahead",   "warning",    "Traffic Signal Ahead",
     "Traffic control signal ahead. Be prepared to stop.",
     4, 20, (36, 186, 135, 300)),

    ("warn_divided_ends",   "warning",    "Divided Highway Ends",
     "Divided highway ends. Two-way traffic begins — stay in right lane.",
     4, 20, (141, 186, 242, 300)),

    ("warn_low_clearance",  "warning",    "Low Clearance",
     "Vehicles or loads higher than the clearance shown cannot pass through the underpass.",
     4, 20, (248, 186, 355, 300)),

    ("warn_curve_right",    "warning",    "Curve Ahead (Right)",
     "Road makes a gentle curve to the right. Slow down, keep right, don't pass.",
     4, 20, (360, 186, 462, 300)),

    ("warn_divided_ahead",  "warning",    "Divided Highway Ahead",
     "Divided highway ahead with a center median. Keep to the right.",
     4, 20, (466, 186, 568, 300)),

    ("warn_two_way",        "warning",    "Two-Way Traffic Ahead",
     "Drive in the right lane. Expect oncoming traffic in the left lane.",
     4, 20, (36, 330, 135, 442)),

    ("warn_added_lane",     "warning",    "Added Lane / Watch for Merge",
     "Two roadways merge ahead with a new lane added. Watch for traffic.",
     4, 20, (141, 330, 242, 442)),

    ("warn_merge",          "warning",    "Merge",
     "Other traffic may move into your lane. Be ready to adjust speed and lane position.",
     4, 20, (248, 330, 355, 442)),

    ("warn_right_lane_ends","warning",    "Right Lane Ends",
     "Right lane ends ahead. Prepare to merge left.",
     4, 20, (360, 330, 460, 442)),

    ("warn_hill",           "warning",    "Steep Hill Ahead",
     "Steep grade ahead. Use a lower gear to slow your vehicle. Approach with caution.",
     4, 20, (466, 330, 568, 520)),

    ("warn_deer_crossing",  "warning",    "Deer Crossing",
     "Deer crossing area ahead. Watch for animals on or near the road.",
     4, 20, (36, 480, 136, 589)),

    ("warn_stop_ahead",     "warning",    "Stop Sign Ahead",
     "A stop sign is ahead. Be prepared to stop completely.",
     4, 20, (141, 475, 242, 589)),

    ("warn_narrow_bridge",  "warning",    "Narrow Bridge",
     "Narrow two-lane bridge or culvert ahead. Approach with caution.",
     4, 20, (248, 480, 355, 589)),

    ("warn_pedestrian",     "warning",    "Pedestrian Crossing",
     "Pedestrian crossing ahead. Slow down and prepare to stop. You must yield.",
     4, 20, (360, 480, 460, 589)),

    ("warn_school_zone",    "warning",    "School Zone Sign",
     "School zone. Slow to posted limit when yellow light is flashing. Watch for children.",
     4, 20, (265, 620, 370, 700)),

    ("warn_school_crossing","warning",    "School Crossing",
     "School crossing ahead. Watch for children crossing the road.",
     4, 20, (380, 620, 470, 700)),

    # ── WARNING signs continued — reflectors & railroad (page 22 = index 21) ─
    ("warn_railroad_crossbuck", "warning", "Railroad Crossbuck",
     "Railroad crossing ahead. Slow down, look both ways, stop if a train is coming.",
     4, 21, (36, 190, 380, 380)),

    # ── CONSTRUCTION SIGNS — orange (page 23 = index 22) ─────────────────────
    ("const_work_zone",     "construction", "Work Zone / Construction Sign",
     "Orange signs mean you are in a work zone. Fines are DOUBLED when workers are present.",
     4, 22, (36, 186, 576, 480)),

    # ── TRAFFIC SIGNALS (page 26 = index 25) ─────────────────────────────────
    ("signal_traffic_lights","signal",   "Traffic Light Colors",
     "Green=Go. Yellow=Caution/prepare to stop. Red=Stop completely before crosswalk.",
     4, 25, (36, 186, 576, 580)),

    # ── LANE MARKINGS (page 27 = index 26) ───────────────────────────────────
    ("lane_markings_overview","marking", "Pavement Lane Markings",
     "Yellow lines = opposing traffic. White lines = same-direction traffic. "
     "Dashed = passing permitted. Solid = do not cross.",
     4, 26, (36, 186, 576, 580)),
]

# ── Main extraction ───────────────────────────────────────────────────────────
def main():
    os.makedirs(SIGNS_DIR, exist_ok=True)

    print(f"Opening: {PDF_PATH}")
    doc = fitz.open(PDF_PATH)

    # Render only the pages we need (cache them)
    pages_needed = sorted(set(d[5] for d in SIGN_DEFS))
    page_images  = {}
    print(f"Rendering {len(pages_needed)} pages at {SCALE}× resolution...")
    for pg_idx in pages_needed:
        page_images[pg_idx] = render_page(doc, pg_idx)
        print(f"  Page {pg_idx + 1} ✓")

    # Extract each sign
    results = []
    print(f"\nCropping {len(SIGN_DEFS)} signs...")
    for sign_id, category, label, meaning, chapter, pg_idx, bbox in SIGN_DEFS:
        out_path = os.path.join(SIGNS_DIR, f"{sign_id}.png")
        try:
            crop_sign(page_images[pg_idx], bbox, out_path)
            results.append({
                "id":         sign_id,
                "category":   category,
                "label":      label,
                "meaning":    meaning,
                "chapter":    chapter,
                "image_path": out_path,
            })
            print(f"  ✓ {sign_id}")
        except Exception as e:
            print(f"  ✗ {sign_id}: {e}")

    # Clean up temp page renders
    for pg_path in page_images.values():
        os.remove(pg_path)

    # Save JSON metadata
    meta_path = os.path.join(OUTPUT_DIR, "signs_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n{'─'*50}")
    print(f"Done!  {len(results)} sign images saved to: {SIGNS_DIR}/")
    print(f"       Metadata saved to:               {meta_path}")
    print(f"\nNext steps:")
    print(f"  1. Review images in {SIGNS_DIR}/")
    print(f"  2. Import {meta_path} into your database")
    print(f"  3. Upload PNG files to Supabase Storage or serve locally")
    print(f"  4. Build image quiz questions using 'image_path' field")

if __name__ == "__main__":
    main()
