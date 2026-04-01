-- NUI Bridge: Communication layer between Lua client and React UI

local isNUIOpen = false
local isCreativeMode = false
local raycastPromise = nil

-- Helper: Get locale strings
local function GetLocale()
    return Config.Locale or "en"
end

-- Helper: Check if string is blacklisted
local function IsBlacklistedString(text)
    for _, v in pairs(Config.BlacklistedStrings) do
        if string.find(string.lower(text), string.lower(v)) then
            return true
        end
    end
    return false
end

-- Helper: Convert items table to array for React
local function GetItemsArray()
    local arr = {}
    local items = BRIDGE.GetItems()
    for _, v in pairs(items) do
        if not IsBlacklistedString(v.name) then
            table.insert(arr, { name = v.name, label = v.label })
        end
    end
    return arr
end

-- Open NUI panel (player-facing)
function OpenNUI(panel, data)
    SetNuiFocus(true, true)
    isNUIOpen = true
    SendNUIMessage({
        action = "openPanel",
        data = {
            panel = panel,
            data = data,
            items = GetItemsArray(),
            locale = GetLocale(),
        }
    })
end

-- Close NUI
function CloseNUI()
    SetNuiFocus(false, false)
    isNUIOpen = false
    SendNUIMessage({ action = "closePanel" })
end

-- Open Creative Mode
function OpenCreativeMode(jobs)
    SetNuiFocus(true, true)
    isNUIOpen = true
    isCreativeMode = true
    SendNUIMessage({
        action = "setCreativeMode",
        data = {
            active = true,
            jobs = jobs,
            items = GetItemsArray(),
            locale = GetLocale(),
            imageDir = Config.DirectoryToInventoryImages,
        }
    })
end

-- Close Creative Mode
function CloseCreativeMode()
    SetNuiFocus(false, false)
    isNUIOpen = false
    isCreativeMode = false
    SendNUIMessage({ action = "closePanel" })
end

-- Send notification via NUI
function NUINotify(data)
    SendNUIMessage({
        action = "notify",
        data = data
    })
end

-- Update jobs in creative mode
function UpdateCreativeJobs(jobs)
    SendNUIMessage({
        action = "updateJobs",
        data = { jobs = jobs }
    })
end

-- Raycast helper: temporarily close NUI, do raycast, return coords
local function DoRaycast()
    SetNuiFocus(false, false)

    NUINotify({
        title = Locales[GetLocale()].select_point or "Select position",
        description = "[ E ]",
        type = "inform"
    })

    while true do
        Wait(0)
        local hit, entity, coords = lib.raycast.cam(1|16)
        if hit then
            DrawSphere(coords.x, coords.y, coords.z, 0.2, 0, 0, 255, 0.2)
            if IsControlJustPressed(1, 38) then -- E
                SetNuiFocus(true, true)
                return coords
            end
        end
        -- Cancel with right click
        if IsControlJustPressed(1, 177) then -- Backspace / ESC
            SetNuiFocus(true, true)
            return nil
        end
    end
end

-- ==========================================
-- NUI CALLBACKS
-- ==========================================

RegisterNUICallback("closeUI", function(data, cb)
    CloseNUI()
    isCreativeMode = false
    cb({ ok = true })
end)

RegisterNUICallback("saveJob", function(data, cb)
    if data.jobData then
        TriggerSecureEvent("pls_jobsystem:server:saveJob", data.jobData)
    end
    cb({ ok = true })
end)

RegisterNUICallback("saveNewJob", function(data, cb)
    if data.jobData then
        -- Set coords to player position
        data.jobData.coords = GetEntityCoords(cache.ped)
        TriggerSecureEvent("pls_jobsystem:server:saveNewJob", data.jobData)
    end
    cb({ ok = true })
end)

RegisterNUICallback("deleteJob", function(data, cb)
    if data.jobData then
        TriggerSecureEvent("pls_jobsystem:server:deleteJob", data.jobData)
    end
    cb({ ok = true })
end)

