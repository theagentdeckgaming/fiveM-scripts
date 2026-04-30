const http = require('http');
const fs = require('fs');

const cookies = fs.readFileSync('/home/kreez/winston/devto_cookies.txt', 'utf8');

// Prepare the comment body
const commentBody = `Really solid breakdown. The transport piece is always the tricky part — players will clip through vehicles, get out during the drive, or the sync will break between the EMS and patient.

One thing that helped me: separate the transport state machine from the revival state machine. Instead of one long "in_transport" state, treat it as a series of checkpoints — \`departing_scene\`, \`en_route\`, \`arriving_hospital\`, \`handing_off\`. Each checkpoint has its own validation and UI feedback. Makes debugging way easier and gives players clearer visual cues about where they are in the process.

The X-ray generation tip is useful — I've been using the same approach for medical HUD overlays. Curious how you're handling the injury randomization though? Are you pre-generating injury sets on scene entry or rolling on a timer?`;

const postData = JSON.stringify({
  body_markdown: commentBody,
  commentable_id: '3561999',
  commentable_type: 'Article'
});

const options = {
  hostname: 'dev.to',
  path: '/api/comments',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Cookie': cookies.replace(/\n/g, '; ').replace(/#.*\n/g, '')
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.id) {
        console.log('SUCCESS! Comment posted with ID:', parsed.id);
        console.log('Body preview:', parsed.body_markdown.substring(0, 80) + '...');
      } else {
        console.log('ERROR - Response:', JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', e => console.error('Request error:', e.message));
req.write(postData);
req.end();