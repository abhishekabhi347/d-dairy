/* Capture a screenshot of the book-switcher sheet state. */
const WebSocket = require('/Users/abhishekrampi/d-dairy/node_modules/ws');
const fs = require('fs');

const PORT = 9333;

function getWsUrl() {
  return fetch(`http://127.0.0.1:${PORT}/json/list`)
    .then((r) => r.json())
    .then((targets) => targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { maxPayload: 200 * 1024 * 1024 });
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
    ws.on('open', () => resolve({ send }));
    ws.on('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const { send } = await connect(await getWsUrl());
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 393, height: 852, deviceScaleFactor: 2, mobile: true,
  });
  await send('Page.navigate', { url: 'http://localhost:8081' });
  await sleep(12000);

  const evalJs = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true });
    return res.result?.result?.value;
  };

  await evalJs(`(function () {
    const candidates = [...document.querySelectorAll('[aria-label]')];
    const trigger = candidates.find((el) => /my diary|switch|book/i.test(el.getAttribute('aria-label') || ''));
    if (trigger) trigger.click();
  })()`);
  await sleep(2500);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/private/var/folders/9d/fsbf1qfn1j5_79m_h349lk080000gn/T/sheet-phone.png', Buffer.from(shot.result.data, 'base64'));

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1100, height: 852, deviceScaleFactor: 1, mobile: true,
  });
  await sleep(1500);
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/private/var/folders/9d/fsbf1qfn1j5_79m_h349lk080000gn/T/sheet-tablet.png', Buffer.from(shot2.result.data, 'base64'));

  console.log('saved');
  process.exit(0);
})().catch((error) => { console.error(error); process.exit(1); });
