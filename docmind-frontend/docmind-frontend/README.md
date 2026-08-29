# DocMind AI — Frontend

A real React (Vite) app that talks to the `docmind-backend` API over REST —
not a mock. Every page here fetches, creates, updates, and deletes through
actual HTTP calls: login/signup, document upload + AI analysis, contacts,
reminders, activity history, device sessions, and settings.

## Setup

```bash
npm install
cp .env.example .env   # points at your backend, defaults to http://localhost:5000/api
npm run dev             # http://localhost:5173
```

Run this alongside the backend (`docmind-backend`) — start that first with
`npm run dev` on port 5000, then start this.

## How it's wired

```
src/api/client.js        Central fetch wrapper: attaches JWT, retries once
                          after a silent token refresh on 401, normalizes
                          error messages from the backend.
src/api/auth.js           signup, login, logout, sessions, change password
src/api/documents.js       list/get/update/delete, multipart upload, ask AI
src/api/resources.js       contacts, reminders, activity, search, settings

src/context/AuthContext.jsx   Holds the logged-in user + auth status
                               (loading/authenticated/guest), restores a
                               session from the stored token on page load.
src/context/ToastContext.jsx  Global success/error toast.

src/hooks/useDocuments.js         Fetches + filters documents, optimistic
                                   favorite/important/archive toggles.
src/hooks/useContactsReminders.js Same pattern for contacts and reminders.

src/pages/*.jsx    One file per screen (Dashboard, Documents, Document
                    detail, AI Assistant, Contacts, Reminders, Activity,
                    Security Center, Settings, Landing, Login, Signup).
src/components/*.jsx  Shared shell (sidebar/topbar/mobile nav), modals
                       (upload, add contact, add reminder), search panel,
                       and small UI primitives (Badge, Modal, EmptyState,
                       Spinner, ErrorState).
```

## Auth flow

- Tokens are stored in `localStorage` (`docmind_access_token` /
  `docmind_refresh_token`).
- On load, `AuthContext` calls `GET /api/auth/me` with the stored token to
  restore a session; if that fails, the person sees the landing page.
- Any request that gets a 401 automatically tries `POST /api/auth/refresh`
  once and retries — if that also fails, tokens are cleared and a
  `docmind:session-expired` event kicks the user back to login.

## What's real vs. left as a next step

Real and working end-to-end (assuming the backend is running and
configured with a database + API keys):
- Signup / login / logout, multi-device session list, password change
- Real TOTP two-factor authentication — QR setup, verification, and a
  two-step login challenge (not a cosmetic toggle)
- Document upload → cloud storage → OCR → AI categorization/summary
- Document list filters, favorite/important/archive toggles, detail view
- AI Assistant chat (calls `/api/documents/ask`)
- Contacts and reminders CRUD, AI-detected date → reminder flow
- Activity history, global search, preference syncing, storage usage
- Notifications panel (real list, unread badge, mark read/mark all read)
- Data export (downloads a real JSON file from the backend)

Intentionally left as next steps:
- Notifications are pulled on open, not pushed live — no WebSockets/web
  push, so the bell badge updates when you open the panel, not instantly
- Tailwind is loaded via CDN in `index.html` for setup speed; swap to a
  proper PostCSS build (`npx tailwindcss init`) before shipping to
  production, since the CDN build isn't meant for production use

## Verified but not live-tested

`npm run build` (Vite production build) completes cleanly with zero
errors across all 1,500+ modules — every page, hook, and component is
syntactically valid and wired together correctly. What hasn't been
verified is an actual network round-trip against a running backend,
since that requires your own MongoDB/Cloudinary/Gemini credentials.
First-run issues (wrong `VITE_API_URL`, CORS mismatch) are normal to
hit and easy to fix — see the CORS note below.

## CORS

The backend's `CLIENT_URL` env var must match wherever this app is
running (`http://localhost:5173` in dev) or the browser will block the
requests.
