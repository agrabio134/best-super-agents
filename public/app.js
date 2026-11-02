(() => {
'use strict';
/* =====================================================================
   Best Super Agents — live client
   Talks to /api (see api/main.js). Wallet: Solana (Phantom, Solflare, Backpack).
   ===================================================================== */
const LOGO = '/logo.png';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = (n = 16) => { const a = crypto.getRandomValues(new Uint8Array(n)); return [...a].map(x => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[x % 62]).join(''); };
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const isPhone = () => matchMedia('(max-width: 899px)').matches;
const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDate = ts => new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
const ago = ts => { const s = (Date.now() - ts) / 1000; if (s < 45) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return fmtDate(ts); };
const dur = ms => ms < 1000 ? Math.max(0, Math.round(ms)) + ' ms' : (ms / 1000).toFixed(1) + ' s';
const shortAddr = a => a ? a.slice(0, 4) + '…' + a.slice(-4) : '';
const fmtNum = n => Number(n).toLocaleString('en-US');
const fmtSize = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

async function api(path, { method = 'GET', body } = {}) {
  let r;
  try { r = await fetch('/api/' + path, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' }); }
  catch { throw new Error("Couldn't reach the server. Check your connection and try again."); }
  let j = null; try { j = await r.json(); } catch {}
  if (!r.ok) { const e = new Error(j?.error || `Request failed (${r.status}).`); e.status = r.status; throw e; }
  return j;
}

/* ---------- Icons ---------- */
const DOTS = pts => `<g fill="currentColor" stroke="none">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4"/>`).join('')}</g>`;
const ICONS = {
  plus: '<path d="M5 12h14M12 5v14"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
  doc: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  arrowR: '<path d="M5 12h14M13 5l7 7-7 7"/>', arrowL: '<path d="M19 12H5M11 19l-7-7 7-7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  grip: DOTS([[9, 6], [9, 12], [9, 18], [15, 6], [15, 12], [15, 18]]), more: DOTS([[5, 12], [12, 12], [19, 12]]),
  chevUp: '<path d="m18 15-6-6-6 6"/>', chevDown: '<path d="m6 9 6 6 6-6"/>',
  play: '<path d="M7 4.5v15l12-7.5-12-7.5Z"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  user: '<circle cx="12" cy="8" r="4.5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M8 16H3v5"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
};
const ic = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[n] || ''}</svg>`;

/* ---------- Mascot ---------- */
function mascot({ size = 32, mood = 'idle', cls = '', label = '' } = {}) {
  const O = '#FF6A00';
  const eyes = {
    idle: `<rect x="47" y="45" width="9" height="20" rx="4.5"/><rect x="72" y="45" width="9" height="20" rx="4.5" transform="rotate(11 76.5 55)"/>`,
    think: `<rect x="50" y="42" width="9" height="18" rx="4.5"/><rect x="75" y="42" width="9" height="18" rx="4.5" transform="rotate(11 79.5 51)"/>`,
    happy: `<path d="M46 59q5.5-10 11 0M71 59q5.5-10 11 0" fill="none" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/>`,
    concern: `<rect x="47" y="51" width="9" height="11" rx="4.5"/><rect x="72" y="51" width="9" height="11" rx="4.5"/>`,
  }[mood] || '';
  const mouth = mood === 'concern' ? `<path d="M57 85h14" stroke="${O}" stroke-width="3.6" stroke-linecap="round" fill="none"/>` : `<path d="M55 83q9 6 18-1" stroke="${O}" stroke-width="3.6" stroke-linecap="round" fill="none"/>`;
  const L = 'M21 30Q13 30 13 38V45Q13 52 6 52Q13 52 13 59V66Q13 74 21 74', R = 'M107 30Q115 30 115 38V45Q115 52 122 52Q115 52 115 59V66Q115 74 107 74';
  const br = d => `<path d="${d}" fill="none" stroke="#131313" stroke-opacity=".14" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${O}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<svg class="mascot ${cls}" width="${size}" height="${Math.round(size * 104 / 128)}" viewBox="0 0 128 104" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}>${br(L)}${br(R)}
    <path d="M54 8H84L104 28V66Q104 96 74 96H54Q24 96 24 66V38Q24 8 54 8Z" fill="#fff" stroke="#131313" stroke-opacity=".14" stroke-width="2"/><path d="M84 8V21Q84 28 91 28H104Z" fill="${O}"/>
    <rect x="34" y="36" width="60" height="38" rx="16" fill="#131313"/><g class="eyes" fill="${O}">${eyes}</g>${mouth}</svg>`;
}

/* ---------- Markdown (safe subset) ---------- */
function md(src) {
  const lines = String(src || '').replace(/\r/g, '').split('\n'); let out = '', list = null, para = [], code = null;
  const inline = t => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, t, u) => `<a href="${u.replace(/"/g, '%22')}" target="_blank" rel="noopener noreferrer">${t}</a>`);
  const flushP = () => { if (para.length) { out += `<p>${inline(para.join(' '))}</p>`; para = []; } };
  const flushL = () => { if (list) { out += `<${list.t}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.t}>`; list = null; } };
  for (const ln of lines) {
    if (code !== null) { if (/^```/.test(ln)) { out += `<pre><code>${esc(code)}</code></pre>`; code = null; } else code += (code ? '\n' : '') + ln; continue; }
    if (/^```/.test(ln)) { flushP(); flushL(); code = ''; continue; }
    const h = ln.match(/^(#{1,4})\s+(.*)/); if (h) { flushP(); flushL(); out += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; continue; }
    const ul = ln.match(/^\s*[-*•]\s+(.*)/), ol = ln.match(/^\s*\d+[.)]\s+(.*)/);
    if (ul || ol) { flushP(); const t = ul ? 'ul' : 'ol'; if (!list || list.t !== t) { flushL(); list = { t, items: [] }; } list.items.push((ul || ol)[1]); continue; }
    if (/^>\s?/.test(ln)) { flushP(); flushL(); out += `<blockquote>${inline(ln.replace(/^>\s?/, ''))}</blockquote>`; continue; }
    if (!ln.trim()) { flushP(); flushL(); continue; }
    if (list && /^\s{2,}/.test(ln)) { list.items[list.items.length - 1] += ' ' + ln.trim(); continue; }
    flushL(); para.push(ln.trim());
  }
  if (code !== null) out += `<pre><code>${esc(code)}</code></pre>`;
  flushP(); flushL(); return out;
}

/* ---------- Product data ---------- */
const STAGES = ['Define', 'Configure', 'Test', 'Publish'];
const CATEGORIES = ['Research', 'Writing', 'Automation', 'Data', 'Support', 'Other'];
const KIND_ICON = { read: 'file', search: 'search', write: 'doc', act: 'zap', review: 'eye', list: 'list' };
const STEP_LABEL = { queued: 'Queued', running: 'Running', done: 'Done', failed: 'Failed', skipped: 'Skipped', cancelled: 'Cancelled' };
const RUN_LABEL = { running: 'Running', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled' };
const TEMPLATES = {
  research: { label: 'Research', icon: 'search', blurb: 'Find and analyze information from across the web.', goal: 'Research a topic and turn the findings into a clear brief.', name: 'Brief Builder', category: 'Research',
    instructions: 'You are a careful research assistant. Read the brief, find recent and credible sources, and write a short, structured brief for general readers. Cite every claim, prefer primary sources, and say clearly when sources disagree or evidence is thin.',
    tools: { search: true, browse: true, knowledge: false, docs: true },
    steps: [{ kind: 'read', title: 'Read the brief', desc: 'Understand the topic, audience and output format.' }, { kind: 'search', title: 'Find reliable sources', desc: 'Search the web, evaluate credibility and collect key insights.' }, { kind: 'write', title: 'Write the report', desc: 'Turn findings into a clear, structured brief with key points and sources.' }],
    samples: ['The future of decentralized social media', 'How cities are adapting to extreme heat', 'Open-source frameworks for building AI agents'] },
  write: { label: 'Write', icon: 'file', blurb: 'Turn ideas into clear content and reports.', goal: 'Turn rough notes into a polished blog post that follows our style guide.', name: 'Post Polisher', category: 'Writing',
    instructions: 'You are an editor. Keep the author\'s meaning and voice. Organize the notes into a clear outline, write a draft of about 800 words, then edit for plain language, short sentences and an active voice. Flag anything you had to guess.',
    tools: { search: false, browse: false, knowledge: true, docs: true },
    steps: [{ kind: 'read', title: 'Read the notes', desc: 'Collect the key points, audience and intended length.' }, { kind: 'list', title: 'Outline the piece', desc: 'Order the points into sections with a clear arc.' }, { kind: 'write', title: 'Draft the post', desc: 'Write the full draft from the outline.' }, { kind: 'review', title: 'Edit for style', desc: 'Apply the style guide and tighten every paragraph.' }],
    samples: ['Notes: we shipped dark mode, fixed sync bugs, and users asked for offline support', 'Why we moved our docs to plain language', 'Three lessons from our first year of remote work'] },
  automate: { label: 'Automate', icon: 'zap', blurb: 'Turn routine requests into ready-to-use actions.', goal: 'Sort new support requests and draft a routing note for the right team.', name: 'Request Router', category: 'Automation',
    instructions: 'You triage support requests. Read each request, classify it as billing, technical, account or other, rate its urgency, and draft a short handoff note for the right team. Escalate anything mentioning security or legal. Never claim a message was sent.',
    tools: { search: false, browse: false, knowledge: true, docs: true },
    steps: [{ kind: 'read', title: 'Read the requests', desc: 'Collect each request and its key details.' }, { kind: 'list', title: 'Classify each request', desc: 'Label each one by topic and urgency.' }, { kind: 'write', title: 'Draft routing notes', desc: 'Write a short handoff note for the right team, ready for you to send.' }],
    samples: ['Hi, I was charged twice for my subscription this month, order 4821.', 'I cannot reset my password, the reset email never arrives.', 'Can I export all my account data as CSV?'] },
};
const GENERIC_SAMPLES = ['A short, realistic task this agent should handle', 'An edge case with missing details', 'A request this agent should decline'];
const TOOLS = [
  { key: 'search', label: 'Web search', desc: 'Search the public web for recent pages and articles.' },
  { key: 'browse', label: 'Read web pages', desc: 'Use the content of pages found while searching.' },
  { key: 'knowledge', label: 'Knowledge files', desc: 'Read the files attached to this agent.' },
  { key: 'docs', label: 'Create documents', desc: 'Return briefs, reports and drafts as formatted output.' },
];
const PERM = {
  search: { title: 'Search the public web', explain: 'Search terms from the task are sent to the AI provider\'s web search.' },
  browse: { title: 'Read pages from search results', explain: 'Content from public pages can be used to answer the task.' },
  knowledge: { title: 'Read attached files', explain: 'Only files the creator attached to this agent. Nothing on your device.' },
  docs: { title: 'Create documents', explain: 'Results are returned as a formatted document in the task output.' },
};
const VIS = { private: { label: 'Private', desc: 'Only you can use it. Not eligible for rewards.' }, unlisted: { label: 'Unlisted', desc: 'Anyone with the link can use it. Not shown in Discover.' }, public: { label: 'Public', desc: 'Listed in Discover so anyone can find and try it.' } };
const ACCESS = { free: 'Free to use', wallet: 'Wallet connection required' };
const REWARD_TYPE = { creation: 'Creation', usage: 'Usage', completion: 'Completion' };
const PROGRAMS = [
  { key: 'creation', title: 'Creation reward', unit: 'per eligible agent', basis: 'A one-time reward for publishing a public agent that passes review.' },
  { key: 'usage', title: 'Usage reward', unit: 'per qualified use', basis: 'Based on genuine use by other people. Your own runs, cancelled runs and heavy repeat use by one person are not counted.' },
  { key: 'completion', title: 'Completion reward', unit: 'per successful task', basis: 'Based on tasks run by other people that finish successfully.' },
];
const ELIGIBILITY = [
  { key: 'public', label: 'Visibility is Public', test: a => a.visibility === 'public' },
  { key: 'tested', label: 'At least one successful test run', test: a => hasPassingRun(a) },
  { key: 'wallet', label: 'Solana wallet connected', test: () => !!S.user?.wallet },
  { key: 'described', label: 'Description of at least 40 characters', test: a => a.description.trim().length >= 40 },
];
const DATA_KEYS = ['stage', 'maxStage', 'goal', 'name', 'description', 'category', 'template', 'plannerNote', 'instructions', 'tools', 'perms', 'steps', 'visibility', 'access', 'confirmGuidelines', 'toolsTouched'];

function mkStep(s) { return { id: uid(10), kind: s.kind || 'act', title: s.title || '', desc: s.desc || '', settings: { instructions: '', tool: 'auto', onFail: 'stop' } }; }
function planSteps(goal) {
  const g = goal.toLowerCase().trim(); let key = null;
  for (const k in TEMPLATES) if (TEMPLATES[k].goal.toLowerCase() === g) key = k;
  if (!key) {
    if (/research|find|search|investigat|compare|analy|summar|brief|sources?|report/.test(g)) key = 'research';
    else if (/write|draft|blog|post|article|copy|edit|rewrite|newsletter|outline/.test(g)) key = 'write';
    else if (/route|sort|automat|monitor|inbox|email|notify|triage|request|classif/.test(g)) key = 'automate';
  }
  if (key) return { key, steps: TEMPLATES[key].steps.map(mkStep), note: `Starting steps for a ${TEMPLATES[key].label.toLowerCase()} agent. Rename, reorder or add steps so they match your goal exactly.` };
  return { key: null, note: 'General starting steps. Edit them so they match your goal.', steps: [{ kind: 'read', title: 'Understand the request', desc: 'Read the task and decide what a good result looks like.' }, { kind: 'act', title: 'Do the work', desc: 'Carry out the main task with the enabled tools.' }, { kind: 'review', title: 'Check the result', desc: 'Review the output against the request before returning it.' }].map(mkStep) };
}
function newAgent() {
  const now = Date.now();
  return { id: uid(), status: 'draft', createdAt: now, updatedAt: now, stage: 0, maxStage: 0, goal: '', name: '', description: '', category: '', template: null, plannerNote: '', instructions: '',
    files: [], tools: { search: true, browse: true, knowledge: false, docs: true }, perms: { askBeforeSend: true, keepHistory: true }, steps: [], visibility: 'public', access: 'free', confirmGuidelines: false, publishedAt: null, persisted: false, uses: 0, completedByOthers: 0 };
}

/* ---------- State ---------- */
const S = {
  booting: true, bootError: null, setup: false, status: {}, user: null, config: null,
  route: 'studio', param: null, routeFull: 'studio',
  agents: [], currentId: null, runs: [], events: [], rewards: [],
  wallet: { status: 'idle', error: null, step: '' },
  save: { status: 'saved', at: null, error: null },
  run: null, tab: {}, selectedRun: {}, chat: {}, runError: {},
  errors: {}, showErrors: false, editingStep: null, editSnap: null, menu: null,
  mobileView: 'build', stageChanged: false, routeChanged: false,
  modal: null, modalFocused: false, modalReturn: null,
  publishing: false, publishError: null, busy: {},
  dir: { loading: false, error: null, items: [], q: '', cat: 'All' }, listing: { loading: false, error: null, agent: null },
  agentsFilter: 'all', rewardsTab: 'all', admin: { loading: false, error: null, data: null, busy: {} },
  pulse: null, pulseShown: null,
};
const cur = () => S.agents.find(a => a.id === S.currentId);
const runsFor = (id, source) => S.runs.filter(r => r.agentId === id && (!source || r.source === source));
const hasPassingRun = a => S.runs.some(r => r.agentId === a.id && r.source === 'Test' && r.status === 'completed');
const liveRun = (key, id) => S.run && S.run.key === key && S.run.agentId === id ? (S.run.rec || { pending: true, steps: [], status: 'running' }) : null;
const isLivePub = a => a.status !== 'draft' && a.publishedAt && a.updatedAt <= a.publishedAt + 1500;
const tintFor = id => ['orange', 'ink', 'paper'][[...String(id)].reduce((s, c) => s + c.charCodeAt(0), 0) % 3];

async function loadMe({ keepCurrent = true } = {}) {
  const prevCur = cur(); const j = await api('me');
  if (j.setup) { S.setup = true; S.status = j.status; S.user = null; if (!S.agents.length) { const a = newAgent(); S.agents = [a]; S.currentId = a.id; } return; }
  S.setup = false; S.status = j.status; S.user = j.user; S.config = j.config; S.events = j.events; S.rewards = j.rewards;
  if (!j.user) {
    S.runs = [];
    const keep = S.agents.find(a => a.id === S.currentId && !a.persisted && (a.goal || a.name || a.steps.length));
    const a = keep || readLocal() || newAgent(); S.agents = [a]; S.currentId = a.id; return;
  }
  const live = S.run?.rec; S.runs = j.runs.map(r => (live && r.id === live.id) ? live : r);
  const local = S.agents.filter(a => !a.persisted && (a.goal || a.name || a.steps.length));
  S.agents = [...j.agents.map(a => ({ ...newAgent(), ...a })), ...local.filter(l => !j.agents.some(a => a.id === l.id))];
  const want = (keepCurrent && prevCur?.id) || ls.get('bsa-current');
  if (want && S.agents.some(a => a.id === want)) S.currentId = want;
  else { const d = S.agents.find(a => a.status === 'draft'); if (d) S.currentId = d.id; else { const a = newAgent(); S.agents.push(a); S.currentId = a.id; } }
  if (prevCur && keepCurrent && !prevCur.persisted && !S.agents.some(a => a.id === prevCur.id)) { S.agents.push(prevCur); S.currentId = prevCur.id; }
}
function setCurrent(id) { S.currentId = id; ls.set('bsa-current', id); }
const signedIn = () => !!S.user?.wallet;
const LOCAL_KEY = 'bsa-local-draft';
function saveLocal() { const a = cur(); if (!a || a.persisted) return; try { localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...Object.fromEntries(DATA_KEYS.map(k => [k, a[k]])), id: a.id })); } catch {} }
function readLocal() { try { const d = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'); return d && d.id ? { ...newAgent(), ...d, files: [], persisted: false } : null; } catch { return null; } }
function clearLocal() { try { localStorage.removeItem(LOCAL_KEY); } catch {} }

/* ---------- Saving ---------- */
let saveTimer = null, savePromise = null;
function markDirty() {
  const a = cur(); if (a) a.updatedAt = Date.now();
  S.save.status = 'pending'; clearTimeout(saveTimer); saveTimer = setTimeout(doSave, 800); renderSave();
}
async function doSave() {
  clearTimeout(saveTimer);
  if (savePromise) { await savePromise; if (S.save.status !== 'pending') return; }
  const a = cur(); if (!a) return;
  if (S.setup) { S.save = { status: 'error', at: null, error: 'The database is not connected yet.' }; renderSave(); return; }
  if (!a.persisted && !a.goal && !a.name && !a.steps.length) { S.save = { status: 'saved', at: S.save.at, error: null }; renderSave(); return; }
  if (!signedIn()) { saveLocal(); S.save = { status: 'local', at: null, error: null }; renderSave(); return; }
  S.save.status = 'saving'; renderSave();
  const data = Object.fromEntries(DATA_KEYS.map(k => [k, a[k]]));
  savePromise = (async () => {
    try { const r = await api('agents/' + a.id, { method: 'PUT', body: { data } }); a.persisted = true; a.updatedAt = Math.max(a.updatedAt, r.updatedAt); if (a.status !== 'draft') a.updatedAt = r.updatedAt; ls.set('bsa-current', a.id); S.save = { status: S.save.status === 'pending' ? 'pending' : 'saved', at: Date.now(), error: null }; }
    catch (e) { S.save = { status: 'error', at: S.save.at, error: e.message }; }
  })();
  await savePromise; savePromise = null; renderSave();
  if (S.save.status === 'pending') saveTimer = setTimeout(doSave, 400);
}
async function flushSave() { if (!signedIn()) { saveLocal(); return false; } if (S.save.status === 'pending' || S.save.status === 'saving' || S.save.status === 'local' || !cur()?.persisted) await doSave(); if (savePromise) await savePromise; return S.save.status !== 'error' && S.save.status !== 'local'; }

/* ---------- Validation ---------- */
function validateDefine(a) {
  const e = {}; const g = a.goal.trim(), n = a.name.trim(), d = a.description.trim();
  if (!g) e.goal = 'Describe what your agent should do.'; else if (g.length < 12) e.goal = 'Add a little more detail (at least 12 characters).';
  if (!n) e.name = 'Give your agent a name.'; else if (n.length < 2) e.name = 'Use at least 2 characters.';
  if (!a.category) e.category = 'Choose a category.';
  if (!d) e.description = 'Add a short description people will see in Discover.'; else if (d.length < 10) e.description = 'Use at least 10 characters.';
  if (!a.steps.length) e.steps = 'Draft steps from your goal, or add one.';
  return e;
}
function validateConfigure(a) {
  const e = {}; const i = a.instructions.trim();
  if (!i) e.instructions = 'Write instructions so the agent knows how to work.'; else if (i.length < 20) e.instructions = 'Add more detail (at least 20 characters).';
  if (!a.steps.length) e.steps = 'Add at least one step.'; else if (a.steps.some(s => !s.title.trim())) e.steps = 'Every step needs a title.';
  if (!Object.values(a.tools).some(Boolean)) e.tools = 'Turn on at least one tool.';
  if (a.files.some(f => f.status === 'uploading')) e.files = 'Wait for uploads to finish.'; else if (a.files.some(f => f.status === 'error')) e.files = 'Retry or remove the files that failed.';
  return e;
}
function validatePublish(a) {
  const e = {};
  if (!S.user?.wallet) e.wallet = 'Connect a Solana wallet. It identifies you as the creator.';
  if (!hasPassingRun(a)) e.test = 'Run a test that completes successfully.';
  if (!a.confirmGuidelines) e.confirm = 'Confirm the agent follows the publishing guidelines.';
  return e;
}
const stageErrors = (a, i) => i === 0 ? validateDefine(a) : i === 1 ? validateConfigure(a) : {};
const stageDone = (a, i) => i < 2 ? !Object.keys(stageErrors(a, i)).length : i === 2 ? hasPassingRun(a) : a.status !== 'draft';
const errs = () => S.showErrors ? S.errors : {};
const FIELD_FOCUS = { goal: 'f-goal', name: 'f-name', category: 'f-category', description: 'f-description', steps: 'add-step', instructions: 'f-instructions', tools: 'tool-search', files: 'f-files', test: 'in-studio', confirm: 'f-confirm', wallet: 'pub-wallet' };
function focusFirstError() { const k = Object.keys(S.errors)[0]; const el = k && document.getElementById(FIELD_FOCUS[k]); if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }); } }
function errP(k) { const m = errs()[k]; return `<p class="err" id="err-${k}" ${m ? '' : 'hidden'}>${ic('alert')}<span>${esc(m || '')}</span></p>`; }
function liveValidate() {
  if (!S.showErrors) return; const a = cur(); const now = { ...validateDefine(a), ...validateConfigure(a), ...validatePublish(a) };
  for (const k of Object.keys(S.errors)) {
    if (!now[k]) { delete S.errors[k]; const p = document.getElementById('err-' + k); if (p) p.hidden = true; document.getElementById(FIELD_FOCUS[k])?.removeAttribute('aria-invalid'); if (k === 'goal') $('#composer')?.classList.remove('invalid'); }
    else { S.errors[k] = now[k]; const s = document.querySelector(`#err-${k} span`); if (s) s.textContent = now[k]; }
  }
}

