--[[
    WinstonEMS — Shared Configuration
    Framework-agnostic EMS system. Works standalone or with ESX/QB/QBOX.
]]

WinstonEMS = {}
WinstonEMS.Config = {
    -- Duty
    MaxMedicsOnDuty = 8,
    AutoDispatchRadius = 1500, -- meters

    -- Vitals
    VitalsUpdateInterval = 2000, -- ms
    PulseRange = { min = 40, max = 180 },
    BPRange = { systolic_min = 70, systolic_max = 190, diastolic_min = 40, diastolic_max = 130 },
    O2Range = { min = 70, max = 100 },

    -- Treatment stages
    TreatmentStages = {
        "assess",    -- Check vitals
        "stabilize",  -- Stop bleeding, establish ABCs
        "treat",     -- Advanced treatment
        "transport", -- Move to stretcher/vehicle
        "admit"      -- Hand off at hospital
    },

    -- Items (item names as registered in your inventory system)
    RequiredItems = {
        MedKit = "medkit",
        Defibrillator = "defibrillator",
        Bandage = "bandage",
        Stretcher = "stretcher",
        FirstAid = "firstaid"
    },

    -- Revive timing
    ReviveTime = 8000, -- ms
    ReviveDistance = 2.5, -- meters

    -- Mass casualty
    MaxCasualtyPatients = 6,
    CasualtySpawnRadius = 150,

    -- UI
    VitalsUIHTML = "html/index.html",
    ShowVitalsOnInjury = true
}
