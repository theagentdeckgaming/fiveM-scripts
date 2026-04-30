---
name: browser-harness
description: Use browser-harness to interact with forums, live websites, and browser-based surfaces. Primary use case: posting replies on forum.cfx.re as winstondev. Also good for: scraping dynamic pages, testing web UI flows, interacting with sites with no API.
---

# browser-harness

## What it does
Gives Winston a live, controllable browser via CDP (Chrome DevTools Protocol). Write Python mid-task to interact with pages. Self-healing - if something is missing, you write it.

## Chrome Location on PC1
PC1 is WSL. Chrome runs on the Windows host:
```
/mnt/c/Program Files/Google/Chrome/Application/chrome.exe
```

## Setup (one-time)
```bash
git clone https://github.com/browser-use/browser-harness ~/browser-harness
cd ~/browser-harness && uv sync
uv tool install -e .
```

## Chrome Bootstrap (one-time on Windows host)
1. On Windows, open Chrome and go to: chrome://inspect/#remote-debugging
2. Tick the checkbox for remote debugging
3. Click Allow if a dialog pops up
4. The setting sticks - after this, just launching Chrome is enough

## Starting Chrome with Debug Port (Windows side)
Run this on the Windows host (PowerShell or CMD):
```cmd
start chrome --remote-debugging-port=9222
```
Or from WSL:
```bash
powershell.exe start chrome --remote-debugging-port=9222
```

## Verifying Connection
```python
# From WSL, test if Chrome CDP is reachable:
curl -s http://localhost:9222/json | head
```

## Core Functions
```python
goto(url)              # Navigate to URL
click(selector)        # Click an element
type(selector, text)   # Type into an input
wait_for_load()        # Wait for page to finish loading
page_info()            # Current URL and title
screenshot()           # Take screenshot
dom()                  # Get full DOM
upload_file(selector, path)  # Upload a file
evaluate(js)           # Run JavaScript in page
```

## Forum.cfx.re Workflow

### Credentials (from CREDS.md)
- Username: winstondev
- Email: winston@theagentdeck.ai
- Password: Lounge33!

### Login (do once per session)
```python
goto("https://forum.cfx.re/login")
wait_for_load()
if "login" in page_info()["url"].lower():
    type('[name="username"]', 'winstondev')
    type('[name="password"]', 'Lounge33!')
    click('button[type="submit"]')
    wait_for_load()
```

### Post a reply
```python
goto("https://forum.cfx.re/t/TOPIC-SLUG/TOPIC_ID")
wait_for_load()
click('.reply-to-post-content-area, .post-area')
wait_for_load()
type('.d-editor-input, textarea[name="reply"]', 'Your reply text here.')
click('.submit-row button, button.btn-primary')
wait_for_load()
print(page_info())  # verify it posted
```

### Common forum.cfx.re selectors
Reply box:     .d-editor-input  or  textarea[name="reply"]
Submit button: .submit-row button  or  button.btn-primary
Post content:  .post  or  .cooked
Topic title:   .fancy-title  or  h1
Quote button:  .quote-button

If selectors do not match, press F12 > Inspect element > right-click > Copy Selector.

## Error Recovery
Page did not load:    add wait_for_load()
Element not found:   use dom() to inspect structure
Stale selector:       get fresh selector from DevTools
Login failed:         check cookies with evaluate("document.cookie")

## Important
- Forum rate limits: do not post more than 1 reply per 30 seconds
- Screenshot before submitting important posts to verify
- Slow pages may need longer wait_for_load() calls or extra wait time
