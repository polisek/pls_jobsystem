-- NUI Bridge: Communication layer between Lua client and React UI

if GetCurrentResourceName() ~= "pls_jobsystem" then
    print("^1[pls_jobsystem] CHYBA: Resource musi byt pojmenovan 'pls_jobsystem'. Soucasne jmeno: '" .. GetCurrentResourceName() .. "'. Script se nespusti.^0")
    return
end

local isNUIOpen = false
local isCreativeMode = false
local raycastPromise = nil

-- Helper: Get locale strings
function GetLocale()
    return Config.Locale or "en"
end

-- Helper: Convert items table to array for React
function GetItemsArray()
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
    if GizmoState.active then
        CleanupGizmo()
    end
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

RegisterNUICallback("requestPropPlacement", function(data, cb)
    cb({ ok = true })
    if GizmoState.active then return end

    CreateThread(function()
        local modelName = data.model
        local hintCoords = data.coords  -- optional Vec3 hint from editor

        -- Load model
        local model = joaat(modelName)
        RequestModel(model)
        local t = 0
        while not HasModelLoaded(model) and t < 5000 do
            Wait(50); t = t + 50
        end
        if not HasModelLoaded(model) then
            NUINotify({ title = "Error", description = "Model nenalezen: " .. modelName, type = "error" })
            return
        end

        -- Pick spawn position: hint coords (IC editor) → 3 m in front of player
        local spawnPos
        if hintCoords and hintCoords.x then
            spawnPos = vector3(hintCoords.x, hintCoords.y, hintCoords.z)
        else
            -- NUI is focused so raycast is unreliable — always place near player
            local pedPos = GetEntityCoords(cache.ped)
            local fwd    = GetEntityForwardVector(cache.ped)
            spawnPos = vector3(pedPos.x + fwd.x * 3.0, pedPos.y + fwd.y * 3.0, pedPos.z)
        end
        -- Snap to ground
        local snapped, groundZ = GetGroundZFor_3dCoord(spawnPos.x, spawnPos.y, spawnPos.z + 2.0, false)
        if snapped then spawnPos = vector3(spawnPos.x, spawnPos.y, groundZ) end

        -- Spawn ghost prop
        GizmoState.prop = CreateObject(model, spawnPos.x, spawnPos.y, spawnPos.z, false, true, false)
        SetEntityCollision(GizmoState.prop, false, true)
        SetEntityAsMissionEntity(GizmoState.prop, true, true)
        SetEntityAlpha(GizmoState.prop, 200, false)
        SetModelAsNoLongerNeeded(model)

        -- Create scripted camera orbiting around prop
        GizmoState.cam        = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
        GizmoState.camHeading = GetEntityHeading(cache.ped) + 180.0
        GizmoState.camDist    = 4.0
        GizmoState.active     = true

        UpdateGizmoCam()
        SetCamActive(GizmoState.cam, true)
        RenderScriptCams(true, true, 500, true, true)

        -- Open gizmo panel in React (keeps creative mode open — only sets activePanel)
        SendNUIMessage({
            action = "openPanel",
            data   = { panel = "propGizmo", data = { model = modelName } }
        })

        -- Update loop: project prop 3D → 2D and send to React (~30 fps)
        while GizmoState.active do
            Wait(33)
            if not DoesEntityExist(GizmoState.prop) then break end

            local pos = GetEntityCoords(GizmoState.prop)
            local rot = GetEntityRotation(GizmoState.prop, 2)

            -- Adaptive axis length so arrows are visible at any distance
            local camPos = GetFinalRenderedCamCoord()
            local dist   = #(camPos - pos)
            local axLen  = math.max(0.4, dist * 0.12)
            GizmoState.axisWorldLen = axLen

            local _, cx, cy = GetScreenCoordFromWorldCoord(pos.x, pos.y, pos.z)
            local _, xx, xy = GetScreenCoordFromWorldCoord(pos.x + axLen, pos.y,        pos.z)
            local _, yx, yy = GetScreenCoordFromWorldCoord(pos.x,        pos.y + axLen, pos.z)
            local _, zx, zy = GetScreenCoordFromWorldCoord(pos.x,        pos.y,        pos.z + axLen)

            SendNUIMessage({
                action = "gizmoUpdate",
                data   = {
                    center       = { x = cx, y = cy },
                    axes         = {
                        x = { x = xx, y = xy },
                        y = { x = yx, y = yy },
                        z = { x = zx, y = zy },
                    },
                    worldPos      = { x = pos.x, y = pos.y, z = pos.z },
                    rotation      = { x = rot.x, y = rot.y, z = rot.z },
                    axisWorldLen  = axLen,
                }
            })
        end
    end)
end)

