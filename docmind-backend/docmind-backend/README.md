# DocMind AI — Backend API

Secure Node.js/Express + MongoDB backend for DocMind AI, a personal
AI-powered document and contact vault.

## Stack

- **Runtime:** Node.js + Express
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Auth:** JWT access tokens + hashed refresh tokens per device (multi-device sessions)
- **File storage:** Cloudinary (swap for S3/GCS by editing `config/cloudStorage.js`)
- **OCR / text extraction:** `pdf-parse` for PDFs, `tesseract.js` for images
- **AI:** Google Gemini (`@google/genai`) — free tier, no credit card required — for categorization, summarization, tagging, date detection, and document Q&A

## Setup

```bash
npm install
cp .env.example .env   # fill in MongoDB URI, JWT secrets, Cloudinary + Gemini keys
npm run dev             # starts on http://localhost:5000
```

### Getting a free Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey) and sign in with a Google account.
2. Click **Create API key** — no billing/credit card needed for the free tier.
3. Paste it into `.env` as `GEMINI_API_KEY`.

The free tier is rate-limited (requests per minute/day) rather than
unlimited — fine for a college project or prototype, but check
[ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models)
for current limits and model names before relying on it for anything with
real traffic. Google renames/retires model IDs periodically; if
`gemini-2.5-flash` ever stops working, update `GEMINI_MODEL` in `.env`
to whatever the current docs list.

## Folder structure

```
config/         Database + cloud storage configuration
models/         Mongoose schemas: User, Document, Contact, Reminder, ActivityLog
middleware/     Auth guard, file upload (multer), central error handler
routes/         REST endpoints, grouped by resource
utils/          AI service, text extraction, token helpers, activity logger
server.js       App entry point
```

## Authentication model

- Signup/login return an **access token** (short-lived JWT) and a
  **refresh token** (`deviceId.rawToken`, hashed before storage).
- Each login creates a `devices[]` entry on the User document — this is
  what powers the Security Center's "Active Devices" list and lets a
  user remotely log out a phone from their laptop.
- `POST /api/auth/refresh` exchanges a refresh token for a new access
  token without re-entering a password.

## Key API routes

| Method & Path | Purpose |
|---|---|
| `POST /api/auth/signup` | Create account |
| `POST /api/auth/login` | Log in — returns tokens, or `{ requires2FA, pendingToken }` if 2FA is on |
| `POST /api/auth/2fa/login-verify` | Second login step: exchange `pendingToken` + TOTP code for a session |
| `POST /api/auth/2fa/setup` | Generate a TOTP secret + QR code (not active until verified) |
| `POST /api/auth/2fa/verify` | Confirm setup with a real code, turns 2FA on |
| `POST /api/auth/2fa/disable` | Turn 2FA off (requires password) |
| `POST /api/auth/refresh` | Refresh access token |
| `POST /api/auth/logout` | End current device session |
| `GET /api/auth/sessions` | List active devices |
| `DELETE /api/auth/sessions/:id` | Remotely log out one device |
| `DELETE /api/auth/sessions` | Log out all other devices |
| `POST /api/auth/change-password` | Change password |
| `POST /api/documents/upload` | Upload file → cloud storage → OCR → AI analysis |
| `GET /api/documents` | List/search/filter documents |
| `PATCH /api/documents/:id` | Update category, tags, favorite/important flags |
| `PATCH /api/documents/:id/confirm-date` | Confirm/ignore an AI-detected date |
| `POST /api/documents/ask` | Ask a natural-language question about documents |
| `GET/POST/PATCH/DELETE /api/contacts` | Manage contacts |
| `GET/POST/PATCH/DELETE /api/reminders` | Manage reminders |
| `GET /api/reminders/ai-detected` | Unconfirmed AI date suggestions |
| `GET /api/search?q=` | Unified search across documents + contacts |
| `GET /api/activity` | Activity history feed |
| `GET /api/notifications` | List notifications (`?unreadOnly=true` for the bell badge) |
| `PATCH /api/notifications/:id/read` | Mark one notification read |
| `PATCH /api/notifications/read-all` | Mark all notifications read |
| `PATCH /api/settings/preferences` | Save theme/layout/notification preferences |
| `GET /api/settings/insights` | Vault insight stats for the dashboard |
| `GET /api/settings/export` | Download all of the user's data as a JSON file |
| `DELETE /api/settings/account` | Permanently delete the account |

## Two-factor authentication

Real TOTP (compatible with Google Authenticator, Authy, 1Password, etc.),
not a UI mock:
1. `POST /auth/2fa/setup` generates a secret and returns a QR code —
   nothing is activated yet.
2. The user scans it and submits a real 6-digit code to
   `POST /auth/2fa/verify`, which only then turns `twoFactorEnabled` on.
3. From then on, `POST /auth/login` returns `{ requires2FA: true,
   pendingToken }` instead of a session after a correct password. The
   client collects the OTP and calls `POST /auth/2fa/login-verify` with
   the `pendingToken` + code to get real tokens.

## Notifications

`utils/notify.js` creates a `Notification` document whenever something
notification-worthy happens (AI analysis finishes, a reminder is
created, a new device signs in, 2FA is enabled/disabled) — and respects
the user's notification preference toggles for categories that have one.
There's no push/real-time delivery here (no WebSockets or web push) —
the frontend polls `GET /api/notifications` when the bell is opened.

## Data export

`GET /api/settings/export` returns a single JSON file with the user's
profile, documents (metadata + AI output, not the binary files
themselves — those stay in Cloudinary), contacts, reminders, and recent
activity. It's a real file download, not a "coming soon" placeholder.


## Security notes

- Passwords are hashed with bcrypt (never stored in plain text).
- Account lockout after 5 failed login attempts (15-minute cooldown).
- All document/contact/reminder queries are scoped with `userId` from
  the verified JWT — a user can never read another user's data.
- AI document Q&A only ever receives documents pre-filtered to the
  requesting user.
- Two-factor authentication uses real TOTP codes, not a cosmetic toggle
  (see above).
- `helmet` + rate limiting are enabled by default; tighten
  `RATE_LIMIT_MAX` in production.

## Verified but not live-tested

Every file in this project has been syntax-checked (`node --check`) and
every module loads cleanly with no require-time errors (all models,
routes, and utilities resolve their imports and construct without
throwing). What hasn't been verified is a live request/response cycle
against a real MongoDB — this sandbox can't reach MongoDB's binary CDN
to spin up a local test database, and doesn't have your Atlas
credentials. Once you plug in `MONGODB_URI`, `CLOUDINARY_*`, and
`GEMINI_API_KEY` and run `npm run dev`, this should come up and work,
but budget time for the normal first-run debugging any new project
needs (wrong env var, a typo in a connection string, etc.).

## Not included (by design, for a college prototype)

- Payment/billing
- Real-time push notifications (notifications exist and are stored, but
  are pulled on-demand rather than pushed live — see above)
- Vector search is stored as a plain array field; swap in MongoDB Atlas
  Vector Search or Pinecone for real semantic search at scale.
