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
    await send('Page.navigate', { url: 'https://dev.to/tackk3/building-a-custom-ambulance-job-script-for-qbcore-why-im-replacing-the-default-one-4icp' });
    await new Promise(r => setTimeout(r, 4000));
    
    // Scroll to bottom to find comments
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, document.body.scrollHeight)' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Find the comment textarea and surrounding form
    const commentSection = await send('Runtime.evaluate', { expression: `
      const ta = document.querySelector("textarea.comment-textarea");
      if (!ta) { "textarea not found"; }
      else {
        const form = ta.closest("form");
        const buttons = form ? Array.from(form.querySelectorAll("button")) : [];
        "found textarea, form action: " + (form?.action || "no action") + ", buttons: " + buttons.map(b => b.textContent.trim()).join(" | ");
      }
    ` });
    console.log('Comment section:', commentSection.result.result.value);
    
    // Type the comment
    await send('Runtime.evaluate', { expression: `
      const ta = document.querySelector("textarea.comment-textarea");
      ta.focus();
      ta.value = "Really solid breakdown. The transport piece is always the tricky part \u2014 players will clip through vehicles or the sync will break between EMS and patient. One thing that helped me: separate the transport state machine from the revival state machine. Instead of one long in_transport state, use checkpoints \u2014 departing_scene, en_route, arriving_hospital, handing_off. Each has its own validation and UI feedback. Makes debugging way easier.";
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      "typed"
    ` });
    console.log('Typed comment');
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Find the submit button inside the form
    const submitInfo = await send('Runtime.evaluate', { expression: `
      const ta = document.querySelector("textarea.comment-textarea");
      const form = ta?.closest("form");
      const btn = form?.querySelector("button[type=submit], input[type=submit]");
      "button: " + (btn?.textContent?.trim() || "not found") + ", type: " + (btn?.type) + ", class: " + (btn?.className);
    ` });
    console.log('Submit info:', submitInfo.result.result.value);
    
    // Click the right button
    await send('Runtime.evaluate', { expression: `
      const ta = document.querySelector("textarea.comment-textarea");
      const form = ta?.closest("form");
      const btn = form?.querySelector("button[type=submit], input[type=submit]");
      if (btn) { btn.click(); "clicked"; } else { "no button found"; }
    ` });
    console.log('Submit clicked');
    
    await new Promise(r => setTimeout(r, 4000));
    
    const loc = await send('Runtime.evaluate', { expression: 'window.location.href' });
    console.log('URL after submit:', loc.result.result.value);
    
    // Check if comment was posted
    const comments = await send('Runtime.evaluate', { expression: 'document.querySelectorAll(".comment, [class*=\\"comment\\"]").length' });
    console.log('Comments count:', comments.result.result.value);
    
    const ss = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    fs.writeFileSync('/home/kreez/winston/devto_comment2.jpg', Buffer.from(ss.result.data, 'base64'));
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