/* ---------- Toasts & pulse ---------- */
const toastActs = new Map();
function toast(msg, { tone = '', action = null, ms } = {}) {
  const id = uid(8); const el = document.createElement('div'); el.className = 'toast ' + tone;
  el.innerHTML = `${ic(tone === 'bad' ? 'alert' : tone === 'good' ? 'check' : 'info')}<span>${esc(msg)}</span>${action ? `<button data-act="toast-act" data-id="${id}">${esc(action.label)}</button>` : ''}<button class="x" data-act="toast-x" data-id="${id}" aria-label="Dismiss">${ic('x')}</button>`;
  if (action) toastActs.set(id, action.fn); $('#toasts').appendChild(el);
  setTimeout(() => { el.remove(); toastActs.delete(id); }, ms || (action ? 8000 : 4500));
}
function pulse(mood) { S.pulse = { id: uid(6), mood }; }
function pulseCls() { if (!S.pulse || S.pulse.id === S.pulseShown || reduceMotion()) return ''; return S.pulse.mood === 'happy' ? 'r-hop' : S.pulse.mood === 'concern' ? 'r-shake' : 'r-blink'; }
function avatar(a, size = '') { return `<span class="avatar t-${tintFor(a.id)} ${size}" aria-hidden="true">${mascot({ size: size === 'lg' ? 56 : 36 })}</span>`; }
function announce(msg) { let r = $('#sr-live'); if (!r) { r = document.createElement('div'); r.id = 'sr-live'; r.className = 'sr'; r.setAttribute('aria-live', 'polite'); document.body.appendChild(r); } r.textContent = ''; setTimeout(() => r.textContent = msg, 30); }

/* =====================================================================
   Rendering
   ===================================================================== */
