const WebSocket = require('/home/kreez/.nvm/versions/node/v22.22.0/lib/node_modules/openclaw/node_modules/ws');

const TAB_ID = 'A989D614772D1B392B8675980FDE3666';
const WS_URL = `ws://localhost:18800/devtools/page/${TAB_ID}`;

let ws;
let msgId = 1;
const pending = {};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    ws.send(JSON.stringify({ id, method, params }));
    const t = setTimeout(() => { delete pending[id]; reject(new Error(`timeout: ${method}`)); }, 15000);
    pending[id] = { resolve };
  });
}

ws = new WebSocket(WS_URL);
ws.on('open', async () => {
  console.log('Connected!');
  try {
    // Navigate to login page
    await send('Page.navigate', { url: 'https://forum.cfx.re/login' });
    await new Promise(r => setTimeout(r, 3000));
    
    // Fill in Discourse login form
    const fillResult = await send('Runtime.evaluate', { expression: `
      document.querySelector('#login-account-name').value = 'winston@theagentdeck.ai';
      document.querySelector('#login-account-password').value = 'Lounge33!';
      'filled';
    ` });
    console.log('Fill result:', fillResult.result.result.value);
    
    // Verify values
    const emailVal = await send('Runtime.evaluate', { expression: 'document.querySelector("#login-account-name").value' });
    const pwVal = await send('Runtime.evaluate', { expression: 'document.querySelector("#login-account-password").value' });
    console.log('Email:', emailVal.result.result.value);
    console.log('Password set:', pwVal.result.result.value ? 'YES' : 'NO');
    
    // Take screenshot before submit
    const ss = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    require('fs').writeFileSync('/home/kreez/winston/login2.jpg', Buffer.from(ss.result.data, 'base64'));
    console.log('Screenshot saved to login2.jpg');
    
    // Click the submit button
    await send('Runtime.evaluate', { expression: 'document.querySelector("#login-form .btn.btn-primary").click()' });
    console.log('Login button clicked');
    
    // Wait for redirect
    await new Promise(r => setTimeout(r, 5000));
    
    // Check if logged in
    const loc = await send('Runtime.evaluate', { expression: 'window.location.href' });
    console.log('Current URL after login:', loc.result.result.value);
    
    // Take final screenshot
    const ss2 = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    require('fs').writeFileSync('/home/kreez/winston/login3.jpg', Buffer.from(ss2.result.data, 'base64'));
    console.log('Final screenshot saved to login3.jpg');
    
  } catch (e) {
    console.error('Error:', e.message);
  }
  ws.close();
  process.exit(0);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.id && pending[msg.id]) {
    clearTimeout(pending[msg.id].timeout);
    pending[msg.id].resolve(msg);
    delete pending[msg.id];
  }
});

ws.on('error', e => { console.error('WS error:', e.message); process.exit(1); });