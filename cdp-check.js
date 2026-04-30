const WebSocket = require('/home/kreez/.nvm/versions/node/v22.22.0/lib/node_modules/openclaw/node_modules/ws');
const fs = require('fs');
const ws = new WebSocket('ws://localhost:18800/devtools/page/A989D614772D1B392B8675980FDE3666');
let msgId = 1;
const pending = {};
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    ws.send(JSON.stringify({ id, method, params }));
    const t = setTimeout(() => { delete pending[id]; reject(new Error('timeout')); }, 15000);
    pending[id] = { resolve };
  });
}
ws.on('open', async () => {
  try {
    // Check for error messages on the page
    const errors = await send('Runtime.evaluate', { expression: 'document.querySelector(".form-message, .error-message, [class*=error], #username-error, #password-error")?.innerText || "no error"' });
    console.log('Error:', errors.result.result.value);
    
    // Check username field
    const uname = await send('Runtime.evaluate', { expression: 'document.querySelector("#login-username")?.value' });
    console.log('Username field:', uname.result.result.value);
    
    // Get body text to see if there's a message
    const body = await send('Runtime.evaluate', { expression: 'document.body.innerText.substring(0, 600)' });
    console.log('Body:', body.result.result.value);
    
    ws.close();
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    ws.close();
    process.exit(1);
  }
});
ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.id && pending[msg.id]) { clearTimeout(pending[msg.id].timeout); pending[msg.id].resolve(msg); delete pending[msg.id]; }
});
ws.on('error', e => { console.error('WS error:', e.message); process.exit(1); });