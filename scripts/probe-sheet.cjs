/* Probe the open sheet state exhaustively and take a screenshot. */
const WebSocket = require('/Users/abhishekrampi/d-dairy/node_modules/ws');
const fs = require('fs');
const PORT = 9333;

function getWsUrl() {
  return fetch(`http://127.0.0.1:${PORT}/json/list`)
    .then((r) => r.json())
    .then((targets) => targets.find((t) => t.type === 'page' && t.url.includes('localhost')).webSocketDebuggerUrl);
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { maxPayload: 200 * 1024 * 1024 });
    let id = 0;
    const pending = new Map();
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    });
    const send = (method, params = {}) => new Promise((res) => {
      id += 1; pending.set(id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });
    ws.on('open', () => resolve({ send }));
    ws.on('error', reject);
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const { send } = await connect(await getWsUrl());
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: 'http://localhost:8081' });
  await sleep(12000);

  const evalJs = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true });
    return res.result?.result?.value ?? 'undefined';
  };
  await evalJs(`(function () {
    const t = [...document.querySelectorAll('[aria-label]')].find((el) => /my diary/i.test(el.getAttribute('aria-label') || ''));
    if (t) t.click();
  })()`);
  await sleep(2500);

  console.log('Z_LAYERS:', await evalJs(`(function () {
    function info(el) {
      if (!el || el === document.documentElement) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return (el.className || '').slice(0, 46) + ' | ' + cs.position + ' z:' + cs.zIndex +
        ' [' + Math.round(r.top) + ',' + Math.round(r.bottom) + '] h:' + Math.round(r.height);
    }
    const out = { portaled: [], inApp: [], mic: null, pngNote: '' };
    const portalRoot = [...document.body.children].find((c) => c !== document.getElementById('root') && c.tagName === 'DIV');
    out.portaled = [...(portalRoot?.children || [])].flatMap((c) => [info(c), ...[...c.querySelectorAll(':scope > *')].map(info)]);
    const app = document.getElementById('root') || document.body.firstElementChild;
    // find mic fab buttons
    out.inApp = [...app.querySelectorAll('[aria-label]')].slice(0, 12).map((el) =>
      (el.getAttribute('aria-label') || '') + ' :: ' + info(el));
    return JSON.stringify(out, null, 1);
  })()`));

  console.log('CARD:', await evalJs(`(function () {
    const all = [...document.querySelectorAll('div')];
    const title = all.find((el) => el.textContent.trim() === 'Your books' && el.children.length === 0);
    if (!title) return 'NO_TITLE';
    let node = title; const rows = [];
    while (node && node !== document.body) {
      const r = node.getBoundingClientRect();
      const cs = getComputedStyle(node);
      rows.push('h:' + Math.round(r.height) + ' top:' + Math.round(r.top) + ' bottom:' + Math.round(r.bottom) +
        ' pos:' + cs.position + ' maxH:' + cs.maxHeight + ' pdB:' + cs.paddingBottom + ' cls:' + String(node.className).slice(0, 40));
      node = node.parentElement;
    }
    return rows.join('\\n');
  })()`));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/private/var/folders/9d/fsbf1qfn1j5_79m_h349lk080000gn/T/sheet-open.png', Buffer.from(shot.result.data, 'base64'));
  console.log('shot saved');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
