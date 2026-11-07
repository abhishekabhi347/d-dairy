/* Find the ancestor chain that overflows the viewport on web. */
const WebSocket = require('/Users/abhishekrampi/d-dairy/node_modules/ws');
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

  console.log(await evalJs(`(function () {
    function line(el) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return (el.id ? '#' + el.id : (el.className || el.tagName).toString().slice(0, 36)) +
        ' [' + Math.round(r.top) + '->' + Math.round(r.bottom) + '] h:' + Math.round(r.height) +
        ' pos:' + cs.position + ' ov:' + cs.overflow + ' disp:' + cs.display + ' flex:' + cs.flex;
    }
    const chip = [...document.querySelectorAll('[aria-label]')].find((el) => (el.getAttribute('aria-label') || '').includes('A moment worth keeping'));
    const rows = [];
    let node = chip;
    while (node && node !== document.documentElement) { rows.push(line(node)); node = node.parentElement; }
    rows.push(line(document.body));
    rows.push(line(document.documentElement));
    const bar = [...document.querySelectorAll('[role="tablist"], [aria-label*="tab" i], [aria-label*="Tab" i]')][0];
    const barRows = [];
    if (bar) { let n = bar; while (n && n !== document.documentElement) { barRows.push(line(n)); n = n.parentElement; } }
    return 'CHIP CHAIN:\\n' + rows.join('\\n') + '\\n\\nTAB BAR CHAIN:\\n' + barRows.join('\\n');
  })()`));

  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
