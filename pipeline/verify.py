"""Pure-Python email verifier.

Three-stage check, increasing in cost / signal:

  1. SYNTAX:    RFC-5321ish regex — quick reject of malformed addresses.
  2. MX:        DNS lookup for the domain — reject if no MX records.
  3. SMTP RCPT: HELO + MAIL FROM + RCPT TO against the lowest-priority MX,
                interpreting the response code:
                  250 -> deliverable
                  550 -> bounce / unknown user
                  4xx -> graylisted / unknown
                Most providers (Gmail, O365) accept-all and won't tell us
                the truth, so this is a heuristic, not a guarantee.

A score on 0..100 is returned plus a human-readable verdict string.

For high-volume use, set NEVERBOUNCE_API_KEY (already wired in `enrich.py`).
"""
from __future__ import annotations
import logging
import random
import re
import smtplib
import socket
from dataclasses import dataclass
from typing import List

log = logging.getLogger(__name__)

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")

# Domains that uniformly accept-all — RCPT 250 means very little.
CATCH_ALL_DOMAINS = {
    "gmail.com", "googlemail.com", "outlook.com", "hotmail.com",
    "yahoo.com", "icloud.com", "me.com",
}


@dataclass
class VerifyResult:
    email: str
    verdict: str           # "valid" | "invalid" | "unknown" | "catch_all" | "bad_syntax" | "no_mx"
    score: float           # 0..100
    detail: str = ""

    def to_dict(self) -> dict:
        return self.__dict__.copy()


def syntax_ok(email: str) -> bool:
    return bool(EMAIL_RE.match(email or ""))


def mx_records(domain: str) -> List[str]:
    """Return a list of MX hostnames sorted by priority. Empty if none.

    Uses dnspython if available, else falls back to socket-based lookup
    via Python's standard library (limited but works for common cases).
    """
    try:
        import dns.resolver  # type: ignore
        answers = dns.resolver.resolve(domain, "MX", lifetime=8.0)
        return [str(r.exchange).rstrip(".") for r in sorted(answers, key=lambda x: x.preference)]
    except ImportError:
        log.debug("dnspython not installed; MX check best-effort.")
    except Exception as e:
        log.debug("MX lookup failed for %s: %s", domain, e)
    # Fallback: at minimum, see if A/AAAA resolves so we know the domain exists.
    try:
        socket.getaddrinfo(domain, 25, proto=socket.IPPROTO_TCP)
        return [domain]
    except OSError:
        return []


def smtp_rcpt(email: str, mx_host: str, helo: str = "verifier.local",
              from_addr: str = "noreply@verifier.local",
              timeout: float = 8.0) -> tuple[int, str]:
    """Open a connection and try RCPT TO. Returns (code, message)."""
    try:
        with smtplib.SMTP(mx_host, 25, timeout=timeout) as smtp:
            smtp.helo(helo)
            smtp.mail(from_addr)
            code, resp = smtp.rcpt(email)
            return code, resp.decode("utf-8", "ignore") if isinstance(resp, bytes) else str(resp)
    except (smtplib.SMTPException, OSError, TimeoutError) as e:
        return -1, str(e)


def verify(email: str, do_smtp: bool = True) -> VerifyResult:
    if not syntax_ok(email):
        return VerifyResult(email, "bad_syntax", 0, "regex reject")

    domain = email.split("@", 1)[1].lower()
    if domain in CATCH_ALL_DOMAINS:
        return VerifyResult(email, "catch_all", 50, f"{domain} accepts all")

    mxs = mx_records(domain)
    if not mxs:
        return VerifyResult(email, "no_mx", 0, "no MX records")

    if not do_smtp:
        return VerifyResult(email, "unknown", 40, f"MX OK ({mxs[0]}); SMTP skipped")

    # Probe a single MX. Random offset so we don't always hit the lowest-pref.
    mx = mxs[0] if len(mxs) == 1 else random.choice(mxs[:2])
    code, resp = smtp_rcpt(email, mx)
    if code == 250:
        # 250 against a non-catch-all = strong signal
        return VerifyResult(email, "valid", 90, f"{mx} -> 250 OK")
    if code in (550, 551, 553):
        return VerifyResult(email, "invalid", 0, f"{mx} -> {code} {resp[:80]}")
    if 400 <= code < 500:
        return VerifyResult(email, "unknown", 40, f"{mx} -> {code} graylist")
    return VerifyResult(email, "unknown", 30, f"{mx} -> {code} {resp[:80]}")


def main() -> None:
    """Quick CLI: `python -m pipeline.verify some@where.com`."""
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("email", nargs="+")
    p.add_argument("--no-smtp", action="store_true",
                   help="Skip SMTP probe, just do syntax + MX")
    args = p.parse_args()
    for e in args.email:
        r = verify(e, do_smtp=not args.no_smtp)
        print(f"{r.email:<50} {r.verdict:<10} {r.score:>5.0f}  {r.detail}")


if __name__ == "__main__":
    main()
