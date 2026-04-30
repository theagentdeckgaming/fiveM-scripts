--[[
    WinstonEMS — Shared Library
    Common utilities and helper functions used by both client and server
]]

-- Framework detection
function GetFramework()
    -- Check for ESX
    if GetResourceState('es_extended') == 'started' then
        return 'ESX'
    -- Check for QBCore
    elseif GetResourceState('qb-core') == 'started' then
        return 'QBCore'
    -- Check for QBOX
    elseif GetResourceState('qbx_core') == 'started' then
        return 'QBOX'
    else
        return 'STANDALONE'
    end
end

-- Treatment stage definitions
TreatmentStages = {
    ASSESS = 1,
    STABILIZE = 2,
    TREAT = 3,
    TRANSPORT = 4,
    ADMIT = 5
}

StageNames = {
    [1] = "assess",
    [2] = "stabilize",
    [3] = "treat",
    [4] = "transport",
    [5] = "admit"
}

-- Vitals normal ranges
NormalVitals = {
    pulse = { min = 60, max = 100 },
    bp_systolic = { min = 90, max = 140 },
    bp_diastolic = { min = 60, max = 90 },
    o2 = { min = 95, max = 100 }
}

function IsVitalsNormal(vitals)
    return vitals.pulse >= NormalVitals.pulse.min and vitals.pulse <= NormalVitals.pulse.max
        and vitals.bp_systolic >= NormalVitals.bp_systolic.min
        and vitals.o2 >= NormalVitals.o2.min
end

function IsPulseNormal(pulse)
    return pulse and pulse >= NormalVitals.pulse.min and pulse <= NormalVitals.pulse.max
end
