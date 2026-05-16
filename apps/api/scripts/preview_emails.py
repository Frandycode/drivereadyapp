# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Render DriveReady email templates to local HTML files for visual QA."""

import asyncio
from datetime import datetime, timezone
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services import email as email_service

OUT = Path("/tmp/dr-email-previews")
OUT.mkdir(parents=True, exist_ok=True)


def _safe_name(subject: str) -> str:
    return (
        subject[:56]
        .replace(" ", "_")
        .replace("/", "_")
        .replace(":", "")
        .replace("—", "-")
    )


async def write_to_disk(*, to: str, subject: str, html: str) -> None:
    filename = OUT / f"{_safe_name(subject)}.html"
    filename.write_text(html, encoding="utf-8")
    print(f"wrote {filename}")


email_service.send_email = write_to_disk  # type: ignore[assignment]


async def main() -> None:
    await email_service.send_otp_email(
        to="learner@example.com",
        code="482617",
        display_name="Jordan",
    )
    await email_service.send_parental_consent_email(
        parent_email="parent@example.com",
        child_name="Jordan",
        approve_url="https://api.drivereadyapp.com/consent/approve/sample",
        deny_url="https://api.drivereadyapp.com/consent/deny/sample",
    )
    await email_service.send_email_change_otp(
        to="new@example.com",
        display_name="Jordan",
        code="091823",
    )
    await email_service.send_password_reset_email(
        to="learner@example.com",
        display_name="Jordan",
        reset_url="https://drivereadyapp.com/reset-password?token=sample",
    )
    await email_service.send_parent_linked_email(
        to="learner@example.com",
        learner_name="Jordan",
        parent_name="Maya Reyes",
        revoke_url="https://drivereadyapp.com/profile",
        xp_total=3420,
        streak_days=14,
        readiness_percent=82,
        hours_this_week="6h 24m",
    )
    await email_service.send_new_device_email(
        to="learner@example.com",
        display_name="Jordan",
        device_label="MacBook · Chrome",
        ip_address="203.0.113.42",
        login_time=datetime(2026, 5, 13, 21, 42, tzinfo=timezone.utc),
        change_password_url="https://drivereadyapp.com/profile",
    )


if __name__ == "__main__":
    asyncio.run(main())