-- ── Move / rotate prop ────────────────────────────────────────
RegisterNUICallback("gizmoApplyDelta", function(data, cb)
    cb({ ok = true })
    if not GizmoState.active or not DoesEntityExist(GizmoState.prop) then return end
    local pos = GetEntityCoords(GizmoState.prop)
    local rot = GetEntityRotation(GizmoState.prop, 2)
    local d   = data.delta or 0.0

    if data.type == 'translate' then
        local nx, ny, nz = pos.x, pos.y, pos.z
        if     data.axis == 'x' then nx = nx + d
        elseif data.axis == 'y' then ny = ny + d
        elseif data.axis == 'z' then nz = nz + d end
        SetEntityCoords(GizmoState.prop, nx, ny, nz, false, false, false, false)
    elseif data.type == 'rotate' then
        local rx, ry, rz = rot.x, rot.y, rot.z
        if     data.axis == 'x' then rx = rx + d
        elseif data.axis == 'y' then ry = ry + d
        elseif data.axis == 'z' then rz = rz + d end
        SetEntityRotation(GizmoState.prop, rx, ry, rz, 2, true)
    end
end)

-- ── Orbit camera with right-drag ─────────────────────────────
RegisterNUICallback("gizmoCameraOrbit", function(data, cb)
    cb({ ok = true })
    if not GizmoState.active then return end
    GizmoState.camHeading = GizmoState.camHeading + (data.dx or 0) * 0.5
    UpdateGizmoCam()
end)

-- ── Confirm placement ─────────────────────────────────────────
RegisterNUICallback("gizmoConfirm", function(data, cb)
    cb({ ok = true })
    if not GizmoState.active then return end

    local pos = GetEntityCoords(GizmoState.prop)
    local rot = GetEntityRotation(GizmoState.prop, 2)

    GizmoState.active = false
    DeleteEntity(GizmoState.prop);  GizmoState.prop = nil
    RenderScriptCams(false, true, 500, true, true)
    DestroyCam(GizmoState.cam, false); GizmoState.cam = nil

    -- propPlacedGizmo → App.tsx closes propGizmo panel + re-dispatches propPlaced
    SendNUIMessage({
        action = "propPlacedGizmo",
        data   = {
            cancelled = false,
            coords    = { x = pos.x, y = pos.y, z = pos.z },
            rotation  = { x = rot.x, y = rot.y, z = rot.z },
        }
    })
end)

-- ── Cancel placement ──────────────────────────────────────────
RegisterNUICallback("gizmoCancel", function(data, cb)
    cb({ ok = true })
    GizmoState.active = false
    if GizmoState.prop and DoesEntityExist(GizmoState.prop) then
        DeleteEntity(GizmoState.prop); GizmoState.prop = nil
    end
    RenderScriptCams(false, true, 500, true, true)
    if GizmoState.cam then DestroyCam(GizmoState.cam, false); GizmoState.cam = nil end

    SendNUIMessage({ action = "propPlacedGizmo", data = { cancelled = true } })
end)

RegisterNUICallback("cancelInteractiveCrafting", function(data, cb)
    TriggerEvent('pls_jobsystem:client:cancelInteractiveCrafting')
    cb({ ok = true })
end)

-- Player selected a recipe in the selection panel
RegisterNUICallback("selectICRecipe", function(data, cb)
    cb({ ok = true })
    if not ICPendingStation or not ICPendingRecipes or not data.recipeId then return end

    local recipe = nil
    for _, r in ipairs(ICPendingRecipes) do
        if r.id == data.recipeId then
            recipe = r
            break
        end
    end

    if not recipe then return end

    local station = ICPendingStation
    ICPendingStation = nil
    ICPendingRecipes = nil

    -- Drop NUI focus but keep panel mounted — StartICWithRecipe will send startICCrafting
    SetNuiFocus(false, false)
    isNUIOpen = false

    CreateThread(function()
        StartICWithRecipe(station, recipe)
    end)
end)

-- Player cancelled the recipe selection panel
RegisterNUICallback("cancelICSelection", function(data, cb)
    ICPendingStation = nil
    ICPendingRecipes = nil
    CloseNUI()
    cb({ ok = true })
end)
