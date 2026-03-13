# Email Validator API — MX, SMTP, Disposable Detection

Validate any email address in real-time: format check, MX record verification, SMTP mailbox probe, disposable/temporary email detection (400+ domains), free provider identification, and role-based address flagging. A lightweight, zero-dependency alternative to **ZeroBounce**, **Hunter.io**, and **NeverBounce** — no API key required.

[![Email Validator on Apify](https://img.shields.io/badge/Apify-Email%20Validator%20API-blue)](https://apify.com/george.the.developer/email-validator-api)
[![GitHub](https://img.shields.io/github/stars/the-ai-entrepreneur-ai-hub/email-validator-apify?style=social)](https://github.com/the-ai-entrepreneur-ai-hub/email-validator-apify)

## How It Works

```
                    ┌─────────────────────────────────────────────┐
                    │            Email Validator API               │
                    └──────────────────┬──────────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────────┐
                    │  Step 1: FORMAT CHECK (+20 pts)              │
                    │  RFC 5321 regex validation                   │
                    │  ✗ Invalid → stop, return error              │
                    └──────────────────┬──────────────────────────┘
                                       │ ✓ Valid
                    ┌──────────────────▼──────────────────────────┐
                    │  Step 2: DISPOSABLE CHECK (-50 pts)          │
                    │  400+ temp/throwaway domains                 │
                    │  mailinator, guerrillamail, tempmail...      │
                    └──────────────────┬──────────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────────┐
                    │  Step 3: ROLE-BASED CHECK (-10 pts)          │
                    │  32 common role prefixes                     │
                    │  admin@, support@, noreply@, info@...        │
                    └──────────────────┬──────────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────────┐
                    │  Step 4: MX RECORD LOOKUP (+40 pts)          │
                    │  DNS query for mail exchange servers          │
                    │  Returns up to 5 MX records sorted by        │
                    │  priority                                    │
                    └──────────────────┬──────────────────────────┘
                                       │ MX found
                    ┌──────────────────▼──────────────────────────┐
                    │  Step 5: SMTP VERIFICATION (+40 pts)         │
                    │  Direct TCP connection to mail server         │
                    │  EHLO → MAIL FROM → RCPT TO                  │
                    │  250=valid, 550=invalid, 252=catch-all        │
                    └──────────────────┬──────────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────────┐
                    │  FINAL SCORE (0-100)                         │
                    │  valid = score ≥ 60 AND format ✓             │
                    │         AND MX found AND not disposable      │
                    └─────────────────────────────────────────────┘
```

## Features

- **5-layer validation pipeline** — Format → Disposable → Role → MX → SMTP
- **SMTP mailbox verification** — Direct port 25 probe confirms if the inbox exists
- **400+ disposable domains** — Detects temp/throwaway emails (mailinator, guerrillamail, tempmail, etc.)
- **30+ free providers** — Flags Gmail, Yahoo, Outlook, ProtonMail, etc.
- **32 role-based prefixes** — Detects admin@, support@, noreply@, info@, etc.
- **MX record lookup** — Returns actual mail exchange servers with priority
- **Confidence score** — 0-100 point system with clear pass/fail threshold
- **Bulk validation** — Up to 50 emails per request
- **Instant API** — Real-time HTTP endpoint via Standby mode (<2s response)
- **Zero dependencies** — Uses only Node.js built-in modules (dns, net, http)

## Use Cases

- **Email list cleaning** — Remove invalid/disposable addresses before sending campaigns
- **Lead validation** — Verify prospect emails before adding to CRM
- **Signup fraud prevention** — Block disposable emails at registration
- **Deliverability optimization** — Improve sender reputation by removing bad addresses
- **B2B lead scoring** — Flag free providers vs business domains
- **Compliance** — Ensure email collection meets data quality standards

## Input

| Field | Type | Description |
|-------|------|-------------|
| `email` | String | Single email to validate (e.g., `user@gmail.com`) |
| `emails` | Array | Multiple emails to validate (max 50) |
| `mode` | String | `validate` (default), `disposable` (quick check), `bulk` |

### Example Input

```json
{
  "email": "hello@stripe.com"
}
```

## Output

### Full Validation Response

```json
{
  "email": "hello@stripe.com",
  "valid": true,
  "format_valid": true,
  "mx_found": true,
  "smtp_check": "valid",
  "is_disposable": false,
  "is_free": false,
  "is_role_based": true,
  "domain": "stripe.com",
  "mx_records": [
    { "priority": 1, "exchange": "aspmx.l.google.com" },
    { "priority": 5, "exchange": "alt1.aspmx.l.google.com" }
  ],
  "score": 90,
  "reason": "Valid email address"
}
```

### Disposable Email Response

```json
{
  "domain": "mailinator.com",
  "is_disposable": true,
  "is_free": false
}
```

### Score Breakdown

```
 Score Component          │ Points │ Condition
──────────────────────────┼────────┼──────────────────────────
 Format valid             │   +20  │ Passes RFC 5321 regex
 MX records found         │   +40  │ DNS resolves mail servers
 SMTP: mailbox exists     │   +40  │ RCPT TO returns 250
 SMTP: catch-all server   │   +20  │ RCPT TO returns 252
 SMTP: timeout            │   +10  │ Server didn't respond
 SMTP: invalid mailbox    │   -20  │ RCPT TO returns 550/553
 Disposable domain        │   -50  │ Matched 400+ temp domains
 Role-based address       │   -10  │ admin@, support@, etc.
──────────────────────────┼────────┼──────────────────────────
 VALID threshold          │   ≥60  │ AND format ✓ AND MX ✓
                          │        │ AND not disposable
```

## API Endpoints (Standby Mode)

### GET /validate — Single Email

```bash
curl "https://YOUR-STANDBY-URL/validate?email=user@gmail.com"
```

### GET /disposable — Quick Disposable Check

```bash
curl "https://YOUR-STANDBY-URL/disposable?email=test@mailinator.com"
# or by domain
curl "https://YOUR-STANDBY-URL/disposable?domain=guerrillamail.com"
```

### POST /validate/bulk — Batch Validation

```bash
curl -X POST "https://YOUR-STANDBY-URL/validate/bulk" \
  -H "Content-Type: application/json" \
  -d '{"emails":["user@gmail.com","fake@mailinator.com","ceo@stripe.com"]}'
```

**Response:**

```json
{
  "count": 3,
  "results": [
    { "email": "user@gmail.com", "valid": true, "score": 80, "is_free": true, "is_disposable": false },
    { "email": "fake@mailinator.com", "valid": false, "score": 0, "is_disposable": true },
    { "email": "ceo@stripe.com", "valid": true, "score": 90, "is_free": false, "is_role_based": false }
  ]
}
```

## Pricing

- **$0.002 per email validated**
- Bulk requests charge per email in the batch
- Free tier available

## Compared to Alternatives

```
 Feature              │ This API  │ ZeroBounce │ Hunter.io │ NeverBounce
──────────────────────┼───────────┼────────────┼───────────┼────────────
 Price per check      │ $0.002    │ $0.008     │ $0.010    │ $0.008
 SMTP verification    │ ✓         │ ✓          │ ✗         │ ✓
 Disposable detection │ 400+      │ ✓          │ ✓         │ ✓
 MX record lookup     │ ✓         │ ✓          │ ✗         │ ✓
 Role-based detection │ ✓         │ ✓          │ ✗         │ ✗
 Free provider flag   │ ✓         │ ✗          │ ✓         │ ✗
 API key required     │ ✗         │ ✓          │ ✓         │ ✓
 Bulk endpoint        │ 50/req    │ 100K file  │ 10/req    │ 100K file
 Real-time API        │ <2s       │ <3s        │ <2s       │ <5s
 Confidence score     │ 0-100     │ ✗          │ 0-100     │ ✗
```

## Integration Examples

### Python

```python
import requests

# Single validation
response = requests.get(
    "https://YOUR-STANDBY-URL/validate",
    params={"email": "user@company.com"}
)
result = response.json()
print(f"Valid: {result['valid']}, Score: {result['score']}")
```

### JavaScript

```javascript
// Bulk validation
const response = await fetch("https://YOUR-STANDBY-URL/validate/bulk", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    emails: ["user@gmail.com", "fake@tempmail.com", "ceo@stripe.com"]
  })
});
const { results } = await response.json();
const valid = results.filter(r => r.valid);
console.log(`${valid.length}/${results.length} emails are valid`);
```

### CRM / Spreadsheet Workflow

```
1. Export lead list from CRM (CSV with email column)
2. POST emails to /validate/bulk (50 at a time)
3. Filter results: keep only valid=true AND score >= 60
4. Re-import cleaned list to CRM
5. Result: higher deliverability, lower bounce rate
```

## Disposable Email Domains (Partial List)

The API detects 400+ disposable/temporary email providers including:

`mailinator.com`, `guerrillamail.com`, `tempmail.com`, `yopmail.com`, `10minutemail.com`, `throwaway.email`, `sharklasers.com`, `dispostable.com`, `maildrop.cc`, `fakeinbox.com`, `emailondeck.com`, `getnada.com`, `mohmal.com`, `bugmenot.com`, `trashmail.com`, `spamgourmet.com`, `dropmail.me`, and 380+ more.

## Technical Architecture

```
 Client Request
       │
       ▼
 ┌─────────────────────────────────────────┐
 │  Apify Standby Container (Node.js 22)   │
 │                                          │
 │  ┌────────────────────────────────────┐  │
 │  │  HTTP Server (port from env)       │  │
 │  │  /validate    → single check       │  │
 │  │  /disposable  → quick lookup       │  │
 │  │  /validate/bulk → batch (≤50)      │  │
 │  └──────────┬─────────────────────────┘  │
 │             │                             │
 │  ┌──────────▼─────────────────────────┐  │
 │  │  Validation Pipeline               │  │
 │  │  1. Regex format check             │  │
 │  │  2. Disposable Set lookup (O(1))   │  │
 │  │  3. Role-based Set lookup (O(1))   │  │
 │  │  4. DNS MX query (async)           │  │
 │  │  5. SMTP TCP probe (port 25)       │  │
 │  └────────────────────────────────────┘  │
 │                                          │
 │  Zero external API calls                 │
 │  Zero npm dependencies (beyond Apify)    │
 └─────────────────────────────────────────┘
```

## Related Tools

- **[Company Enrichment API](https://apify.com/george.the.developer/company-enrichment-api)** — Turn any domain into company data
- **[Website Contact Scraper](https://apify.com/george.the.developer/website-contact-scraper)** — Extract all contact info from websites
- **[Website Intelligence API](https://apify.com/george.the.developer/website-intelligence-api)** — Deep tech detection and SEO analysis

Browse all tools by [george.the.developer on Apify](https://apify.com/george.the.developer).
