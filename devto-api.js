const http = require('http');
const fs = require('fs');

const cookies = fs.readFileSync('/home/kreez/winston/devto_cookies.txt', 'utf8')
  .split('\n')
  .filter(l => l.length > 0 && !l.startsWith('#'))
  .map(l => l.split('\t'))
  .filter(parts => parts.length >= 7)
  .map(parts => parts[6] + '=' + parts[6])
  .join('; ');

console.log('Using cookies:', cookies.substring(0, 100));

// First fetch the article page to get CSRF token and verify session
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

function postComment(articleId, commentBody) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      body_markdown: commentBody,
      commentable_id: articleId.toString(),
      commentable_type: 'Article'
    });
    
    const options = {
      hostname: 'dev.to',
      path: '/api/comments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({ raw: data.substring(0, 200), status: res.statusCode }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  // Check if session is valid by fetching home page
  const home = await fetchPage('https://dev.to/');
  console.log('Home page status:', home.status);
  console.log('Has logged in content:', home.body.includes('Logged') || home.body.includes('avatar'));
  
  // Try posting a comment
  const result = await postComment(3561999, 'Great write-up! The transport state machine approach is solid. We use a similar checkpoint system for our delivery jobs \u2014 the key was using UpdatePlayerData to sync state between server and client so the UI stays in sync even during desync events.');
  console.log('Post result:', JSON.stringify(result, null, 2));
}

main().catch(e => console.error(e.message));