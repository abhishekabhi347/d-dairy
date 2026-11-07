/* Hard reload, open the sheet, measure, screenshot. */
const WebSocket = require('/Users/abhishekrampi/d-dairy/node_modules/ws');
const fs = require('fs');
const PORT = 9333;
(async () => {
  const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
  const wsUrl = list.find((t) => t.type === 'page' && t.url.includes('localhost')).webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl, { maxPayload: 200e6 });
  let id = 0; const pending = new Map();
  ws.on('message', (d) => { const m = JSON.parse(d.toString()); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((res) => { id += 1; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  await new Promise((r) => ws.on('open', r));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 2, mobile: true });
  // hard reload ignoring cache
  await send('Page.reload', { ignoreCache: true });
  await new Promise((r) => setTimeout(r, 14000));

  const ev = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true });
    return res.result?.result?.value;
  };
  await ev(`(function(){
    var t = Array.prototype.slice.call(document.querySelectorAll('[aria-label]'))
      .find(function(el){ return /my diary/i.test(el.getAttribute('aria-label') || ''); });
    if (t) t.click();
  })()`);
  await new Promise((r) => setTimeout(r, 3000));

  const report = await ev(`(function () {
    var all = Array.prototype.slice.call(document.querySelectorAll('div'));
    var title = all.find(function (el) {
      return el.textContent.trim() === 'Your books' && el.children.length === 0;
    });
    if (!title) return 'NO_TITLE';
    var rows = [];
    var node = title;
    while (node && node !== document.body) {
      var r = node.getBoundingClientRect();
      var cs = getComputedStyle(node);
      rows.push('h:' + Math.round(r.height) + ' [' + Math.round(r.top) + '->' + Math.round(r.bottom) + '] maxH:' + cs.maxHeight + ' pos:' + cs.position + ' z:' + cs.zIndex + ' cls:' + String(node.className).slice(0, 42));
      node = node.parentElement;
    }
    var tabbar = all.filter(function (el) { return getComputedStyle(el).zIndex === '20'; });
    var rows2 = ['TABBAR: ' + tabbar.map(function (el) {
      var r = el.getBoundingClientRect();
      return '[' + Math.round(r.top) + '->' + Math.round(r.bottom) + ']';
    }).join(' | ')];
    return rows.join('\\n') + '\\n' + rows2.join('\\n');
  })()`);
  console.log(report);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/private/var/folders/9d/fsbf1qfn1j5_79m_h349lk080000gn/T/sheet-fixed2.png', Buffer.from(shot.result.data, 'base64'));
  console.log('shot');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
