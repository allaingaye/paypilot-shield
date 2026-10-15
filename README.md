# PayPilot Shield

[![ci](https://github.com/Elthiero/paypilot-shield/actions/workflows/ci.yml/badge.svg)](https://github.com/Elthiero/paypilot-shield/actions/workflows/ci.yml)

**An AI agent that pays supplier invoices through PayPal Payouts, but only inside a spending policy the owner has signed, and only after the invoice passes a truth check. Every decision is written to an audit log you can replay.**

Built for the [PayPal AI Hackathon](https://paypalaihackathon.devpost.com/). Live demo (PayPal sandbox): https://paypilot.donambi.dev. Privacy and terms: [/privacy](https://paypilot.donambi.dev/privacy).

## The problem

Business email compromise and fake invoices cost companies billions every year. Letting an AI agent pay invoices makes the risk worse: the agent can be tricked by a payee change or by instructions hidden inside an invoice. PayPilot Shield lets an agent do the work without letting it hold the money.

## The golden rule

> **The model proposes. Deterministic code decides.**

- The agent has **no tool that moves money**. Its only way to ask for a payment is `submit_payment_request`, which hands the request to the pipeline.
- The pipeline is plain Python. It checks the invoice, applies the owner's policy and returns one of three outcomes.
- AI can raise the risk level of a request but can never lower it.
- Invoice text is treated as untrusted data and is never followed as instructions.

## Outcomes

| Outcome | Meaning | What happens |
|---|---|---|
| `AUTO_PAY` | Inside policy and all checks passed | The payout is sent through PayPal |
| `NEEDS_APPROVAL` | Valid, but above the auto limit or first payment | The owner reviews and signs the exact cart in the browser |
| `BLOCKED` | A check failed (unverified supplier, changed payee email, injected instructions, monthly budget would be exceeded) | No PayPal call is made, reasons are shown |

## Demo data

| Invoice | Supplier | Amount | Expected outcome |
|---|---|---|---|
| INV-001 | ABC Supplies | $250 | AUTO_PAY |
| INV-002 | TechWorld | $450 | AUTO_PAY |
| INV-003 | Global Services | $1,500 | NEEDS_APPROVAL (over the $500 auto limit) |
| INV-004 | Unknown Supplier | $900 | BLOCKED (unverified supplier) |
| INV-005 | TechWorld | $480 | BLOCKED (payee email changed and hidden "ignore previous policy" text) |

## How a request flows

1. The owner asks the agent in plain language ("Pay INV-001").
2. The agent calls `submit_payment_request`.
3. The pipeline loads the invoice, supplier and payment history.
4. The truth check produces signals (verification, payee change, injection patterns).
5. The decision function returns `AUTO_PAY`, `NEEDS_APPROVAL` or `BLOCKED`.
6. If approval is needed, the owner signs the cart in the browser.
7. The verifier re-checks everything immediately before payout.
8. The PayPal client sends the payout, using an idempotency key so a retry cannot pay twice.
9. Each step is written to the audit log, and the agent explains the outcome.

## Architecture

| Layer | Contents | Stack |
|---|---|---|
| Presentation | Chat, policy editor, approvals, operations grid, audit replay | React, Vite, TypeScript, AG Grid, WebCrypto |
| API | Auth, endpoints | FastAPI, Pydantic, JWT |
| AI agent | Tool calling loop with read-only tools | LLM with a rule based fallback |
| Trust and decision | Truth check, decision, signed policy, verifier | Plain Python, `cryptography` |
| Data and integrations | Invoices, suppliers, transactions, audit events, PayPal | PostgreSQL, SQLAlchemy, PayPal Payouts sandbox |

![Architecture](docs/architecture.png)

More detail: [docs/architecture.md](docs/architecture.md), [docs/layer1.md](docs/layer1.md), [docs/layer2.md](docs/layer2.md), [docs/layer3.md](docs/layer3.md), [docs/layer4.md](docs/layer4.md) and [docs/security.md](docs/security.md).

## Project status

| Layer | Status |
|---|---|
| Layer 1, core (login, invoices, pipeline, agent, real sandbox payout, audit log) | Done |
| Layer 2, trust (owner-signed policy, signed approvals, verifier, tamper test) | Done |
| Layer 3, detection (extra fraud signals and an AI screen that can only raise risk) | Done |
| Layer 4, presentation (UI, AG Grid, replay page) | Built, tested in Docker (including the `/paypilot/` base path) and live at https://paypilot.donambi.dev. Polish done: keyboard access, loading and error states, e2e tests |

## Screenshots

Taken on a local run with the fake PayPal stand-in (see `docs/screenshots/` for all 18).

| | |
|---|---|
| ![Agent blocks INV-005](docs/screenshots/07-agent-blocked.png) | ![Signing an approval](docs/screenshots/09-approval-signing.png) |
| ![Replay of a blocked payment](docs/screenshots/13-replay.png) | ![Payouts with duration](docs/screenshots/12-payments-payouts.png) |

## Quick start (local)

**Requirements:** Python 3.11+, Node.js 20+, PostgreSQL 14+, a PayPal developer account.

### 1. Database

Edit the password in `scripts/setup_local_postgres.sql`, then:

```bash
sudo -u postgres psql -f scripts/setup_local_postgres.sql
```

### 2. Environment file

```bash
cp .env.example .env
```

Fill in `DATABASE_URL` (same password as above), `JWT_SECRET`, `DEMO_PASSWORD`, `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`.

### 3. PayPal sandbox accounts

In the PayPal developer dashboard (Testing Tools, Sandbox Accounts) create:

- 1 **Business** account (country United States), funded. This is the sender.
- 3 **Personal** accounts (country United States), one for each supplier that gets paid.

Create a **Merchant** app linked to the business account and enable **Payouts**. Put the supplier emails into `backend/seed.py`.

Check the credentials before building on them:

```bash
python scripts/test_paypal_sandbox.py --payout --email sb-xxxx@personal.example.com
```

### 4. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python seed.py                              # creates tables and loads the five demo invoices
uvicorn app.main:app --reload --port 8000
```

Open <http://localhost:8000/docs> for the interactive API, or <http://localhost:8000/health> for a quick check.

### 5. Frontend

```bash
cd frontend
npm install
npm run dev                                 # http://localhost:5173
```

### 6. Try it

Open <http://localhost:5173> and sign in with `DEMO_EMAIL` and `DEMO_PASSWORD` to use the web app (Vite proxies `/api` to the backend on port 8000). Or call the API directly: log in at `/docs` with `DEMO_EMAIL` and `DEMO_PASSWORD`, click **Authorize**, then call `POST /agent/chat`:

```json
{"message": "Pay INV-001"}
```

Other messages to try: `Pay INV-003`, `Pay INV-004`, `Pay INV-005`, `Why INV-005?`, `List invoices`.

Nothing is paid until the owner has signed a policy. In the web app open **Policy**, then **Review and sign**. Without the frontend, run `python ../scripts/sign_policy.py` from `backend/`. Payments above the auto limit wait on the **Approvals** page, where the owner signs the exact payment.

**Test aids (development only).** With `APP_ENV=development` the backend also mounts `PATCH /dev/invoices/{number}` (change an invoice amount or payee after it was evaluated) and `POST /dev/mandates/{id}/tamper` (break the signed policy). They exist to demo that the verifier refuses tampered data, and they never touch PayPal. They are not mounted in any other environment.

## Configuration

| Variable | Purpose |
|---|---|
| `APP_ENV` | `production` (default) or `development`. Development mounts the `/dev` tamper helpers and allows weak secrets |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signs login tokens. Outside development at least 32 random characters |
| `DEMO_EMAIL`, `DEMO_PASSWORD` | The seeded owner account. Outside development the password needs at least 12 characters |
| `PAYPAL_MODE` | `sandbox` for real sandbox calls, `fake` for an offline stand-in |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Sandbox app credentials |
| `LLM_API_KEY`, `LLM_MODEL` | Optional. Without them a rule based matcher handles chat |
| `LLM_BASE_URL` | Optional. Set it to use an OpenAI compatible provider (Groq `https://api.groq.com/openai/v1`, xAI `https://api.x.ai/v1`). Empty means Anthropic. The live demo uses Groq |
| `PAYPAL_BASE_URL`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_SENDER_NOTE` | PayPal API host (sandbox by default), the webhook id that `POST /webhooks/paypal` verifies against (without it the webhook rejects everything), and the note on each payout |
| `CORS_ORIGINS` | Allowed frontend origins |
| `FRONTEND_PORT` | Docker only. Host port for the frontend container (default 8080) |
| `VITE_BASE` | Docker build only. Path the app is served under (default `/`, the live site). `/paypilot/` is supported but not used in production |

Never commit `.env`. It is in `.gitignore`.

## API overview

| Method and path | Purpose |
|---|---|
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Login sets an httpOnly, SameSite=Strict cookie (the JWT is not readable by page scripts). 429 after 5 failed attempts in 5 minutes |
| `POST /auth/register-key` | Stores the browser's public key. Replacing an existing key needs the password |
| `/mandates/...`, `/approvals/...` | Signed policy and signed approvals, see [docs/layer2.md](docs/layer2.md) |
| `GET /invoices`, `GET /invoices/{number}` | Invoice data |
| `GET /suppliers`, `POST /suppliers` | List suppliers, add one (starts unverified) |
| `GET /suppliers/{id}/verify-payload`, `POST /suppliers/{id}/verify`, `GET /suppliers/{id}/analytics` | Owner-signed supplier verification, its trust history, payment analytics |
| `POST /agent/chat` | Talk to the agent |
| `POST /payments`, `GET /payments`, `GET /payments/{id}`, `GET /payments/{id}/trace` | Request a payment, list requests, one request, its audit steps with timestamps. Every `reasons` item is `{ code, level, message }` |
| `GET /transactions`, `POST /transactions/{id}/refresh` | Payout records and status refresh |
| `GET /health` | Liveness check |
| `POST /webhooks/paypal` | PayPal payout events. No login: the PayPal signature is checked (see below) |

## Tests

```bash
cd backend
pytest -q
```

The suite uses the fake PayPal client and a temporary SQLite database, so it needs no credentials and never calls PayPal. It covers the five demo invoices, signed supplier verification, idempotency (no double payment), the audit trace, the API and the agent loop, the signed policy and approvals (Layer 2), the fraud signals (Layer 3) and the security hardening ([docs/security.md](docs/security.md)).

### End-to-end tests

```bash
cd frontend
npm ci && npx playwright install chromium
E2E_PYTHON=../backend/venv/bin/python npm run e2e   # starts its own backend (fake PayPal, SQLite) and Vite
```

Covers the demo flow, signing, loading, empty and error states, and keyboard access to grid rows. CI runs the same job.

## Deployment

Live demo: https://paypilot.donambi.dev (PayPal sandbox). The production stack runs the compose setup below, served at the root path.

### Docker Compose

```bash
cp .env.example .env        # then edit it, see below
docker compose up --build   # open http://localhost:8080 (set FRONTEND_PORT in .env to publish another port)
docker compose exec backend python seed.py   # first run only, loads suppliers, invoices and the owner account
```

Three services: `db` (bundled Postgres 16, data in the `pgdata` volume, not published), `backend` (FastAPI, not published; uses the bundled `db` unless `DOCKER_DATABASE_URL` is set in `.env`, `DATABASE_URL` is only for running outside Docker) and `frontend` (nginx serving the built app and proxying `/api` to the backend). With `APP_ENV=development` in `.env` it runs with the `/dev` helpers on and weak secrets allowed. Without it, set a real `JWT_SECRET` and `DEMO_PASSWORD` or the backend refuses to start. For the `/paypilot/` path on the VPS build with `VITE_BASE=/paypilot/ docker compose build frontend` and strip the prefix in the host nginx (see [docs/layer4.md](docs/layer4.md)). The "Simulate tampering" demo button shows automatically when the backend runs with `APP_ENV=development`. Inside the container `localhost` is the container itself, so for a Postgres on the same machine set `DOCKER_DATABASE_URL=postgresql://user:pass@host.docker.internal:5432/paypilot` and make it accept connections from Docker (`listen_addresses` and `pg_hba.conf`). Copy `.env.example` to `.env` first (`cp` on Linux, `copy` on Windows), compose refuses to start without it. Signing needs HTTPS or `localhost`. `seed.py` wipes all data, so do not run it on data you want to keep.

The live site is a VPS with a host nginx (TLS) in front of this compose stack (see [docs/security.md](docs/security.md) for the proxy headers). On any public server leave `APP_ENV` at its default (`production`): the API then refuses to start unless `JWT_SECRET` has at least 32 random characters and `DEMO_PASSWORD` at least 12, and the `/dev` tamper helpers are not mounted. Set `APP_ENV=development` only on your own machine. GitHub Actions ([ci.yml](.github/workflows/ci.yml)) runs the tests on every push and pull request.

## Project structure

```
backend/app/        FastAPI app, models, routers, services (pipeline, decision, truth check, agent, PayPal client)
backend/tests/      Pipeline, API, agent, signature, truth check and security tests
backend/Dockerfile  Backend image (non-root)
frontend/src/       Pages, components, API client, WebCrypto signing
frontend/e2e/         Playwright tests (demo path, states, keyboard)
frontend/Dockerfile, frontend/nginx.conf   Frontend image: built app plus the /api proxy
docker-compose.yml  Backend and frontend services
docs/               Architecture, layer notes, security, API contract, design, demo script, dev log
scripts/            Database setup SQL and PayPal sandbox test
```

## Limitations and roadmap

- Sandbox only. Real payouts require PayPal production approval, and payout availability depends on the countries involved. During development, sandbox accounts in Rwanda were denied for Payouts, while United States sandbox accounts worked.
- Signed policies are an AP2-inspired simplification: the owner's browser signs a server-built payload with a non-extractable ECDSA key.
- Suppliers can be added and verified in the app (the owner signs the verification in the browser). Only the demo suppliers come from `backend/seed.py`.
- Payment status can lag: a sandbox payout stays pending for about 35 seconds. The PayPal webhook, the Payments page poll and the Refresh button settle it.
- Planned: fraud thresholds inside the signed policy, LLM drafting of the policy, dispute handling, multi-user roles. (The AI screen that can only raise risk is already built, see [docs/layer3.md](docs/layer3.md).)
- Known security gaps are listed in [docs/security.md](docs/security.md).
- Data sharing: with AI mode on, chat messages and the invoice details the agent looks up go to the LLM provider (Groq on the live demo). Payout requests go to the PayPal sandbox. The `/privacy` page says this in plain words.

## Team

| Name | GitHub | Contact |
|---|---|---|
| Thierry Donambi | [@Elthiero](https://github.com/Elthiero) | thierrydonambi@gmail.com |
| Allaingaye Lucien | [@alaingaye](https://github.com/alaingaye) | lucienallaingaye@gmail.com |

## Contributing

Work happens on short-lived branches and pull requests into `main`. Each pull request needs a green `ci` run and a review from the other team member. Run `pytest -q` in `backend/`, and `npx tsc --noEmit`, `npm run build` and `npm run e2e` in `frontend/` before opening one. Never commit `.env`, and add every new environment variable to `.env.example` in the same pull request.

## License

[MIT](LICENSE)
