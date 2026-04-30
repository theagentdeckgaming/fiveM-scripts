--[[
    WinstonEMS — Server Main
    Handles EMS duty, patient states, treatment progression, and vitals sync
]]

local EMS_Duty = {}          -- [playerId] = true/false
local PatientStates = {}     -- [playerId] = { state, vitals, stage, isDown }
local MedicCount = 0

-- Events

RegisterNetEvent('winstonems:server:setDuty', function(onDuty)
    local src = source
    EMS_Duty[src] = onDuty
    
    if onDuty then
        MedicCount = MedicCount + 1
        TriggerClientEvent('winstonems:client:toggleDuty', src, true)
    else
        MedicCount = math.max(0, MedicCount - 1)
        TriggerClientEvent('winstonems:client:toggleDuty', src, false)
    end
    
    -- Broadcast medic count to all players
    TriggerClientEvent('winstonems:client:updateMedicCount', -1, MedicCount)
end)

RegisterNetEvent('winstonems:server:requestTreat', function(targetId)
    local src = source
    
    if not EMS_Duty[src] then
        TriggerClientEvent('winstonems:client:notify', src, "You must be on EMS duty to treat patients")
        return
    end
    
    if not PatientStates[targetId] or not PatientStates[targetId].isDown then
        TriggerClientEvent('winstonems:client:notify', src, "Patient is not in need of treatment")
        return
    end
    
    -- Start treatment
    local stage = PatientStates[targetId].stage or 1
    TriggerClientEvent('winstonems:client:startTreat', src, targetId, stage)
end)

RegisterNetEvent('winstonems:server:completeStage', function(targetId, stage)
    local src = source
    
    if not EMS_Duty[src] then return end
    
    local patient = PatientStates[targetId]
    if not patient then return end
    
    -- Advance stage
    if stage < #WinstonEMS.Config.TreatmentStages then
        PatientStates[targetId].stage = stage + 1
        TriggerClientEvent('winstonems:client:notify', src, "Stage complete. Next: " .. WinstonEMS.Config.TreatmentStages[stage + 1])
    else
        -- Treatment complete — revive player
        PatientStates[targetId].isDown = false
        PatientStates[targetId].stage = 1
        TriggerClientEvent('winstonems:client:revive', targetId)
        TriggerClientEvent('winstonems:client:notify', src, "Patient revived!")
    end
    
    -- Sync vitals update
    SyncPatientVitals(targetId)
end)

RegisterNetEvent('winstonems:server:syncVitals', function(targetId)
    local src = source
    if not EMS_Duty[src] then return end
    
    local patient = PatientStates[targetId]
    if patient then
        TriggerClientEvent('winstonems:client:showVitals', src, targetId, patient.vitals)
    end
end)

RegisterNetEvent('winstonems:server:showVitals', function(targetId)
    local src = source
    if not EMS_Duty[src] then return end
    
    local patient = PatientStates[targetId]
    if patient then
        TriggerClientEvent('winstonems:client:showVitals', src, targetId, patient.vitals)
    end
end)

-- Player state management
AddEventHandler('playerDropped', function()
    local src = source
    if EMS_Duty[src] then
        MedicCount = math.max(0, MedicCount - 1)
        EMS_Duty[src] = nil
    end
    PatientStates[src] = nil
end)

-- When a player goes down (injured)
RegisterNetEvent('winstonems:server:playerDown', function()
    local src = source
    PatientStates[src] = {
        isDown = true,
        stage = 1,
        vitals = GenerateRandomVitals()
    }
end)

-- When a player revives naturally (default game mechanic)
RegisterNetEvent('winstonems:server:playerUp', function()
    local src = source
    PatientStates[src] = nil
end)

-- Commands
RegisterCommand('emsduty', function(src)
    TriggerClientEvent('winstonems:client:toggleDuty', src)
end)

RegisterCommand('emsstatus', function(src)
    TriggerClientEvent('winstonems:client:notify', src, "Medics on duty: " .. MedicCount)
end)

-- Functions

function GenerateRandomVitals()
    local pulse = math.random(40, 120)
    local systolic = math.random(80, 160)
    local diastolic = math.random(50, 100)
    local o2 = math.random(75, 99)
    
    return {
        pulse = pulse,
        bp_systolic = systolic,
        bp_diastolic = diastolic,
        o2 = o2
    }
end

function SyncPatientVitals(targetId)
    local patient = PatientStates[targetId]
    if not patient then return end
    
    -- Simulate vitals change based on stage
    if patient.stage == 1 then
        patient.vitals.pulse = math.random(50, 100)
        patient.vitals.o2 = math.random(80, 95)
    elseif patient.stage == 2 then
        patient.vitals.pulse = math.random(60, 110)
        patient.vitals.bp_systolic = math.random(90, 140)
        patient.vitals.o2 = math.random(85, 97)
    elseif patient.stage >= 3 then
        patient.vitals.pulse = math.random(65, 100)
        patient.vitals.bp_systolic = math.random(100, 130)
        patient.vitals.bp_diastolic = math.random(65, 85)
        patient.vitals.o2 = math.random(93, 99)
    end
    
    -- Notify nearby medics
    for playerId, _ in pairs(EMS_Duty) do
        if EMS_Duty[playerId] then
            TriggerClientEvent('winstonems:client:showVitals', playerId, targetId, patient.vitals)
        end
    end
end

-- Callback for framework integration
exports('IsOnDuty', function(playerId)
    return EMS_Duty[playerId] == true
end)

exports('GetMedicCount', function()
    return MedicCount
end)

exports('GetPatientState', function(playerId)
    return PatientStates[playerId]
end)