RegisterNUICallback("craftItem", function(data, cb)
    if data.craftingData then
        local craftingData = data.craftingData
        local hasAllItems = true
        if craftingData.ingedience then
            for _, v in pairs(craftingData.ingedience) do
                local needed = tonumber(v.itemCount) or 0
                local have = tonumber(BRIDGE.GetItemCount(v.itemName)) or 0
                if needed > have then
                    hasAllItems = false
                end
            end
        else
            hasAllItems = false
        end
        if hasAllItems then
            local animData = { anim = Config.DEFAULT_ANIM, dict = Config.DEFAULT_ANIM_DIC }
            if craftingData.animation then
                if craftingData.animation.dict and craftingData.animation.anim then
                    animData = { anim = craftingData.animation.anim, dict = craftingData.animation.dict }
                end
            end

            CloseNUI()

            local itemLabel = craftingData.itemName
            local items = BRIDGE.GetItems()
            if items[craftingData.itemName] then
                itemLabel = items[craftingData.itemName].label
            end

            local locale = Locales[GetLocale()] or Locales["en"]
            if lib.progressCircle({
                duration = 10000,
                label = string.format(locale.crafting_progress or "Preparing %s", itemLabel),
                position = 'bottom',
                useWhileDead = false,
                canCancel = true,
                disable = { car = true, move = true },
                anim = { dict = animData.dict, clip = animData.anim },
            }) then
                TriggerSecureEvent("pls_jobsystem:server:createItem", craftingData)
            end
        else
            local locale = Locales[GetLocale()] or Locales["en"]
            NUINotify({
                title = locale.error or "Error",
                description = locale.not_enough_items or "You don't have all items!",
                type = "error"
            })
            CloseNUI()
        end
    end
    cb({ ok = true })
end)

RegisterNUICallback("registerAction", function(data, cb)
    if data.job and data.action and data.amount then
        TriggerSecureEvent("pls_jobsystem:server:makeRegisterAction", data.job, data.action, data.amount)
        CloseNUI()
    end
    cb({ ok = true })
end)

RegisterNUICallback("requestRaycast", function(data, cb)
    local coords = DoRaycast()
    if coords then
        cb({ coords = { x = coords.x, y = coords.y, z = coords.z } })
    else
        cb({ coords = nil })
    end
end)

RegisterNUICallback("getPlayerPosition", function(data, cb)
    local coords = GetEntityCoords(cache.ped)
    local heading = GetEntityHeading(cache.ped)
    cb({ coords = { x = coords.x, y = coords.y, z = coords.z }, heading = heading })
end)

RegisterNUICallback("pullChanges", function(data, cb)
    local pullType = data.type or "creator"
    TriggerSecureEvent("pls_jobsystem:server:pullChanges", pullType)
    cb({ ok = true })
end)

RegisterNUICallback("createBackup", function(data, cb)
    TriggerSecureEvent("pls_jobsystem:server:createBackup")
    cb({ ok = true })
end)

RegisterNUICallback("restoreBackup", function(data, cb)
    TriggerSecureEvent("pls_jobsystem:server:setBackup")
    cb({ ok = true })
end)

RegisterNUICallback("confirmAction", function(data, cb)
    if data.confirmed then
        -- Alarm: send dispatch
        if data.alarmCoords and data.jobLabel then
            SendDispatch(
                vector3(data.alarmCoords.x, data.alarmCoords.y, data.alarmCoords.z),
                data.jobLabel
            )
        end
    end
    CloseNUI()
    cb({ ok = true })
end)

RegisterNUICallback("callAlarm", function(data, cb)
    if data.coords and data.jobLabel then
        SendDispatch(
            vector3(data.coords.x, data.coords.y, data.coords.z),
            data.jobLabel
        )
    end
    CloseNUI()
    cb({ ok = true })
end)

RegisterNUICallback("openBossmenu", function(data, cb)
    if data.jobName then
        CloseNUI()
        openBossmenu(data.jobName)
    end
    cb({ ok = true })
end)

RegisterNUICallback("openStash", function(data, cb)
    if data.id then
        CloseNUI()
        BRIDGE.OpenStash(data.id, data.weight, data.slots)
    end
    cb({ ok = true })
end)

RegisterNUICallback("buyShopItem", function(data, cb)
    if data.item and data.job then
        TriggerSecureEvent("pls_jobsystem:server:buyShopItem", data.item, data.job)
        CloseNUI()
    end
    cb({ ok = true })
end)
