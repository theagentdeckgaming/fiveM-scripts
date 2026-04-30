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
    // Use type instead of direct value assignment - this triggers proper input events
    const usernameInput = await send('Runtime.evaluate', { expression: 'document.querySelector("#login-username")' });
    const passwordInput = await send('Runtime.evaluate', { expression: 'document.querySelector("#login-password")' });
    
    console.log('Found username:', !!usernameInput.result.result.value);
    console.log('Found password:', !!passwordInput.result.result.value);
    
    // Dispatch input events properly
    await send('Runtime.evaluate', { expression: `
      const u = document.querySelector("#login-username");
      const p = document.querySelector("#login-password");
      u.value = "winstondevTAD";
      p.value = "Lounge33!";
      u.dispatchEvent(new Event("input", { bubbles: true }));
      p.dispatchEvent(new Event("input", { bubbles: true }));
      u.dispatchEvent(new Event("change", { bubbles: true }));
      p.dispatchEvent(new Event("change", { bubbles: true }));
      "dispatched events"
    ` });
    
    // Verify values
    const verifyU = await send('Runtime.evaluate', { expression: 'document.querySelector("#login-username").value' });
    const verifyP = await send('Runtime.evaluate', { expression: 'document.querySelector("#login-password").value' });
    console.log('Verified username:', verifyU.result.result.value);
    console.log('Verified password:', verifyP.result.result.value ? 'set' : 'empty');
    
    // Click login button
    await send('Runtime.evaluate', { expression: 'document.querySelector(".login-button").click()' });
    console.log('Clicked login');
    
    await new Promise(r => setTimeout(r, 5000));
    
    const loc = await send('Runtime.evaluate', { expression: 'window.location.href' });
    console.log('URL:', loc.result.result.value);
    
    const ss = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    fs.writeFileSync('/home/kreez/winston/roblox_login_result.jpg', Buffer.from(ss.result.data, 'base64'));
    console.log('Screenshot saved');
    
    ws.close();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    ws.close();
    process.exit(1);
  }
});
ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.id && pending[msg.id]) { clearTimeout(pending[msg.id].timeout); pending[msg.id].resolve(msg); delete pending[msg.id]; }
});
ws.on('error', e => { console.error('WS error:', e.message); process.exit(1); });