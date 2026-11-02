# Best Super Agents ($BSA)

Create, test, publish and manage AI agents through guided steps.

- `public/` — the web app (no build step)
- `api/main.js` — Vercel function: Neon Postgres storage, Sign in with Solana, Claude-powered runs (streamed), publishing, Discover, rewards ledger
- `vercel.json` — routes `/api/*` to the function

## Environment variables

| Name | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Neon Postgres (set automatically by the Vercel Neon integration) |
| `SESSION_SECRET` | yes | Signs session cookies |
| `GROQ_API_KEY` | one AI key needed | Groq API key (uses `openai/gpt-oss-120b` with built-in browser search) |
| `GROQ_MODEL` | no | Defaults to `openai/gpt-oss-120b` |
| `GROQ_MODELS` | no | Comma-separated free-tier rotation pool (default: GROQ_MODEL, openai/gpt-oss-20b, qwen/qwen3.8-27b) |
| `ANTHROPIC_API_KEY` | one AI key needed | Claude API key |
| `ANTHROPIC_MODEL` | no | Defaults to `claude-sonnet-5-5` |
| `AI_PROVIDER` | no | `groq` or `anthropic` when both keys are set (default: anthropic) |
| `ADMIN_WALLETS` | no | Comma-separated Solana addresses that can review rewards |
| `RUNS_PER_HOUR` | no | Per-user run limit, default 20 |
| `CLAIM_PROGRAM_ID` | no | Enables claims once a Solana claim program exists |

Tables are created automatically on first request.
