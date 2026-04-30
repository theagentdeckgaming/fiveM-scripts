const WebSocket = require('/home/kreez/.nvm/versions/node/v22.22.0/lib/node_modules/openclaw/node_modules/ws');
const fs = require('fs');
const ws = new WebSocket('ws://localhost:18800/devtools/page/A989D614772D1B392B8675980FDE3666');
let msgId = 1;
const pending = {};
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    ws.send(JSON.stringify({ id, method, params }));
    const t = setTimeout(() => { delete pending[id]; reject(new Error('timeout')); }, 20000);
    pending[id] = { resolve };
  });
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function browse(url, readTime) {
  console.log('→ Visiting:', url);
  await send('Page.navigate', { url });
  await wait(readTime);
  
  // Scroll down slowly like a human reading
  for (let i = 0; i < 3; i++) {
    await send('Runtime.evaluate', { expression: 'window.scrollBy(0, 300)' });
    await wait(800);
  }
  await wait(1000);
  
  // Get page title
  const title = await send('Runtime.evaluate', { expression: 'document.querySelector("h1")?.innerText?.substring(0, 60) || document.title' });
  console.log('  Title:', title.result.result.value);
}

ws.on('open', async () => {
  try {
    const urls = [
      'https://devforum.roblox.com/t/release-notes-for-719/4606704',
      'https://devforum.roblox.com/t/weekly-recap-april-20-24-2026/4596790',
      'https://devforum.roblox.com/c/avatar/20',
      'https://devforum.roblox.com/c/scripting/13'
    ];
    
    for (const url of urls) {
      await browse(url, 6000 + Math.random() * 4000);
    }
    
    // Save updated cookies
    const cookies = await send('Network.getAllCookies');
    let cookieTxt = '# Netscape HTTP Cookie File\n';
    cookies.result.cookies.forEach(c => {
      const domain = c.domain.startsWith('.') ? 'TRUE' : 'FALSE';
      const secure = c.secure ? 'TRUE' : 'FALSE';
      const expiry = c.expires < 0 ? 0 : c.expires;
      cookieTxt += c.domain + '\t' + domain + '\t/\t' + secure + '\t' + expiry + '\t' + c.name + '\t' + c.value + '\n';
    });
    fs.writeFileSync('/home/kreez/winston/roblox_cookies.txt', cookieTxt);
    console.log('\n✓ Cookies saved');
    
    const ss = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    fs.writeFileSync('/home/kreez/winston/roblox_human_browse.jpg', Buffer.from(ss.result.data, 'base64'));
    
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