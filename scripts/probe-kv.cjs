/* Inspect KeyboardAvoidingView children + z-indexes of floating UI. */
const WebSocket = require('/Users/abhishekrampi/ddairy/node_modules/ws');
const PORT = 9333;
function getWsUrl() {
  return fetch(`http://127.0.0.1:${PORT}/json/list`)
    .then((r) => r.json())
    .then((targets) => targets.find((t) => t.type === 'page' && t.url.includes('localhost')).webSocketDebuggerUrl);
}
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { maxPayload: 200 * 1024 * 1024 });
    let id = 0; const pending = new Map();
    ws.on('message', (d) => { const m = JSON.parse(d.toString()); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
    const send = (method, params = {}) => new Promise((res) => { id += 1; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
    ws.on('open', () => resolve({ send }));
    ws.on('error', reject);
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const { send } = await connect(await getWsUrl());
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: 'http://localhost:8081' });
  await sleep(12000);
  const evalJs = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true });
    return res.result?.result?.value ?? 'undefined';
  };

  await evalJs(`(function(){const t=[...document.querySelectorAll('[aria-label]')].find((el)=>/my diary/i.test(el.getAttribute('aria-label')||''));if(t)t.click();})()`);
  await sleep(2000);

  console.log(await evalJs(`(function () {
    function line(el, label) {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      return label + ': [' + Math.round(r.top) + '->' + Math.round(r.bottom) + '] h:' + Math.round(r.height) +
        ' pos:' + cs.position + ' z:' + cs.zIndex + ' disp:' + cs.display + ' flex:' + cs.flex +
        ' transform:' + cs.transform + ' ov:' + cs.overflow + ' mb:' + cs.marginBottom + ' cls:' + String(el.className).slice(0, 50);
    }
    const all = [...document.querySelectorAll('div')];
    const card = all.find((el) => {
      const cs = getComputedStyle(el);
      return cs.maxHeight === '90%' && cs.position === 'relative' && el.getBoundingClientRect().height > 200;
    });
    const lines = ['CARD ' + line(card)];
    const kb = card.parentElement;
    lines.push('KV ' + line(kb));
    [...kb.children].forEach((c) => lines.push('  kbChild ' + line(c)));
    const rootEl = kb.parentElement;
    lines.push('ROOT ' + line(rootEl));
    [...rootEl.children].forEach((c) => lines.push('  rootChild ' + line(c)));
    const portal = rootEl.parentElement;
    [portal, ...portal.children].forEach((c) => lines.push('portal ' + line(c)));
    // tabbar + fab z indexes inside app
    const app = document.getElementById('root');
    [...app.querySelectorAll('div')].filter((el) => {
      const z = getComputedStyle(el).zIndex; const r = el.getBoundingClientRect();
      return (z !== 'auto' && z !== '0') || (r.height >= 60 && r.top > 700);
    }).slice(0, 25).forEach((el) => lines.push('appZ ' + line(el)));
    return lines.join('\\n');
  })()`));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
