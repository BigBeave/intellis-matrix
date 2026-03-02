const fs = require('fs');
const f = 'C:/Users/Brandon Beavers/.gemini/antigravity/scratch/intellis-v5/index.html';
let c = fs.readFileSync(f, 'utf8');

// 1. GLOBAL BRANDING
c = c.replace(/APEX TRADER/g, 'INTELLIS MARKET MATRIX AI');
c = c.replace(/APEX/g, 'INTELLIS');
c = c.replace(/v4\.0/g, 'v5.0');
c = c.replace(/v4 —/g, 'v5 —');
c = c.replace(/APEX TRADER v4/g, 'INTELLIS MATRIX v5');

// Matrix Styling
c = c.replace('--bg:#020b14', '--bg:#00050a');
c = c.replace('--acc:#00c6ff', '--acc:#00f2ff');
c = c.replace('--acc2:#00ff88', '--acc2:#00ff41');

// 2. HEADER: SQUAWK BUTTON
const oldHeaderBtns = '<button class="hbtn key" onclick="openM(\'settingsModal\')">⚙ SETTINGS</button>';
const newHeaderBtns = '<button class="hbtn y" id="squawkBtn" onclick="toggleSquawk()">📻 SQUAWK: OFF</button>\n    <button class="hbtn key" onclick="openM(\'settingsModal\')">⚙ SETTINGS</button>';
c = c.replace(oldHeaderBtns, newHeaderBtns);

// 3. SETTINGS: ALPACA
const oldAlphaBox = '<div class="api-source backup" style="margin-bottom:10px">';
const alpacaBox = `
        <div class="api-source" style="border-color:var(--acc2);margin-bottom:10px">
          <div><span class="api-badge badge-best">⚡ REAL-TIME</span> <span class="api-badge badge-free">FREE Tier</span></div>
          <div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:4px">Alpaca Markets <a href="https://alpaca.markets/data" target="_blank" style="color:var(--acc);font-size:10px;font-weight:600;margin-left:8px">→ credentials</a></div>
          <div style="font-size:11px;color:var(--dim);margin-bottom:6px">Used for sub-second momentum alerts.</div>
          <div class="key-row"><input id="alKeyIn" placeholder="API Key ID" style="flex:1;font-family:Share Tech Mono,monospace;font-size:11px"><input id="alSecIn" type="password" placeholder="Secret Key" style="flex:1;font-family:Share Tech Mono,monospace;font-size:11px"></div>
          <div class="key-row"><button class="btn bg bw" style="font-size:9px;" onclick="saveKey('alpaca')">SAVE ALPACA CREDENTIALS</button></div>
          <div class="key-status" id="alSt">Status: <span style="color:var(--dim)">Not configured</span></div>
        </div>
`;
c = c.replace(oldAlphaBox, alpacaBox + oldAlphaBox);
c = c.replace('grid-template-columns:295px 1fr 278px', 'grid-template-columns:310px 1fr 290px');

// 4. CONFIG & STATE
c = c.replace(
    'anthropicKey: localStorage.getItem(\'ant_key\') || \'\',',
    'anthropicKey: localStorage.getItem(\'ant_key\') || \'\',\n  alpacaKey: localStorage.getItem(\'al_key\') || \'\',\n  alpacaSecret: localStorage.getItem(\'al_sec\') || \'\','
);
c = c.replace(
    'wsSubs:new Set(), cache:{},',
    'wsSubs:new Set(), cache:{}, alpacaWS:null, squawkOn:false,'
);

