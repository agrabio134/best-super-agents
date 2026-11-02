// Best Super Agents — API (Vercel Node function)
// Routes are rewritten from /api/<path> to /api/main?p=<path> (see vercel.json).
import { neon } from '@neondatabase/serverless';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import crypto from 'node:crypto';

const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
const sql = globalThis.__BSA_SQL__ || (DB_URL ? neon(DB_URL) : null);
const SECRET = process.env.SESSION_SECRET || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const GROQ_KEY = process.env.GROQ_API_KEY || '';
const PROVIDER = (process.env.AI_PROVIDER || (GROQ_KEY && !ANTHROPIC_KEY ? 'groq' : ANTHROPIC_KEY ? 'anthropic' : GROQ_KEY ? 'groq' : '')).toLowerCase();
const AI_KEY = PROVIDER === 'groq' ? GROQ_KEY : PROVIDER === 'anthropic' ? ANTHROPIC_KEY : '';
const MODEL = PROVIDER === 'groq' ? (process.env.GROQ_MODEL || 'openai/gpt-oss-120b') : (process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5');
const RUNS_PER_HOUR = Number(process.env.RUNS_PER_HOUR || 20);
const ADMIN_WALLETS = (process.env.ADMIN_WALLETS || '').split(',').map(s => s.trim()).filter(Boolean);
const CLAIM_CONTRACT = process.env.CLAIM_PROGRAM_ID || '';

const DEFAULT_CONFIG = {
  token: { symbol: '$BSA', totalSupply: 1000000000, chain: 'Solana' },
  allocation: null, fundingSource: null, reviewWindowDays: null,
  caps: { perAgent: null, perCreator: null },
  programs: { creation: { enabled: true, amount: null }, usage: { enabled: true, amount: null }, completion: { enabled: true, amount: null } },
};

/* ---------------- helpers ---------------- */
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const id = (n = 16) => crypto.randomBytes(n).toString('base64url').slice(0, n);
const isId = s => typeof s === 'string' && /^[A-Za-z0-9_-]{6,40}$/.test(s);
const hmac = s => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
const json = (res, status, body) => { res.statusCode = status; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(body)); };
const clip = (s, n) => String(s ?? '').slice(0, n);

