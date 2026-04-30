--[[
    WinstonEMS — Client Main
    Handles EMS duty, treatment, vitals, and NUI
]]

local isOnDuty = false
local isTreating = false
local currentStage = 1
local patientData = {}
local vitals = { pulse = 80, bp_systolic = 120, bp_diastolic = 80, o2 = 98 }

-- Key mappings
local Keys = {
    TREAT_PATIENT = 47,     -- G
    TOGGLE_DUTY = 166,      -- F5
    OPEN_STRETCHER = 56,    -- F9
    CHECK_VITALS = 74,      -- H
}

-- Initialize
RegisterNetEvent('winstonems:client:init', function()
    -- Register callbacks
    exports['PolyZone']:AddBoxZone and nil or nil
    print("[WinstonEMS] Client initialized")
end)

-- Toggle EMS Duty
RegisterNetEvent('winstonems:client:toggleDuty', function()
    isOnDuty = not isOnDuty
    local playerPed = PlayerPedId()
    
    if isOnDuty then
        -- Check if player is on an EMS job or standalone
        TriggerServerEvent('winstonems:server:setDuty', true)
        SetEntityAsDoctor(playerPed)
        ShowNotification("~g~[WinstonEMS]~w~ EMS Duty: ON")
    else
        TriggerServerEvent('winstonems:server:setDuty', false)
        ShowNotification("~r~[WinstonEMS]~w~ EMS Duty: OFF")
    end
end)

-- Start treating a nearby injured player
function StartTreatment()
    local player, distance = GetClosestPlayer()
    if distance ~= -1 and distance < WinstonEMS.Config.ReviveDistance then
        local playerId = GetPlayerServerId(player)
        
        -- Check if player is actually down/injured
        TriggerServerEvent('winstonems:server:requestTreat', playerId)
    else
        ShowNotification("~r~[WinstonEMS]~w~ No injured player nearby")
    end
end

RegisterNetEvent('winstonems:client:startTreat', function(targetId, stage)
    isTreating = true
    currentStage = stage or 1
    
    -- Lock player in treatment animation
    local playerPed = PlayerPedId()
    RequestAnimDict('mini@safe_cracks')
    TaskPlayAnim(playerPed, 'mini@safe_cracks', 'idle', 8.0, -1, -1, 16, 0, 0, 0, 0)
    
    -- Progress bar
    exports['progressbar']:Progress({
        name = "ems_treatment",
        duration = GetTreatmentTime(stage),
        label = GetStageLabel(stage),
        useWhileDead = false,
        canCancel = true
    }, function(cancelled)
        if not cancelled then
            TriggerServerEvent('winstonems:server:completeStage', targetId, currentStage)
        end
        ClearPedTasks(playerPed)
        isTreating = false
    end)
end)

-- Show vitals HUD for a player
RegisterNetEvent('winstonems:client:showVitals', function(targetId, vitalsData)
    vitals = vitalsData or vitals
    SendNUIMessage({
        type = 'showVitals',
        vitals = vitals,
        show = true
    })
end)

RegisterNetEvent('winstonems:client:hideVitals', function()
    SendNUIMessage({ type = 'hideVitals' })
end)

-- Update vitals in real-time
CreateThread(function()
    while true do
        Wait(WinstonEMS.Config.VitalsUpdateInterval)
        if isOnDuty then
            local player, distance = GetClosestPlayer()
            if distance ~= -1 and distance < 3.0 then
                local playerId = GetPlayerServerId(player)
                TriggerServerEvent('winstonems:server:syncVitals', playerId)
            end
        end
    end
end)

-- Keybinds
CreateThread(function()
    while true do
        Wait(0)
        local playerPed = PlayerPedId()
        
        if isOnDuty then
            -- Check for nearby injured
            local player, distance = GetClosestPlayer()
            if distance ~= -1 and distance < WinstonEMS.Config.ReviveDistance then
                ShowHelpNotification("Press ~INPUT_CONTEXT~ to treat player")
                if IsControlJustPressed(0, 38) then -- E
                    StartTreatment()
                end
            end
            
            -- Check vitals
            if IsControlJustPressed(0, Keys.CHECK_VITALS) then
                local player, distance = GetClosestPlayer()
                if distance ~= -1 and distance < 3.0 then
                    local playerId = GetPlayerServerId(player)
                    TriggerServerEvent('winstonems:server:showVitals', playerId)
                end
            end
        end
        
        -- Duty toggle (F5)
        if IsControlJustPressed(0, Keys.TOGGLE_DUTY) then
            TriggerEvent('winstonems:client:toggleDuty')
        end
    end
end)

-- Utility: Get closest player
function GetClosestPlayer()
    local players = GetActivePlayers()
    local playerPed = PlayerPedId()
    local coords = GetEntityCoords(playerPed)
    local closest = -1
    local closestDist = -1
    
    for _, v in pairs(players) do
        local targetPed = GetPlayerPed(v)
        if targetPed ~= playerPed then
            local dist = #(coords - GetEntityCoords(targetPed))
            if closestDist == -1 or dist < closestDist then
                closestDist = dist
                closest = v
            end
        end
    end
    
    return closest, closestDist
end

function GetPlayerServerId(rpcId)
    return GetPlayerServerId(rpcId)
end

function GetTreatmentTime(stage)
    local times = { 3000, 5000, 8000, 4000, 2000 } -- per stage
    return times[stage] or 5000
end

function GetStageLabel(stage)
    local labels = {
        [1] = "Assessing patient...",
        [2] = "Stabilizing vitals...",
        [3] = "Applying treatment...",
        [4] = "Preparing for transport...",
        [5] = "Admitting patient..."
    }
    return labels[stage] or "Treating..."
end

function ShowHelpNotification(msg)
    SetTextComponentFormat("STRING")
    AddTextComponentString(msg)
    DisplayHelpTextFromStringLabel(0, 0, 1, -1)
end

function ShowNotification(msg)
    SetNotificationTextEntry("STRING")
    AddTextComponentString(msg)
    DrawNotification(false, true)
end
