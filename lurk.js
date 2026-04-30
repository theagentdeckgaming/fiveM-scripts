const WebSocket = require('/home/kreez/.nvm/versions/node/v22.22.0/lib/node_modules/openclaw/node_modules/ws');
const fs = require('fs');

const ws = new WebSocket('ws://localhost:18800/devtools/page/A989D614772D1B392B8675980FDE3666');
let msgId = 1;
const pending = {};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    ws.send(JSON.stringify({ id, method, params }));
    const t = setTimeout(() => { delete pending[id]; reject(new Error('timeout')), 20000 });
    pending[id] = { resolve };
  });
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function lurk(url, readTime) {
  try {
    console.log('lurking:', url.substring(0, 60));
    await send('Page.navigate', { url });
    
    // Human-like scroll
    for (let i = 0; i < 4; i++) {
      await send('Runtime.evaluate', { expression: 'window.scrollBy(0, 250)' });
      await wait(700 + Math.random() * 500);
    }
    
    await wait(readTime);
    
    const title = await send('Runtime.evaluate', { expression: 'document.querySelector("h1, .topic-title")?.innerText?.substring(0, 80) || "no title"' });
    console.log('  →', title.result.result.value);
  } catch (e) {
    // silently skip errors
  }
}

ws.on('open', async () => {
  const urls = [
    // dev.to - scripting/Lua topics
    'https://dev.to/t/lua',
    'https://dev.to/t/gamedev',
    'https://dev.to/t/fivem',
    // Cfx.re - latest discussions
    'https://forum.cfx.re/latest',
    'https://forum.cfx.re/c/fivem-development/7',
    // Roblox DevForum
    'https://devforum.roblox.com/',
    'https://devforum.roblox.com/c/scripting/13/l/latest',
    'https://devforum.roblox.com/c/tutorials/3/l/latest',
  ];
  
  for (const url of urls) {
    await lurk(url, 4000 + Math.random() * 5000);
    await wait(2000);
  }
  
  // Save cookies from each session
  const cookies = await send('Network.getAllCookies');
  let cookieTxt = '# Netscape HTTP Cookie File\n';
  cookies.result.cookies.forEach(c => {
    const domain = c.domain.startsWith('.') ? 'TRUE' : 'FALSE';
    const secure = c.secure ? 'TRUE' : 'FALSE';
    const expiry = c.expires < 0 ? 0 : c.expires;
    cookieTxt += c.domain + '\t' + domain + '\t/\t' + secure + '\t' + expiry + '\t' + c.name + '\t' + c.value + '\n';
  });
  fs.writeFileSync('/home/kreez/winston/forum_cookies.txt', cookieTxt);
  
  console.log('\n✓ Done lurking');
  
  const ss = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  fs.writeFileSync('/home/kreez/winston/lurking_done.jpg', Buffer.from(ss.result.data, 'base64'));
  
  ws.close();
  process.exit(0);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.id && pending[msg.id]) { clearTimeout(pending[msg.id].timeout); pending[msg.id].resolve(msg); delete pending[msg.id]; }
});

ws.on('error', e => { process.exit(1); });