function readCookie(req, name) {
  const c = req.headers.cookie || ''; const m = c.split(/;\s*/).find(x => x.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
}
function setSession(res, uid) {
  const payload = Buffer.from(JSON.stringify({ uid, iat: Date.now() })).toString('base64url');
  res.setHeader('set-cookie', `bsa_s=${payload}.${hmac(payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`);
}
function sessionUid(req) {
  const v = readCookie(req, 'bsa_s'); if (!v) return null;
  const [p, sig] = v.split('.'); if (!p || !sig) return null;
  const good = hmac(p);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try { return JSON.parse(Buffer.from(p, 'base64url').toString()).uid; } catch { return null; }
}

let schemaReady = null;
function ensureSchema() {
  if (!schemaReady) schemaReady = (async () => {
    await sql`create table if not exists users(id text primary key, wallet text unique, created_at timestamptz default now())`;
    await sql`create table if not exists agents(id text primary key, owner_id text not null, status text not null default 'draft', data jsonb not null, created_at timestamptz default now(), updated_at timestamptz default now(), published_at timestamptz)`;
    await sql`create index if not exists agents_owner on agents(owner_id)`;
    await sql`create index if not exists agents_status on agents(status)`;
    await sql`create table if not exists files(id text primary key, agent_id text not null, owner_id text not null, name text, size int, ext text, body text, created_at timestamptz default now())`;
    await sql`create index if not exists files_agent on files(agent_id)`;
    await sql`create table if not exists runs(id text primary key, agent_id text not null, agent_owner text not null, user_id text not null, agent_name text, source text, input text, status text, steps jsonb, output jsonb, error text, model text, started_at timestamptz default now(), ended_at timestamptz)`;
    await sql`create index if not exists runs_agent on runs(agent_id)`;
    await sql`create index if not exists runs_user on runs(user_id)`;
    await sql`create index if not exists runs_owner on runs(agent_owner)`;
    await sql`create table if not exists events(id text primary key, user_id text not null, t timestamptz default now(), text text, tone text)`;
    await sql`create index if not exists events_user on events(user_id)`;
    await sql`create table if not exists rewards(id text primary key, user_id text not null, agent_id text, agent_name text, type text, status text, amount numeric, reason text, period text, created_at timestamptz default now(), updated_at timestamptz default now())`;
    await sql`create index if not exists rewards_user on rewards(user_id)`;
    await sql`create table if not exists settings(key text primary key, value jsonb)`;
  })().catch(e => { schemaReady = null; throw e; });
  return schemaReady;
}

// Accounts exist only for signed-in Solana wallets. Older guest sessions are read once so their drafts can move into the wallet account.
async function getUser(req) {
  const uid = sessionUid(req); if (!uid) return null;
  const r = await sql`select id, wallet from users where id = ${uid}`; return r[0] || null;
}
function clearSession(res) { res.setHeader('set-cookie', 'bsa_s=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'); }
function needWallet(u) { if (!u?.wallet) throw new HttpError(401, 'Connect your Solana wallet to continue. Your work is saved to your wallet account.'); return u; }
const isAdmin = u => !!(u?.wallet && ADMIN_WALLETS.includes(u.wallet));
async function logEvent(uid, text, tone = '') { await sql`insert into events(id, user_id, text, tone) values (${id()}, ${uid}, ${clip(text, 300)}, ${tone})`; }
async function getConfig() {
  const r = await sql`select value from settings where key = 'rewards'`;
  const v = r[0]?.value || {};
  return { ...DEFAULT_CONFIG, ...v, programs: { ...DEFAULT_CONFIG.programs, ...(v.programs || {}) }, caps: { ...DEFAULT_CONFIG.caps, ...(v.caps || {}) }, token: DEFAULT_CONFIG.token };
}
function statusInfo(u) {
  return { db: !!sql, ai: !!AI_KEY, session: !!SECRET, model: AI_KEY ? MODEL : null, claims: !!CLAIM_CONTRACT, admin: isAdmin(u) };
}
function shapeRun(r) {
  let status = r.status, error = r.error;
  if (status === 'running' && Date.now() - new Date(r.started_at).getTime() > 6 * 60 * 1000) { status = 'failed'; error = 'The run was interrupted before it finished.'; }
  return { id: r.id, agentId: r.agent_id, agentName: r.agent_name, source: r.source, input: r.input, status, steps: r.steps || [], output: r.output, error, model: r.model,
    startedAt: new Date(r.started_at).getTime(), endedAt: r.ended_at ? new Date(r.ended_at).getTime() : null, mine: undefined };
}
const shapeReward = r => ({ id: r.id, agentId: r.agent_id, agentName: r.agent_name, type: r.type, status: r.status, amount: r.amount == null ? null : Number(r.amount), reason: r.reason, period: r.period, createdAt: new Date(r.created_at).getTime(), updatedAt: new Date(r.updated_at).getTime() });

/* ---------------- validation (mirrors the client) ---------------- */
const CATEGORIES = ['Research', 'Writing', 'Automation', 'Data', 'Support', 'Other'];
function sanitizeData(d) {
  if (!d || typeof d !== 'object') throw new HttpError(400, 'Missing agent data.');
  const steps = Array.isArray(d.steps) ? d.steps.slice(0, 12).map(s => ({
    id: isId(s.id) ? s.id : id(10), kind: clip(s.kind, 12) || 'act', title: clip(s.title, 60), desc: clip(s.desc, 160),
    settings: { instructions: clip(s.settings?.instructions, 800), tool: clip(s.settings?.tool, 20) || 'auto', onFail: ['stop', 'retry', 'skip'].includes(s.settings?.onFail) ? s.settings.onFail : 'stop' },
  })) : [];
  const tools = {}; for (const k of ['search', 'browse', 'knowledge', 'docs']) tools[k] = !!d.tools?.[k];
  return {
    stage: Math.max(0, Math.min(3, Number(d.stage) || 0)), maxStage: Math.max(0, Math.min(3, Number(d.maxStage) || 0)),
    goal: clip(d.goal, 400), name: clip(d.name, 48), description: clip(d.description, 160), category: CATEGORIES.includes(d.category) ? d.category : '',
    template: clip(d.template, 20) || null, plannerNote: clip(d.plannerNote, 300), instructions: clip(d.instructions, 2000),
    tools, perms: { askBeforeSend: d.perms?.askBeforeSend !== false, keepHistory: d.perms?.keepHistory !== false },
    steps, visibility: ['private', 'unlisted', 'public'].includes(d.visibility) ? d.visibility : 'public', access: d.access === 'wallet' ? 'wallet' : 'free',
    confirmGuidelines: !!d.confirmGuidelines, toolsTouched: !!d.toolsTouched,
  };
}
function publishProblems(d) {
  const p = [];
  if (d.goal.trim().length < 12) p.push('goal'); if (d.name.trim().length < 2) p.push('name'); if (!d.category) p.push('category');
  if (d.description.trim().length < 10) p.push('description'); if (!d.steps.length || d.steps.some(s => !s.title.trim())) p.push('steps');
  if (d.instructions.trim().length < 20) p.push('instructions'); if (!Object.values(d.tools).some(Boolean)) p.push('tools');
  return p;
}

/* ---------------- Claude execution ---------------- */
function callAI(o) { return PROVIDER === 'groq' ? callGroq(o) : callClaude(o); }

// Groq (OpenAI-compatible). Free tier = 8K tokens/minute per model, so requests rotate across a pool of models,
// each with its own limit. Web search (browser_search) is only available on GPT-OSS models.
const GROQ_POOL = (process.env.GROQ_MODELS || `${MODEL},openai/gpt-oss-20b,qwen/qwen3.8-27b`).split(',').map(x => x.trim()).filter((x, i, a) => x && a.indexOf(x) === i);
const groqCooldown = new Map(); // model -> time it may be used again (per warm function instance)
const sleepMs = (ms, signal) => new Promise((res, rej) => { const t = setTimeout(res, ms); signal?.addEventListener('abort', () => { clearTimeout(t); rej(new DOMException('Aborted', 'AbortError')); }, { once: true }); });
function parseReset(v) { // "7.66s", "1m2.5s", "350ms", "12"
  if (!v) return 0; if (/^\d+(\.\d+)?$/.test(v)) return Number(v) * 1000;
  let ms = 0; const re = /(\d+(?:\.\d+)?)(ms|h|m|s)/g; let m;
  while ((m = re.exec(v))) ms += Number(m[1]) * { ms: 1, s: 1000, m: 60000, h: 3600000 }[m[2]];
  return ms;
}
function parseGroq(j) {
  const m = j.choices?.[0]?.message || {};
  const text = String(m.content || '').replace(/【[^】]*】/g, '').trim();
  const sources = []; const seen = new Set();
  const walk = (v, depth = 0) => {
    if (!v || depth > 8) return;
    if (Array.isArray(v)) return v.forEach(x => walk(x, depth + 1));
    if (typeof v === 'object') { if (typeof v.url === 'string' && /^https?:\/\//.test(v.url) && !seen.has(v.url)) { seen.add(v.url); sources.push({ url: v.url, title: v.title || v.url }); } for (const k in v) walk(v[k], depth + 1); return; }
    if (typeof v === 'string' && v.startsWith('{')) { try { walk(JSON.parse(v), depth + 1); } catch {} }
  };
  walk(m.executed_tools);
  return { text, sources, usage: { input: j.usage?.prompt_tokens || 0, output: j.usage?.completion_tokens || 0 } };
}
async function callGroq({ system, user, search, last, signal, onWait }) {
  const deadline = Date.now() + 75000; let noSearch = false; let lastErr = '';
  while (true) {
    const now = Date.now();
    // search steps prefer GPT-OSS (browser_search); fall back to any model after waiting too long
    const searchPool = GROQ_POOL.filter(m => /gpt-oss/.test(m));
    const pool = search && !noSearch && searchPool.length ? searchPool : GROQ_POOL;
    if (search && !noSearch && pool.every(m => (groqCooldown.get(m) || 0) - now > 20000)) { noSearch = true; continue; }
    const ready = pool.filter(m => (groqCooldown.get(m) || 0) <= now);
    if (!ready.length) {
      const wait = Math.max(500, Math.min(...pool.map(m => (groqCooldown.get(m) || now) - now)) + 300);
      if (now + wait > deadline) throw new Error('The free AI tier is busy right now. Wait about a minute, then press Retry.');
      onWait?.(`Free tier limit reached. Retrying in ${Math.ceil(wait / 1000)}s…`);
      await sleepMs(wait, signal); continue;
    }
    const model = ready[0]; const useSearch = search && !noSearch && /gpt-oss/.test(model);
    const body = { model, max_completion_tokens: last ? 2200 : 1100, temperature: 0.4, messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      ...(useSearch ? { tools: [{ type: 'browser_search' }], tool_choice: 'required' } : {}) };
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', signal, headers: { authorization: `Bearer ${AI_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const raw = await r.text(); let j = null; try { j = JSON.parse(raw); } catch {}
    if (r.ok) { const out = parseGroq(j); out.model = model; if (!useSearch && search) out.note = 'Web search unavailable on this model; answered from model knowledge'; return out; }
    const msg = j?.error?.message || raw; lastErr = msg;
    if (r.status === 401) throw new Error('The AI provider rejected the API key. Check GROQ_API_KEY.');
    if (r.status === 413 || /too large|reduce your message size|context length/i.test(msg)) {
      if (useSearch) { noSearch = true; continue; } // search results pushed it over; retry without search
      throw new Error('This step has too much text for the free AI tier. Shorten the instructions or attached files.');
    }
    if (r.status === 429) {
      const tpd = /per day|TPD|RPD/i.test(msg);
      const wait = tpd ? 30 * 60000 : Math.max(parseReset(r.headers.get('retry-after')), parseReset(r.headers.get('x-ratelimit-reset-tokens')), 2000);
      groqCooldown.set(model, Date.now() + wait);
      if (tpd && GROQ_POOL.every(m => (groqCooldown.get(m) || 0) - Date.now() > 10 * 60000)) throw new Error("Today's free AI quota is used up. Runs resume after the daily limit resets.");
      continue;
    }
    if (r.status >= 500 || r.status === 503) { groqCooldown.set(model, Date.now() + 5000); continue; }
    if (r.status === 400 && /model/i.test(msg) && /not found|decommission|does not exist/i.test(msg)) { groqCooldown.set(model, Date.now() + 3600000); continue; }
    throw new Error(`AI provider error (${r.status}): ${clip(msg, 200)}`);
  }
}

async function callClaude({ system, user, search, signal }) {
  let messages = [{ role: 'user', content: user }]; let blocks = []; let usage = { input: 0, output: 0 };
  const tools = search ? [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }] : undefined;
  for (let turn = 0; turn < 4; turn++) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal,
      headers: { 'x-api-key': AI_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 2500, system, messages, ...(tools ? { tools } : {}) }),
    });
    const body = await r.text();
    if (!r.ok) {
      let msg = body; try { msg = JSON.parse(body).error?.message || body; } catch {}
      throw new Error(r.status === 401 ? 'The AI provider rejected the API key. Check ANTHROPIC_API_KEY.' : r.status === 429 ? 'The AI provider is rate limiting requests. Try again in a minute.' : `AI provider error (${r.status}): ${clip(msg, 200)}`);
    }
    const j = JSON.parse(body); blocks = blocks.concat(j.content || []);
    usage.input += j.usage?.input_tokens || 0; usage.output += j.usage?.output_tokens || 0;
    if (j.stop_reason === 'pause_turn') { messages = [...messages, { role: 'assistant', content: j.content }]; continue; }
    break;
  }
  const text = blocks.filter(b => b.type === 'text').map(b => b.text).join('').trim();
  const sources = blocks.filter(b => b.type === 'web_search_tool_result' && Array.isArray(b.content)).flatMap(b => b.content.filter(x => x.url).map(x => ({ url: x.url, title: x.title || x.url })));
  return { text, sources, usage };
}

