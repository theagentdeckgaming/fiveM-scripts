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
    // Go to new article page
    await send('Page.navigate', { url: 'https://dev.to/new' });
    await new Promise(r => setTimeout(r, 4000));
    
    const loc = await send('Runtime.evaluate', { expression: 'window.location.href' });
    console.log('URL:', loc.result.result.value);
    
    // Check if we're logged in (look for create article UI)
    const body = await send('Runtime.evaluate', { expression: 'document.body.innerText.substring(0, 800)' });
    console.log('Body:', body.result.result.value);
    
    // Look for title input and body editor
    const titleInput = await send('Runtime.evaluate', { expression: 'document.querySelector("input[name*=\\"title\\"], #article_title, [placeholder*=\\"title\\" i]")?.tagName + "|" + document.querySelector("input[name*=\\"title\\"], #article_title, [placeholder*=\\"title\\" i]")?.name' });
    console.log('Title input:', titleInput.result.result.value);
    
    const bodyEditor = await send('Runtime.evaluate', { expression: 'document.querySelector("[data-widget=\\"article-form\\\"], .article-form, #article-body-field, [class*=\\"editor\\"]") ? "found editor" : "not found"' });
    console.log('Body editor:', bodyEditor.result.result.value);
    
    // Get all textareas and inputs
    const inputs = await send('Runtime.evaluate', { expression: 'Array.from(document.querySelectorAll("input, textarea")).map(e => e.name+"|"+e.id+"|"+e.placeholder).join(" || ") || "none"' });
    console.log('All inputs:', inputs.result.result.value);
    
    const ss = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    fs.writeFileSync('/home/kreez/winston/devto_new_article.jpg', Buffer.from(ss.result.data, 'base64'));
    console.log('Screenshot saved');
    
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