// 5. LOGIC INJECTION
const logicInjection = `
// ── MOMENTUM SCANNER (ALPACA) ───────────────────────
function connectAlpaca(){
  if(!CFG.alpacaKey||!CFG.alpacaSecret) return;
  if(S.alpacaWS && S.alpacaWS.readyState===WebSocket.OPEN) return;
  setConn('MATRIX SCANNING','var(--acc2)');
  S.alpacaWS = new WebSocket('wss://stream.data.alpaca.markets/v2/iex');
  S.alpacaWS.onopen = () => {
    S.alpacaWS.send(JSON.stringify({action:'auth',key:CFG.alpacaKey,secret:CFG.alpacaSecret}));
  };
  S.alpacaWS.onmessage = (e) => {
    const data = JSON.parse(e.data);
    data.forEach(m => {
      if(m.msg==='authenticated'){ S.alpacaWS.send(JSON.stringify({action:'subscribe',trades:['*']})); }
      if(m.T==='t'){ // Trade message
        const sym=m.S, p=m.p;
        S.prices[sym]=p;
        if(S.prevPrices[sym]){
          const pct = ((p-S.prevPrices[sym])/S.prevPrices[sym])*100;
          if(Math.abs(pct) >= 2.0){ triggerMomentum(sym, p, pct); }
        }
        S.prevPrices[sym]=p;
      }
    });
  };
}
function triggerMomentum(sym, p, pct){
  const key = 'mom_'+sym; if(S.alCool[key] && Date.now()-S.alCool[key] < 30000) return;
  S.alCool[key] = Date.now();
  const dir = pct>0?'🔥 SPIKE':'💩 DROP';
  toast(\`\${dir}: \${sym}\`, \`Matrix detects \${pct.toFixed(2)}% move to $\${p.toFixed(2)}\`, pct>0?'up':'dn');
  loadTickerNews(sym);
}
function toggleSquawk(){
  S.squawkOn = !S.squawkOn;
  const btn = document.getElementById('squawkBtn');
  if(S.squawkOn){
    btn.innerHTML = '📻 SQUAWK: LIVE'; btn.classList.add('bg');
    toast('Squawk Enabled','Connecting to Financial Juice...','ai');
    if(!document.getElementById('squawkFrame')){
      const f = document.createElement('iframe'); f.id = 'squawkFrame';
      f.src = 'https://www.financialjuice.com/embedded-player.aspx';
      f.style.cssText = 'position:fixed;bottom:-500px;left:0;width:1px;height:1px;border:none;pointer-events:none;';
      document.body.appendChild(f);
    }
  } else {
    btn.innerHTML = '📻 SQUAWK: OFF'; btn.classList.remove('bg');
    const f = document.getElementById('squawkFrame'); if(f) f.remove();
    toast('Squawk Muted','Audio feed disconnected','warn');
  }
}
async function loadTickerNews(sym){
  if(!CFG.finnhubKey) return;
  try {
    const res = await fetch(\`https://finnhub.io/api/v1/company-news?symbol=\${sym}&from=\${new Date(Date.now()-86400000).toISOString().split('T')[0]}&to=\${new Date().toISOString().split('T')[0]}&token=\${CFG.finnhubKey}\`);
    const news = await res.json();
    if(news && news.length>0){
      const latest = news[0];
      toast(\`CATALYST: \${sym}\`, latest.headline.substring(0,60)+'...', 'ai');
      renderNews([latest, ...S.cache.news||[]]);
    }
  } catch(e) {}
}
`;
c = c.replace('// ── STATUS HELPERS ──────────────────────────────────────', logicInjection + '\n// ── STATUS HELPERS ──────────────────────────────────────');

// 6. SAVEKEY UPDATE
const alpacaSaveLogic = `
  } else if(type==='alpaca'){
    const k=document.getElementById('alKeyIn').value.trim();
    const s=document.getElementById('alSecIn').value.trim();
    if(!k||!s)return;
    CFG.alpacaKey=k; localStorage.setItem('al_key',k);
    CFG.alpacaSecret=s; localStorage.setItem('al_sec',s);
    document.getElementById('alSt').innerHTML='Status: <span style="color:var(--grn)">✅ Credentials Saved</span>';
    connectAlpaca();
    toast('Alpaca Connected','Matrix scanner active','up');`;
c = c.replace('} else if(type===\'anthropic\'){', alpacaSaveLogic + '\n  } else if(type===\'anthropic\'){');

// Call in launch
c = c.replace('connectWS();', 'connectWS(); connectAlpaca();');

fs.writeFileSync(f, c, 'utf8');
console.log('TRANSFORM SUCCESSFUL: INTELLIS MARKET MATRIX v5');
