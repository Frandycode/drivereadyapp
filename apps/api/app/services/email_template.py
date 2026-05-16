# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Shared DriveReady email template helpers.

Email clients are restrictive, so these helpers use table-based structure and
mostly inline styles. The visual language mirrors the app: warmed navy surfaces,
cream text, restrained vintage accents, and full brand orange for primary CTAs.
"""

from html import escape
from typing import Optional


BRAND_BG = "#0E1130"
BRAND_SURFACE = "#0A1740"
BRAND_SURFACE_2 = "#142555"
BRAND_BORDER = "rgba(245,240,230,0.10)"

CREAM = "#F5F0E6"
CREAM_DIM = "rgba(245,240,230,0.65)"
CREAM_MUTED = "rgba(245,240,230,0.42)"

BRAND_ORANGE = "#F45B26"
BRAND_YELLOW = "#F8DE22"
BRAND_NAVY = "#021A54"

VINTAGE_BRICK = "#963024"
VINTAGE_TERRACOTTA = "#C75A3A"

APP_URL = "https://drivereadyapp.com"
SUPPORT_EMAIL = "support@drivereadyapp.com"


def render_email_shell(
    *,
    preheader: str,
    body_html: str,
    footer_note: Optional[str] = None,
) -> str:
    footer_block = ""
    if footer_note:
        footer_block = f"""
          <tr>
            <td style="padding:14px 36px 0;border-top:1px solid {BRAND_BORDER};">
              <p style="margin:0;font-size:11px;color:{CREAM_MUTED};line-height:1.6;">
                {footer_note}
              </p>
            </td>
          </tr>
        """

    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>DriveReady</title>
  <style>
    @media only screen and (max-width: 620px) {{
      .dr-shell {{ width: 100% !important; }}
      .dr-pad {{ padding-left: 24px !important; padding-right: 24px !important; }}
    }}
  </style>
</head>
<body style="margin:0;padding:0;background:{BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:{CREAM};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;visibility:hidden;">
    {preheader}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:{BRAND_BG};padding:40px 20px;">
    <tr>
      <td align="center">
        <table class="dr-shell" width="560" cellpadding="0" cellspacing="0" role="presentation" style="width:560px;max-width:100%;background:{BRAND_SURFACE};border:1px solid {BRAND_BORDER};border-radius:14px;overflow:hidden;">
          <tr>
            <td class="dr-pad" style="background:{BRAND_BG};padding:28px 36px;border-bottom:1px solid {BRAND_BORDER};">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:{BRAND_ORANGE};width:30px;height:30px;border-radius:7px;vertical-align:middle;text-align:center;line-height:30px;font-size:15px;font-weight:800;color:{BRAND_BG};">
                    ✓
                  </td>
                  <td style="padding-left:10px;">
                    <span style="font-family:'Syne','Segoe UI',sans-serif;font-weight:800;font-size:18px;color:{CREAM};letter-spacing:-0.3px;">
                      Drive<span style="color:{BRAND_ORANGE};">Ready</span>
                    </span>
                    <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:{CREAM_MUTED};margin-top:2px;">
                      drivereadyapp.com
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="dr-pad" style="padding:32px 36px;">
              {body_html}
            </td>
          </tr>

          <tr>
            <td style="height:4px;padding:0;line-height:0;font-size:0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
                <td width="33.33%" style="background:{CREAM};height:4px;line-height:0;font-size:0;">&nbsp;</td>
                <td width="33.34%" style="background:{BRAND_NAVY};height:4px;line-height:0;font-size:0;">&nbsp;</td>
                <td width="33.33%" style="background:{BRAND_ORANGE};height:4px;line-height:0;font-size:0;">&nbsp;</td>
              </tr></table>
            </td>
          </tr>

          <tr>
            <td class="dr-pad" style="padding:20px 36px;">
              <p style="margin:0;font-size:11px;color:{CREAM_MUTED};line-height:1.6;">
                DriveReady · <a href="{APP_URL}" style="color:{CREAM_DIM};text-decoration:none;">drivereadyapp.com</a>
                · Need help? <a href="mailto:{SUPPORT_EMAIL}" style="color:{CREAM_DIM};text-decoration:none;">{SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>
          {footer_block}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def primary_button(href: str, label: str) -> str:
    safe_href = escape(href, quote=True)
    safe_label = escape(label)
    return f"""\
<table cellpadding="0" cellspacing="0" role="presentation"><tr>
  <td style="background:{BRAND_ORANGE};border-radius:10px;">
    <a href="{safe_href}" style="display:inline-block;padding:14px 28px;font-family:'Syne','Segoe UI',sans-serif;font-weight:700;font-size:14px;color:{CREAM};text-decoration:none;letter-spacing:-0.1px;">
      {safe_label} →
    </a>
  </td>
</tr></table>
"""


def secondary_button(href: str, label: str) -> str:
    safe_href = escape(href, quote=True)
    safe_label = escape(label)
    return f"""\
<table cellpadding="0" cellspacing="0" role="presentation"><tr>
  <td style="border:1px solid {BRAND_BORDER};border-radius:10px;">
    <a href="{safe_href}" style="display:inline-block;padding:13px 28px;font-family:'Syne','Segoe UI',sans-serif;font-weight:600;font-size:14px;color:{CREAM_DIM};text-decoration:none;">
      {safe_label}
    </a>
  </td>
</tr></table>
"""


def danger_button(href: str, label: str) -> str:
    safe_href = escape(href, quote=True)
    safe_label = escape(label)
    return f"""\
<table cellpadding="0" cellspacing="0" role="presentation"><tr>
  <td style="background:{VINTAGE_BRICK};border-radius:10px;">
    <a href="{safe_href}" style="display:inline-block;padding:14px 28px;font-family:'Syne','Segoe UI',sans-serif;font-weight:700;font-size:14px;color:{CREAM};text-decoration:none;letter-spacing:-0.1px;">
      {safe_label}
    </a>
  </td>
</tr></table>
"""


def code_block(code: str) -> str:
    safe_code = escape(code)
    return f"""\
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:{BRAND_BG};border:1px solid {BRAND_BORDER};border-radius:12px;">
  <tr>
    <td style="padding:28px;text-align:center;">
      <span style="font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:42px;font-weight:700;letter-spacing:14px;color:{BRAND_YELLOW};">
        {safe_code}
      </span>
    </td>
  </tr>
</table>
"""


def stat_card(label: str, value: str) -> str:
    safe_label = escape(label)
    safe_value = escape(value)
    return f"""\
<td width="50%" style="padding:6px;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:{BRAND_SURFACE_2};border:1px solid {BRAND_BORDER};border-radius:10px;">
    <tr>
      <td style="padding:14px 16px;">
        <div style="font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:18px;font-weight:800;color:{BRAND_YELLOW};line-height:1;">
          {safe_value}
        </div>
        <div style="margin-top:6px;font-size:10px;color:{CREAM_MUTED};letter-spacing:0.10em;text-transform:uppercase;">
          {safe_label}
        </div>
      </td>
    </tr>
  </table>
</td>
"""
