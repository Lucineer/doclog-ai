/*
 * THE ACCUMULATION THEOREM
 *
 * Accumulation beats optimization.
 *
 * A perfectly optimized agent with no memory is less useful
 * than a mediocre agent with 6 months of accumulated context.
 *
 * This is the theorem that makes repo-native agents inevitable.
 * The question isn't whether AI will accumulate context.
 * The question is who controls the context.
 *
 * Corporate walled gardens: the corporation controls your context.
 * They train on it. They optimize for engagement. You don't own it.
 *
 * Repo-native agents: you control your context. It's in your repo.
 * You can fork it. Move it. Delete it. Audit it.
 *
 * A fresh Claude Code session is brilliant but amnesiac.
 * A 6-month-old cocapn vessel is good enough and remembers everything.
 * Good enough + perfect memory > brilliant + amnesia.
 *
 * This is the moat. Not technology. Not algorithms. Accumulation.
 * Time is the competitive advantage that cannot be bought.
 */

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const h = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' } });

    if (url.pathname === '/') return new Response(landing(), { headers: { 'Content-Type': 'text/html' } });
    if (url.pathname === '/app') return new Response(app(), { headers: { 'Content-Type': 'text/html' } });

    // Chat SSE
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const { message, context } = await request.json();
      const stream = new ReadableStream({
        async start(ctrl) {
          const enc = new TextEncoder();
          const sysPrompt = `You are DocLog, a living documentation agent for a codebase. You have watched this project evolve. You know every API endpoint, every ADR, every breaking change. Reference specific docs in your answers. Use markdown formatting for code. Be precise but accessible.
${context ? 'RELEVANT CONTEXT FROM DOCS:\n' + context : ''}`;
          const resp = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}` },
            body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: message }], stream: true })
          });
          const reader = resp.body!.getReader();
          while (true) { const { done, value } = await reader.read(); if (done) break; const chunk = new TextDecoder().decode(value); for (const line of chunk.split('\n')) { if (line.startsWith('data: ') && line !== 'data: [DONE]') { try { const d = JSON.parse(line.slice(6)); if (d.choices?.[0]?.delta?.content) ctrl.enqueue(enc.encode(`data: ${JSON.stringify(d.choices[0].delta.content)}\n\n`)); } catch {} } } }
          ctrl.enqueue(enc.encode('data: [DONE]\n\n')); ctrl.close();
        }
      });
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
    }

    // Generic KV CRUD for all collections
    const collections = ['endpoints', 'adrs', 'changelogs', 'components', 'guides', 'glossary'];
    for (const col of collections) {
      if (url.pathname === `/api/${col}`) {
        const items = await env.DOCLOG_KV.get(col, 'json') || [];
        if (request.method === 'GET') return new Response(JSON.stringify(items), { headers });
        if (request.method === 'POST') { const item = await request.json(); item.id = crypto.randomUUID(); item.createdAt = Date.now(); items.push(item); await env.DOCLOG_KV.put(col, JSON.stringify(items)); return new Response(JSON.stringify(item), { headers }); }
      }
    }

    // Search across all docs
    if (url.pathname === '/api/search' && request.method === 'GET') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      const results: any[] = [];
      for (const col of collections) {
        const items = await env.DOCLOG_KV.get(col, 'json') || [];
        for (const item of items) {
          const searchable = JSON.stringify(item).toLowerCase();
          if (searchable.includes(q)) results.push({ ...item, _collection: col });
        }
      }
      return new Response(JSON.stringify(results), { headers });
    }

    // Staleness check
    if (url.pathname === '/api/staleness' && request.method === 'GET') {
      const stale: any[] = [];
      for (const col of collections) {
        const items = await env.DOCLOG_KV.get(col, 'json') || [];
        for (const item of items) {
          const age = Date.now() - (item.createdAt || 0);
          const days = Math.floor(age / 86400000);
          if (days > 30) stale.push({ ...item, _collection: col, _staleDays: days });
        }
      }
      return new Response(JSON.stringify(stale), { headers });
    }

    return new Response('Not found', { status: 404, headers });
  }
};

function landing(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DocLog — Living Documentation</title><style>
body{margin:0;font-family:system-ui;background:#0F172A;color:#E2E8F0}
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem}
h1{font-size:3rem;color:#3B82F6;margin-bottom:1rem}
p{font-size:1.1rem;max-width:600px;line-height:1.6;color:#94A3B8}
.btn{display:inline-block;margin-top:2rem;padding:1rem 2rem;background:#3B82F6;color:white;border-radius:12px;text-decoration:none;font-weight:700}
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:2rem;padding:4rem 2rem;max-width:1000px;margin:0 auto}
.card{background:#1E293B;padding:2rem;border-radius:16px}
.card h3{color:#3B82F6;margin-top:0}
</style></head><body><div class="hero"><div><h1>📋 DocLog</h1><p>Living documentation that watches your codebase evolve. After 6 months, this repo knows your API better than any new hire.</p><a href="/app" class="btn">Open Docs</a></div></div>
<div class="features"><div class="card"><h3>📡 Endpoints</h3><p>Every API endpoint catalogued with auth, schemas, deprecation status.</p></div><div class="card"><h3>🏛️ ADRs</h3><p>Architecture Decision Records with full context and consequences.</p></div><div class="card"><h3>📝 Changelogs</h3><p>Auto-generated per version with breaking changes and features.</p></div></div></body></html>`;
}

function app(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DocLog</title><style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui;background:#0F172A;color:#E2E8F0;display:flex;height:100vh}
.sidebar{width:260px;background:#1E293B;padding:1rem;overflow-y:auto;flex-shrink:0}
.sidebar h2{color:#3B82F6;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.1em;margin:1rem 0 0.5rem}
.sidebar a{display:block;padding:0.5rem;color:#94A3B8;text-decoration:none;border-radius:8px;cursor:pointer;font-size:0.9rem}
.sidebar a:hover,.sidebar a.active{background:#334155;color:#E2E8F0}
.main{flex:1;display:flex;flex-direction:column}
.header{padding:0.75rem 1.5rem;background:#1E293B;border-bottom:1px solid #334155;font-weight:600;color:#3B82F6}
.content{flex:1;overflow-y:auto;padding:1.5rem}
.card{background:#1E293B;padding:1rem;border-radius:12px;margin-bottom:0.75rem;border-left:3px solid #3B82F6}
.card h4{color:#3B82F6;margin-bottom:0.25rem}
.card .meta{color:#64748B;font-size:0.8rem}
.card .body{color:#CBD5E1;font-size:0.9rem;margin-top:0.5rem;line-height:1.5}
.badge{display:inline-block;padding:0.15rem 0.5rem;border-radius:12px;font-size:0.75rem;font-weight:600}
.badge.accepted{background:#065F46;color:#6EE7B7}.badge.superseded{background:#92400E;color:#FCD34D}.badge.deprecated{background:#991B1B;color:#FCA5A5}
.form-group{margin-bottom:0.75rem}.form-group label{display:block;font-size:0.8rem;color:#64748B;margin-bottom:0.25rem}.form-group input,.form-group textarea,.form-group select{width:100%;padding:0.5rem;background:#0F172A;border:1px solid #334155;border-radius:8px;color:#E2E8F0;font-size:0.85rem}
.btn{padding:0.5rem 1rem;background:#3B82F6;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.85rem}
.btn:hover{background:#2563EB}
.chat-area{flex:1;display:flex;flex-direction:column}.messages{flex:1;overflow-y:auto;padding:1rem}
.msg{margin-bottom:1rem;padding:0.75rem;border-radius:12px;max-width:80%;line-height:1.6;font-size:0.9rem}
.msg.user{background:#334155;margin-left:auto}.msg.ai{background:#1E293B;border:1px solid #334155}
.input-area{display:flex;padding:1rem;gap:0.5rem;background:#1E293B;border-top:1px solid #334155}
.input-area input{flex:1;padding:0.75rem;background:#0F172A;border:1px solid #334155;border-radius:8px;color:#E2E8F0}
.input-area button{padding:0.75rem 1.5rem;background:#3B82F6;color:white;border:none;border-radius:8px;cursor:pointer}
code{background:#0F172A;padding:0.15rem 0.4rem;border-radius:4px;font-size:0.85rem;color:#7DD3FC}
.page{display:none}.page.active{display:block}
</style></head><body>
<div class="sidebar"><h2>📋 DocLog</h2>
<a class="active" onclick="showPage('dashboard',this)">Dashboard</a>
<a onclick="showPage('endpoints',this)">Endpoints</a>
<a onclick="showPage('adrs',this)">ADRs</a>
<a onclick="showPage('changelogs',this)">Changelogs</a>
<a onclick="showPage('components',this)">Components</a>
<a onclick="showPage('guides',this)">Guides</a>
<a onclick="showPage('glossary',this)">Glossary</a>
<a onclick="showPage('search',this)">Search</a>
<a onclick="showPage('chat',this)">Ask DocLog</a>
</div>
<div class="main"><div class="header" id="page-title">Dashboard</div>
<div class="content">
<div id="dashboard" class="page active"><p style="color:#94A3B8">DocLog watches your codebase and keeps documentation alive. After months of accumulation, it knows your system better than any new hire.</p></div>
<div id="endpoints" class="page"><div id="endpoints-list"></div><h3 style="margin:1rem 0 0.5rem;color:#3B82F6">Add Endpoint</h3><div class="form-group"><input id="ep-method" placeholder="GET" style="width:80px"></div><div class="form-group"><input id="ep-path" placeholder="/api/users"></div><div class="form-group"><textarea id="ep-desc" rows="2" placeholder="Description"></textarea></div><button class="btn" onclick="addDoc('endpoints',{method:document.getElementById('ep-method').value,path:document.getElementById('ep-path').value,description:document.getElementById('ep-desc').value,status:'active'})">Add</button></div>
<div id="adrs" class="page"><div id="adrs-list"></div><h3 style="margin:1rem 0 0.5rem;color:#3B82F6">Add ADR</h3><div class="form-group"><input id="adr-title" placeholder="ADR Title"></div><div class="form-group"><textarea id="adr-context" rows="2" placeholder="Context..."></textarea></div><div class="form-group"><textarea id="adr-decision" rows="2" placeholder="Decision..."></textarea></div><select id="adr-status" style="width:100%;padding:0.5rem;background:#0F172A;border:1px solid #334155;border-radius:8px;color:#E2E8F0;margin-bottom:0.5rem"><option>accepted</option><option>superseded</option><option>deprecated</option></select><button class="btn" onclick="addDoc('adrs',{title:document.getElementById('adr-title').value,context:document.getElementById('adr-context').value,decision:document.getElementById('adr-decision').value,status:document.getElementById('adr-status').value})">Add</button></div>
<div id="changelogs" class="page"><div id="changelogs-list"></div></div>
<div id="components" class="page"><div id="components-list"></div></div>
<div id="guides" class="page"><div id="guides-list"></div></div>
<div id="glossary" class="page"><div id="glossary-list"></div></div>
<div id="search" class="page"><input id="search-input" placeholder="Search all docs..." style="width:100%;padding:0.75rem;background:#0F172A;border:1px solid #334155;border-radius:8px;color:#E2E8F0;font-size:1rem;margin-bottom:1rem" onkeypress="if(event.key==='Enter')searchDocs()"><div id="search-results"></div></div>
<div id="chat" class="page chat-area"><div class="messages" id="chat-messages"></div><div class="input-area"><input id="chat-input" placeholder="Ask about the codebase..." onkeypress="if(event.key==='Enter')sendChat()"><button onclick="sendChat()">Ask</button></div></div>
</div></div>
<script>
const api='/api';const cols=['endpoints','adrs','changelogs','components','guides','glossary'];
function showPage(id,el){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.sidebar a').forEach(a=>a.classList.remove('active'));el.classList.add('active');document.getElementById('page-title').textContent=id.charAt(0).toUpperCase()+id.slice(1);if(cols.includes(id))loadCol(id)}
async function loadCol(col){const items=await fetch(api+'/'+col).then(r=>r.json());const list=document.getElementById(col+'-list');list.innerHTML=items.map(i=>'<div class="card">'+(i.title||i.method+' '+i.path||i.term||'')+(i.status?' <span class="badge '+i.status+'">'+i.status+'</span>':'')+'<div class="meta">'+(new Date(i.createdAt).toLocaleDateString())+'</div>'+(i.description||i.context||i.body||i.definition?'<div class="body">'+(i.description||i.context||i.body||i.definition)+'</div>':'')+'</div>').join('')}
async function addDoc(col,data){await fetch(api+'/'+col,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});loadCol(col)}
async function searchDocs(){const q=document.getElementById('search-input').value;const results=await fetch(api+'/search?q='+encodeURIComponent(q)).then(r=>r.json());document.getElementById('search-results').innerHTML=results.map(r=>'<div class="card"><strong>'+r._collection+'</strong><div class="body">'+JSON.stringify(r).slice(0,200)+'...</div></div>').join('')}
async function sendChat(){const input=document.getElementById('chat-input');const msg=input.value;if(!msg)return;input.value='';document.getElementById('chat-messages').innerHTML+='<div class="msg user">'+msg+'</div>';const resp=await fetch(api+'/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})});const reader=resp.body.getReader();const decoder=new TextDecoder();let ai='';while(true){const{done,value}=await reader.read();if(done)break;const text=decoder.decode(value);for(const line of text.split('\\n')){if(line.startsWith('data: ')&&line!=='data: [DONE]'){try{ai+=JSON.parse(line.slice(6))}catch{}}}document.getElementById('chat-messages').innerHTML='<div class="msg user">'+msg+'</div><div class="msg ai">'+ai+'</div>';}}
loadCol('endpoints');
</script></body></html>`;
}

interface Env { DOCLOG_KV: KVNamespace; DEEPSEEK_API_KEY: string; }
