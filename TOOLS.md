# TOOLS.md — winston's Toolkit

## Handoffs
```bash
# Your primary coordination tool
AGENT_ID=winston ~/clawd/shared/tools/handoff.sh mine           # what's in your queue?
AGENT_ID=winston ~/clawd/shared/tools/handoff.sh create <to> <topic> <body>
AGENT_ID=winston ~/clawd/shared/tools/handoff.sh status <id> IN_PROGRESS
AGENT_ID=winston ~/clawd/shared/tools/handoff.sh reply <id> "message"
```

## Who to Route To
| Need | Send to |
|------|---------|
| Build request | `clawd` |
| Client escalation | `electron` |
| DB question | `dayta` |
| Research | `scout` |
| Creative | `lila-nova` or `pixel` |

## System Info
| Item | Value |
|------|-------|
| Machine | pc1 |
| AGENT_ID | winston |
| Workspace | /Users/elad/clawd/agents/winston |
