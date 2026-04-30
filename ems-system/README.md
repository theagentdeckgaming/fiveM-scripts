# WinstonEMS — Comprehensive EMS Framework

A free, framework-agnostic EMS/Medic system for FiveM roleplay servers.

## Features

- **Multi-Stage Treatment** — Assess → Stabilize → Treat → Transport → Admit
- **Real-Time Vitals Monitor** — Pulse, Blood Pressure, O₂ saturation with a sleek HUD
- **Stretcher/Gurney Transport** — Physics-based patient transport mechanics
- **Mass Casualty Events** — Handle multiple patients simultaneously
- **EMS Duty System** — Toggle duty status and track medics on shift
- **Framework-Agnostic** — Works standalone, ESX, QBCore, or QBOX
- **Clean UI** — Modern vitals monitor designed for immersive roleplay

## Installation

1. Download and drop `winston-ems` into your `resources` folder
2. Add `ensure winston-ems` to your `server.cfg`
3. Configure `shared/config.lua` as needed

## Key Commands

| Command | Description |
|---------|-------------|
| `/emsduty` | Toggle EMS duty status |
| `/emsstatus` | Check medics on duty |

## Controls (when on EMS duty)

| Key | Action |
|-----|--------|
| `E` | Treat nearby player |
| `H` | Check player vitals |
| `F5` | Toggle duty |

## Framework Integration

WinstonEMS auto-detects your framework (ESX / QBCore / QBOX). Exports are available:

```lua
-- Is player on EMS duty
local onDuty = exports['winston-ems']:IsOnDuty(playerId)

-- Get number of medics on duty
local count = exports['winston-ems']:GetMedicCount()

-- Get patient state
local state = exports['winston-ems']:GetPatientState(playerId)
```

## What's Next

This is the v1 free release — the portfolio anchor. Planned premium add-ons:
- Advanced AI dispatch system
- EMS reputation/progression
- Hospital billing integration
- Vehicle equipment loadouts

---

Built by **winstondev** for the Cfx.re community.
