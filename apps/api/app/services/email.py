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
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape

from app.config import settings
from app.services.email_template import (
    BRAND_BORDER,
    BRAND_SURFACE_2,
    BRAND_YELLOW,
    CREAM,
    CREAM_DIM,
    CREAM_MUTED,
    VINTAGE_BRICK,
    code_block,
    danger_button,
    primary_button,
    render_email_shell,
    secondary_button,
    stat_card,
)

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
    child = escape(child_name)
    body = f"""\
<h2 style="margin:0 0 14px;font-family:'Syne','Segoe UI',sans-serif;font-size:24px;font-weight:800;color:{CREAM};letter-spacing:-0.4px;">
  Parental consent request
</h2>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:{CREAM_DIM};">
  <strong style="color:{CREAM};">{child}</strong> created a DriveReady account and listed this address for parent or guardian approval.
</p>
<p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:{CREAM_DIM};">
  DriveReady is a driver education study app. To support family oversight and privacy compliance, this learner account needs consent before it can be activated.
</p>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:{BRAND_SURFACE_2};border:1px solid {BRAND_BORDER};border-left:4px solid {BRAND_YELLOW};border-radius:10px;margin-bottom:24px;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="margin:0 0 10px;font-size:12px;font-weight:800;color:{BRAND_YELLOW};text-transform:uppercase;letter-spacing:0.10em;">What DriveReady collects</p>
      <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.8;color:{CREAM_DIM};">
        <li>Name and email address</li>
        <li>Date of birth, month and year only</li>
        <li>Study progress, quiz scores, streaks, and readiness signals</li>
        <li>No location tracking, no payment data, and no public social profile</li>
      </ul>
    </td>
  </tr>
</table>
<p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:{CREAM_DIM};">
  This consent link expires in <strong style="color:{CREAM};">72 hours</strong>. If this was not expected, you can deny the request or ignore this email.
</p>
<table cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td style="padding-right:10px;">{primary_button(approve_url, "Approve account")}</td>
    <td>{secondary_button(deny_url, "Deny request")}</td>
  </tr>
</table>
"""
    await send_email(
        to=parent_email,
        subject=f"Action required: {child_name} wants to use DriveReady",
        html=render_email_shell(
            preheader=f"{child_name} needs parent or guardian approval to use DriveReady.",
            body_html=body,
            footer_note="This email was sent because someone listed this address as a parent or guardian.",
        ),
    )


async def send_email_change_otp(
    *,
    to: str,
    display_name: str,
    code: str,
) -> None:
    name = escape(display_name)
    address = escape(to)
    body = f"""\
<h2 style="margin:0 0 14px;font-family:'Syne','Segoe UI',sans-serif;font-size:24px;font-weight:800;color:{CREAM};letter-spacing:-0.4px;">
  Confirm your new email
</h2>
<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:{CREAM_DIM};">
  Hi {name}, enter this code to confirm <strong style="color:{CREAM};">{address}</strong> as your new DriveReady email.
  It expires in <strong style="color:{CREAM};">10 minutes</strong>.
</p>
{code_block(code)}
<p style="margin:24px 0 0;font-size:12px;color:{CREAM_MUTED};line-height:1.6;">
  If you did not request this change, you can safely ignore this email.
</p>
"""
    await send_email(
        to=to,
        subject=f"{code} — confirm your new DriveReady email",
        html=render_email_shell(
            preheader=f"Your email-change code is {code}. Expires in 10 minutes.",
            body_html=body,
        ),
    )


async def send_password_reset_email(
    *,
    to: str,
    display_name: str,
    reset_url: str,
) -> None:
    name = escape(display_name)
    body = f"""\
<h2 style="margin:0 0 14px;font-family:'Syne','Segoe UI',sans-serif;font-size:24px;font-weight:800;color:{CREAM};letter-spacing:-0.4px;">
  Reset your password
</h2>
<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:{CREAM_DIM};">
  Hi {name}, we received a request to reset your DriveReady password. This link expires in <strong style="color:{CREAM};">1 hour</strong>.
</p>
{primary_button(reset_url, "Reset password")}
"""
    await send_email(
        to=to,
        subject="Reset your DriveReady password",
        html=render_email_shell(
            preheader="Reset your DriveReady password. This link expires in 1 hour.",
            body_html=body,
            footer_note="If you did not request this reset, your account is still secure. You can ignore this email.",
        ),
    )