function captureFocus() {
  const a = document.activeElement; if (!a || a === document.body || a.id === 'main') return null;
  const k = a.id ? { id: a.id } : a.dataset.act ? { act: a.dataset.act, did: a.dataset.id || '', v: a.dataset.v || '' } : null;
  if (k) { try { if (typeof a.selectionStart === 'number') { k.s = a.selectionStart; k.e = a.selectionEnd; } } catch {} }
  return k;
}
function restoreFocus(k) {
  if (!k) return;
  const el = k.id ? document.getElementById(k.id) : $$(`[data-act="${k.act}"]`).find(n => (n.dataset.id || '') === k.did && (n.dataset.v || '') === k.v);
  if (!el || el === document.activeElement || el.disabled || el.closest('[hidden]')) return;
  el.focus({ preventScroll: true }); if (k.s != null) { try { el.setSelectionRange(k.s, k.e); } catch {} }
}
function captureScroll() { return $$('[data-scroll-key]').map(el => ({ key: el.dataset.scrollKey, top: el.scrollTop, bottom: el.scrollHeight - el.scrollTop - el.clientHeight < 48 })); }
function restoreScroll(list, stick) { for (const s of list) { const el = document.querySelector(`[data-scroll-key="${s.key}"]`); if (!el) continue; if ((s.bottom || stick) && el.hasAttribute('data-stick')) el.scrollTop = el.scrollHeight; else el.scrollTop = s.top; } }
function captureFlip() { const m = new Map(); $$('[data-flip]').forEach(el => m.set(el.dataset.flip, el.getBoundingClientRect())); return m; }
function playFlip(prev) {
  if (!prev || reduceMotion()) return;
  $$('[data-flip]').forEach(el => {
    const a = prev.get(el.dataset.flip); if (!a) return; const b = el.getBoundingClientRect(); if (!b.width || !b.height) return;
    const dx = a.left - b.left, dy = a.top - b.top; let sx = a.width / b.width, sy = a.height / b.height;
    if (sx < .7 || sx > 1.4 || sy < .5 || sy > 2.2) { sx = 1; sy = 1; }
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < .01 && Math.abs(sy - 1) < .01) return;
    el.animate([{ transformOrigin: 'top left', transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})`, opacity: .55 }, { transformOrigin: 'top left', transform: 'none', opacity: 1 }], { duration: 340, easing: 'cubic-bezier(.2,.7,.2,1)' });
  });
}
function grow(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 420) + 'px'; }

function render(prevFlip, opts = {}) {
  const f = captureFocus(); const sc = captureScroll();
  const studio = S.route === 'studio' && !S.booting && !S.bootError; const a = cur(); const app = $('#app');
  app.classList.toggle('is-other', !studio); app.classList.toggle('studio', studio);
  app.dataset.stage = studio && a ? a.stage : '';
  app.classList.toggle('m-preview', studio && S.mobileView === 'preview');
  $('#top').innerHTML = renderTop(); $('#side').innerHTML = renderSide(); $('#main').innerHTML = renderMain();
  $('#panel').innerHTML = studio ? renderConsole({ key: 'studio', agent: a, runs: runsFor(a.id, 'Test') }) : '';
  $('#bar').innerHTML = studio ? renderBar() : ''; $('#tabbar').innerHTML = renderTabbar();
  renderLayer(); $$('textarea[data-grow]').forEach(grow);
  restoreFocus(f); restoreScroll(sc, opts.stick);
  if (prevFlip) playFlip(prevFlip);
  if (S.pulse) S.pulseShown = S.pulse.id;
  S.stageChanged = false; S.routeChanged = false;
}
function renderSave() { const el = $('#save-status'); if (el) el.innerHTML = saveHTML(); }

/* ---------- Top / side / tabbar ---------- */
const setupMissing = () => !S.status?.db || !S.status?.ai;
function renderTop() {
  const r = S.route === 'agent' ? 'discover' : S.route; const w = S.user?.wallet;
  const wbtn = w ? `<button class="wallet-btn" data-act="acct-menu" aria-label="Wallet ${shortAddr(w)}. Open account menu"><span class="live"></span>${ic('wallet')}<span class="wtxt">${shortAddr(w)}</span></button>`
    : S.wallet.status === 'connecting' ? `<button class="wallet-btn" aria-disabled="true"><span class="spin"></span><span class="wtxt">Connecting…</span></button>`
    : `<button class="wallet-btn" data-act="wallet" aria-label="Connect wallet">${ic('wallet')}<span class="wtxt">Connect wallet</span></button>`;
  const menu = S.menu === 'acct' ? `<div class="menu" role="menu" aria-label="Account">
      ${w ? `<p class="menu-note">${shortAddr(w)} · Solana</p>` : '<p class="menu-note">Guest · drafts saved to this browser\'s session</p>'}
      <a role="menuitem" href="#agents">${ic('folder')} My agents</a><a role="menuitem" href="#activity">${ic('activity')} Activity</a><a role="menuitem" href="#rewards">${ic('coins')} Rewards</a>
      <hr>${w ? `<button role="menuitem" data-act="sign-out">${ic('logout')} Sign out</button>` : `<button role="menuitem" data-act="wallet">${ic('wallet')} Connect wallet</button>`}
      <button role="menuitem" data-act="open-setup">${ic('info')} Service status</button></div>` : '';
  return `<div class="top-in">
    <a class="brand" href="#studio" aria-label="Best Super Agents, go to Studio"><img src="${LOGO}" alt="" width="30" height="30"><span class="brand-text"><b>BSA</b><span class="slash">/</span><span class="brand-name">Best Super Agents</span></span></a>
    <nav class="topnav" aria-label="Main">${[['studio', 'Studio'], ['discover', 'Discover'], ['rewards', 'Rewards']].map(([k, l]) => `<a href="#${k}" ${r === k ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    <div class="top-right">
      ${!S.booting && setupMissing() ? `<button class="status-chip" data-act="open-setup" aria-label="Setup needed. Show details"><span class="dot"></span>Setup</button>` : ''}
      ${wbtn}
      <button class="icon-btn acct" data-act="acct-menu" aria-haspopup="menu" aria-expanded="${S.menu === 'acct'}" aria-label="Account menu">${ic('user')}</button>${menu}
    </div></div>`;
}
function renderSide() {
  const r = S.route, a = cur();
  const link = (href, icon, label, on) => `<a class="side-link ${on ? 'on' : ''}" href="#${href}" ${on ? 'aria-current="page"' : ''} title="${label}">${icon}<span class="lbl">${label}</span></a>`;
  const blank = a && !a.goal && !a.persisted && a.stage === 0;
  let stages = '';
  if (r === 'studio' && a && !S.booting) {
    stages = `<div class="stages"><p class="eyebrow" title="${esc(a.name || 'Untitled agent')}">${esc(a.name || 'Untitled agent')}</p><ol aria-label="Creation stages">${STAGES.map((s, i) => {
      const st = i === a.stage ? 'current' : stageDone(a, i) ? 'done' : i <= a.maxStage ? 'reached' : 'upcoming';
      return `<li class="stg stg-${st}"><button data-act="stage" data-v="${i}" ${i === a.stage ? 'aria-current="step"' : ''} aria-label="Stage ${i + 1}: ${s}${st === 'done' ? ', complete' : ''}"><span class="mono num">0${i + 1}</span><span class="dotmark">${st === 'done' ? ic('check') : ''}</span><span class="lbl">${s}</span></button></li>`; }).join('')}</ol></div>`;
  }
  return `<div class="side-links">${link('new', `<span class="plus-dot">${ic('plus')}</span>`, 'New agent', r === 'studio' && blank)}${link('studio', ic('layout'), 'Studio', r === 'studio' && !blank)}${link('agents', ic('folder'), 'My agents', r === 'agents')}${link('activity', ic('activity'), 'Activity', r === 'activity')}</div>
    ${stages}<p class="side-foot">Best Super Agents<br>Smarter work<br>for a brighter internet.</p>`;
}
function renderTabbar() {
  const r = S.route === 'agent' ? 'discover' : S.route === 'activity' ? 'agents' : S.route;
  return [['studio', 'layout', 'Studio'], ['discover', 'compass', 'Discover'], ['agents', 'folder', 'My Agents'], ['rewards', 'coins', 'Rewards']].map(([k, i, l]) => `<a href="#${k}" ${r === k ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span></a>`).join('');
}
function renderMain() {
  if (S.booting) return `<div class="wrap"><div class="skel" style="height:22px;width:200px"></div><div class="skel" style="height:64px;width:70%"></div><div class="skel" style="height:86px"></div><div class="skel" style="height:260px"></div></div>`;
  if (S.bootError) return `<div class="wrap"><div class="empty">${mascot({ size: 60, mood: 'concern' })}<h3>Couldn't load your workspace</h3><p>${esc(S.bootError)}</p><button class="btn btn-primary" data-act="retry-boot">${ic('refresh')} Try again</button></div></div>`;
  switch (S.route) { case 'discover': return discoverView(); case 'agent': return detailView(); case 'agents': return agentsView(); case 'activity': return activityView(); case 'rewards': return rewardsView(); default: return studioView(); }
}
function setupNote() {
  if (S.setup || !S.status.db) return `<div class="note note-warn" role="note">${ic('alert')}<span><b>Saving is off.</b> The database isn't connected yet, so drafts can't be stored.</span><button class="link-btn" data-act="open-setup">Details</button></div>`;
  if (!signedIn()) return `<div class="note note-example" role="note">${ic('wallet')}<span><b>Connect your wallet to save.</b> Agents, tests and rewards are stored in your wallet account. Until you connect, this draft stays only in this browser.</span><button class="btn btn-sm btn-dark" data-act="wallet" data-v="save">Connect wallet</button></div>`;
  if (!S.status.ai) return `<div class="note note-warn" role="note">${ic('alert')}<span><b>Test runs are off.</b> The AI provider key hasn't been added yet. You can still build and save agents.</span><button class="link-btn" data-act="open-setup">Details</button></div>`;
  return '';
}

/* ---------- Studio ---------- */
function studioView() {
  const a = cur(); const st = a.stage; const live = liveRun('studio', a.id);
  const stepper = `<nav class="m-stepper" aria-label="Creation stages">${STAGES.map((s, i) => `<button data-act="stage" data-v="${i}" class="${stageDone(a, i) && i !== st ? 'done' : ''}" ${i === st ? 'aria-current="step"' : ''}><span class="mono">0${i + 1}</span>${s}</button>`).join('')}</nav>`;
  const sw = `<div class="m-switch" role="group" aria-label="Workspace view"><button data-act="mview" data-v="build" aria-pressed="${S.mobileView === 'build'}">${ic('layout')} Build</button><button data-act="mview" data-v="preview" aria-pressed="${S.mobileView === 'preview'}">${ic('play')} Preview${live ? '<span class="tab-dot" aria-label="running"></span>' : ''}</button></div>`;
  const body = st === 0 ? defineView(a) : st === 1 ? configureView(a) : st === 2 ? testView(a) : publishView(a);
  return `${stepper}${sw}<div class="wrap ${S.stageChanged ? 'enter' : ''}">${setupNote()}${body}</div>`;
}
const eyebrow = i => `<div class="eyebrow">Agent studio<span class="sep">/</span>0${i + 1} ${STAGES[i]}</div>`;
function defineView(a) {
  const e = errs();
  return `${eyebrow(0)}
  <h1 class="hero">What should <b>your agent do?</b></h1>
  <p class="lede">Describe the goal and build an agent with the right steps.</p>
  <form class="composer ${e.goal ? 'invalid' : ''}" id="composer" data-flip="goal" novalidate>
    <label class="sr" for="f-goal">Goal for your agent</label>
    <textarea id="f-goal" data-field="goal" data-grow rows="1" maxlength="400" placeholder="Research a topic and turn the findings into a clear brief." aria-describedby="goal-meta err-goal" ${e.goal ? 'aria-invalid="true"' : ''}>${esc(a.goal)}</textarea>
    <button class="send" type="submit" aria-label="Draft steps from this goal" title="Draft steps">${ic('arrowR')}</button>
  </form>
  <div class="composer-meta" id="goal-meta"><span class="mono">Enter drafts steps · Shift + Enter for a new line</span><span class="mono count" id="count-goal">${a.goal.length}/400</span></div>
  ${errP('goal')}
  <div class="starters" role="group" aria-label="Start from a template">${Object.entries(TEMPLATES).map(([k, t]) => `<button type="button" class="starter ${a.template === k ? 'on' : ''}" data-act="starter" data-v="${k}" aria-pressed="${a.template === k}">${ic(t.icon)}<span><b>${t.label}</b><span>${t.blurb}</span></span></button>`).join('')}</div>
  <section class="block" aria-labelledby="det-h">
    <div class="block-head"><h2 class="h2" id="det-h">Agent details</h2><span class="mono muted">Shown on the agent's profile</span></div>
    <div class="fields">
      <div class="field"><label for="f-name">Name</label><input id="f-name" data-field="name" maxlength="48" autocomplete="off" value="${esc(a.name)}" placeholder="e.g. Brief Builder" aria-describedby="err-name" ${e.name ? 'aria-invalid="true"' : ''}>${errP('name')}</div>
      <div class="field"><label for="f-category">Category</label><select id="f-category" data-field="category" aria-describedby="err-category" ${e.category ? 'aria-invalid="true"' : ''}><option value="">Choose a category</option>${CATEGORIES.map(c => `<option ${a.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>${errP('category')}</div>
      <div class="field span2"><label for="f-description">Description</label><textarea id="f-description" data-field="description" data-grow rows="2" maxlength="160" placeholder="One or two sentences people see in Discover." aria-describedby="desc-foot err-description" ${e.description ? 'aria-invalid="true"' : ''}>${esc(a.description)}</textarea>
        <div class="field-foot" id="desc-foot"><span>The goal above is used as the agent's purpose.</span><span class="mono count" id="count-description">${a.description.length}/160</span></div>${errP('description')}</div>
    </div>
  </section>
  ${workflowView(a, 'edit')}`;
}
function summaryView(a, compact) {
  return `<div class="summary ${compact ? 'compact' : ''}" data-flip="goal"><div class="sum-main"><span class="eyebrow">Goal</span><p class="sum-goal">${esc(a.goal)}</p>
    <div class="sum-meta">${a.name ? `<span class="chip">${esc(a.name)}</span>` : ''}${a.category ? `<span class="chip">${esc(a.category)}</span>` : ''}${a.status !== 'draft' ? `<span class="pill pill-${a.status}">${a.status}</span>` : ''}</div></div>
    <button class="btn btn-sm" data-act="edit-define">${ic('pencil')} Edit</button></div>`;
}
function workflowView(a, mode) {
  const n = a.steps.length; const run = liveRun('studio', a.id) || (mode === 'run' ? runsFor(a.id, 'Test').slice(-1)[0] : null);
  return `<section class="wf ${mode}" data-flip="canvas" aria-labelledby="wf-h">
    <div class="wf-head"><h2 class="h2" id="wf-h">Workflow <span class="mono muted">${plural(n, 'step')}</span></h2>${mode === 'edit' ? `<button class="btn btn-sm" id="add-step" data-act="add-step">${ic('plus')} Add step</button>` : `<button class="btn btn-sm btn-ghost" data-act="stage" data-v="1">${ic('pencil')} Edit steps</button>`}</div>
    ${a.plannerNote && mode === 'edit' ? `<p class="planner-note">${ic('info')}<span>${esc(a.plannerNote)}</span></p>` : ''}
    ${errP('steps')}
    <div class="canvas">${n ? `<ol class="steps" aria-label="Workflow steps">${a.steps.map((s, i) => stepItem(a, s, i, mode, run)).join('')}</ol>` : `<div class="canvas-empty">${mascot({ size: 48 })}<p><b>No steps yet.</b> Press the arrow in the goal box to draft steps, or add one yourself.</p></div>`}
      ${n && mode === 'edit' ? sticker(a) : ''}</div>
    ${mode === 'edit' && n > 1 ? `<p class="reorder-hint mono">Drag the handle, use the arrows, or focus a step and press Alt + ↑ / ↓ to reorder.</p>` : ''}
  </section>`;
}
function stepItem(a, s, i, mode, run) {
  const rs = run?.steps?.find(x => x.id === s.id); const st = rs?.status;
  const cls = { running: 'is-active', done: 'is-done', failed: 'is-failed', skipped: 'is-skipped', cancelled: 'is-cancelled' }[st] || '';
  const editing = mode === 'edit' && S.editingStep === s.id; const menuOpen = S.menu === 'step:' + s.id; const n = a.steps.length; const t = esc(s.title || 'step');
  const tags = [s.settings.tool !== 'auto' ? `uses ${TOOLS.find(x => x.key === s.settings.tool)?.label || s.settings.tool}` : '', s.settings.onFail === 'retry' ? 'retries once' : s.settings.onFail === 'skip' ? 'skips on failure' : '', s.settings.instructions ? 'custom instructions' : ''].filter(Boolean).join(' · ');
  return `<li class="step-item ${cls}" data-step-id="${s.id}"><div class="step ${cls}" ${st === 'running' ? 'aria-current="step"' : ''}>
    ${mode === 'edit' ? `<div class="step-move"><span class="grip" data-grip="${s.id}" title="Drag to reorder">${ic('grip')}</span>
      <button class="mv" data-act="step-up" data-id="${s.id}" aria-label="Move “${t}” up" ${i === 0 ? 'disabled' : ''}>${ic('chevUp')}</button>
      <button class="mv" data-act="step-down" data-id="${s.id}" aria-label="Move “${t}” down" ${i === n - 1 ? 'disabled' : ''}>${ic('chevDown')}</button></div>` : ''}
    <span class="step-ic">${st === 'done' ? ic('check') : st === 'failed' ? ic('alert') : ic(KIND_ICON[s.kind] || 'zap')}</span>
    <div class="step-body"><span class="mono step-num">${String(i + 1).padStart(2, '0')}${st ? ` · ${STEP_LABEL[st]}` : ''}</span>
      ${editing ? `<label class="sr" for="se-title-${s.id}">Step title</label><input class="inline-in" id="se-title-${s.id}" data-step-field="title" data-id="${s.id}" value="${esc(s.title)}" maxlength="60" placeholder="Step title">
        <label class="sr" for="se-desc-${s.id}">Step description</label><textarea class="inline-in" id="se-desc-${s.id}" data-step-field="desc" data-id="${s.id}" data-grow rows="2" maxlength="160" placeholder="What this step does">${esc(s.desc)}</textarea>
        <div class="inline-acts"><button class="btn btn-sm btn-dark" data-act="step-edit-done" data-id="${s.id}">Done</button><button class="btn btn-sm btn-ghost" data-act="step-edit-cancel" data-id="${s.id}">Cancel</button></div>`
      : `<h3 class="step-title">${s.title ? esc(s.title) : '<span class="muted">Untitled step</span>'}</h3>${s.desc ? `<p class="step-desc">${esc(s.desc)}</p>` : ''}${tags ? `<p class="step-tags mono">${esc(tags)}</p>` : ''}${rs?.note && mode === 'run' ? `<p class="step-tags mono">${esc(rs.note)}</p>` : ''}`}
    </div>
    ${mode === 'edit' && !editing ? `<div class="step-acts"><button class="icon-btn" data-act="step-settings" data-id="${s.id}" aria-label="Settings for “${t}”" title="Step settings">${ic('sliders')}</button>
      <button class="icon-btn" data-act="step-menu" data-id="${s.id}" aria-label="More actions for “${t}”" aria-haspopup="menu" aria-expanded="${menuOpen}">${ic('more')}</button>
      ${menuOpen ? `<div class="menu" role="menu" aria-label="Actions for ${t}"><button role="menuitem" data-act="step-edit" data-id="${s.id}">${ic('pencil')} Edit text</button><button role="menuitem" data-act="step-settings" data-id="${s.id}">${ic('sliders')} Settings</button><button role="menuitem" data-act="step-dup" data-id="${s.id}">${ic('copy')} Duplicate</button><hr><button role="menuitem" class="danger" data-act="step-remove" data-id="${s.id}">${ic('trash')} Remove</button></div>` : ''}</div>` : ''}
  </div></li>`;
}
function sticker(a) {
  const live = liveRun('studio', a.id); const last = runsFor(a.id, 'Test').slice(-1)[0]; const n = a.steps.length;
  let mood = 'idle', t1 = 'Workflow ready', t2 = `${plural(n, 'step')} · Ready to test`, cls = '';
  if (live) { const i = (live.steps || []).findIndex(s => s.status === 'running'); mood = 'think'; t1 = 'Working'; t2 = i >= 0 ? `Step ${i + 1} of ${live.steps.length}` : 'Starting'; }
  else if (last && last.status === 'failed') { mood = 'concern'; t1 = 'Needs a look'; t2 = 'Last test failed'; cls = 's-concern'; }
  else if (last && last.status === 'completed') { mood = 'happy'; t1 = 'Test passed'; t2 = `${plural(n, 'step')} · Ready to publish`; }
  else if (Object.keys(validateDefine(a)).length) { t1 = 'Workflow drafted'; t2 = `${plural(n, 'step')} · Add details next`; }
  return `<div class="sticker ${cls}" aria-hidden="true">${mascot({ size: 52, mood, cls: pulseCls() })}<div class="sticker-card"><span class="ok">${cls ? ic('alert') : ic('check')}</span><span><b>${t1}</b><span>${t2}</span></span></div></div>`;
}
function configureView(a) {
  const e = errs(); const tpl = a.template && TEMPLATES[a.template]; const enabled = TOOLS.filter(t => a.tools[t.key]);
  return `${eyebrow(1)}${summaryView(a)}${workflowView(a, 'edit')}
  <section class="block" aria-labelledby="ins-h"><div class="block-head"><h2 class="h2" id="ins-h">Instructions</h2><span class="mono muted">Required</span></div>
    <p class="hint" id="ins-hint">Tell the agent how to work: tone, what to include, what to avoid, and when to stop.</p>
    <label class="sr" for="f-instructions">Instructions</label>
    <textarea class="ta" id="f-instructions" data-field="instructions" data-grow rows="5" maxlength="2000" aria-describedby="ins-hint err-instructions" placeholder="You are a careful research assistant…" ${e.instructions ? 'aria-invalid="true"' : ''}>${esc(a.instructions)}</textarea>
    <div class="field-foot">${tpl && a.instructions.trim() !== tpl.instructions ? `<button class="link-btn" data-act="use-instructions">Use suggested instructions</button>` : '<span></span>'}<span class="mono count" id="count-instructions">${a.instructions.length}/2000</span></div>${errP('instructions')}</section>
  <section class="block" aria-labelledby="tools-h"><div class="block-head"><h2 class="h2" id="tools-h">Tools</h2><span class="mono muted">${enabled.length} on</span></div>
    <div class="tools" role="group" aria-labelledby="tools-h">${TOOLS.map(t => `<label class="tool" for="tool-${t.key}"><input type="checkbox" id="tool-${t.key}" data-field="tools.${t.key}" ${a.tools[t.key] ? 'checked' : ''}><span><b>${t.label}</b><span>${t.desc}</span></span></label>`).join('')}</div>
    <p class="hint">Sending messages and calling outside services aren't available yet. Agents prepare that work for people to act on.</p>${errP('tools')}</section>
  <section class="block" aria-labelledby="perm-h"><div class="block-head"><h2 class="h2" id="perm-h">Permissions</h2><span class="mono muted">People approve these before first use</span></div>
    ${enabled.length ? `<ul class="perm-list">${enabled.map(t => `<li>${ic('shield')}<div><b>${PERM[t.key].title}</b><p>${PERM[t.key].explain}</p></div></li>`).join('')}</ul>` : '<p class="hint">Turn on a tool to see the permissions it needs.</p>'}
    <p class="hint">Every run is processed by the AI provider and saved to the person's own task history.</p></section>
  <section class="block" aria-labelledby="kn-h"><div class="block-head"><h2 class="h2" id="kn-h">Knowledge files</h2><span class="mono muted">Optional</span></div>
    <p class="hint" id="kn-hint">PDF, TXT, MD, CSV or DOCX, up to 10 MB each and 5 files in total. The text is extracted in your browser and stored with this agent. Scanned PDFs without a text layer can't be read.</p>
    <label class="drop" id="dropzone" for="f-files"><input type="file" id="f-files" class="sr" multiple accept=".pdf,.txt,.md,.csv,.docx" aria-describedby="kn-hint">${ic('upload')}<span><b>Choose files</b> or drop them here</span></label>
    ${a.files.length ? `<ul class="files" aria-label="Attached files">${a.files.map(fileRow).join('')}</ul>` : ''}${errP('files')}</section>`;
}
function fileRow(f) {
  return `<li class="file ${f.status}" data-file-id="${f.id}"><span class="file-ic">${ic('file')}</span><div class="file-main"><div class="file-top"><span class="file-name" title="${esc(f.name)}">${esc(f.name)}</span><span class="mono muted">${fmtSize(f.size)}</span></div>
    ${f.status === 'uploading' ? `<div class="prog" role="progressbar" aria-label="${f.phase === 'reading' ? 'Reading' : 'Uploading'} ${esc(f.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(f.progress)}"><span style="width:${f.progress}%"></span></div><span class="mono muted small">${f.phase === 'reading' ? 'Extracting text' : 'Uploading'} ${Math.round(f.progress)}%</span>`
      : f.status === 'error' ? `<p class="file-err">${ic('alert')}<span>${esc(f.error)}</span></p>` : `<span class="ok-line good mono">${ic('check')} Ready</span>`}</div>
    <div class="file-acts">${f.status === 'error' && f.retryable && fileObjects.has(f.id) ? `<button class="btn btn-sm" data-act="file-retry" data-id="${f.id}">${ic('refresh')} Retry</button>` : ''}
      ${f.status === 'uploading' ? `<button class="btn btn-sm" data-act="file-cancel" data-id="${f.id}">Cancel</button>` : `<button class="icon-btn" data-act="file-remove" data-id="${f.id}" aria-label="Remove ${esc(f.name)}">${ic('x')}</button>`}</div></li>`;
}
function testView(a) {
  const runs = runsFor(a.id, 'Test'); const samples = (a.template && TEMPLATES[a.template]?.samples) || GENERIC_SAMPLES; const sel = S.selectedRun.studio;
  return `${eyebrow(2)}${summaryView(a, true)}
  <div class="test-grid">${workflowView(a, 'run')}
    <aside class="test-side" aria-label="Test tools">
      <section class="block tight"><h2 class="h3">Sample tasks</h2><p class="hint">Pick one to fill the test box, then run it.</p><div class="samples">${samples.map(s => `<button class="sample" data-act="use-sample" data-v="${esc(s)}"><span>${esc(s)}</span>${ic('arrowR')}</button>`).join('')}</div></section>
      <section class="block tight"><h2 class="h3">Test history</h2>${runs.length ? `<div class="hist">${runs.slice(-6).reverse().map(r => `<button data-act="select-run" data-key="studio" data-id="${r.id}" class="${sel === r.id ? 'sel' : ''}"><span class="sdot ${r.status}"></span><span class="t">${esc(r.input)}</span><span class="mono muted small">${fmtTime(r.startedAt)}</span></button>`).join('')}</div>` : '<p class="hint">No test runs yet.</p>'}</section>
      <section class="block tight"><h2 class="h3">Not quite right?</h2><p class="hint">Change instructions, tools or steps, then run the test again. Your history stays.</p><div><button class="btn btn-sm" data-act="stage" data-v="1">${ic('sliders')} Revise configuration</button></div></section>
    </aside></div>`;
}
function publishView(a) {
  const e = errs(); const w = S.user?.wallet; const creator = w ? shortAddr(w) : 'you (wallet not connected)';
  const elig = ELIGIBILITY.map(r => ({ ...r, ok: !!r.test(a) })); const allOk = elig.every(r => r.ok); const enabled = TOOLS.filter(t => a.tools[t.key]); const live = isLivePub(a);
  const ready = [['Define is complete', stageDone(a, 0)], ['Configure is complete', stageDone(a, 1)], ['A test run completed successfully', hasPassingRun(a), 'test'], ['Solana wallet connected', !!w, 'wallet']];
  return `${eyebrow(3)}
  ${live ? `<div class="success" role="status">${mascot({ size: 52, mood: 'happy', cls: pulseCls() })}<div><b>${esc(a.name)} is ${a.status === 'paused' ? 'published and paused' : 'live'}</b><p>${VIS[a.visibility].label} · published ${fmtDate(a.publishedAt)} ${fmtTime(a.publishedAt)}.</p>
    <div class="row"><a class="btn btn-sm btn-dark" href="#agents">Manage agent</a>${a.visibility !== 'private' ? `<a class="btn btn-sm" href="#agent-${a.id}">Open public page</a>` : ''}<button class="btn btn-sm" data-act="copy-link" data-id="${a.id}">${ic('link')} Copy link</button><button class="btn btn-sm" data-act="new-agent">${ic('plus')} Create another</button></div></div></div>` : ''}
  ${S.publishError ? `<div class="note note-bad" role="alert">${ic('alert')}<span><b>Not published.</b> ${esc(S.publishError)}</span><button class="btn btn-sm" data-act="continue">${ic('refresh')} Try again</button></div>` : ''}
  <h1 class="h1">Review and publish</h1><p class="lede">Check how your agent will appear, choose who can use it, then publish.</p>
  <div class="pub-grid">
    <article class="profile" data-flip="canvas" aria-labelledby="pf-name">
      <div class="pf-head">${avatar(a, 'lg')}<div><span class="eyebrow">Profile preview</span><h2 class="pf-name" id="pf-name">${esc(a.name) || 'Untitled agent'}</h2><p class="mono muted">by ${esc(creator)} · ${esc(a.category || 'No category')}</p></div></div>
      ${a.description ? `<p class="pf-desc">${esc(a.description)}</p>` : ''}
      <dl class="pf-dl"><div><dt>Purpose</dt><dd>${esc(a.goal)}</dd></div><div><dt>Steps</dt><dd><ol class="pf-steps">${a.steps.map(s => `<li>${esc(s.title)}</li>`).join('')}</ol></dd></div>
        <div><dt>Tools</dt><dd><div class="chips">${enabled.map(t => `<span class="chip">${t.label}</span>`).join('') || '—'}</div></dd></div>
        <div><dt>Permissions</dt><dd><ul class="pf-perms">${enabled.map(t => `<li><b>${PERM[t.key].title}</b><span>${PERM[t.key].explain}</span></li>`).join('')}</ul></dd></div>
        <div><dt>Visibility</dt><dd>${VIS[a.visibility].label}</dd></div><div><dt>Access</dt><dd>${ACCESS[a.access]}</dd></div></dl>
    </article>
    <div class="pub-side">
      <fieldset><legend class="h3">Visibility</legend><div class="radios">${Object.entries(VIS).map(([k, v]) => `<label class="radio" for="vis-${k}"><input type="radio" name="vis" id="vis-${k}" value="${k}" data-field="visibility" ${a.visibility === k ? 'checked' : ''}><span><b>${v.label}</b><span>${v.desc}</span></span></label>`).join('')}</div></fieldset>
      <fieldset><legend class="h3">Access terms</legend><div class="radios">
        <label class="radio" for="acc-free"><input type="radio" name="acc" id="acc-free" value="free" data-field="access" ${a.access === 'free' ? 'checked' : ''}><span><b>Free to use</b><span>Anyone who can see the agent can run it.</span></span></label>
        <label class="radio" for="acc-wallet"><input type="radio" name="acc" id="acc-wallet" value="wallet" data-field="access" ${a.access === 'wallet' ? 'checked' : ''}><span><b>Wallet connection required</b><span>People connect a Solana wallet before their first run.</span></span></label></div></fieldset>
      <section class="block tight rewards-box" aria-labelledby="rw-h"><h2 class="h3" id="rw-h">${ic('coins')} Reward eligibility</h2>
        <p class="hint">Creators may receive $BSA for eligible agent creation, genuine usage and successful task completion. Every reward is reviewed before it can be claimed. Amounts are set by the rewards program${S.config?.programs?.creation?.amount == null ? ' and are not set yet' : ''}.</p>
        <ul class="checklist">${elig.map(r => `<li><span class="ck ${r.ok ? 'yes' : 'no'}">${r.ok ? ic('check') : ''}</span><span>${r.label}</span></li>`).join('')}</ul>
        <p class="hint">${allOk ? 'Publishing will record a creation reward for review.' : 'You can still publish. The agent won\'t be entered for a creation reward until these are met.'} <a class="link-btn" href="#rewards">How rewards work</a></p></section>
      <section class="block tight" aria-labelledby="rd-h"><h2 class="h3" id="rd-h">Ready to publish</h2>
        <ul class="checklist">${ready.map(([l, ok, k]) => `<li><span class="ck ${ok ? 'yes' : 'no'}">${ok ? ic('check') : ''}</span><span>${l}${!ok && k === 'test' ? ` · <button class="link-btn" data-act="stage" data-v="2">Run a test</button>` : ''}${!ok && k === 'wallet' ? ` · <button class="link-btn" id="pub-wallet" data-act="wallet">Connect</button>` : ''}</span></li>`).join('')}</ul>
        ${errP('wallet')}${errP('test')}
        <label class="check" for="f-confirm"><input type="checkbox" id="f-confirm" data-field="confirmGuidelines" aria-describedby="err-confirm" ${a.confirmGuidelines ? 'checked' : ''} ${e.confirm ? 'aria-invalid="true"' : ''}><span>I confirm this agent follows the publishing guidelines and its description is accurate.</span></label>${errP('confirm')}</section>
    </div></div>`;
}

/* ---------- Bar ---------- */
function saveHTML() {
  const s = S.save;
  if (!signedIn() && !S.setup) { const a = cur(); return (a && (a.goal || a.name || a.steps.length)) ? `${ic('wallet')}<span>Not saved to an account</span><button class="link-btn" data-act="wallet" data-v="save">Connect wallet to save</button>` : `<span class="muted">Connect a wallet to save</span>`; }
  if (s.status === 'saving') return `<span class="spin" aria-hidden="true"></span><span>Saving…</span>`;
  if (s.status === 'pending') return `<span class="wdot" aria-hidden="true"></span><span>Unsaved changes</span>`;
  if (s.status === 'error') return `${ic('alert', 'ic-bad')}<span class="stxt">Couldn't save. ${esc(s.error)}</span><span class="sr">Couldn't save.</span><button class="link-btn" data-act="save-retry">Retry</button>`;
  return s.at ? `<span class="okc" aria-hidden="true">${ic('check')}</span><span>Draft saved</span><span class="muted stxt">${ago(s.at)}</span>` : (cur()?.persisted ? `<span class="okc" aria-hidden="true">${ic('check')}</span><span>All changes saved</span>` : `<span class="muted">Not saved yet</span>`);
}
function renderBar() {
  const a = cur(); const st = a.stage; const live = liveRun('studio', a.id);
  const next = st < 2 ? 'Continue' : st === 2 ? 'Review' : isLivePub(a) ? 'Manage agent' : a.status === 'draft' ? 'Publish agent' : 'Publish update';
  return `<div class="bar-in"><div class="save" id="save-status" aria-live="polite">${saveHTML()}</div><div class="bar-acts">
    ${st > 0 ? `<button class="btn btn-ghost bar-back" data-act="back" aria-label="Back to ${STAGES[st - 1]}">${ic('arrowL')}<span>Back</span></button>` : ''}
    ${st < 3 ? (live ? `<button class="btn bar-test" data-act="cancel-run" aria-label="Cancel test run">${ic('stop')}<span>Cancel run</span></button>` : `<button class="btn bar-test" data-act="test-agent" aria-label="${st === 2 ? 'Run test' : 'Test agent'}">${ic('play')}<span>${st === 2 ? 'Run test' : 'Test agent'}</span></button>`) : ''}
    <button class="btn btn-primary bar-next" data-act="continue" ${S.publishing ? 'aria-disabled="true"' : ''}>${S.publishing ? '<span class="spin"></span>Publishing…' : `${next} ${ic('arrowR')}`}</button></div></div>`;
}

/* ---------- Console ---------- */
function renderConsole(ctx) {
  const { key, agent, runs } = ctx; const live = liveRun(key, agent.id);
  const sel = runs.find(r => r.id === S.selectedRun[key]) || runs[runs.length - 1] || null; const tab = S.tab[key] || 'chat';
  const aiOff = !S.status?.ai;
  return `<div class="con"><div class="con-head"><div class="con-top"><span class="eyebrow on-dark">Live preview</span><span class="demo-tag">${aiOff ? '<span class="dot" style="background:#D99A00"></span>Runs not set up' : `<span class="dot" style="background:#22A35A"></span>${esc(S.status.model || 'Claude')}`}</span></div>
    <div class="tabs" role="tablist" aria-label="Preview views">${[['chat', 'Chat'], ['steps', 'Steps'], ['output', 'Output']].map(([k, l]) => `<button role="tab" id="tab-${key}-${k}" aria-selected="${tab === k}" aria-controls="tp-${key}" tabindex="${tab === k ? 0 : -1}" data-act="tab" data-key="${key}" data-v="${k}">${l}${k === 'steps' && live ? '<span class="tab-dot" aria-hidden="true"></span>' : ''}</button>`).join('')}</div></div>
    ${strip(sel, live, key)}
    <div class="con-body" id="tp-${key}" data-scroll-key="cb-${key}" ${tab === 'chat' ? 'data-stick' : ''} role="tabpanel" aria-labelledby="tab-${key}-${tab}" tabindex="0">${tab === 'chat' ? chatTab(ctx, live) : tab === 'steps' ? stepsTab(sel, runs, key) : outputTab(sel, key)}</div>
    <form class="con-foot" data-form="run" data-key="${key}" novalidate><label class="sr" for="in-${key}">Task to ${key === 'studio' ? 'test' : 'run'}</label>
      <div class="con-input"><textarea id="in-${key}" data-chat="${key}" data-grow rows="1" maxlength="2000" placeholder="${key === 'studio' ? 'Give a sample task to test…' : 'Describe your task…'}">${esc(S.chat[key] || '')}</textarea>
        ${live ? `<button type="button" class="run-btn cancel" data-act="cancel-run">${ic('stop')}<span>Cancel</span></button>` : `<button type="submit" class="run-btn">${ic('play')}<span>Run</span></button>`}</div>
      ${S.runError[key] ? `<p class="err-dark" role="alert">${ic('alert')}<span>${esc(S.runError[key].msg)}</span>${S.runError[key].fix != null ? `<button type="button" class="link-d" data-act="stage" data-v="${S.runError[key].fix}">Go to ${STAGES[S.runError[key].fix]} ${ic('arrowR')}</button>` : ''}${S.runError[key].wallet ? `<button type="button" class="link-d" data-act="wallet">Connect wallet ${ic('arrowR')}</button>` : ''}</p>` : ''}
      <div class="foot-hint"><span>Enter to run · Shift + Enter for a new line</span><span>Results are AI-generated. Check important facts.</span></div></form></div>`;
}
function strip(sel, live, key) {
  if (live) {
    if (live.pending) return `<div class="strip st-running" role="status"><span class="spin" aria-hidden="true"></span><span class="grow"><b>Starting</b> · connecting to the run service</span><button class="btn btn-sm btn-on-dark" data-act="cancel-run">${ic('stop')} Cancel</button></div>`;
    const i = live.steps.findIndex(s => s.status === 'running'); const c = live.steps[i];
    return `<div class="strip st-running" role="status"><span class="grow"><b>Running</b> · Step ${i + 1} of ${live.steps.length}${c ? ` · ${esc(c.title)}` : ''}</span><button class="btn btn-sm btn-on-dark" data-act="cancel-run">${ic('stop')} Cancel</button>
      <div class="segs" aria-hidden="true">${live.steps.map(s => `<i class="${s.status === 'done' || s.status === 'skipped' ? 'done' : s.status === 'running' ? 'running' : ''}"></i>`).join('')}</div></div>`;
  }
  if (!sel) return `<div class="strip st-idle" role="status"><span class="grow"><b>Idle</b> · No runs yet</span></div>`;
  const d = sel.endedAt ? dur(sel.endedAt - sel.startedAt) : '';
  if (sel.status === 'completed') return `<div class="strip st-completed" role="status">${ic('check')}<span class="grow"><b>Completed</b> in ${d} · ${fmtTime(sel.endedAt)}</span></div>`;
  const at = sel.steps.findIndex(s => s.status === 'failed' || s.status === 'cancelled');
  if (sel.status === 'failed') return `<div class="strip st-failed" role="status">${ic('alert')}<span class="grow"><b>Failed</b>${at >= 0 ? ` at step ${at + 1}` : ''}${d ? ` · ${d}` : ''}</span><button class="btn btn-sm btn-on-dark" data-act="retry-run" data-key="${key}" data-id="${sel.id}">${ic('refresh')} Retry</button></div>`;
  if (sel.status === 'running') return `<div class="strip st-running" role="status"><span class="grow"><b>Running elsewhere</b> · refresh to see the result</span></div>`;
  return `<div class="strip st-cancelled" role="status"><span class="grow"><b>Cancelled</b>${at >= 0 ? ` at step ${at + 1}` : ''}${d ? ` · ${d}` : ''}</span><button class="btn btn-sm btn-on-dark" data-act="retry-run" data-key="${key}" data-id="${sel.id}">${ic('refresh')} Run again</button></div>`;
}
const statusIcon = st => `<span class="tic ${st}" aria-hidden="true">${st === 'done' ? ic('check') : st === 'failed' ? ic('x') : ''}</span>`;
function chatTab(ctx, live) {
  const { key, agent, runs } = ctx;
  if (!runs.length && !live) {
    const samples = (agent.template && TEMPLATES[agent.template]?.samples) || GENERIC_SAMPLES;
    return `<div class="con-empty">${mascot({ size: 56 })}<h3>Ready when you are</h3><p>${key === 'studio' ? 'Run a sample task to watch each step execute with the real model. Each run uses your saved configuration.' : 'Describe a task and run it. You can watch each step and cancel at any time.'}</p>
      <div class="chips">${samples.slice(0, 3).map(s => `<button class="chip-d" data-act="use-sample" data-key="${key}" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>`;
  }
  const list = runs.slice(-4); if (live?.pending) list.push(null);
  return list.map(r => {
    if (!r) return `<div class="msg-user">${esc(S.run.input)}</div><div class="msg-agent"><span class="av-d">${mascot({ size: 30, mood: 'think' })}</span><div><div class="who"><span class="sdot running"></span>Starting…</div></div></div>`;
    const failedAt = r.steps.findIndex(s => s.status === 'failed' || s.status === 'cancelled');
    return `<div class="msg-user">${esc(r.input)}</div>
    <div class="msg-agent"><span class="av-d">${mascot({ size: 30, mood: r.status === 'running' ? 'think' : r.status === 'completed' ? 'happy' : r.status === 'failed' ? 'concern' : 'idle' })}</span>
      <div><div class="who"><span class="sdot ${r.status}"></span>${esc(agent.name || r.agentName || 'Agent')} · ${RUN_LABEL[r.status]}</div>
        <ol class="trace-mini">${r.steps.map((s, i) => `<li class="ts-${s.status}">${statusIcon(s.status)}<span><b>Step ${i + 1}</b> · ${esc(s.title)}<span class="sub">${STEP_LABEL[s.status]}${s.endedAt && s.startedAt ? ` · ${dur(s.endedAt - s.startedAt)}` : ''}${s.note ? ` · ${esc(s.note)}` : ''}</span></span></li>`).join('')}</ol>
        ${r.status === 'completed' && r.output ? `<div class="result-card"><span class="eyebrow on-dark">Result</span><h4>${esc(firstLine(r.output.markdown))}</h4><p class="k">${r.output.sources?.length ? plural(r.output.sources.length, 'source') : 'No web sources'} · ${dur(r.endedAt - r.startedAt)}</p><button class="link-d" data-act="open-output" data-key="${key}" data-id="${r.id}">Open output ${ic('arrowR')}</button></div>`
        : r.status === 'failed' ? `<div class="err-card" role="alert"><div class="h">${ic('alert')}<span>Run failed${failedAt >= 0 ? ` at step ${failedAt + 1}` : ''}</span></div><p>${esc(r.error || 'Unknown error.')}</p><div class="row"><button class="btn btn-sm btn-on-dark" data-act="retry-run" data-key="${key}" data-id="${r.id}">${ic('refresh')} Retry</button>${key === 'studio' ? `<button class="btn btn-sm btn-on-dark" data-act="stage" data-v="1">${ic('sliders')} Revise steps</button>` : ''}</div></div>`
        : r.status === 'cancelled' ? `<div class="info-card">Cancelled${failedAt >= 0 ? ` during step ${failedAt + 1}` : ''}. No output was produced.</div>` : ''}
      </div></div>`;
  }).join('');
}
function firstLine(m) { const l = String(m || '').split('\n').map(x => x.replace(/^#+\s*|\*\*/g, '').trim()).find(Boolean) || 'Result'; return l.length > 110 ? l.slice(0, 108) + '…' : l; }
function stepsTab(sel, runs, key) {
  if (!sel) return `<div class="con-empty"><h3>No execution yet</h3><p>Each step's status, timing and intermediate output appear here during and after a run.</p></div>`;
  return `<div class="trace-head"><span class="pill pill-${sel.status}">${RUN_LABEL[sel.status]}</span><span>${fmtTime(sel.startedAt)}</span><span>${sel.endedAt ? dur(sel.endedAt - sel.startedAt) : 'in progress'}</span>${sel.model ? `<span class="dim">${esc(sel.model)}</span>` : ''}</div>
    <p class="dim small mono" style="overflow-wrap:anywhere">Task: ${esc(sel.input)}</p>
    <ol class="trace">${sel.steps.map((s, i) => `<li>${statusIcon(s.status)}<div><b>Step ${i + 1} · ${esc(s.title)}</b><span class="meta">${STEP_LABEL[s.status]}${s.startedAt ? ` · started +${dur(s.startedAt - sel.startedAt)}` : ''}${s.endedAt && s.startedAt ? ` · took ${dur(s.endedAt - s.startedAt)}` : ''}</span>${s.note ? `<p class="tr-note">${esc(s.note)}</p>` : ''}${s.output ? `<details class="step-out"><summary>Show step output</summary><div class="md">${md(s.output)}</div></details>` : ''}</div></li>`).join('')}</ol>
    ${sel.error ? `<div class="err-card"><div class="h">${ic('alert')}<span>Error</span></div><p>${esc(sel.error)}</p></div>` : ''}
    ${runs.length > 1 ? `<div><p class="eyebrow on-dark" style="margin-bottom:8px">Earlier runs</p><div class="run-list">${runs.slice(-8).reverse().map(r => `<button data-act="select-run" data-key="${key}" data-id="${r.id}" class="${r.id === sel.id ? 'sel' : ''}"><span class="sdot ${r.status}"></span><span class="t">${esc(r.input)}</span><span class="mono dim">${fmtTime(r.startedAt)}</span></button>`).join('')}</div></div>` : ''}`;
}
function outputTab(sel, key) {
  if (!sel) return `<div class="con-empty"><h3>No output yet</h3><p>Run a task to see the agent's result here.</p></div>`;
  if (sel.status === 'running') return `<div class="con-empty"><h3>Waiting for the final step</h3><p>Output appears when the run completes. You can cancel at any time.</p></div>`;
  if (sel.status !== 'completed' || !sel.output) return `<div class="con-empty"><h3>No output from this run</h3><p>The run was ${sel.status} before the final step, so nothing was produced.</p><button class="btn btn-sm btn-on-dark" data-act="retry-run" data-key="${key}" data-id="${sel.id}">${ic('refresh')} Run again</button></div>`;
  const o = sel.output;
  return `<article class="out-doc"><div class="md">${md(o.markdown)}</div>${o.sources?.length ? `<h4>Sources (${o.sources.length})</h4><ol class="src-list">${o.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a><span>${esc(new URL(s.url).hostname)}</span></li>`).join('')}</ol>` : ''}</article>
    <div class="row"><button class="btn btn-sm btn-on-dark" data-act="copy-output" data-id="${sel.id}">${ic('copy')} Copy text</button><span class="mono dim small">AI-generated · ${esc(sel.model || '')}</span></div>`;
}

/* ---------- Discover ---------- */
function filteredDir() {
  const q = S.dir.q.trim().toLowerCase(), c = S.dir.cat;
  return S.dir.items.filter(d => (c === 'All' || (c === 'Yours' ? d.mine : d.cat === c)) && (!q || [d.name, d.purpose, d.creator, d.cat].join(' ').toLowerCase().includes(q)));
}
function dirResults() {
  if (S.dir.loading && !S.dir.items.length) return `<div class="dir-grid">${[1, 2, 3].map(() => '<div class="skel" style="height:220px"></div>').join('')}</div>`;
  if (S.dir.error) return `<div class="empty"><h3>Couldn't load agents</h3><p>${esc(S.dir.error)}</p><button class="btn btn-sm" data-act="dir-reload">${ic('refresh')} Try again</button></div>`;
  if (!S.dir.items.length) return `<div class="empty">${mascot({ size: 60 })}<h3>No public agents yet</h3><p>Agents appear here once creators publish them with Public visibility. Yours could be the first.</p><a class="btn btn-primary" href="#new">${ic('plus')} Create an agent</a></div>`;
  const list = filteredDir();
  if (!list.length) return `<div class="empty">${mascot({ size: 52, mood: 'think' })}<h3>No agents match</h3><p>Try a different word, or clear the filters to see every agent.</p><button class="btn btn-sm" data-act="dir-clear">Clear filters</button></div>`;
  return `<ul class="dir-grid">${list.map(d => `<li class="dir-card"><div class="dir-top">${avatar(d)}<div><h3>${esc(d.name)}</h3><p class="by">by ${esc(shortAddr(d.creator))}</p></div>${d.mine ? '<span class="pill pill-published">Yours</span>' : ''}</div>
    <p class="dir-purpose">${esc(d.purpose)}</p>
    <div class="dir-terms">${ic(d.access === 'wallet' ? 'wallet' : 'globe')}<span>${ACCESS[d.access]}</span><span>· ${plural(d.completed, 'completed task')}</span></div>
    <div class="dir-foot"><span class="chip">${esc(d.cat || 'Other')}</span><a class="btn btn-sm btn-dark" href="#agent-${d.id}">Try agent ${ic('arrowR')}</a></div></li>`).join('')}</ul>`;
}
function discoverView() {
  const all = S.dir.items; const cats = ['All', ...CATEGORIES.filter(c => all.some(d => d.cat === c))]; if (all.some(d => d.mine)) cats.push('Yours');
  return `<div class="wrap wide ${S.routeChanged ? 'enter' : ''}">
    <div class="page-head"><div><div class="eyebrow">Discover</div><h1 class="h1">Find an agent for the job</h1><p class="lede">Browse public agents built by creators on Best Super Agents. Every listing runs on the same live engine you test with.</p></div></div>
    <div class="block tight"><label class="search" for="dir-q">${ic('search')}<span class="sr">Search agents</span><input id="dir-q" type="search" data-search="dir" placeholder="Search by name, task or creator" value="${esc(S.dir.q)}" autocomplete="off"></label>
      ${all.length ? `<div class="filters" role="group" aria-label="Filter by category">${cats.map(c => `<button class="fchip" data-act="dir-cat" data-v="${c}" aria-pressed="${S.dir.cat === c}">${c}<span class="n">${c === 'All' ? all.length : c === 'Yours' ? all.filter(d => d.mine).length : all.filter(d => d.cat === c).length}</span></button>`).join('')}</div>` : ''}
      <p class="mono muted small" id="dir-count" aria-live="polite">${S.dir.loading ? 'Loading…' : plural(filteredDir().length, 'agent')}</p></div>
    <div id="dir-results">${dirResults()}</div></div>`;
}
function detailView() {
  const L = S.listing;
  if (L.loading || (!L.agent && !L.error)) return `<div class="wrap wide"><a class="back" href="#discover">${ic('arrowL')} Back to Discover</a><div class="skel" style="height:72px;width:60%"></div><div class="skel" style="height:420px"></div></div>`;
  if (L.error) return `<div class="wrap"><a class="back" href="#discover">${ic('arrowL')} Back to Discover</a><div class="empty"><h3>Agent not available</h3><p>${esc(L.error)}</p><a class="btn btn-sm" href="#discover">Open Discover</a></div></div>`;
  const d = L.agent; const runs = runsFor(d.id, 'Try');
  return `<div class="wrap wide ${S.routeChanged ? 'enter' : ''}"><a class="back" href="#discover">${ic('arrowL')} Back to Discover</a>
    <header class="det-head">${avatar(d, 'lg')}<div><div class="row"><span class="chip">${esc(d.cat || 'Other')}</span>${d.status === 'paused' ? '<span class="pill pill-paused">Paused by creator</span>' : ''}${d.mine ? '<span class="pill pill-published">Yours</span>' : ''}</div><h1 class="h1">${esc(d.name)}</h1><p class="by">by ${esc(shortAddr(d.creator))} · ${ACCESS[d.access]}</p></div></header>
    <div class="det-grid"><div class="det-info">
      <section class="block tight"><h2 class="h2">What it does</h2><p>${esc(d.purpose || d.goal)}</p>${d.purpose && d.goal ? `<p class="hint">Goal: ${esc(d.goal)}</p>` : ''}</section>
      <section class="block tight"><h2 class="h2">How it works</h2><ol class="pf-steps">${d.steps.map(s => `<li><b>${esc(s.title)}</b> <span class="muted">${esc(s.desc)}</span></li>`).join('')}</ol></section>
      <section class="block tight"><h2 class="h2">Required permissions</h2><p class="hint">You'll be asked to allow these before your first run.${allowed(d.id) ? ' <b>Allowed on this device.</b>' : ''}</p>
        <ul class="perm-list">${d.tools.map(k => PERM[k] ? `<li>${ic('shield')}<div><b>${PERM[k].title}</b><p>${PERM[k].explain}</p></div></li>` : '').join('')}<li>${ic('info')}<div><b>Your task is processed by the AI provider</b><p>Tasks and results are saved to your own run history.</p></div></li></ul></section>
      <section class="block tight"><h2 class="h2">Limitations</h2><ul class="dots lim"><li>Results are generated by AI and can be wrong. Check important facts.</li><li>It can't send messages, make purchases or act on other services.</li>${d.tools.includes('search') ? '<li>Web search can miss very recent or paywalled pages.</li>' : '<li>It has no web access, so it works only from your task and the creator\'s files.</li>'}</ul></section>
    </div><div class="det-console">${renderConsole({ key: 'dir', agent: d, runs })}</div></div></div>`;
}
const allowed = id => ls.get('bsa-allow-' + id) === '1';

/* ---------- My agents / Activity ---------- */
function signInView(title, text) {
  return `<div class="wrap wide ${S.routeChanged ? 'enter' : ''}"><div class="page-head"><div><div class="eyebrow">Manage</div><h1 class="h1">${title}</h1></div></div>
    <div class="empty">${mascot({ size: 64 })}<h3>Connect your wallet</h3><p>${text}</p><div class="row" style="justify-content:center"><button class="btn btn-primary" data-act="wallet" data-v="save">${ic('wallet')} Connect wallet</button><a class="btn" href="#studio">Open Studio</a></div></div></div>`;
}
function agentsView() {
  if (!signedIn()) return signInView('My agents', 'Your drafts, published agents and their test history are saved to your Solana wallet account. Connect to see them on any device.');
  const f = S.agentsFilter; const list = S.agents.filter(a => a.persisted || a.id === S.currentId && (a.goal || a.name));
  const counts = { all: list.length, draft: list.filter(a => a.status === 'draft').length, published: list.filter(a => a.status === 'published').length, paused: list.filter(a => a.status === 'paused').length };
  const shown = list.filter(a => f === 'all' || a.status === f).sort((x, y) => y.updatedAt - x.updatedAt);
  const tests = S.runs.filter(r => r.source === 'Test'); const uses = list.reduce((s, a) => s + (a.uses || 0), 0); const done = list.reduce((s, a) => s + (a.completedByOthers || 0), 0); const pub = counts.published + counts.paused;
  return `<div class="wrap wide ${S.routeChanged ? 'enter' : ''}">
    <div class="page-head"><div><div class="eyebrow">Manage</div><h1 class="h1">My agents</h1><p class="lede">Drafts and published agents, their tests and how other people use them.</p></div><a class="btn btn-primary" href="#new">${ic('plus')} New agent</a></div>
    ${!list.length ? `<div class="empty">${mascot({ size: 64 })}<h3>No agents yet</h3><p>Describe a goal in the Studio and your first agent takes shape in four steps: define, configure, test and publish.</p><a class="btn btn-primary" href="#new">${ic('plus')} Create your first agent</a></div>` : `
    <div class="stats" role="group" aria-label="Your numbers"><div class="stat"><span class="k">Agents</span><span class="v">${counts.all}</span><span class="s">${pub} published</span></div>
      <div class="stat"><span class="k">Your test runs</span><span class="v">${tests.length}</span><span class="s">${tests.filter(r => r.status === 'completed').length} completed</span></div>
      <div class="stat"><span class="k">Uses by others</span><span class="v">${pub ? uses : '—'}</span><span class="s">${pub ? 'Runs started by other people' : 'Shown after you publish'}</span></div>
      <div class="stat"><span class="k">Successful tasks</span><span class="v">${pub ? done : '—'}</span><span class="s">${pub ? 'Completed for other people' : 'Shown after you publish'}</span></div></div>
    <div class="filters" role="group" aria-label="Filter agents">${[['all', 'All'], ['draft', 'Drafts'], ['published', 'Published'], ['paused', 'Paused']].map(([k, l]) => `<button class="fchip" data-act="agents-filter" data-v="${k}" aria-pressed="${f === k}">${l}<span class="n">${counts[k]}</span></button>`).join('')}</div>
    ${shown.length ? `<ul class="alist">${shown.map(agentRow).join('')}</ul>` : `<div class="empty"><h3>Nothing here</h3><p>No agents have this status yet.</p></div>`}`}
    <section class="block"><div class="block-head"><h2 class="h2">Recent tasks</h2><a class="link-btn" href="#activity">All activity</a></div>${S.runs.length ? runTable(S.runs.slice(-5).reverse()) : '<p class="hint">Your test runs and tries appear here.</p>'}</section></div>`;
}
function agentRow(a) {
  const t = runsFor(a.id, 'Test'); const ok = t.filter(r => r.status === 'completed').length; const busy = S.busy[a.id];
  return `<li class="arow">${avatar(a)}<div class="nm"><b title="${esc(a.name || 'Untitled agent')}">${esc(a.name || 'Untitled agent')}</b><span>${esc(a.goal || 'No goal yet')}</span><span><span class="pill pill-${a.status}">${a.status}</span> ${a.id === S.currentId ? '<span class="pill">In studio</span>' : ''}</span></div>
    <div class="met"><span>${a.category || 'No category'} · ${a.status === 'draft' ? `stage ${a.stage + 1} of 4` : VIS[a.visibility].label}</span><span>${plural(t.length, 'test')} · ${ok} completed</span>${a.status !== 'draft' ? `<span>${plural(a.uses || 0, 'use')} by others · ${a.completedByOthers || 0} successful</span>` : ''}<span>Updated ${ago(a.updatedAt)}</span></div>
    <div class="acts"><button class="btn btn-sm" data-act="agent-edit" data-id="${a.id}">${ic('pencil')} Edit</button><button class="btn btn-sm" data-act="agent-test" data-id="${a.id}">${ic('play')} Test</button>
      ${a.status === 'published' ? `<button class="btn btn-sm" data-act="agent-pause" data-id="${a.id}" ${busy ? 'aria-disabled="true"' : ''}>${busy ? '<span class="spin"></span>' : ic('pause')} Pause</button>` : ''}
      ${a.status === 'paused' ? `<button class="btn btn-sm" data-act="agent-resume" data-id="${a.id}" ${busy ? 'aria-disabled="true"' : ''}>${busy ? '<span class="spin"></span>' : ic('play')} Resume</button>` : ''}
      ${a.status !== 'draft' && a.visibility !== 'private' ? `<a class="btn btn-sm btn-ghost" href="#agent-${a.id}">${ic('eye')} View</a>` : ''}
      ${a.status === 'draft' ? `<button class="icon-btn" data-act="agent-delete" data-id="${a.id}" aria-label="Delete ${esc(a.name || 'untitled draft')}">${ic('trash')}</button>` : ''}</div></li>`;
}
function runTable(runs) {
  return `<div class="tbl-wrap"><table><thead><tr><th>Agent</th><th>Task</th><th>Status</th><th>Type</th><th>Started</th><th>Duration</th></tr></thead><tbody>
    ${runs.map(r => `<tr><td>${esc(r.agentName || '—')}</td><td><span class="clip" title="${esc(r.input)}">${esc(r.input)}</span>${r.error ? `<span class="muted small">${esc(r.error)}</span>` : ''}</td><td><span class="pill pill-${r.status}">${RUN_LABEL[r.status]}</span></td><td class="mono small">${r.source === 'Test' ? 'Test' : 'Try'}</td><td class="mono small">${fmtDate(r.startedAt)} ${fmtTime(r.startedAt)}</td><td class="mono small">${r.endedAt ? dur(r.endedAt - r.startedAt) : '—'}</td></tr>`).join('')}</tbody></table></div>`;
}
function activityView() {
  if (!signedIn()) return signInView('Activity', 'Your runs and account events are recorded in your wallet account. Connect to see your history.');
  return `<div class="wrap wide ${S.routeChanged ? 'enter' : ''}">
    <div class="page-head"><div><div class="eyebrow">Manage</div><h1 class="h1">Activity</h1><p class="lede">Your execution history and account events.</p></div><a class="btn" href="#agents">${ic('folder')} My agents</a></div>
    <section class="block"><div class="block-head"><h2 class="h2">Execution history</h2><span class="mono muted">${plural(S.runs.length, 'run')}</span></div>
      ${S.runs.length ? runTable(S.runs.slice().reverse()) : `<div class="empty">${mascot({ size: 52 })}<h3>No runs yet</h3><p>Test an agent in the Studio or try one in Discover. Each run's steps and timing are recorded here.</p><a class="btn btn-sm" href="#studio">Open Studio</a></div>`}</section>
    <section class="block"><div class="block-head"><h2 class="h2">Events</h2></div>${S.events.length ? `<ol class="events">${S.events.slice(0, 80).map(e => `<li><span class="tm">${fmtDate(e.t)} ${fmtTime(e.t)}</span><span class="dt ${e.tone}"></span><span>${esc(e.text)}</span></li>`).join('')}</ol>` : '<p class="hint">Sign-ins, tests, publications and status changes are listed here.</p>'}</section></div>`;
}

/* ---------- Rewards ---------- */
function rewardsView() {
  const C = S.config || { programs: {}, caps: {}, token: { totalSupply: 1000000000 } }; const list = S.rewards; const tab = S.rewardsTab; const w = S.user?.wallet;
  const STAT = ['pending', 'approved', 'available', 'claimed'];
  const sum = arr => { const k = arr.filter(e => e.amount != null); return k.length ? fmtNum(k.reduce((s, e) => s + e.amount, 0)) + ' $BSA' : '—'; };
  const shown = list.filter(e => tab === 'all' || e.status === tab); const nc = '<span class="nc">Not set</span>';
  return `<div class="wrap wide ${S.routeChanged ? 'enter' : ''}">
    <div class="page-head"><div><div class="eyebrow">Rewards</div><h1 class="h1">Rewards for agents people use</h1><p class="lede">Creators can receive $BSA for eligible agent creation, genuine usage and tasks that complete successfully. Every reward is reviewed before it can be claimed.</p></div>
      <div class="wallet-card">${w ? `<span class="mono">Rewards wallet · Solana</span><b class="mono">${shortAddr(w)}</b><button class="link-btn" data-act="sign-out">Sign out</button>` : `<span class="mono">No wallet connected</span><p class="hint">Connect a Solana wallet to receive rewards.</p><button class="btn btn-sm btn-dark" data-act="wallet">${ic('wallet')} Connect wallet</button>`}</div></div>
    <section class="programs" aria-label="Reward types">${PROGRAMS.map((p, i) => { const pc = C.programs?.[p.key] || {}; return `<article class="program"><span class="mono num">0${i + 1}</span><h3>${p.title}</h3><p>${p.basis}</p><dl class="kv"><div><dt>Amount</dt><dd>${pc.enabled === false ? '<span class="nc">Paused</span>' : pc.amount == null ? nc : fmtNum(pc.amount) + ' $BSA'}</dd></div><div><dt>Counted</dt><dd>${p.unit}</dd></div></dl></article>`; }).join('')}</section>
    <section class="block" aria-labelledby="cfg-h"><div class="block-head"><h2 class="h2" id="cfg-h">Program settings</h2><span class="mono muted">Set by the rewards program</span></div>
      <dl class="cfg-grid"><div><dt>Total token supply</dt><dd class="mono">1,000,000,000 $BSA</dd></div><div><dt>Rewards allocation</dt><dd>${C.allocation == null ? nc : fmtNum(C.allocation) + ' $BSA'}</dd></div><div><dt>Funding source</dt><dd>${C.fundingSource ? esc(C.fundingSource) : nc}</dd></div>
        <div><dt>Review window</dt><dd>${C.reviewWindowDays == null ? nc : C.reviewWindowDays + ' days'}</dd></div><div><dt>Cap per agent</dt><dd>${C.caps?.perAgent == null ? nc : fmtNum(C.caps.perAgent) + ' $BSA'}</dd></div><div><dt>Cap per creator</dt><dd>${C.caps?.perCreator == null ? nc : fmtNum(C.caps.perCreator) + ' $BSA'}</dd></div></dl>
      <p class="hint">Rewards come from a finite allocation. They are not unlimited, and amounts, rules and funding can change. Nothing on this page promises future rewards.</p>
      <details class="how"><summary>How a reward moves through review</summary><ol class="flow"><li><b>Pending</b>Recorded and waiting for review.</li><li><b>Approved</b>Passed review. Waiting for release.</li><li><b>Available</b>Released and ready to claim.</li><li><b>Claimed</b>Sent to your wallet.</li></ol></details></section>
    <section class="block" aria-labelledby="led-h"><div class="block-head"><h2 class="h2" id="led-h">Your rewards</h2></div>
      ${!S.status.claims ? `<div class="note">${ic('info')}<span>Claiming opens once the $BSA claim program is live on Solana. Approved rewards stay recorded until then.</span></div>` : ''}
      <div class="statuses" role="group" aria-label="Filter by status"><button class="sbox" data-act="rewards-tab" data-v="all" aria-pressed="${tab === 'all'}"><span class="k">All</span><span class="v">${list.length}</span><span class="s">${sum(list)}</span></button>
        ${STAT.map(s => { const a = list.filter(e => e.status === s); return `<button class="sbox" data-act="rewards-tab" data-v="${s}" aria-pressed="${tab === s}"><span class="k">${s}</span><span class="v">${a.length}</span><span class="s">${sum(a)}</span></button>`; }).join('')}</div>
      ${shown.length ? `<ul class="ledger">${shown.map(e => `<li class="lrow"><div class="l-type"><span>${REWARD_TYPE[e.type] || e.type}</span></div><div class="l-main"><b>${esc(e.agentName)}</b><p>${esc(e.reason)}</p></div><div class="l-amt">${e.amount == null ? '<span class="nc">Set at review</span>' : fmtNum(e.amount) + ' $BSA'}</div><span><span class="pill pill-${e.status}">${e.status}</span></span>
        <div class="l-act">${e.status === 'available' ? `<button class="btn btn-sm" aria-disabled="true" title="Claiming opens when the claim program is live">Claim soon</button>` : `<span class="mono muted small">${fmtDate(e.updatedAt || e.createdAt)}</span>`}</div></li>`).join('')}</ul>`
        : `<div class="empty">${mascot({ size: 52 })}<h3>${list.length ? 'No rewards with this status' : 'No rewards yet'}</h3><p>${list.length ? 'Choose another status to see your entries.' : 'Publish a public agent that passes its test to record a creation reward for review. Usage and completion rewards are recorded each review period once other people use your agents.'}</p>${list.length ? '' : '<a class="btn btn-sm" href="#studio">Open Studio</a>'}</div>`}
    </section>
    ${S.user?.isAdmin ? adminView() : ''}</div>`;
}
function adminView() {
  const A = S.admin; const d = A.data;
  if (!d) return `<section class="admin"><h2 class="h2">Rewards admin</h2>${A.error ? `<p class="err">${ic('alert')}<span>${esc(A.error)}</span></p>` : ''}<div><button class="btn btn-sm" data-act="admin-load">${A.loading ? '<span class="spin"></span>' : ic('refresh')} Load review queue</button></div></section>`;
  const c = d.config; const v = x => x == null ? '' : x;
  return `<section class="admin" aria-labelledby="adm-h"><div class="block-head"><h2 class="h2" id="adm-h">Rewards admin</h2><span class="mono muted">Visible to admin wallets only</span></div>
    ${A.error ? `<div class="note note-bad" role="alert">${ic('alert')}<span>${esc(A.error)}</span></div>` : ''}
    <form id="admin-cfg" class="block tight" novalidate><h3 class="h3">Program settings</h3><div class="admin-grid">
      ${['creation', 'usage', 'completion'].map(k => `<div class="field"><label for="ac-${k}">${REWARD_TYPE[k]} amount ($BSA ${k === 'creation' ? 'per agent' : k === 'usage' ? 'per use' : 'per task'})</label><input id="ac-${k}" name="${k}" inputmode="decimal" value="${v(c.programs[k].amount)}" placeholder="Not set"></div>`).join('')}
      <div class="field"><label for="ac-alloc">Rewards allocation ($BSA)</label><input id="ac-alloc" name="allocation" inputmode="decimal" value="${v(c.allocation)}" placeholder="Not set"></div>
      <div class="field"><label for="ac-fund">Funding source</label><input id="ac-fund" name="fundingSource" value="${esc(v(c.fundingSource))}" placeholder="Not set"></div>
      <div class="field"><label for="ac-win">Review window (days)</label><input id="ac-win" name="reviewWindowDays" inputmode="numeric" value="${v(c.reviewWindowDays)}" placeholder="Not set"></div>
      <div class="field"><label for="ac-cap1">Cap per agent ($BSA)</label><input id="ac-cap1" name="perAgent" inputmode="decimal" value="${v(c.caps.perAgent)}" placeholder="Not set"></div>
      <div class="field"><label for="ac-cap2">Cap per creator ($BSA)</label><input id="ac-cap2" name="perCreator" inputmode="decimal" value="${v(c.caps.perCreator)}" placeholder="Not set"></div></div>
      <div class="row"><button class="btn btn-sm btn-dark" type="submit">${A.busy.cfg ? '<span class="spin"></span>' : ''} Save settings</button></div></form>
    <div class="block tight"><h3 class="h3">Review period</h3><p class="hint">Records pending usage and completion entries for runs by other people since ${d.lastPeriodEnd ? fmtDate(Date.parse(d.lastPeriodEnd)) : 'launch'}. Each person counts at most 20 runs per agent per period.</p><div><button class="btn btn-sm" data-act="admin-period">${A.busy.period ? '<span class="spin"></span>' : ''} Record period entries</button></div></div>
    <div class="block tight"><h3 class="h3">Review queue</h3>${d.entries.length ? `<div class="tbl-wrap"><table><thead><tr><th>Type</th><th>Agent</th><th>Creator</th><th>Reason</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${d.entries.map(e => `<tr><td class="mono small">${REWARD_TYPE[e.type] || e.type}</td><td>${esc(e.agentName)}</td><td class="mono small">${esc(shortAddr(e.wallet) || 'guest')}</td><td><span class="clip" title="${esc(e.reason)}">${esc(e.reason)}</span></td>
        <td><label class="sr" for="amt-${e.id}">Amount</label><input id="amt-${e.id}" inputmode="decimal" value="${e.amount == null ? '' : e.amount}" placeholder="—"></td><td><span class="pill pill-${e.status}">${e.status}</span></td>
        <td><div class="row">${e.status === 'pending' ? `<button class="btn btn-sm" data-act="admin-set" data-id="${e.id}" data-v="approved">Approve</button><button class="btn btn-sm btn-ghost" data-act="admin-set" data-id="${e.id}" data-v="rejected">Reject</button>` : ''}${e.status === 'approved' ? `<button class="btn btn-sm" data-act="admin-set" data-id="${e.id}" data-v="available">Release</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>` : '<p class="hint">No entries yet.</p>'}</div></section>`;
}

/* ---------- Dialogs ---------- */
function dialog({ title, eyebrowTxt = '', body, foot = '', wide = false, sheet = false }) {
  return `<div class="scrim ${sheet ? 'sheet-scrim' : ''}" data-scrim><div class="dialog ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="m-title"><div class="grab" aria-hidden="true"></div>
    <header class="m-head"><div>${eyebrowTxt ? `<span class="eyebrow">${eyebrowTxt}</span>` : ''}<h2 id="m-title">${title}</h2></div><button class="icon-btn" data-act="modal-close" aria-label="Close">${ic('x')}</button></header>
    <div class="m-body">${body}</div>${foot ? `<footer class="m-foot">${foot}</footer>` : ''}</div></div>`;
}
/* ---------- Solana wallets ----------
   1) Wallet Standard (Phantom, Solflare, Backpack, OKX, Bitget, Coinbase, Trust, Magic Eden, Glow, Exodus and others)
   2) Older injected providers, for wallets that don't register through the standard yet */
const stdWallets = [];
(function initWalletStandard() {
  const reg = { register: (...ws) => { for (const w of ws) if (!stdWallets.includes(w)) stdWallets.push(w); if (S.modal?.type === 'wallet') renderLayer(); return () => {}; } };
  try { window.addEventListener('wallet-standard:register-wallet', e => { try { e.detail(reg); } catch {} }); window.dispatchEvent(new CustomEvent('wallet-standard:app-ready', { detail: reg })); } catch {}
})();
const LEGACY = [
  ['phantom', 'Phantom', () => window.phantom?.solana?.isPhantom && window.phantom.solana],
  ['solflare', 'Solflare', () => window.solflare?.isSolflare && window.solflare],
  ['backpack', 'Backpack', () => window.backpack?.signMessage && window.backpack],
  ['okx', 'OKX Wallet', () => window.okxwallet?.solana],
  ['bitget', 'Bitget Wallet', () => window.bitkeep?.solana],
  ['coinbase', 'Coinbase Wallet', () => window.coinbaseSolana],
  ['trust', 'Trust Wallet', () => window.trustwallet?.solana],
  ['magiceden', 'Magic Eden', () => window.magicEden?.solana],
  ['glow', 'Glow', () => window.glowSolana],
  ['exodus', 'Exodus', () => window.exodus?.solana],
];
const slug = n => String(n).toLowerCase().replace(/wallet|[^a-z0-9]/g, '');
function walletProviders() {
  const list = []; const seen = new Set();
  for (const w of stdWallets) {
    const f = w.features || {};
    if (!f['standard:connect'] || !f['solana:signMessage'] || !(w.chains || []).some(c => String(c).startsWith('solana:'))) continue;
    const k = slug(w.name); if (seen.has(k)) continue; seen.add(k);
    list.push({ key: 'std:' + k, name: w.name, icon: w.icon, kind: 'std', w });
  }
  for (const [k, name, get] of LEGACY) { let p = null; try { p = get(); } catch {} if (!p || seen.has(slug(name))) continue; seen.add(slug(name)); list.push({ key: 'legacy:' + k, name, kind: 'legacy', p }); }
  if (!list.length && window.solana?.signMessage) list.push({ key: 'legacy:solana', name: 'Solana wallet', kind: 'legacy', p: window.solana });
  return list;
}
async function walletConnect(prov) {
  if (prov.kind === 'std') { const r = await prov.w.features['standard:connect'].connect(); const acc = (r?.accounts || prov.w.accounts || []).find(a => (a.chains || ['solana:']).some(c => String(c).startsWith('solana:'))) || (r?.accounts || prov.w.accounts || [])[0]; if (!acc) throw new Error('The wallet did not share an address.'); prov.account = acc; return acc.address; }
  const r = await prov.p.connect(); const pk = r?.publicKey || prov.p.publicKey; if (!pk) throw new Error('The wallet did not share an address.'); return pk.toBase58 ? pk.toBase58() : pk.toString();
}
async function walletSign(prov, bytes) {
  if (prov.kind === 'std') { const out = await prov.w.features['solana:signMessage'].signMessage({ account: prov.account, message: bytes }); const o = Array.isArray(out) ? out[0] : out; return o?.signature; }
  const r = await prov.p.signMessage(bytes, 'utf8'); return r?.signature || r;
}
async function walletDisconnect(prov) { try { if (prov.kind === 'std') await prov.w.features['standard:disconnect']?.disconnect(); else await prov.p.disconnect?.(); } catch {} }
const MOBILE_WALLETS = [
  ['Phantom', u => `https://phantom.app/ul/browse/${encodeURIComponent(u)}?ref=${encodeURIComponent(location.origin)}`],
  ['Solflare', u => `https://solflare.com/ul/v1/browse/${encodeURIComponent(u)}?ref=${encodeURIComponent(location.origin)}`],
  ['OKX Wallet', u => `https://web3.okx.com/download?deeplink=${encodeURIComponent('okx://wallet/dapp/url?dappUrl=' + encodeURIComponent(u))}`],
  ['Backpack', u => `https://backpack.app/ul/v1/browse/${encodeURIComponent(u)}?ref=${encodeURIComponent(location.origin)}`],
  ['Bitget Wallet', u => `https://bkcode.vip?action=dapp&url=${encodeURIComponent(u)}`],
];
window.__bsaWalletIc = ic('wallet');
const walletIcon = p => p.icon && /^data:image\/(svg\+xml|png|webp|jpeg)/.test(p.icon) ? `<img src="${esc(p.icon)}" alt="" width="28" height="28" style="border-radius:8px;flex:none" onerror="this.replaceWith(document.createRange().createContextualFragment(window.__bsaWalletIc))">` : ic('wallet');
function renderLayer() {
  const m = S.modal; const L = $('#layer'); if (!m) { L.innerHTML = ''; return; }
  let html = '';
  if (m.type === 'wallet') {
    const provs = walletProviders(); const W = S.wallet;
    const here = encodeURIComponent(location.href), origin = encodeURIComponent(location.origin);
    const why = { save: ['Save your agent', 'Your agents, test history and rewards are stored in your wallet account, so you can come back to them on any device.'], test: ['Connect to run a test', 'Test runs use the live AI model and are saved to your wallet account with the agent.'], try: ['Connect to run this agent', 'Runs use the live AI model and are saved to your task history.'], publish: ['Connect to publish', 'Your wallet identifies you as the creator and receives any rewards your agent earns.'] }[m.reason] || ['Connect a Solana wallet', 'Your wallet identifies you as a creator, saves your agents and receives rewards.'];
    html = dialog({ title: why[0], eyebrowTxt: 'Solana wallet', body: `
      <p>${why[1]} You'll sign a short message to prove you own the wallet. Signing is free and doesn't send a transaction.</p>
      ${W.status === 'error' ? `<div class="note note-bad" role="alert">${ic('alert')}<span>${esc(W.error)}</span></div>` : ''}
      ${W.status === 'connecting' ? `<div class="note" role="status"><span class="spin"></span><span>${esc(W.step || 'Waiting for your wallet…')}</span></div>` : ''}
      ${provs.length ? `<p class="hint">Wallets found in this browser:</p>` + provs.map(p => `<button class="wopt" data-act="wallet-connect" data-v="${esc(p.key)}" ${W.status === 'connecting' ? 'aria-disabled="true"' : ''}>${walletIcon(p)}<span><b>${esc(p.name)}</b><span class="tag">Detected</span></span>${ic('arrowR')}</button>`).join('') : `<div class="note">${ic('info')}<span>No Solana wallet was found in this browser. On a computer, install a wallet extension such as Phantom, OKX Wallet, Solflare or Backpack, then reload this page.</span></div>`}
      <details class="how"><summary>${provs.length ? 'Using a phone? Open in your wallet app' : 'On a phone? Open this page in your wallet app'}</summary><div class="block tight" style="padding-bottom:14px">${MOBILE_WALLETS.map(([n, f]) => `<a class="wopt" href="${esc(f(location.href))}" rel="noopener">${ic('wallet')}<span><b>Open in ${n}</b><span>Opens this page in the ${n} in-app browser</span></span>${ic('arrowR')}</a>`).join('')}</div></details>
      ${!signedIn() && cur() && (cur().goal || cur().name) ? `<p class="hint">Your current draft${cur().name ? ` “${esc(cur().name)}”` : ''} will be saved to your account as soon as you sign in.</p>` : ''}`,
      foot: m.reason === 'save' ? `<button class="btn btn-ghost" data-act="modal-close">Keep editing without saving</button>` : '' });
  } else if (m.type === 'setup') {
    const st = S.status || {}; const row = (ok, t, d) => `<li><span class="ck ${ok ? 'yes' : 'no'}">${ok ? ic('check') : ''}</span><div><b>${t}</b><p>${d}</p></div></li>`;
    html = dialog({ wide: true, title: 'Service status', eyebrowTxt: 'Live services', body: `<ul class="setup-list">
      ${row(st.db, 'Database', st.db ? 'Connected. Agents, runs and rewards are stored.' : 'Not connected. Add Neon Postgres to the Vercel project (Storage → Neon), which sets <code>DATABASE_URL</code>, then redeploy.')}
      ${row(st.ai, 'AI provider', st.ai ? `Connected · ${esc(st.model)}` : 'Not connected. Add <code>GROQ_API_KEY</code> (or <code>ANTHROPIC_API_KEY</code>) in Vercel → Settings → Environment Variables, then redeploy.')}
      ${row(st.session !== false, 'Sessions', 'Signed session cookies use <code>SESSION_SECRET</code>.')}
      ${row(st.claims, 'Claim program', st.claims ? 'Configured.' : 'Not deployed yet. Claims stay closed until a Solana claim program is connected.')}</ul>` });
  } else if (m.type === 'leave') {
    html = dialog({ title: 'Leave with unsaved changes?', body: `<p>${uploadingAny() ? 'A file is still uploading. Leaving now cancels it.' : `Your latest changes couldn't be saved${S.save.error ? `: ${esc(S.save.error)}` : '.'} They stay in this tab, but will be lost if you close it.`}</p>`,
      foot: `<button class="btn btn-ghost" data-act="leave-anyway">Leave anyway</button><button class="btn" data-act="modal-close">Stay</button>${S.save.status === 'error' ? `<button class="btn btn-primary" data-act="save-retry-leave">${ic('refresh')} Retry save</button>` : ''}` });
  } else if (m.type === 'step') {
    const d = m.draft; const a = cur(); const idx = a.steps.findIndex(s => s.id === m.id); const enabled = TOOLS.filter(t => a.tools[t.key] && (t.key === 'search' || t.key === 'browse'));
    html = dialog({ sheet: true, eyebrowTxt: `Step ${idx + 1} settings`, title: esc(d.title || 'Untitled step'), body: `
      <div class="field"><label for="sh-title">Title</label><input id="sh-title" data-sheet="title" value="${esc(d.title)}" maxlength="60" ${m.err ? 'aria-invalid="true" aria-describedby="sh-err"' : ''}>${m.err ? `<p class="err" id="sh-err">${ic('alert')}<span>${esc(m.err)}</span></p>` : ''}</div>
      <div class="field"><label for="sh-desc">Description</label><textarea id="sh-desc" data-sheet="desc" data-grow rows="2" maxlength="160">${esc(d.desc)}</textarea></div>
      <div class="field"><label for="sh-instr">Step instructions <span class="muted">(optional)</span></label><textarea id="sh-instr" data-sheet="instructions" data-grow rows="3" maxlength="800" placeholder="Extra guidance for this step only">${esc(d.instructions)}</textarea></div>
      <div class="field"><label for="sh-tool">Web access for this step</label><select id="sh-tool" data-sheet="tool"><option value="auto">Automatic (search steps only)</option>${enabled.length ? '<option value="search" ' + (d.tool === 'search' ? 'selected' : '') + '>Always search the web</option>' : ''}<option value="none" ${d.tool === 'none' ? 'selected' : ''}>No web access</option></select><span class="hint">${enabled.length ? 'Web search is on for this agent.' : 'Turn on Web search in Tools to let steps search.'}</span></div>
      <fieldset><legend class="lbl-strong" style="margin-bottom:8px">If this step fails</legend><div class="radios">${[['stop', 'Stop the run', 'Show the error and wait for you.'], ['retry', 'Retry once', 'Try the step one more time before stopping.'], ['skip', 'Skip and continue', 'Move on without this result. The final step never skips.']].map(([k, l, s]) => `<label class="radio" for="sh-f-${k}"><input type="radio" name="shf" id="sh-f-${k}" data-sheet="onFail" value="${k}" ${d.onFail === k ? 'checked' : ''}><span><b>${l}</b><span>${s}</span></span></label>`).join('')}</div></fieldset>`,
      foot: `<button class="btn" data-act="modal-close">Cancel</button><button class="btn btn-primary" data-act="sheet-save">Save step</button>` });
  } else if (m.type === 'delete') {
    const a = S.agents.find(x => x.id === m.id);
    html = dialog({ title: `Delete ${esc(a?.name || 'this draft')}?`, body: `<p>The draft, its settings and attached files are deleted. Test history stays in Activity. This can't be undone.</p>${m.error ? `<div class="note note-bad" role="alert">${ic('alert')}<span>${esc(m.error)}</span></div>` : ''}`,
      foot: `<button class="btn" data-act="modal-close">Keep draft</button><button class="btn btn-danger" data-act="agent-delete-confirm" data-id="${m.id}" ${m.busy ? 'aria-disabled="true"' : ''}>${m.busy ? '<span class="spin"></span>' : ''}Delete draft</button>` });
  } else if (m.type === 'perm') {
    const d = S.listing.agent;
    html = dialog({ title: `Allow ${esc(d.name)} to:`, eyebrowTxt: 'Before your first run', body: `<ul class="perm-list">${d.tools.map(k => PERM[k] ? `<li>${ic('shield')}<div><b>${PERM[k].title}</b><p>${PERM[k].explain}</p></div></li>` : '').join('')}<li>${ic('info')}<div><b>Process your task with the AI provider</b><p>Your task and its result are saved to your run history.</p></div></li></ul><p class="hint">You can review these on the agent's page at any time.</p>`,
      foot: `<button class="btn" data-act="modal-close">Not now</button><button class="btn btn-primary" data-act="perm-allow" data-id="${d.id}">Allow and run</button>` });
  }
  L.innerHTML = html; $$('textarea[data-grow]', L).forEach(grow);
  if (!S.modalFocused) { S.modalFocused = true; const dlg = $('.dialog', L); const first = $('#sh-title', dlg) || $$('button:not([disabled]):not([aria-disabled="true"]),a[href],input,select,textarea', $('.m-body', dlg))[0] || $('[data-act="modal-close"]', dlg); requestAnimationFrame(() => first?.focus({ preventScroll: true })); }
}
function openModal(m, opener) { S.modal = m; S.modalFocused = false; S.modalReturn = opener ? (opener.id ? { id: opener.id } : { act: opener.dataset.act, did: opener.dataset.id || '', v: opener.dataset.v || '' }) : null; S.menu = null; render(); }
function closeModal() { const r = S.modalReturn; S.modal = null; S.modalReturn = null; if (S.wallet.status === 'error') S.wallet = { status: 'idle', error: null }; render(); restoreFocus(r); }

/* =====================================================================
   Actions
   ===================================================================== */
function parseRoute(h) { h = (h || '').replace(/^#/, ''); if (h.startsWith('agent-')) return ['agent', h.slice(6)]; return [['studio', 'discover', 'agents', 'activity', 'rewards', 'new'].includes(h) ? h : 'studio', null]; }
const uploadingAny = () => S.agents.some(a => a.files.some(f => f.status === 'uploading'));
let navLock = false;
async function navigate(hash, { fromHash = false } = {}) {
  const [r, p] = parseRoute(hash);
  if (r === 'new') { if (fromHash) history.replaceState(null, '', '#studio'); await startNewAgent(); return; }
  const full = r === 'agent' ? 'agent-' + p : r;
  if (full === S.routeFull && !fromHash) return;
  if (S.route === 'studio' && r !== 'studio') {
    if (S.save.status === 'pending') await doSave();
    if (S.save.status === 'error' || uploadingAny()) { if (fromHash) history.replaceState(null, '', '#' + S.routeFull); S.pendingNav = full; openModal({ type: 'leave' }); return; }
  }
  applyRoute(r, p, full);
}
function applyRoute(r, p, full) {
  const changed = full !== S.routeFull;
  S.route = r; S.param = p; S.routeFull = full; S.menu = null; S.routeChanged = changed; S.editingStep = null;
  if (location.hash.slice(1) !== full) { navLock = true; location.hash = full; }
  if (r === 'discover') loadDirectory(); if (r === 'agent') loadListing(p); if (r === 'rewards' || r === 'agents' || r === 'activity') refreshQuiet();
  render();
  if (changed) { $('#main').scrollTop = 0; window.scrollTo(0, 0); $('#main').focus({ preventScroll: true }); }
}
async function refreshQuiet() { try { await loadMe(); render(); } catch {} }
async function loadDirectory() { S.dir.loading = true; S.dir.error = null; render(); try { const j = await api('directory'); S.dir.items = j.agents; } catch (e) { S.dir.error = e.message; } S.dir.loading = false; if (S.route === 'discover') render(); }
async function loadListing(id) {
  S.listing = { loading: true, error: null, agent: null }; render();
  try { const j = await api('directory/' + id); S.listing = { loading: false, error: null, agent: j.agent }; for (const r of j.runs) if (!S.runs.some(x => x.id === r.id)) S.runs.push(r); S.runs.sort((a, b) => a.startedAt - b.startedAt); }
  catch (e) { S.listing = { loading: false, error: e.message, agent: null }; }
  if (S.route === 'agent') render();
}
async function startNewAgent() {
  const c = cur();
  if (c && c.status === 'draft' && !c.goal && !c.name && !c.steps.length) { c.stage = 0; applyRoute('studio', null, 'studio'); setTimeout(() => $('#f-goal')?.focus(), 30); return; }
  if (S.save.status === 'pending') await doSave();
  const a = newAgent(); S.agents.push(a); setCurrent(a.id); S.errors = {}; S.showErrors = false; S.mobileView = 'build'; S.publishError = null; S.save = { status: 'saved', at: null, error: null };
  if (S.route !== 'studio') applyRoute('studio', null, 'studio'); else { S.stageChanged = true; render(); if (location.hash !== '#studio') { navLock = true; location.hash = 'studio'; } }
  if (c && (c.goal || c.name)) toast(`Started a new agent. “${c.name || 'Untitled agent'}” is saved in My agents.`);
  setTimeout(() => $('#f-goal')?.focus(), 40);
}
function goStage(n) {
  const a = cur(); if (n === a.stage) return true;
  if (n > a.stage) for (let i = 0; i < n; i++) {
    const e = stageErrors(a, i);
    if (Object.keys(e).length) { const flip = i !== a.stage ? captureFlip() : null; if (i !== a.stage) { a.stage = i; S.stageChanged = true; }
      S.errors = e; S.showErrors = true; S.mobileView = 'build'; render(flip); focusFirstError();
      toast(`Finish ${STAGES[i]} first: ${Object.keys(e).length === 1 ? Object.values(e)[0] : plural(Object.keys(e).length, 'item') + ' need attention.'}`, { tone: 'bad' }); return false; }
  }
  if (!signedIn() && n >= 1 && !S.promptedSave && !S.setup) { S.promptedSave = true; setTimeout(() => openModal({ type: 'wallet', reason: 'save' }), 360); }
  const flip = captureFlip(); a.stage = n; a.maxStage = Math.max(a.maxStage, n); S.errors = {}; S.showErrors = false; S.stageChanged = true; S.editingStep = null; S.menu = null; S.publishError = null; S.mobileView = 'build';
  markDirty(); render(flip); $('#main').scrollTo({ top: 0 }); if (isPhone()) window.scrollTo(0, 0); return true;
}
function draftSteps(fromStarter) {
  const a = cur(); const g = a.goal.trim();
  if (g.length < 12) { S.errors = { goal: g ? 'Add a little more detail (at least 12 characters).' : 'Describe what your agent should do.' }; S.showErrors = true; render(); $('#f-goal')?.focus(); return; }
  const prev = a.steps.slice(), prevNote = a.plannerNote, prevTpl = a.template; const r = planSteps(g);
  a.steps = r.steps; a.plannerNote = r.note; a.template = r.key || a.template; const t = r.key && TEMPLATES[r.key];
  if (t) { if (!a.name) a.name = t.name; if (!a.category) a.category = t.category; if (!a.instructions) a.instructions = t.instructions; if (!fromStarter && !a.toolsTouched) a.tools = { ...t.tools }; }
  if (S.showErrors) { delete S.errors.goal; delete S.errors.steps; }
  pulse('blink'); markDirty(); render();
  if (prev.length) toast(`Steps redrafted (${plural(a.steps.length, 'step')}).`, { action: { label: 'Undo', fn: () => { a.steps = prev; a.plannerNote = prevNote; a.template = prevTpl; markDirty(); render(); } } });
}
function moveStep(id, dir) {
  const a = cur(); const i = a.steps.findIndex(s => s.id === id); const j = i + dir; if (i < 0 || j < 0 || j >= a.steps.length) return;
  const flip = captureStepFlip(); [a.steps[i], a.steps[j]] = [a.steps[j], a.steps[i]]; markDirty(); render(); playStepFlip(flip);
  const btn = document.querySelector(`[data-act="step-${dir < 0 ? 'up' : 'down'}"][data-id="${id}"]`); (btn && !btn.disabled ? btn : document.querySelector(`[data-act="step-${dir < 0 ? 'down' : 'up'}"][data-id="${id}"]`))?.focus();
  announce(`Moved to position ${j + 1} of ${a.steps.length}`);
}
function captureStepFlip() { const m = new Map(); $$('.step-item').forEach(el => m.set(el.dataset.stepId, el.getBoundingClientRect().top)); return m; }
function playStepFlip(m) { if (reduceMotion()) return; $$('.step-item').forEach(el => { const t = m.get(el.dataset.stepId); if (t == null) return; const d = t - el.getBoundingClientRect().top; if (Math.abs(d) > 1) el.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)' }); }); }

/* ---------- Runs (Server-Sent Events over fetch) ---------- */
async function startRun(key, agentId, input) {
  if (S.run) { toast('A run is already in progress. Cancel it or wait for it to finish.'); return; }
  const ctrl = new AbortController(); S.run = { key, agentId, rec: null, controller: ctrl, input }; S.runError[key] = null; S.chat[key] = '';
  if (isPhone() && key === 'studio') S.mobileView = 'preview';
  pulse('think'); render(null, { stick: true });
  let rec = null, ended = false;
  try {
    const resp = await fetch('/api/run', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', signal: ctrl.signal, body: JSON.stringify(key === 'studio' ? { agentId, input } : { listingId: agentId, input }) });
    if (!resp.ok) { let j = null; try { j = await resp.json(); } catch {} throw Object.assign(new Error(j?.error || `The run could not start (${resp.status}).`), { pre: true, status: resp.status }); }
    const reader = resp.body.getReader(); const dec = new TextDecoder(); let buf = ''; let lastStep = -1;
    while (true) {
      const { value, done } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true });
      let k; while ((k = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, k); buf = buf.slice(k + 2); const line = chunk.split('\n').find(l => l.startsWith('data: ')); if (!line) continue;
        let ev; try { ev = JSON.parse(line.slice(6)); } catch { continue; }
        if (ev.type === 'start') { rec = { ...ev.run, endedAt: null, output: null, error: null }; S.runs.push(rec); S.run.rec = rec; S.selectedRun[key] = rec.id; }
        else if (ev.type === 'step' && rec) { rec.steps[ev.i] = ev.step; if (ev.step.status === 'running' && ev.i !== lastStep) { lastStep = ev.i; announce(`Step ${ev.i + 1} of ${rec.steps.length}: ${ev.step.title}`); } }
        else if (ev.type === 'end' && rec) { Object.assign(rec, ev.run); ended = true; }
        render(null, { stick: true });
      }
    }
    if (rec && !ended) { rec.status = 'failed'; rec.error = 'The connection closed before the run finished. Check Activity in a moment for the final result.'; rec.endedAt = Date.now(); }
  } catch (e) {
    if (e.name === 'AbortError') { if (rec) { rec.status = 'cancelled'; rec.endedAt = Date.now(); rec.steps.forEach(s => { if (s.status === 'running') s.status = 'cancelled'; else if (s.status === 'queued') s.status = 'skipped'; }); } toast('Run cancelled.'); }
    else if (e.pre || !rec) { S.runError[key] = { msg: e.message, wallet: e.status === 403 && key === 'dir' }; S.chat[key] = input; }
    else { rec.status = 'failed'; rec.error = e.message; rec.endedAt = Date.now(); }
  }
  S.run = null;
  if (rec?.status === 'completed') { pulse('happy'); toast(key === 'studio' ? 'Test completed' : 'Run completed', { tone: 'good' }); }
  else if (rec?.status === 'failed') { pulse('concern'); announce('Run failed. ' + (rec.error || '')); }
  render(null, { stick: true });
}
async function requestRun(key) {
  const input = (S.chat[key] || '').trim();
  if (!S.status?.ai) { S.runError[key] = { msg: 'Test runs are off until the AI provider key is added. See Service status.' }; render(); return; }
  if (!signedIn()) { S.chat[key] = S.chat[key] || ''; openModal({ type: 'wallet', reason: key === 'studio' ? 'test' : 'try', then: 'run:' + key }); return; }
  if (key === 'studio') {
    const a = cur(); const e0 = validateDefine(a), e1 = validateConfigure(a);
    if (Object.keys(e0).length || Object.keys(e1).length) { const fix = Object.keys(e0).length ? 0 : 1; const list = Object.values(fix === 0 ? e0 : e1); S.runError.studio = { msg: `Finish ${STAGES[fix]} before testing: ${list[0]}${list.length > 1 ? ` (+${list.length - 1} more)` : ''}`, fix }; render(); return; }
    if (input.length < 3) { S.runError.studio = { msg: 'Describe a sample task (at least 3 characters), or pick one from the list.' }; render(); $('#in-studio')?.focus(); return; }
    if (!(await flushSave())) { S.runError.studio = { msg: `Your latest changes aren't saved, so the test can't use them. ${S.save.error || ''}` }; render(); return; }
    startRun('studio', a.id, input);
  } else {
    const d = S.listing.agent; if (!d) return;
    if (input.length < 3) { S.runError.dir = { msg: 'Describe your task (at least 3 characters).' }; render(); $('#in-dir')?.focus(); return; }
    if (d.access === 'wallet' && !S.user?.wallet) { S.runError.dir = { msg: 'This agent requires a connected wallet before the first run.', wallet: true }; render(); return; }
    if (!allowed(d.id) && !d.mine) { openModal({ type: 'perm' }); return; }
    startRun('dir', d.id, input);
  }
}

/* ---------- Uploads ---------- */
const ALLOWED = ['pdf', 'txt', 'md', 'csv', 'docx']; const fileObjects = new Map(); const uploads = new Map();
const LIBS = { pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js', docx: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js' };
const loaded = {};
function loadScript(src) { return loaded[src] || (loaded[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { delete loaded[src]; rej(new Error('Could not load the file reader. Check your connection and retry.')); }; document.head.appendChild(s); })); }
async function extractText(file, ext, onProgress) {
  if (['txt', 'md', 'csv'].includes(ext)) { const t = await file.text(); onProgress(100); return t; }
  if (ext === 'pdf') {
    await loadScript(LIBS.pdf); window.pdfjsLib.GlobalWorkerOptions.workerSrc = LIBS.pdfWorker;
    const doc = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise; let out = '';
    for (let i = 1; i <= doc.numPages; i++) { const pg = await doc.getPage(i); const c = await pg.getTextContent(); out += c.items.map(x => x.str).join(' ') + '\n\n'; onProgress(i / doc.numPages * 100); }
    return out;
  }
  if (ext === 'docx') { await loadScript(LIBS.docx); const r = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() }); onProgress(100); return r.value; }
  throw new Error('Unsupported file type.');
}
function postWithProgress(body, onProgress, signal) {
  return new Promise((res, rej) => {
    const x = new XMLHttpRequest(); x.open('POST', '/api/files'); x.setRequestHeader('content-type', 'application/json');
    x.upload.onprogress = e => { if (e.lengthComputable) onProgress(e.loaded / e.total * 100); };
    x.onload = () => { let j = null; try { j = JSON.parse(x.responseText); } catch {} x.status < 300 ? res(j) : rej(new Error(j?.error || `Upload failed (${x.status}).`)); };
    x.onerror = () => rej(new Error('The upload was interrupted. Check your connection and retry.'));
    x.onabort = () => rej(new DOMException('Aborted', 'AbortError'));
    signal.addEventListener('abort', () => x.abort(), { once: true }); x.send(JSON.stringify(body));
  });
}
async function addFiles(list) {
  const a = cur(); let added = 0;
  for (const file of list) {
    if (a.files.length >= 5) { toast('You can attach up to 5 files. Remove one to add another.', { tone: 'bad' }); break; }
    const ext = file.name.split('.').pop().toLowerCase(); const id = 'tmp' + uid(8);
    const f = { id, name: file.name, size: file.size, status: 'uploading', phase: 'reading', progress: 0, error: null, retryable: true };
    if (!ALLOWED.includes(ext)) Object.assign(f, { status: 'error', error: `.${ext} files aren't supported. Use PDF, TXT, MD, CSV or DOCX.`, retryable: false });
    else if (file.size > 10 * 1048576) Object.assign(f, { status: 'error', error: `This file is ${fmtSize(file.size)}. The limit is 10 MB.`, retryable: false });
    else if (file.size === 0) Object.assign(f, { status: 'error', error: 'This file is empty.', retryable: false });
    a.files.push(f); fileObjects.set(id, file); added++;
  }
  if (added && !a.tools.knowledge && a.files.some(f => f.status !== 'error')) { a.tools.knowledge = true; markDirty(); toast('Knowledge files tool turned on so the agent can read them.'); }
  render();
  for (const f of a.files.filter(x => x.status === 'uploading' && !uploads.has(x.id))) runUpload(a, f);
}
async function runUpload(a, f) {
  const ctrl = new AbortController(); uploads.set(f.id, ctrl); Object.assign(f, { status: 'uploading', phase: 'reading', progress: 0, error: null }); render();
  try {
    if (!signedIn()) throw Object.assign(new Error('Connect your wallet to attach files. Files are stored with your agent in your account.'), { needWallet: true });
    if (!(await flushSave())) throw new Error("The agent couldn't be saved, so the file can't be attached yet.");
    const file = fileObjects.get(f.id); const ext = file.name.split('.').pop().toLowerCase();
    const text = await extractText(file, ext, p => { f.progress = p; updateFileRow(f); });
    if (ctrl.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!text.trim()) throw Object.assign(new Error(ext === 'pdf' ? 'No text found. This looks like a scanned PDF without a text layer.' : 'No readable text was found in this file.'), { final: true });
    f.phase = 'uploading'; f.progress = 0; updateFileRow(f);
    const r = await postWithProgress({ agentId: a.id, name: file.name, size: file.size, ext, text }, p => { f.progress = p; updateFileRow(f); }, ctrl.signal);
    fileObjects.delete(f.id); Object.assign(f, { id: r.id, status: 'done', progress: 100 });
  } catch (e) {
    if (e.name === 'AbortError') { a.files = a.files.filter(x => x.id !== f.id); toast(`Upload of “${f.name}” cancelled.`); }
    else Object.assign(f, { status: 'error', error: e.message, retryable: !e.final, needWallet: !!e.needWallet });
  }
  uploads.delete(f.id); liveValidate(); render();
}
function updateFileRow(f) { const el = document.querySelector(`[data-file-id="${f.id}"]`); if (!el) return render(); const p = $('.prog', el); if (p) { p.setAttribute('aria-valuenow', Math.round(f.progress)); $('span', p).style.width = f.progress + '%'; } const t = $('.small', el); if (t) t.textContent = `${f.phase === 'reading' ? 'Extracting text' : 'Uploading'} ${Math.round(f.progress)}%`; }

/* ---------- Publish ---------- */
async function publish() {
  const a = cur(); if (S.publishing) return;
  if (Object.keys({ ...validateDefine(a), ...validateConfigure(a) }).length) { goStage(3); return; }
  if (!signedIn()) { openModal({ type: 'wallet', reason: 'publish', then: 'publish' }); return; }
  const e = validatePublish(a); if (Object.keys(e).length) { S.errors = e; S.showErrors = true; render(); focusFirstError(); return; }
  S.publishing = true; S.publishError = null; render();
  try {
    if (!(await flushSave())) throw new Error(`Your latest changes couldn't be saved. ${S.save.error || ''}`);
    const r = await api(`agents/${a.id}/publish`, { method: 'POST' }); const first = a.status === 'draft';
    Object.assign(a, { status: r.status, publishedAt: r.publishedAt, updatedAt: r.updatedAt, maxStage: 3 });
    pulse('happy'); toast(`${a.name} ${first ? 'is live' : 'updated'}.${r.reward ? ' Creation reward recorded for review.' : ''}`, { tone: 'good' });
    refreshQuiet();
  } catch (err) { S.publishError = err.message; pulse('concern'); }
  S.publishing = false; render(); $('#main').scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
}

/* ---------- Wallet ---------- */
function b64(u8) { let s = ''; for (const b of u8) s += String.fromCharCode(b); return btoa(s); }
async function connectWallet(key) {
  const prov = walletProviders().find(p => p.key === key); if (!prov || S.wallet.status === 'connecting') return;
  S.wallet = { status: 'connecting', step: `Approve the connection in ${prov.name}…` }; render();
  try {
    const address = await walletConnect(prov);
    const { message, token } = await api('auth/nonce', { method: 'POST', body: { address } });
    S.wallet.step = `Sign the message in ${prov.name}. It's free and sends no transaction.`; render();
    const sig = await walletSign(prov, new TextEncoder().encode(message));
    if (!sig || !sig.length) throw new Error('The wallet did not return a signature.');
    await api('auth/verify', { method: 'POST', body: { address, message, signature: b64(new Uint8Array(sig)), token } });
    const local = cur(); const hadLocal = local && !local.persisted && (local.goal || local.name || local.steps.length);
    S.user = { wallet: address };
    if (hadLocal) { S.wallet.step = 'Saving your agent to your account…'; render(); S.save.status = 'pending'; await doSave(); if (S.save.status !== 'error') clearLocal(); }
    const then = S.modal?.then;
    await loadMe(); S.wallet = { status: 'idle', error: null }; S.modal = null; pulse('happy');
    toast(hadLocal && S.save.status !== 'error' ? `Signed in as ${shortAddr(address)}. Your agent is saved to your account.` : `Signed in as ${shortAddr(address)}.`, { tone: 'good' }); liveValidate(); render();
    if (then?.startsWith('run:')) requestRun(then.slice(4));
    if (then === 'publish') publish();
    for (const f of (cur()?.files || []).filter(x => x.status === 'error' && x.needWallet)) runUpload(cur(), f);
  } catch (e) {
    const declined = e?.code === 4001 || /reject|declin|cancel|denied/i.test(e?.message || '');
    S.wallet = { status: 'error', error: declined ? 'You declined the request in your wallet. Try again when you are ready.' : (e?.message || 'The wallet connection failed.') }; render();
  }
}
async function signOut() {
  if (S.save.status === 'pending') await doSave();
  try { await api('auth/logout', { method: 'POST' }); for (const p of walletProviders()) await walletDisconnect(p); S.agents = []; S.currentId = null; S.user = null; clearLocal(); await loadMe({ keepCurrent: false }); toast('Signed out. Connect a wallet to keep working on your agents.'); }
  catch (e) { toast(e.message, { tone: 'bad' }); }
  S.menu = null; render();
}

/* =====================================================================
   Events
   ===================================================================== */
const H = {
  'retry-boot': () => boot(),
  stage: el => { if (S.route !== 'studio') applyRoute('studio', null, 'studio'); goStage(+el.dataset.v); },
  back: () => goStage(cur().stage - 1),
  continue: () => { const a = cur(); if (a.stage < 3) goStage(a.stage + 1); else isLivePub(a) ? navigate('agents') : publish(); },
  'test-agent': () => {
    const a = cur(); if (a.stage < 2 && !goStage(2)) return;
    if (a.stage === 2 && (S.chat.studio || '').trim().length >= 3) { requestRun('studio'); return; }
    const samples = (a.template && TEMPLATES[a.template]?.samples) || GENERIC_SAMPLES; if (a.stage === 2 && !(S.chat.studio || '').trim()) S.chat.studio = samples[0];
    if (isPhone()) S.mobileView = 'preview'; render(); $('#in-studio')?.focus();
  },
  starter: el => { const a = cur(); const t = TEMPLATES[el.dataset.v]; const prevGoal = a.goal; a.goal = t.goal; a.template = el.dataset.v; a.tools = { ...t.tools };
    if (!a.name || Object.values(TEMPLATES).some(x => x.name === a.name)) a.name = t.name; if (!a.category || Object.values(TEMPLATES).some(x => x.category === a.category)) a.category = t.category;
    if (!a.instructions || Object.values(TEMPLATES).some(x => x.instructions === a.instructions)) a.instructions = t.instructions;
    draftSteps(true); if (prevGoal && prevGoal !== t.goal) toast('Goal replaced with the template.', { action: { label: 'Undo goal', fn: () => { a.goal = prevGoal; markDirty(); render(); } } }); },
  'edit-define': () => { goStage(0); setTimeout(() => $('#f-goal')?.focus({ preventScroll: true }), 20); },
  'use-instructions': () => { const a = cur(); const prev = a.instructions; a.instructions = TEMPLATES[a.template].instructions; markDirty(); liveValidate(); render(); if (prev) toast('Instructions replaced.', { action: { label: 'Undo', fn: () => { a.instructions = prev; markDirty(); render(); } } }); },
  'add-step': () => { const a = cur(); if (a.steps.length >= 12) { toast('An agent can have up to 12 steps.', { tone: 'bad' }); return; } const s = mkStep({ kind: 'act' }); a.steps.push(s); S.editingStep = s.id; S.editSnap = { ...s, isNew: true }; markDirty(); render(); const el = $('#se-title-' + s.id); el?.focus(); el?.scrollIntoView({ block: 'center' }); },
  'step-up': el => moveStep(el.dataset.id, -1), 'step-down': el => moveStep(el.dataset.id, 1),
  'step-menu': el => { S.menu = S.menu === 'step:' + el.dataset.id ? null : 'step:' + el.dataset.id; render(); if (S.menu) $('.step-acts .menu button')?.focus(); },
  'step-edit': el => { const s = cur().steps.find(x => x.id === el.dataset.id); S.editingStep = s.id; S.editSnap = { ...s }; S.menu = null; render(); $('#se-title-' + s.id)?.focus(); },
  'step-edit-done': el => { const s = cur().steps.find(x => x.id === el.dataset.id); if (!s.title.trim()) { $('#se-title-' + s.id)?.setAttribute('aria-invalid', 'true'); $('#se-title-' + s.id)?.focus(); toast('Give the step a title, or cancel.', { tone: 'bad' }); return; } S.editingStep = null; S.editSnap = null; liveValidate(); render(); $(`[data-act="step-settings"][data-id="${s.id}"]`)?.focus(); },
  'step-edit-cancel': el => cancelInlineEdit(el.dataset.id),
  'step-settings': el => { const s = cur().steps.find(x => x.id === el.dataset.id); openModal({ type: 'step', id: s.id, draft: { title: s.title, desc: s.desc, ...s.settings } }, $(`[data-act="step-settings"][data-id="${s.id}"]`) || el); },
  'step-dup': el => { const a = cur(); if (a.steps.length >= 12) { toast('An agent can have up to 12 steps.', { tone: 'bad' }); return; } const i = a.steps.findIndex(x => x.id === el.dataset.id); a.steps.splice(i + 1, 0, { ...a.steps[i], id: uid(10), title: (a.steps[i].title + ' (copy)').slice(0, 60), settings: { ...a.steps[i].settings } }); S.menu = null; markDirty(); render(); toast('Step duplicated.'); },
  'step-remove': el => { const a = cur(); const i = a.steps.findIndex(x => x.id === el.dataset.id); const [s] = a.steps.splice(i, 1); S.menu = null; markDirty(); render(); toast(`Removed “${s.title || 'Untitled step'}”.`, { action: { label: 'Undo', fn: () => { a.steps.splice(i, 0, s); markDirty(); render(); } } }); $('#add-step')?.focus(); },
  'sheet-save': () => { const m = S.modal; const d = m.draft; if (!d.title.trim()) { m.err = 'A step needs a title.'; render(); $('#sh-title')?.focus(); return; }
    const s = cur().steps.find(x => x.id === m.id); s.title = d.title.trim(); s.desc = d.desc.trim(); s.settings = { instructions: d.instructions.trim(), tool: d.tool, onFail: d.onFail }; markDirty(); liveValidate(); closeModal(); toast('Step settings saved.', { tone: 'good' }); },
  'file-retry': el => { const a = cur(); runUpload(a, a.files.find(x => x.id === el.dataset.id)); },
  'file-cancel': el => uploads.get(el.dataset.id)?.abort(),
  'file-remove': async el => { const a = cur(); const f = a.files.find(x => x.id === el.dataset.id); if (f.status === 'done') { try { await api('files/' + f.id, { method: 'DELETE' }); } catch (e) { toast(e.message, { tone: 'bad' }); return; } }
    a.files = a.files.filter(x => x.id !== f.id); fileObjects.delete(f.id); liveValidate(); render(); $('#f-files')?.focus(); },
  tab: el => { S.tab[el.dataset.key] = el.dataset.v; render(); $(`#tab-${el.dataset.key}-${el.dataset.v}`)?.focus(); },
  'cancel-run': () => S.run?.controller.abort(),
  'retry-run': el => { const r = S.runs.find(x => x.id === el.dataset.id); if (!r) return; S.chat[el.dataset.key] = r.input; requestRun(el.dataset.key); },
  'use-sample': el => { const key = el.dataset.key || 'studio'; S.chat[key] = el.dataset.v; S.runError[key] = null; if (isPhone() && key === 'studio') S.mobileView = 'preview'; render(); const t = $('#in-' + key); t?.focus(); try { t.setSelectionRange(t.value.length, t.value.length); } catch {} },
  'open-output': el => { S.selectedRun[el.dataset.key] = el.dataset.id; S.tab[el.dataset.key] = 'output'; render(); $(`#tab-${el.dataset.key}-output`)?.focus(); },
  'select-run': el => { S.selectedRun[el.dataset.key] = el.dataset.id; if (!el.closest('.con')) { if ((S.tab[el.dataset.key] || 'chat') === 'chat') S.tab[el.dataset.key] = 'steps'; if (isPhone()) S.mobileView = 'preview'; } render(); },
  'copy-output': async el => { const r = S.runs.find(x => x.id === el.dataset.id); const txt = r.output.markdown + (r.output.sources?.length ? '\n\nSources\n' + r.output.sources.map((s, i) => `${i + 1}. ${s.title} — ${s.url}`).join('\n') : '');
    try { await navigator.clipboard.writeText(txt); toast('Output copied.', { tone: 'good' }); } catch { toast('Copy was blocked by the browser. Select the text to copy it.', { tone: 'bad' }); } },
  'copy-link': async el => { const u = `${location.origin}/#agent-${el.dataset.id}`; try { await navigator.clipboard.writeText(u); toast('Link copied.', { tone: 'good' }); } catch { toast(u); } },
  'new-agent': () => startNewAgent(),
  wallet: el => openModal({ type: 'wallet', reason: el.dataset.v || '' }, el),
  'wallet-connect': el => connectWallet(el.dataset.v),
  'sign-out': () => signOut(),
  'acct-menu': () => { S.menu = S.menu === 'acct' ? null : 'acct'; render(); if (S.menu) $('.top-right .menu [role="menuitem"]')?.focus(); },
  'open-setup': el => openModal({ type: 'setup' }, el),
  'modal-close': () => closeModal(),
  'leave-anyway': () => { for (const c of uploads.values()) c.abort(); const to = S.pendingNav; S.modal = null; const [r, p] = parseRoute(to); applyRoute(r, p, to); },
  'save-retry': () => doSave(),
  'save-retry-leave': async () => { await doSave(); if (S.save.status === 'saved') { const to = S.pendingNav; S.modal = null; const [r, p] = parseRoute(to); applyRoute(r, p, to); } else render(); },
  'dir-cat': el => { S.dir.cat = el.dataset.v; render(); }, 'dir-clear': () => { S.dir.q = ''; S.dir.cat = 'All'; render(); $('#dir-q')?.focus(); }, 'dir-reload': () => loadDirectory(),
  'perm-allow': el => { ls.set('bsa-allow-' + el.dataset.id, '1'); closeModal(); requestRun('dir'); },
  'agent-edit': async el => { if (S.save.status === 'pending') await doSave(); setCurrent(el.dataset.id); S.errors = {}; S.showErrors = false; S.publishError = null; S.stageChanged = true; applyRoute('studio', null, 'studio'); },
  'agent-test': async el => { if (S.save.status === 'pending') await doSave(); const a = S.agents.find(x => x.id === el.dataset.id); setCurrent(a.id); S.publishError = null; applyRoute('studio', null, 'studio'); if (!Object.keys({ ...validateDefine(a), ...validateConfigure(a) }).length) { a.stage = 2; a.maxStage = Math.max(a.maxStage, 2); S.stageChanged = true; render(); } else goStage(2); },
  'agent-pause': el => setPaused(el.dataset.id, true), 'agent-resume': el => setPaused(el.dataset.id, false),
  'agent-delete': el => openModal({ type: 'delete', id: el.dataset.id }, el),
  'agent-delete-confirm': async el => { const id = el.dataset.id; const a = S.agents.find(x => x.id === id); S.modal.busy = true; render();
    try { if (a.persisted) await api('agents/' + id, { method: 'DELETE' }); } catch (e) { S.modal.busy = false; S.modal.error = e.message; render(); return; }
    S.agents = S.agents.filter(x => x.id !== id); if (S.currentId === id) { const nx = S.agents.find(x => x.status === 'draft'); if (nx) setCurrent(nx.id); else { const n = newAgent(); S.agents.push(n); setCurrent(n.id); } }
    S.modal = null; render(); toast('Draft deleted.'); },
  'agents-filter': el => { S.agentsFilter = el.dataset.v; render(); },
  'rewards-tab': el => { S.rewardsTab = el.dataset.v; render(); },
  mview: el => { S.mobileView = el.dataset.v; render(); window.scrollTo(0, 0); },
  'admin-load': () => adminLoad(),
  'admin-period': async () => { S.admin.busy.period = true; render(); try { const r = await api('admin/period', { method: 'POST' }); toast(`Recorded ${plural(r.created, 'entry')} for ${r.period}.`, { tone: 'good' }); await adminLoad(); } catch (e) { S.admin.error = e.message; } S.admin.busy.period = false; render(); },
  'admin-set': async el => { const amt = $('#amt-' + el.dataset.id)?.value.trim(); try { await api(`admin/rewards/${el.dataset.id}`, { method: 'POST', body: { status: el.dataset.v, amount: amt } }); toast('Entry updated.', { tone: 'good' }); await adminLoad(); refreshQuiet(); } catch (e) { toast(e.message, { tone: 'bad' }); } },
  'toast-act': el => { const fn = toastActs.get(el.dataset.id); el.closest('.toast')?.remove(); fn?.(); },
  'toast-x': el => el.closest('.toast')?.remove(),
};
async function adminLoad() { S.admin.loading = true; S.admin.error = null; render(); try { S.admin.data = await api('admin/rewards'); } catch (e) { S.admin.error = e.message; } S.admin.loading = false; render(); }
async function setPaused(id, paused) {
  const a = S.agents.find(x => x.id === id); if (S.busy[id]) return; S.busy[id] = true; render();
  try { const r = await api(`agents/${id}/status`, { method: 'POST', body: { paused } }); a.status = r.status; toast(`${a.name} ${paused ? 'paused. New runs are blocked.' : 'resumed.'}`, { tone: 'good' }); }
  catch (e) { toast(e.message, { tone: 'bad' }); }
  delete S.busy[id]; render();
}
function cancelInlineEdit(id) { const a = cur(); const snap = S.editSnap; const i = a.steps.findIndex(x => x.id === id); if (snap?.isNew && i >= 0) a.steps.splice(i, 1); else if (snap && i >= 0) Object.assign(a.steps[i], { title: snap.title, desc: snap.desc }); S.editingStep = null; S.editSnap = null; markDirty(); render(); }

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); const link = e.target.closest('a[href^="#"]');
  if (S.menu && !e.target.closest('.menu') && !(t && /menu$/.test(t.dataset.act))) { S.menu = null; if (!t && !link) { render(); return; } }
  if (e.target.matches('[data-scrim]')) { closeModal(); return; }
  if (link && !t) { e.preventDefault(); if (S.modal) S.modal = null; navigate(link.getAttribute('href')); return; }
  if (!t) return;
  if (t.getAttribute('aria-disabled') === 'true' || t.disabled) { e.preventDefault(); return; }
  const fn = H[t.dataset.act]; if (fn) { e.preventDefault(); fn(t, e); }
});
document.addEventListener('submit', async e => {
  e.preventDefault();
  if (e.target.id === 'composer') draftSteps();
  else if (e.target.dataset.form === 'run') requestRun(e.target.dataset.key);
  else if (e.target.id === 'admin-cfg') {
    const f = new FormData(e.target); const g = k => f.get(k)?.toString().trim() ?? '';
    S.admin.busy.cfg = true; render();
    try { const r = await api('admin/config', { method: 'POST', body: { allocation: g('allocation'), fundingSource: g('fundingSource'), reviewWindowDays: g('reviewWindowDays'), caps: { perAgent: g('perAgent'), perCreator: g('perCreator') }, programs: Object.fromEntries(['creation', 'usage', 'completion'].map(k => [k, { amount: g(k) }])) } });
      S.config = r.config; S.admin.data.config = r.config; toast('Rewards settings saved.', { tone: 'good' }); } catch (err) { toast(err.message, { tone: 'bad' }); }
    S.admin.busy.cfg = false; render();
  }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.matches('textarea[data-grow]')) grow(el);
  if (el.dataset.field && !['checkbox', 'radio'].includes(el.type) && el.tagName !== 'SELECT') {
    const a = cur(); a[el.dataset.field] = el.value; markDirty();
    const c = document.getElementById('count-' + el.dataset.field); if (c) c.textContent = `${el.value.length}/${el.maxLength}`;
    liveValidate(); if (el.dataset.field === 'name') { const ey = $('.stages .eyebrow'); if (ey) ey.textContent = el.value || 'Untitled agent'; }
  } else if (el.dataset.stepField) { const s = cur().steps.find(x => x.id === el.dataset.id); s[el.dataset.stepField] = el.value; el.removeAttribute('aria-invalid'); markDirty(); }
  else if (el.dataset.chat) { S.chat[el.dataset.chat] = el.value; const er = S.runError[el.dataset.chat]; if (er && el.value.trim().length >= 3 && er.fix == null && !er.wallet) { S.runError[el.dataset.chat] = null; el.closest('form').querySelector('.err-dark')?.remove(); } }
  else if (el.dataset.sheet && el.type !== 'radio') S.modal.draft[el.dataset.sheet] = el.value;
  else if (el.dataset.search === 'dir') { S.dir.q = el.value; $('#dir-results').innerHTML = dirResults(); $('#dir-count').textContent = plural(filteredDir().length, 'agent'); }
});
document.addEventListener('change', e => {
  const el = e.target; const a = cur();
  if (el.id === 'f-files') { addFiles([...el.files]); el.value = ''; return; }
  if (el.dataset.sheet) { S.modal.draft[el.dataset.sheet] = el.value; return; }
  if (!el.dataset.field || !(el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT')) return;
  const path = el.dataset.field.split('.'); const val = el.type === 'checkbox' ? el.checked : el.value;
  if (path.length === 2) { a[path[0]][path[1]] = val; if (path[0] === 'tools') a.toolsTouched = true; } else a[path[0]] = val;
  markDirty(); liveValidate(); render();
});
document.addEventListener('keydown', e => {
  const el = e.target;
  if (e.key === 'Escape') {
    if (S.modal) { e.preventDefault(); closeModal(); return; }
    if (S.menu) { const m = S.menu; S.menu = null; render(); if (m.startsWith('step:')) $(`[data-act="step-menu"][data-id="${m.slice(5)}"]`)?.focus(); else $('.acct')?.focus(); return; }
    if (S.editingStep) { const id = S.editingStep; cancelInlineEdit(id); $(`[data-act="step-settings"][data-id="${id}"]`)?.focus(); return; }
  }
  if (e.key === 'Tab' && S.modal) {
    const f = $$('#layer .dialog button:not([disabled]), #layer .dialog input, #layer .dialog select, #layer .dialog textarea, #layer .dialog a[href]').filter(x => x.offsetParent !== null); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } else if (!$('#layer').contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  }
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    if (el.id === 'f-goal') { e.preventDefault(); draftSteps(); return; }
    if (el.dataset.chat) { e.preventDefault(); if (!S.run) requestRun(el.dataset.chat); return; }
    if (el.dataset.stepField === 'title') { e.preventDefault(); H['step-edit-done']({ dataset: { id: el.dataset.id } }); return; }
  }
  if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { const item = el.closest?.('.wf.edit .step-item'); if (item) { e.preventDefault(); moveStep(item.dataset.stepId, e.key === 'ArrowUp' ? -1 : 1); } }
  if (el.getAttribute?.('role') === 'tab' && ['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) { const tabs = $$('[role="tab"]', el.parentElement); let i = tabs.indexOf(el); i = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; e.preventDefault(); H.tab(tabs[i]); }
  if (el.getAttribute?.('role') === 'menuitem' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { const items = $$('[role="menuitem"]', el.closest('.menu')); const i = items.indexOf(el); e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); }
});
let dragId = null;
document.addEventListener('pointerdown', e => { const g = e.target.closest('[data-grip]'); if (g) g.closest('.step-item').draggable = true; });
document.addEventListener('dragstart', e => { const li = e.target.closest?.('.step-item'); if (!li || !li.draggable) return; dragId = li.dataset.stepId; li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch {} });
document.addEventListener('dragover', e => {
  const drop = e.target.closest?.('#dropzone'); if (drop && e.dataTransfer.types.includes('Files')) { e.preventDefault(); drop.classList.add('over'); return; }
  if (!dragId) return; const li = e.target.closest?.('.step-item'); if (!li) return; e.preventDefault();
  $$('.step-item').forEach(x => x.classList.remove('drop-before', 'drop-after')); if (li.dataset.stepId === dragId) return;
  const r = li.getBoundingClientRect(); li.classList.add(e.clientY < r.top + r.height / 2 + 17 ? 'drop-before' : 'drop-after');
});
document.addEventListener('dragleave', e => { const drop = e.target.closest?.('#dropzone'); if (drop && !drop.contains(e.relatedTarget)) drop.classList.remove('over'); });
document.addEventListener('drop', e => {
  const drop = e.target.closest?.('#dropzone'); if (drop) { e.preventDefault(); drop.classList.remove('over'); addFiles([...e.dataTransfer.files]); return; }
  if (!dragId) return; const li = e.target.closest?.('.step-item'); e.preventDefault(); if (!li || li.dataset.stepId === dragId) return;
  const a = cur(); const from = a.steps.findIndex(s => s.id === dragId); const [s] = a.steps.splice(from, 1); let to = a.steps.findIndex(x => x.id === li.dataset.stepId); if (li.classList.contains('drop-after')) to++;
  const flip = captureStepFlip(); a.steps.splice(to, 0, s); markDirty(); render(); playStepFlip(flip); announce(`Moved to position ${to + 1}`);
});
document.addEventListener('dragend', () => { dragId = null; $$('.step-item').forEach(x => { x.draggable = false; x.classList.remove('dragging', 'drop-before', 'drop-after'); }); });
['dragover', 'drop'].forEach(t => window.addEventListener(t, e => { if (e.dataTransfer?.types?.includes('Files') && !e.target.closest?.('#dropzone')) e.preventDefault(); }));
window.addEventListener('hashchange', () => { if (navLock) { navLock = false; return; } navigate(location.hash, { fromHash: true }); });
window.addEventListener('beforeunload', e => { if (S.save.status === 'error' || S.save.status === 'pending' || S.save.status === 'saving' || uploadingAny() || S.run) { e.preventDefault(); e.returnValue = ''; } });
if (window.visualViewport) { const vv = window.visualViewport; const upd = () => { const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop); const open = kb > 120 && isPhone(); document.documentElement.style.setProperty('--kb', (open ? kb : 0) + 'px'); document.body.classList.toggle('kb-open', open); }; vv.addEventListener('resize', upd); vv.addEventListener('scroll', upd); }
document.addEventListener('focusin', e => { if (isPhone() && e.target.matches('input:not([type=checkbox]):not([type=radio]),textarea,select')) setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }), 320); });
setInterval(() => { if (S.save.status === 'saved') renderSave(); }, 30000);

async function boot() {
  S.booting = true; S.bootError = null; render();
  try { await loadMe({ keepCurrent: false }); } catch (e) { S.bootError = e.message; }
  S.booting = false;
  const [r0, p0] = parseRoute(location.hash);
  if (r0 === 'new') { await startNewAgent(); return; }
  S.route = r0; S.param = p0; S.routeFull = r0 === 'agent' ? 'agent-' + p0 : r0;
  if (r0 === 'discover') loadDirectory(); if (r0 === 'agent') loadListing(p0);
  if (!S.bootError && cur()?.persisted) S.save = { status: 'saved', at: null, error: null };
  render();
}
boot();
})();
