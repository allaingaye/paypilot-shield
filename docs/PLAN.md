# PayPilot Shield: Plan

Tasks only, ticked when done. Update the checkboxes in your pull requests.

**Team:** Elthiero (backend, integrations, deploy) and Alain (frontend). Both share docs, demo and submission.
**Hackathon:** [PayPal AI Hackathon](https://paypalaihackathon.devpost.com/).
**Live:** https://paypilot.donambi.dev (PayPal sandbox, served at the root path, `/api` proxied by nginx).

## Backend

### Core (Layer 1)
- [x] Login, invoices, suppliers, pipeline, audit log
- [x] Agent with a rules fallback
- [x] OpenAI compatible LLM support (Groq) with the rules fallback kept
- [x] Real sandbox payout through PayPal Payouts
- [x] `POST /payments` and `GET /payments/{id}`
- [x] Seed and reset script for demo data (`python seed.py` wipes and reseeds)
- [x] Seed supplier emails replaced with the US sandbox personal accounts
- [ ] Reset the password in `scripts/setup_local_postgres.sql`
- [ ] CODEOWNERS, protect `main`, invite Alain
- [x] CORS and the dev proxy confirmed for local dev

### Trust (Layer 2)
- [x] `POST /auth/register-key` (stores the user's JWK public key)
- [x] Mandate service: exact payload string, ECDSA P-256 check (raw r||s to DER)
- [x] `/mandates`: current, prepare, activate with a signature, history, verify
- [x] Pipeline reads the active signed mandate. No valid mandate means BLOCKED
- [x] `/approvals`: list, approve by signature (then payout), reject
- [x] Verifier re-checks everything right before PayPal, including the signed auto limit for AUTO_PAY
- [x] Tamper endpoint (development only) and the tamper test
- [x] Tests: valid, wrong and modified signature, expired mandate, replayed approval
- [x] Monthly budget blocked at decision time, advisory lock against parallel overspend
- [ ] LLM policy drafting (`POST /mandates/draft`), not built. The Policy page edits the rules form directly

### Detection (Layer 3)
- [x] Signals: duplicate invoice, amount outlier, new payee email, round amount, prompt injection (English and French)
- [x] AI screen (`services/classifier.py`): can only add a review reason
- [ ] Fraud thresholds inside the signed policy, not built (thresholds are fixed in code, see `docs/layer3.md`)

### Suppliers, webhook, deploy
- [x] Add supplier (starts unverified)
- [x] Verify supplier by signature, trust history in the analytics response
- [x] PayPal webhook with signature verification, idempotent, verified live against a real sandbox event
- [x] Deploy to the VPS: `docker-compose.yml`, Postgres via `DATABASE_URL`, HTTPS
- [x] CI: ruff, backend tests against Postgres, `pip-audit`, type check, frontend build, Playwright demo path
- [x] Security review fixed (httpOnly cookie with CSRF header, login rate limit, key replacement needs the password, nginx headers)
- [ ] Deploy workflow (deploys are manual today)
- [ ] Backend hardening still open: clearer error messages, health checks
- [ ] Final test run, README setup verified from a clean clone

## Frontend

- [x] Tailwind, self-hosted fonts, tokens, ruled paper background, `lucide-react`
- [x] `api.ts` with `ApiError` and 401 handling, `types.ts`
- [x] Shell (top nav), StatusBadge, EmptyState, ErrorState, Spinner, auth guard
- [x] Login
- [x] Agent screen (chat, step blocks, decision card)
- [x] Invoices (grid, drawer, request payment, New invoice form), Suppliers (Add supplier, trust history)
- [x] Payments (stat cards, total paid chart, Requests and Payouts tabs, payout polling), Replay (trace timeline)
- [x] `crypto.ts`: keypair, export public key, sign, secure context check
- [x] Signing modal
- [x] Policy and Approvals on the real endpoints, public key registered after first login
- [x] Every screen wired to real endpoints, mocks removed
- [x] Base path support (`VITE_BASE=/paypilot/`) and the `/paypilot/approvals` deep link
- [x] Four states on every page, keyboard path, reduced motion (`frontend/e2e/states.spec.ts`; Replay and the chat are not in it)
- [x] Privacy and terms page at `/privacy`
- [x] Tamper banner and Demo tools card
- [x] PayPal balance card tried and removed (the Balances API is a 30 minute snapshot)
- [x] Production build served by nginx
- [x] Playwright test of the demo path with the fake PayPal
- [ ] Visual polish pass against the design preview
- [ ] Responsive check below 1024 px

## Integration and demo

- [x] Whole demo path (see below) runs on the live URL. The tamper step cannot run live because demo tools are off in production
- [x] Screenshots in `docs/screenshots/`
- [ ] Time the demo path (target under 3 minutes)
- [ ] Bug bash on the live URL: one person drives the demo path, the other watches the console and server logs
- [ ] Record the video: public on YouTube, under 3 minutes, no PayPal logos, no copyrighted music
- [ ] Fill in the demo password in the Devpost text (never in the README)
- [ ] Someone who has not touched the project runs the README and the live demo, fix what they hit

## Submission

- [ ] Feature freeze: bug fixes only
- [ ] Freeze the demo data and the video, re-seed before filming
- [ ] Submit on Devpost, then open the submission page and check the video plays, links work, the repo is public with the MIT license shown, and no secrets are in the history
- [ ] Keep the live site, the Groq key and the PayPal sandbox app working and free to use until judging ends, and re-seed if the demo invoices are used up

Devpost requires: public GitHub repo with the MIT license, a working demo with login credentials in the testing instructions field, a text description with the tools used and how, a paragraph on how the project was updated during the period, and a demo video under 3 minutes.

## Demo path

1. Log in.
2. Policy: set the auto limit to 500 and the monthly budget to 5000, Review and sign.
3. Agent: "Pay INV-001". AUTO_PAY, paid through the PayPal sandbox.
4. Agent: "Pay INV-003" ($1,500). NEEDS_APPROVAL. Approvals: review, sign, payout sent.
5. Agent: "Pay INV-005". BLOCKED (changed payee email and injected text). Replay shows each step.
6. Policy: Simulate tampering (development only). Signature invalid. Paying is refused until a new signed policy.

## Scope cuts (in this order, if time runs short)

1. Layer 3 signals beyond duplicate invoice and new payee email
2. PayPal webhook (keep the manual Refresh button)
3. Supplier add and verify (the list and history are enough)
4. VPS deploy (run locally and record the demo from there)

**Never cut:** the signed policy, the signed approval, the tamper test, the audit replay, the BLOCKED demo. They are the product.

## Definition of done (any task)

- [ ] Merged to `main` through a pull request with CI green
- [ ] Tests added for new backend logic, `npm run build` passes for frontend
- [ ] Docs updated if a shape or screen changed
- [ ] No secrets, no em or en dashes in text
- [ ] Works on the live URL
