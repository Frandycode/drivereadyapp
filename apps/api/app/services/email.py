# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)


async def send_email(*, to: str, subject: str, html: str) -> None:
    """Send an email. Falls back to console logging in dev when SMTP is not configured."""
    if not settings.smtp_host:
        logger.info(
            "\n━━━ [DEV EMAIL] ━━━\nTo: %s\nSubject: %s\n\n%s\n━━━━━━━━━━━━━━━━━",
            to,
            subject,
            html,
        )
        return

    import aiosmtplib

    msg = MIMEMultipart("alternative")
    msg["From"]    = settings.smtp_from
    msg["To"]      = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user or None,
        password=settings.smtp_password or None,
        start_tls=settings.smtp_tls,
    )


async def send_parental_consent_email(
    *,
    parent_email: str,
    child_name: str,
    approve_url: str,
    deny_url: str,
) -> None:
    html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Parental Consent Request — DriveReady</title>
</head>
<body style="margin:0;padding:0;background:#0A0F0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#E8F0EB;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F0D;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111A14;border:1px solid #1E2D22;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#0D6B35;padding:28px 36px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">DriveReady</h1>
              <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">AI-Powered Driver Education</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#E8F0EB;">Parental Consent Request</h2>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#9DB8A4;">
                <strong style="color:#E8F0EB;">{child_name}</strong> has created a DriveReady account and listed you as their parent or guardian.
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#9DB8A4;">
                DriveReady is a driver's education study app. To comply with the
                <strong style="color:#E8F0EB;">Children's Online Privacy Protection Act (COPPA)</strong>,
                we require parental consent before activating accounts for users under 18.
              </p>

              <!-- What we collect -->
              <div style="background:#0A0F0D;border:1px solid #1E2D22;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#22C55E;text-transform:uppercase;letter-spacing:0.5px;">What we collect</p>
                <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.8;color:#9DB8A4;">
                  <li>Name and email address</li>
                  <li>Date of birth (month and year only)</li>
                  <li>Study progress and quiz scores</li>
                  <li>No location data, no payment data, no social features</li>
                </ul>
              </div>

              <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#9DB8A4;">
                This link expires in <strong style="color:#E8F0EB;">72 hours</strong>. If you did not expect this email, you can safely ignore it or click Deny below.
              </p>

              <!-- Buttons -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding-right:8px;">
                    <a href="{approve_url}"
                       style="display:block;text-align:center;background:#22C55E;color:#0A0F0D;text-decoration:none;padding:13px 0;border-radius:8px;font-size:14px;font-weight:700;">
                      Approve Account
                    </a>
                  </td>
                  <td style="padding-left:8px;">
                    <a href="{deny_url}"
                       style="display:block;text-align:center;background:#111A14;color:#EF4444;text-decoration:none;padding:13px 0;border-radius:8px;font-size:14px;font-weight:600;border:1px solid rgba(239,68,68,0.4);">
                      Deny &amp; Delete Account
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #1E2D22;">
              <p style="margin:0;font-size:11px;color:#4A6B54;line-height:1.6;">
                DriveReady · driveready.app · Questions? Contact us at support@driveready.app<br/>
                This email was sent because someone listed this address as a parent or guardian.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    await send_email(
        to=parent_email,
        subject=f"Action required: {child_name} wants to use DriveReady",
        html=html,
    )