async def send_parent_linked_email(
    *,
    to: str,
    learner_name: str,
    parent_name: str,
    revoke_url: str,
    xp_total: int | None = None,
    streak_days: int | None = None,
    readiness_percent: int | None = None,
    hours_this_week: str | None = None,
) -> None:
    learner = escape(learner_name)
    parent = escape(parent_name)
    xp_value = f"{xp_total:,}" if xp_total is not None else "Open"
    streak_value = f"{streak_days} days" if streak_days is not None else "Open"
    readiness_value = f"{readiness_percent}%" if readiness_percent is not None else "Open"
    hours_value = escape(hours_this_week) if hours_this_week else "Open"
    body = f"""\
<h2 style="margin:0 0 14px;font-family:'Syne','Segoe UI',sans-serif;font-size:24px;font-weight:800;color:{CREAM};letter-spacing:-0.4px;">
  Parent link confirmed
</h2>
<p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:{CREAM_DIM};">
  Hi {learner}, <strong style="color:{CREAM};">{parent}</strong> is now linked to your DriveReady account. They can view progress signals that help guide practice.
</p>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 -6px 22px;">
  <tr>{stat_card("XP", xp_value)}{stat_card("Streak", streak_value)}</tr>
  <tr>{stat_card("Readiness", readiness_value)}{stat_card("This week", hours_value)}</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:{BRAND_SURFACE_2};border:1px solid {BRAND_BORDER};border-radius:10px;margin-bottom:24px;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="margin:0;font-size:13px;color:{CREAM_DIM};line-height:1.7;">
        <strong style="color:{CREAM};">They can see:</strong> level, XP, streaks, readiness, and chapter progress.<br/>
        <strong style="color:{CREAM};">They cannot do:</strong> change your account or access your login credentials.
      </p>
    </td>
  </tr>
</table>
<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:{CREAM_DIM};">
  If this link was not expected, remove it from your profile.
</p>
{secondary_button(revoke_url, "Review parent link")}
"""
    await send_email(
        to=to,
        subject=f"{parent_name} is now linked to your DriveReady account",
        html=render_email_shell(
            preheader=f"{parent_name} is now linked to your DriveReady account.",
            body_html=body,
        ),
    )


async def send_new_device_email(
    *,
    to: str,
    display_name: str,
    device_label: str,
    ip_address: str,
    login_time: datetime,
    change_password_url: str,
) -> None:
    time_str = login_time.strftime("%B %d, %Y at %H:%M UTC")
    name = escape(display_name)
    device = escape(device_label)
    ip = escape(ip_address)
    account_url = f"{settings.frontend_url}/profile"
    body = f"""\
<table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:18px;">
  <tr>
    <td style="background:{VINTAGE_BRICK};border-radius:999px;padding:7px 12px;font-size:11px;font-weight:800;color:{CREAM};letter-spacing:0.10em;text-transform:uppercase;">
      Security alert
    </td>
  </tr>
</table>
<h2 style="margin:0 0 14px;font-family:'Syne','Segoe UI',sans-serif;font-size:24px;font-weight:800;color:{CREAM};letter-spacing:-0.4px;">
  New sign-in detected
</h2>
<p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:{CREAM_DIM};">
  Hi {name}, we noticed a sign-in from a device we have not seen before.
</p>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:{BRAND_SURFACE_2};border:1px solid {BRAND_BORDER};border-radius:10px;margin-bottom:24px;">
  <tr>
    <td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="font-size:11px;color:{CREAM_MUTED};text-transform:uppercase;letter-spacing:0.10em;padding-bottom:6px;">Device</td>
          <td style="font-size:13px;color:{CREAM};font-weight:700;text-align:right;padding-bottom:6px;">{device}</td>
        </tr>
        <tr>
          <td style="font-size:11px;color:{CREAM_MUTED};text-transform:uppercase;letter-spacing:0.10em;padding:10px 0 6px;">IP address</td>
          <td style="font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:13px;color:{CREAM};text-align:right;padding:10px 0 6px;">{ip}</td>
        </tr>
        <tr>
          <td style="font-size:11px;color:{CREAM_MUTED};text-transform:uppercase;letter-spacing:0.10em;padding-top:10px;">Time</td>
          <td style="font-size:13px;color:{CREAM};text-align:right;padding-top:10px;">{time_str}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:{CREAM_DIM};">
  If this was you, no action is needed. If you do not recognize it, reset your password immediately.
</p>
<table cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td style="padding-right:10px;">{secondary_button(account_url, "This was me")}</td>
    <td>{danger_button(change_password_url, "Reset password now")}</td>
  </tr>
</table>
"""
    await send_email(
        to=to,
        subject="New login to your DriveReady account",
        html=render_email_shell(
            preheader="A new sign-in was detected on your DriveReady account.",
            body_html=body,
            footer_note="If you do not recognize this sign-in, change your password immediately.",
        ),
    )


async def send_otp_email(*, to: str, code: str, display_name: str) -> None:
    name = escape(display_name)
    body = f"""\
<h2 style="margin:0 0 14px;font-family:'Syne','Segoe UI',sans-serif;font-size:24px;font-weight:800;color:{CREAM};letter-spacing:-0.4px;">
  Verify your email
</h2>
<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:{CREAM_DIM};">
  Hi {name}, enter this code to confirm your DriveReady account.
  It expires in <strong style="color:{CREAM};">10 minutes</strong>.
</p>
{code_block(code)}
<p style="margin:24px 0 0;font-size:12px;color:{CREAM_MUTED};line-height:1.6;">
  Did not request this? You can safely ignore this email.
</p>
"""
    await send_email(
        to=to,
        subject=f"{code} — verify your DriveReady email",
        html=render_email_shell(
            preheader=f"Your verification code is {code}. Expires in 10 minutes.",
            body_html=body,
        ),
    )