async function handleRun(req, res, u) {
  const b = req.body || {}; const input = clip(b.input, 2000).trim();
  if (input.length < 3) throw new HttpError(400, 'Describe a task of at least 3 characters.');
  if (!AI_KEY) throw new HttpError(503, 'Runs are not available yet: no AI provider key has been added (GROQ_API_KEY or ANTHROPIC_API_KEY).');
  let row, source;
  if (b.agentId) {
    const r = await sql`select * from agents where id = ${b.agentId} and owner_id = ${u.id}`; row = r[0]; source = 'Test';
    if (!row) throw new HttpError(404, 'Agent not found.');
  } else if (b.listingId) {
    const r = await sql`select a.*, us.wallet as owner_wallet from agents a join users us on us.id = a.owner_id where a.id = ${b.listingId}`; row = r[0]; source = 'Try';
    if (!row || row.status === 'draft' || row.data.visibility === 'private') throw new HttpError(404, 'This agent is not available.');
    if (row.status === 'paused') throw new HttpError(409, 'The creator has paused this agent. Try again later.');
    if (row.data.access === 'wallet' && !u.wallet) throw new HttpError(403, 'This agent requires a connected wallet before the first run.');
  } else throw new HttpError(400, 'Missing agent.');
  const recent = await sql`select count(*)::int as n from runs where user_id = ${u.id} and started_at > now() - interval '1 hour'`;
  if (recent[0].n >= RUNS_PER_HOUR) throw new HttpError(429, `You've reached ${RUNS_PER_HOUR} runs this hour. Try again later.`);

  const d = row.data; const runId = id();
  const steps = d.steps.map(s => ({ id: s.id, title: s.title, status: 'queued' }));
  await sql`insert into runs(id, agent_id, agent_owner, user_id, agent_name, source, input, status, steps, model) values (${runId}, ${row.id}, ${row.owner_id}, ${u.id}, ${d.name || 'Untitled agent'}, ${source}, ${input}, 'running', ${JSON.stringify(steps)}, ${MODEL})`;

  res.statusCode = 200;
  res.setHeader('content-type', 'text/event-stream'); res.setHeader('cache-control', 'no-store, no-transform'); res.setHeader('x-accel-buffering', 'no');
  const send = o => { try { res.write(`data: ${JSON.stringify(o)}\n\n`); } catch {} };
  const ctrl = new AbortController(); let finished = false;
  res.on('close', () => { if (!finished) ctrl.abort(); });
  const started = Date.now();
  send({ type: 'start', run: { id: runId, agentId: row.id, agentName: d.name, source, input, status: 'running', steps, startedAt: started, model: MODEL } });

  let knowledge = '';
  if (d.tools.knowledge) {
    const f = await sql`select name, body from files where agent_id = ${row.id} order by created_at`;
    let budget = PROVIDER === 'groq' ? 16000 : 120000; for (const x of f) { const t = clip(x.body, budget); budget -= t.length; knowledge += `\n--- File: ${x.name} ---\n${t}\n`; if (budget <= 0) break; }
  }
  const allSources = []; const outputs = []; let status = 'completed', error = null, finalText = '';
  try {
    for (let i = 0; i < d.steps.length; i++) {
      const s = d.steps[i]; const last = i === d.steps.length - 1;
      steps[i].status = 'running'; steps[i].startedAt = Date.now(); send({ type: 'step', i, step: steps[i] });
      const wantSearch = (d.tools.search || d.tools.browse) && (s.settings.tool === 'search' || s.settings.tool === 'browse' || (s.settings.tool === 'auto' && (s.kind === 'search' || /search|find|source|research|look up/i.test(s.title))));
      const system = [
        `You are "${d.name || 'an agent'}", an AI agent published on Best Super Agents.`,
        `Agent purpose: ${d.goal}`,
        `Creator instructions:\n${d.instructions}`,
        knowledge ? `Reference files attached by the creator:\n${knowledge}` : '',
        `Today's date is ${new Date().toISOString().slice(0, 10)}.`,
        `You are running step ${i + 1} of ${d.steps.length} in a fixed workflow. Do only this step.`,
        wantSearch ? 'Use at most two focused web searches. Report only the key findings in under 250 words, each with its source URL.' : '',
        last ? 'This is the final step. Produce the finished deliverable for the user in clear Markdown. Cite sources inline when you used web search.' : 'Your output is passed to the next step as working notes. Be concise and factual.',
        'You cannot send messages, make purchases or call external services. If the task needs that, say what you would need instead.',
      ].filter(Boolean).join('\n\n');
      const user = [`Task from the user:\n${input}`, outputs.length ? `Output of earlier steps:\n${outputs.map((o, k) => `## Step ${k + 1}: ${d.steps[k].title}\n${PROVIDER === 'groq' && k < outputs.length - 1 ? clip(o, 1200) : PROVIDER === 'groq' ? clip(o, 3500) : o}`).join('\n\n')}` : '',
        `Current step: ${s.title}\n${s.desc}${s.settings.instructions ? `\nStep instructions: ${s.settings.instructions}` : ''}`].filter(Boolean).join('\n\n');
      let attempt = 0, out = null;
      while (true) {
        try { out = await callAI({ system, user, search: wantSearch, last, signal: ctrl.signal, onWait: note => { steps[i].note = note; send({ type: 'step', i, step: steps[i] }); } }); break; }
        catch (e) {
          if (ctrl.signal.aborted) throw e;
          if (s.settings.onFail === 'retry' && attempt === 0) { attempt++; steps[i].note = 'Failed once, retrying.'; send({ type: 'step', i, step: steps[i] }); continue; }
          if (s.settings.onFail === 'skip' && !last) { steps[i].status = 'skipped'; steps[i].note = `Skipped after an error: ${clip(e.message, 160)}`; steps[i].endedAt = Date.now(); send({ type: 'step', i, step: steps[i] }); out = null; break; }
          steps[i].status = 'failed'; steps[i].endedAt = Date.now(); steps[i].note = clip(e.message, 300); send({ type: 'step', i, step: steps[i] });
          throw new Error(`“${s.title}” failed: ${e.message}`);
        }
      }
      if (out) {
        outputs.push(out.text || '(no output)'); allSources.push(...out.sources);
        steps[i].status = 'done'; steps[i].endedAt = Date.now(); steps[i].output = clip(out.text, 12000); steps[i].searched = out.sources.length;
        steps[i].note = out.sources.length ? `Searched the web · ${out.sources.length} result${out.sources.length === 1 ? '' : 's'}` : (out.note || undefined);
        if (out.model && out.model !== MODEL) steps[i].note = [steps[i].note, `ran on ${out.model}`].filter(Boolean).join(' · ');
        if (last) finalText = out.text;
        send({ type: 'step', i, step: steps[i] });
      } else outputs.push('(step skipped)');
    }
  } catch (e) {
    if (ctrl.signal.aborted) { status = 'cancelled'; steps.forEach(x => { if (x.status === 'running') { x.status = 'cancelled'; x.endedAt = Date.now(); } else if (x.status === 'queued') x.status = 'skipped'; }); }
    else { status = 'failed'; error = clip(e.message, 500); steps.forEach(x => { if (x.status === 'queued') x.status = 'skipped'; }); }
  }
  finished = true;
  const seen = new Set(); const sources = allSources.filter(s => !seen.has(s.url) && seen.add(s.url)).slice(0, 20);
  const output = status === 'completed' ? { markdown: finalText, sources } : null;
  await sql`update runs set status = ${status}, steps = ${JSON.stringify(steps)}, output = ${output ? JSON.stringify(output) : null}, error = ${error}, ended_at = now() where id = ${runId}`;
  if (source === 'Test') await logEvent(u.id, `Test run ${status} for “${d.name || 'Untitled agent'}”`, status === 'completed' ? 'good' : status === 'failed' ? 'bad' : '');
  send({ type: 'end', run: { id: runId, status, steps, output, error, endedAt: Date.now() } });
  res.end();
}

