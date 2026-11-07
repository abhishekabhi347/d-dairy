/* Drive headless Chrome over CDP to inspect the book-switcher sheet layout. */
const WebSocket = require('/Users/abhishekrampi/d-dairy/node_modules/ws');
const { execFile, spawn } = require('child_process');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

function getWsUrl() {
  return fetch(`http://127.0.0.1:${PORT}/json/list`)
    .then((r) => r.json())
    .then((targets) => targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { maxPayload: 100 * 1024 * 1024 });
    let id = 0;
    const pending = new Map();
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    });
    const send = (method, params = {}) =>
      new Promise((res) => {
        id += 1;
        const mid = id;
        pending.set(mid, res);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });
    ws.on('open', () => resolve({ ws, send }));
    ws.on('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const { send } = await connect(await getWsUrl());
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 393, height: 852, deviceScaleFactor: 2, mobile: true,
  });
  await send('Page.navigate', { url: 'http://localhost:8081' });
  await sleep(12000); // allow bundle + hydration

  const evalJs = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.result?.value ?? res.result?.result?.description ?? res;
  };

  // Report viewport + document metrics
  console.log('METRICS:', await evalJs(`JSON.stringify({
    inner: [window.innerWidth, window.innerHeight],
    scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
    bodyChildren: [...document.body.children].map((c) => c.tagName + '.' + (c.className || '')),
    visualViewport: window.visualViewport ? [visualViewport.height, visualViewport.scale] : null,
  })`));

  // Find the "Your books" trigger: the switcher button in the header (labeled book switch)
  const clicked = await evalJs(`(function () {
    const candidates = [...document.querySelectorAll('[aria-label]')];
    const trigger = candidates.find((el) => /my diary|switch|book/i.test(el.getAttribute('aria-label') || ''));
    if (trigger) { trigger.click(); return trigger.getAttribute('aria-label'); }
    return 'NO_TRIGGER';
  })()`);
  console.log('CLICKED:', clicked);
  await sleep(2500);

  console.log('SHEET:', await evalJs(`(function () {
    function rect(el) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height),
        position: cs.position, maxHeight: cs.maxHeight, parent: el.parentElement?.className?.slice?.(0, 60) };
    }
    const all = [...document.querySelectorAll('div')];
    const title = all.find((el) => el.textContent.trim() === 'Your books' && el.children.length === 0);
    if (!title) return 'NO_TITLE';
    let card = title;
    for (let i = 0; i < 12 && card; i++) {
      const cs = getComputedStyle(card);
      if (cs.borderRadius !== '0px' && cs.position !== 'fixed' && card.getBoundingClientRect().height > 200) break;
      card = card.parentElement;
    }
    const used = [];
    let node = title;
    while (node && node !== document.body) { used.push(rect(node)); node = node.parentElement; }
    return JSON.stringify(used, null, 1);
  })()`));

  console.log('SCROLL_STATE:', await evalJs(`JSON.stringify({
    scrollY: window.scrollY,
    docHeight: document.documentElement.scrollHeight,
    innerH: window.innerHeight,
  })`));

  process.exit(0);
})().catch((error) => { console.error(error); process.exit(1); });