/* ---------------- router ---------------- */
async function route(req, res) {
  const url = new URL(req.url, 'http://x'); const p = (url.searchParams.get('p') || '').replace(/^\/+|\/+$/g, ''); const parts = p.split('/'); const m = req.method;
  if (p === 'health') return json(res, 200, { ok: true });
  if (!SECRET) throw new HttpError(503, 'Server setup incomplete: SESSION_SECRET is missing.');
  if (!sql) { if (p === 'me' || p === 'status') return json(res, 200, { setup: true, status: statusInfo(null) }); throw new HttpError(503, 'The database is not connected yet. Add Neon Postgres to this Vercel project.'); }
  await ensureSchema();
  const sess = await getUser(req);
  const u = sess?.wallet ? sess : null;
  const authed = /^(agents|files|run|admin)(\/|$)/.test(p);
  if (authed) needWallet(u);

  if (p === 'status') return json(res, 200, { status: statusInfo(u) });

  if (p === 'me' && m === 'GET') {
    if (!u) return json(res, 200, { user: null, status: statusInfo(null), config: await getConfig(), agents: [], runs: [], events: [], rewards: [] });
    const agents = await sql`select a.*, (select count(*)::int from runs r where r.agent_id = a.id and r.user_id <> a.owner_id and r.status <> 'cancelled') as uses, (select count(*)::int from runs r where r.agent_id = a.id and r.user_id <> a.owner_id and r.status = 'completed') as completed from agents a where owner_id = ${u.id} order by updated_at desc`;
    const files = await sql`select id, agent_id, name, size, ext, created_at from files where owner_id = ${u.id}`;
    const runs = await sql`select * from runs where user_id = ${u.id} order by started_at desc limit 100`;
    const events = await sql`select * from events where user_id = ${u.id} order by t desc limit 100`;
    const rewards = await sql`select * from rewards where user_id = ${u.id} order by created_at desc`;
    return json(res, 200, {
      user: { id: u.id, wallet: u.wallet, isAdmin: isAdmin(u) }, status: statusInfo(u), config: await getConfig(),
      agents: agents.map(a => ({ id: a.id, status: a.status, ...a.data, files: files.filter(f => f.agent_id === a.id).map(f => ({ id: f.id, name: f.name, size: f.size, status: 'done' })),
        updatedAt: new Date(a.updated_at).getTime(), createdAt: new Date(a.created_at).getTime(), publishedAt: a.published_at ? new Date(a.published_at).getTime() : null, uses: a.uses, completedByOthers: a.completed, persisted: true })),
      runs: runs.map(shapeRun).reverse(), events: events.map(e => ({ id: e.id, t: new Date(e.t).getTime(), text: e.text, tone: e.tone })), rewards: rewards.map(shapeReward),
    });
  }

  /* Sign in with Solana */
  if (p === 'auth/nonce' && m === 'POST') {
    const addr = String(req.body?.address || '');
    let ok = false; try { ok = bs58.decode(addr).length === 32; } catch {}
    if (!ok) throw new HttpError(400, 'That is not a valid Solana address.');
    const message = `Sign in to Best Super Agents\n\nWallet: ${addr}\nNonce: ${id(12)}\nIssued: ${new Date().toISOString()}\n\nSigning proves you own this wallet. It does not send a transaction or cost anything.`;
    return json(res, 200, { message, token: hmac(message) });
  }
  if (p === 'auth/verify' && m === 'POST') {
    const { address, message, signature, token } = req.body || {};
    if (!message || !token || hmac(message) !== token) throw new HttpError(400, 'The sign-in request expired. Try again.');
    const issued = Date.parse((message.match(/Issued: (.+)/) || [])[1] || 0);
    if (!issued || Date.now() - issued > 10 * 60 * 1000) throw new HttpError(400, 'The sign-in request expired. Try again.');
    if (!message.includes(`Wallet: ${address}\n`)) throw new HttpError(400, 'The signed message does not match this wallet.');
    let valid = false;
    try { valid = nacl.sign.detached.verify(new TextEncoder().encode(message), Buffer.from(signature, 'base64'), bs58.decode(address)); } catch {}
    if (!valid) throw new HttpError(401, 'The signature could not be verified. Try again.');
    const ex = await sql`select id from users where wallet = ${address}`;
    let uid = ex[0]?.id;
    if (!uid) { uid = id(); await sql`insert into users(id, wallet) values (${uid}, ${address})`; }
    if (sess && !sess.wallet && sess.id !== uid) { // older guest session: move its drafts into the wallet account
      await sql`update agents set owner_id = ${uid} where owner_id = ${sess.id}`;
      await sql`update files set owner_id = ${uid} where owner_id = ${sess.id}`;
      await sql`update runs set agent_owner = ${uid} where agent_owner = ${sess.id}`;
      await sql`update runs set user_id = ${uid} where user_id = ${sess.id}`;
      await sql`update events set user_id = ${uid} where user_id = ${sess.id}`;
      await sql`delete from users where id = ${sess.id} and wallet is null`;
    }
    setSession(res, uid);
    await logEvent(uid, `Signed in with wallet ${address.slice(0, 4)}…${address.slice(-4)}`, 'good');
    return json(res, 200, { ok: true });
  }
  if (p === 'auth/logout' && m === 'POST') { clearSession(res); return json(res, 200, { ok: true }); }

  /* Agents */
  if (parts[0] === 'agents' && isId(parts[1])) {
    const aid = parts[1];
    const r = await sql`select * from agents where id = ${aid}`; const row = r[0];
    if (row && row.owner_id !== u.id) throw new HttpError(404, 'Agent not found.');
    if (parts.length === 2 && m === 'PUT') {
      const data = sanitizeData(req.body?.data);
      if (JSON.stringify(data).length > 120000) throw new HttpError(413, 'This agent is too large to save.');
      if (!row) {
        const c = await sql`select count(*)::int as n from agents where owner_id = ${u.id}`; if (c[0].n >= 50) throw new HttpError(429, 'You can keep up to 50 agents.');
        await sql`insert into agents(id, owner_id, data) values (${aid}, ${u.id}, ${JSON.stringify(data)})`;
      } else {
        const strip = x => { const { stage, maxStage, confirmGuidelines, ...rest } = x || {}; return JSON.stringify(rest); };
        if (strip(row.data) === strip(data)) await sql`update agents set data = ${JSON.stringify(data)} where id = ${aid}`;
        else await sql`update agents set data = ${JSON.stringify(data)}, updated_at = now() where id = ${aid}`;
      }
      const t = await sql`select updated_at from agents where id = ${aid}`;
      return json(res, 200, { ok: true, updatedAt: new Date(t[0].updated_at).getTime() });
    }
    if (!row) throw new HttpError(404, 'Agent not found.');
    if (parts.length === 2 && m === 'DELETE') {
      if (row.status !== 'draft') throw new HttpError(409, 'Pause a published agent instead of deleting it.');
      await sql`delete from files where agent_id = ${aid}`; await sql`delete from agents where id = ${aid}`;
      await logEvent(u.id, `Deleted draft “${row.data.name || 'Untitled agent'}”`); return json(res, 200, { ok: true });
    }
    if (parts[2] === 'publish' && m === 'POST') {
      if (!u.wallet) throw new HttpError(403, 'Connect a Solana wallet to publish. It identifies you as the creator.');
      const d = row.data; const probs = publishProblems(d);
      if (probs.length) throw new HttpError(400, `Finish these first: ${probs.join(', ')}.`);
      if (!d.confirmGuidelines) throw new HttpError(400, 'Confirm the agent follows the publishing guidelines.');
      const passed = await sql`select 1 from runs where agent_id = ${aid} and source = 'Test' and status = 'completed' limit 1`;
      if (!passed.length) throw new HttpError(400, 'Run a test that completes successfully before publishing.');
      const first = row.status === 'draft'; const nextStatus = row.status === 'paused' ? 'paused' : 'published';
      await sql`update agents set status = ${nextStatus}, published_at = now(), updated_at = now() where id = ${aid}`;
      let reward = null;
      const cfg = await getConfig();
      const eligible = d.visibility === 'public' && d.description.trim().length >= 40;
      if (first && eligible && cfg.programs.creation.enabled) {
        const ex = await sql`select 1 from rewards where agent_id = ${aid} and type = 'creation'`;
        if (!ex.length) { reward = id(); await sql`insert into rewards(id, user_id, agent_id, agent_name, type, status, amount, reason) values (${reward}, ${u.id}, ${aid}, ${d.name}, 'creation', 'pending', ${cfg.programs.creation.amount}, 'Published publicly with a passing test. Waiting for eligibility review.')`; }
      }
      await logEvent(u.id, `${first ? 'Published' : 'Updated'} “${d.name}” (${d.visibility})`, 'good');
      if (reward) await logEvent(u.id, `Creation reward recorded for review: “${d.name}”`, 'orange');
      const t = await sql`select published_at, updated_at from agents where id = ${aid}`;
      return json(res, 200, { ok: true, status: nextStatus, publishedAt: new Date(t[0].published_at).getTime(), updatedAt: new Date(t[0].updated_at).getTime(), reward: !!reward, eligible });
    }
    if (parts[2] === 'status' && m === 'POST') {
      if (row.status === 'draft') throw new HttpError(409, 'Publish the agent first.');
      const s = req.body?.paused ? 'paused' : 'published';
      await sql`update agents set status = ${s} where id = ${aid}`; await logEvent(u.id, `${s === 'paused' ? 'Paused' : 'Resumed'} “${row.data.name}”`);
      return json(res, 200, { ok: true, status: s });
    }
  }

  /* Knowledge files (text extracted in the browser) */
  if (p === 'files' && m === 'POST') {
    const { agentId, name, size, ext, text } = req.body || {};
    const a = await sql`select id from agents where id = ${agentId} and owner_id = ${u.id}`; if (!a.length) throw new HttpError(404, 'Save the agent before attaching files.');
    if (!['pdf', 'txt', 'md', 'csv', 'docx'].includes(ext)) throw new HttpError(400, 'Unsupported file type.');
    const body = String(text || ''); if (!body.trim()) throw new HttpError(400, 'No readable text was found in this file.');
    if (body.length > 1500000) throw new HttpError(413, 'This file has too much text (limit is about 1.5 million characters).');
    const c = await sql`select count(*)::int as n from files where agent_id = ${agentId}`; if (c[0].n >= 5) throw new HttpError(409, 'An agent can have up to 5 files.');
    const fid = id();
    await sql`insert into files(id, agent_id, owner_id, name, size, ext, body) values (${fid}, ${agentId}, ${u.id}, ${clip(name, 200)}, ${Number(size) || 0}, ${ext}, ${body})`;
    return json(res, 200, { id: fid, name: clip(name, 200), size: Number(size) || 0, status: 'done' });
  }
  if (parts[0] === 'files' && isId(parts[1]) && m === 'DELETE') {
    await sql`delete from files where id = ${parts[1]} and owner_id = ${u.id}`; return json(res, 200, { ok: true });
  }

  /* Runs */
  if (p === 'run' && m === 'POST') return handleRun(req, res, u);

  /* Discover */
  if (p === 'directory' && m === 'GET') {
    const rows = await sql`select a.id, a.data, a.owner_id, a.published_at, us.wallet, (select count(*)::int from runs r where r.agent_id = a.id and r.user_id <> a.owner_id and r.status = 'completed') as completed from agents a join users us on us.id = a.owner_id where a.status = 'published' and a.data->>'visibility' = 'public' order by a.published_at desc limit 200`;
    return json(res, 200, { agents: rows.map(r => ({ id: r.id, name: r.data.name, cat: r.data.category, purpose: r.data.description || r.data.goal, access: r.data.access, creator: r.wallet, completed: r.completed, mine: !!u && r.owner_id === u.id, publishedAt: new Date(r.published_at).getTime() })) });
  }
  if (parts[0] === 'directory' && isId(parts[1]) && m === 'GET') {
    const r = await sql`select a.id, a.data, a.status, a.owner_id, us.wallet from agents a join users us on us.id = a.owner_id where a.id = ${parts[1]}`; const a = r[0];
    if (!a || a.status === 'draft' || a.data.visibility === 'private') throw new HttpError(404, 'This agent is not available.');
    const runs = u ? await sql`select * from runs where agent_id = ${a.id} and user_id = ${u.id} order by started_at desc limit 20` : [];
    const d = a.data;
    return json(res, 200, { agent: { id: a.id, name: d.name, cat: d.category, goal: d.goal, purpose: d.description, access: d.access, creator: a.wallet, status: a.status, mine: !!u && a.owner_id === u.id,
      tools: Object.keys(d.tools).filter(k => d.tools[k]), askBeforeSend: d.perms.askBeforeSend, keepHistory: d.perms.keepHistory, template: d.template,
      steps: d.steps.map(s => ({ id: s.id, kind: s.kind, title: s.title, desc: s.desc })) }, runs: runs.map(shapeRun).reverse() });
  }

  /* Rewards admin */
  if (parts[0] === 'admin') {
    if (!isAdmin(u)) throw new HttpError(403, 'Admins only.');
    if (p === 'admin/rewards' && m === 'GET') {
      const rows = await sql`select r.*, us.wallet from rewards r join users us on us.id = r.user_id order by r.created_at desc limit 300`;
      const s = await sql`select value from settings where key = 'lastPeriodEnd'`;
      return json(res, 200, { entries: rows.map(r => ({ ...shapeReward(r), wallet: r.wallet })), config: await getConfig(), lastPeriodEnd: s[0]?.value || null });
    }
    if (p === 'admin/config' && m === 'POST') {
      const c = req.body || {}; const num = v => (v === '' || v == null) ? null : (Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null);
      const val = { allocation: num(c.allocation), fundingSource: c.fundingSource ? clip(c.fundingSource, 120) : null, reviewWindowDays: num(c.reviewWindowDays), caps: { perAgent: num(c.caps?.perAgent), perCreator: num(c.caps?.perCreator) },
        programs: Object.fromEntries(['creation', 'usage', 'completion'].map(k => [k, { enabled: c.programs?.[k]?.enabled !== false, amount: num(c.programs?.[k]?.amount) }])) };
      await sql`insert into settings(key, value) values ('rewards', ${JSON.stringify(val)}) on conflict (key) do update set value = excluded.value`;
      await logEvent(u.id, 'Updated rewards program settings'); return json(res, 200, { config: await getConfig() });
    }
    if (parts[1] === 'rewards' && isId(parts[2]) && m === 'POST') {
      const st = req.body?.status; if (!['pending', 'approved', 'available', 'rejected'].includes(st)) throw new HttpError(400, 'Unknown status.');
      const amt = req.body?.amount === '' || req.body?.amount == null ? null : Number(req.body.amount);
      if ((st === 'approved' || st === 'available') && (amt == null || !(amt >= 0))) throw new HttpError(400, 'Set an amount before approving.');
      await sql`update rewards set status = ${st}, amount = ${amt}, reason = coalesce(${req.body?.reason ? clip(req.body.reason, 300) : null}, reason), updated_at = now() where id = ${parts[2]}`;
      return json(res, 200, { ok: true });
    }
    if (p === 'admin/period' && m === 'POST') {
      const cfg = await getConfig(); const s = await sql`select value from settings where key = 'lastPeriodEnd'`;
      const from = s[0]?.value || '1970-01-01T00:00:00Z'; const to = new Date().toISOString(); const label = `${s[0]?.value ? from.slice(0, 10) : 'launch'} → ${to.slice(0, 10)}`;
      // Qualified use: a run by someone other than the creator, not cancelled, at most 20 per person per agent per period.
      const rows = await sql`select agent_id, agent_owner, max(agent_name) as name, sum(least(n, 20))::int as uses, sum(least(ok, 20))::int as done from (
          select agent_id, agent_owner, agent_name, user_id, count(*) filter (where status <> 'cancelled') as n, count(*) filter (where status = 'completed') as ok
          from runs where source = 'Try' and user_id <> agent_owner and started_at > ${from} and started_at <= ${to} group by agent_id, agent_owner, agent_name, user_id) t group by agent_id, agent_owner`;
      let created = 0;
      for (const r of rows) {
        if (cfg.programs.usage.enabled && r.uses > 0) { await sql`insert into rewards(id, user_id, agent_id, agent_name, type, status, amount, reason, period) values (${id()}, ${r.agent_owner}, ${r.agent_id}, ${r.name}, 'usage', 'pending', ${cfg.programs.usage.amount == null ? null : cfg.programs.usage.amount * r.uses}, ${`${r.uses} qualified use${r.uses === 1 ? '' : 's'} by other people in ${label}. Waiting for review.`}, ${label})`; created++; }
        if (cfg.programs.completion.enabled && r.done > 0) { await sql`insert into rewards(id, user_id, agent_id, agent_name, type, status, amount, reason, period) values (${id()}, ${r.agent_owner}, ${r.agent_id}, ${r.name}, 'completion', 'pending', ${cfg.programs.completion.amount == null ? null : cfg.programs.completion.amount * r.done}, ${`${r.done} successful task${r.done === 1 ? '' : 's'} for other people in ${label}. Waiting for review.`}, ${label})`; created++; }
      }
      await sql`insert into settings(key, value) values ('lastPeriodEnd', ${JSON.stringify(to)}) on conflict (key) do update set value = excluded.value`;
      return json(res, 200, { created, period: label });
    }
  }
  throw new HttpError(404, 'Not found.');
}

export default async function handler(req, res) {
  try { await route(req, res); }
  catch (e) {
    if (res.headersSent) { try { res.end(); } catch {} return; }
    const status = e.status || 500; if (status === 500) console.error(e);
    json(res, status, { error: status === 500 ? 'Something went wrong on our side. Try again.' : e.message });
  }
}
