local Jobs = {}
local Targets = {}
local Peds = {}
local Blips = {}
local Props = {}   -- { model, coords, rotation, entity }
local items = BRIDGE.GetItems()

-- ─────────────────────────────────────────────────────────
--  NUI GIZMO STATE  (used by nui.lua callbacks)
-- ─────────────────────────────────────────────────────────
GizmoState = {
    active      = false,
    prop        = nil,
    cam         = nil,
    camHeading  = 180.0,  -- degrees
    camDist     = 4.0,    -- metres from prop
    axisWorldLen = 1.0,   -- world-space axis length projected each frame
}

function UpdateGizmoCam()
    if not GizmoState.prop or not DoesEntityExist(GizmoState.prop) then return end
    local pos = GetEntityCoords(GizmoState.prop)
    local hRad = math.rad(GizmoState.camHeading)
    local d = GizmoState.camDist

    -- Desired camera offset (45° elevation)
    local offX = math.sin(hRad) * d * 0.7
    local offY = -math.cos(hRad) * d * 0.7
    local offZ = d * 0.7
    local desiredX = pos.x + offX
    local desiredY = pos.y + offY
    local desiredZ = pos.z + offZ

    -- Wall avoidance: sweep from prop toward desired camera position
    local ray = StartExpensiveSynchronousShapeTestLosProbe(
        pos.x, pos.y, pos.z + 0.1,
        desiredX, desiredY, desiredZ,
        1 | 16,         -- world + vehicles
        GizmoState.prop,
        7
    )
    local _, hit, hitCoords = GetShapeTestResult(ray)
    if hit and hitCoords then
        -- Pull camera back to just before the wall (leave 0.3m gap)
        local dx = hitCoords.x - pos.x
        local dy = hitCoords.y - pos.y
        local dz = hitCoords.z - pos.z
        local dist = math.sqrt(dx*dx + dy*dy + dz*dz)
        local safeRatio = math.max(0.0, (dist - 0.3)) / math.max(dist, 0.01)
        desiredX = pos.x + dx * safeRatio
        desiredY = pos.y + dy * safeRatio
        desiredZ = pos.z + dz * safeRatio
    end

    SetCamCoord(GizmoState.cam, desiredX, desiredY, desiredZ)
    PointCamAtCoord(GizmoState.cam, pos.x, pos.y, pos.z)
end

-- Cleanup all gizmo state (called on ESC / resource stop)
function CleanupGizmo()
    GizmoState.active = false
    if GizmoState.prop and DoesEntityExist(GizmoState.prop) then
        DeleteEntity(GizmoState.prop)
    end
    GizmoState.prop = nil
    if GizmoState.cam then
        RenderScriptCams(false, false, 0, true, true)
        DestroyCam(GizmoState.cam, false)
    end
    GizmoState.cam = nil
end

-- ─────────────────────────────────────────────────────────
--  PROP PLACEMENT (ghost prop + raycast loop)
-- ─────────────────────────────────────────────────────────
function PlaceProp(modelName)
    local model = joaat(modelName)
    RequestModel(model)
    local timeout = 0
    while not HasModelLoaded(model) do
        Wait(50)
        timeout = timeout + 50
        if timeout > 5000 then
            SetModelAsNoLongerNeeded(model)
            NUINotify({ title = "Error", description = "Model not found: " .. modelName, type = "error" })
            return false
        end
    end

    local ghostProp  = nil
    local heightOff  = 0.0          -- vertical offset above raycast hit
    local rot        = {x=0,y=0,z=0}
    local axisNames  = {"Z","X","Y"}
    local axisIdx    = 1            -- 1=Z, 2=X, 3=Y
    local lastCoords = nil          -- last known ground coords (used when no hit)

    local function buildHint()
        local fine = IsControlPressed(0, 21) -- Shift
        local axis = axisNames[axisIdx]
        local step = fine and "1°/0.01m" or "5°/0.05m"
        return string.format(
            "[E] Potvrdit  [X] Zrusit\n" ..
            "[Q] -%s° ↺  [R] +%s° ↻  [G] Osa: %s\n" ..
            "[Scroll] Výška: %.2f m  [Shift] Přesný režim (%s)",
            axis, axis, axis, heightOff, step
        )
    end

    while true do
        Wait(0)

        local fine     = IsControlPressed(0, 21)       -- Shift held
        local rotStep  = fine and 1.0  or 5.0
        local hStep    = fine and 0.01 or 0.05

        local hit, _, groundCoords = lib.raycast.cam(1 | 16)

        -- Update last known position when we have a hit
        if hit and groundCoords then
            lastCoords = groundCoords
        end

        if lastCoords then
            local px = lastCoords.x
            local py = lastCoords.y
            local pz = lastCoords.z + heightOff

            lib.showTextUI(buildHint())

            if not ghostProp then
                ghostProp = CreateObject(model, px, py, pz, false, true, false)
                SetEntityCollision(ghostProp, false, true)
                SetEntityAsMissionEntity(ghostProp, true, true)
                SetEntityAlpha(ghostProp, 150, false)
                SetEntityRotation(ghostProp, rot.x, rot.y, rot.z, 2, true)
            else
                -- Only follow ground when we actually have a fresh hit
                if hit then
                    SetEntityCoords(ghostProp, px, py, pz, false, false, false, true)
                end

                -- ── Height — mouse wheel ──────────────────────────
                if IsControlJustPressed(0, 241) then   -- scroll up
                    heightOff = heightOff + hStep
                    local c = GetEntityCoords(ghostProp)
                    SetEntityCoords(ghostProp, c.x, c.y, c.z + hStep, false, false, false, true)
                end
                if IsControlJustPressed(0, 242) then   -- scroll down
                    heightOff = heightOff - hStep
                    local c = GetEntityCoords(ghostProp)
                    SetEntityCoords(ghostProp, c.x, c.y, c.z - hStep, false, false, false, true)
                end

                -- ── Rotation axis cycle — G (control 47) ─────────
                if IsControlJustPressed(0, 47) then
                    axisIdx = (axisIdx % 3) + 1
                end

                -- ── Rotation — Q / R ──────────────────────────────
                if IsControlJustPressed(0, 15) then   -- Q
                    if axisIdx == 1 then rot.z = rot.z + rotStep
                    elseif axisIdx == 2 then rot.x = rot.x + rotStep
                    else rot.y = rot.y + rotStep end
                    SetEntityRotation(ghostProp, rot.x, rot.y, rot.z, 2, true)
                end
                if IsControlJustPressed(0, 14) then   -- R
                    if axisIdx == 1 then rot.z = rot.z - rotStep
                    elseif axisIdx == 2 then rot.x = rot.x - rotStep
                    else rot.y = rot.y - rotStep end
                    SetEntityRotation(ghostProp, rot.x, rot.y, rot.z, 2, true)
                end

                -- ── Confirm — E ───────────────────────────────────
                if IsControlJustReleased(0, 38) then
                    local fc = GetEntityCoords(ghostProp)
                    lib.hideTextUI()
                    DeleteEntity(ghostProp)
                    SetModelAsNoLongerNeeded(model)
                    return {
                        coords   = vector3(fc.x, fc.y, fc.z),
                        rotation = vector3(rot.x, rot.y, rot.z),
                    }
                end
            end
        end

        -- ── Cancel — X (always active) ────────────────────────────
        if IsControlJustReleased(0, 73) then
            lib.hideTextUI()
            if ghostProp then DeleteEntity(ghostProp) end
            SetModelAsNoLongerNeeded(model)
            return false
        end
    end
end

-- ─────────────────────────────────────────────────────────
--  PROP GENERATION (reads blips from Jobs)
-- ─────────────────────────────────────────────────────────
local function GenerateProps()
    for _, prop in pairs(Props) do
        if DoesEntityExist(prop.entity) then
            DeleteEntity(prop.entity)
        end
    end
    Props = {}

    for _, job in pairs(Jobs) do
        if job.props then
            for _, propData in pairs(job.props) do
                local model = joaat(propData.model)
                RequestModel(model)
                while not HasModelLoaded(model) do Wait(10) end
                
                local entity = CreateObject(model, propData.coords.x, propData.coords.y, propData.coords.z, false, false, false)
                SetEntityRotation(entity, propData.rotation.x, propData.rotation.y, propData.rotation.z, 2, true)
                FreezeEntityPosition(entity, true)
                
                table.insert(Props, {
                    model = propData.model,
                    coords = propData.coords,
                    rotation = propData.rotation,
                    entity = entity
                })
            end
        end
    end
end

local function GenerateBlips()
    -- Remove old blips
    for _, blip in pairs(Blips) do
        if DoesBlipExist(blip) then
            RemoveBlip(blip)
        end
    end
    Blips = {}

    local playerJob = BRIDGE.GetPlayerJob()

    for _, job in pairs(Jobs) do
        if job.blips then
            for _, blipData in pairs(job.blips) do
                -- Skip job-only blips if player doesn't have this job
                if blipData.jobOnly and playerJob ~= job.job then
                    -- don't add
                else
                    local blip = AddBlipForCoord(blipData.coords.x, blipData.coords.y, blipData.coords.z)
                    SetBlipSprite(blip, blipData.sprite or 1)
                    SetBlipColour(blip, blipData.color or 2)
                    SetBlipScale(blip, blipData.scale or 0.8)
                    SetBlipAsShortRange(blip, true)
                    BeginTextCommandSetBlipName("STRING")
                    AddTextComponentString(blipData.label or "")
                    EndTextCommandSetBlipName(blip)
                    table.insert(Blips, blip)
                end
            end
        end
    end
end


local function AddNewPed(pedData)
  table.insert(Peds, pedData)
end

local function generateCrafting(craftItems)
  if craftItems then
    OpenNUI("crafting", {
      items = craftItems,
      imageDir = Config.DirectoryToInventoryImages,
    })
  end
end

local function openCashRegister(job)
  local cashBalance = lib.callback.await('pls_jobsystem:server:getBalance', 100, job)
  if cashBalance then
    OpenNUI("cashRegister", {
      balance = cashBalance,
      job = job,
    })
  end
end

local isInteractiveCrafting = false
-- Pending IC data — used by nui.lua selectICRecipe callback
ICPendingStation  = nil
ICPendingRecipes  = nil

-- Normalize station to new multi-recipe format.
-- Handles legacy stations that had a single recipe stored flat on the station.
local function NormalizeICStation(station)
    if type(station.recipes) == "table" and #station.recipes > 0 then
        return station
    end
    -- Legacy single-recipe format
    if station.resultItem and station.resultItem ~= "" then
        local recipe = {
            id              = station.id .. "_r0",
            label           = station.label or "Recept",
            resultItem      = station.resultItem,
            resultCount     = station.resultCount or 1,
            resultPropModel = station.resultPropModel or "",
            resultPropRotation = station.resultPropRotation or {x=0,y=0,z=0},
            ingredients     = station.ingredients or {},
        }
        return { id = station.id, label = station.label, coords = station.coords, recipes = {recipe} }
    end
    -- No recipes at all — return as-is (recipes will be empty)
    return { id = station.id, label = station.label, coords = station.coords, recipes = station.recipes or {} }
end

local function SafeLoadModel(modelHash)
    if not IsModelInCdimage(modelHash) then return false end
    RequestModel(modelHash)
    local t = 0
    while not HasModelLoaded(modelHash) and t < 5000 do
        Wait(50)
        t = t + 50
    end
    return HasModelLoaded(modelHash)
end

-- ─── Core crafting loop — called after recipe is selected ───
function StartICWithRecipe(station, recipe)
    if isInteractiveCrafting then return end

    lib.callback('pls_jobsystem:server:checkICIngredients', 1000, function(hasItems)
        if not hasItems then
            local locale = Locales[Config.Locale or "en"] or Locales["en"]
            NUINotify({
                title = locale.error or "Error",
                description = locale.not_enough_items or "Nemas vsechny potrebne suroviny.",
                type = "error"
            })
            return
        end

        isInteractiveCrafting = true
        local totalSteps = #recipe.ingredients
        local currentStep = 1
        local ped = cache.ped

        -- Spawn ingredient props
        local spawnedProps = {}
        for _, ing in ipairs(recipe.ingredients) do
            if ing.propModel and ing.propModel ~= "" then
                local model = joaat(ing.propModel)
                if SafeLoadModel(model) then
                    local prop = CreateObject(model, ing.propCoords.x, ing.propCoords.y, ing.propCoords.z, false, true, false)
                    SetEntityRotation(prop, ing.propRotation.x, ing.propRotation.y, ing.propRotation.z, 2, true)
                    FreezeEntityPosition(prop, true)
                    SetEntityCollision(prop, true, true)
                    SetEntityAsMissionEntity(prop, true, true)
                    table.insert(spawnedProps, prop)
                else
                    table.insert(spawnedProps, nil)
                end
            else
                table.insert(spawnedProps, nil)
            end
        end

        -- Result prop (invisible, fades in as steps complete)
        local resultProp = nil
        if recipe.resultPropModel and recipe.resultPropModel ~= "" then
            local model = joaat(recipe.resultPropModel)
            if SafeLoadModel(model) then
                resultProp = CreateObject(model,
                    station.coords.x, station.coords.y, station.coords.z + 0.5,
                    false, true, false)
                SetEntityRotation(resultProp,
                    recipe.resultPropRotation.x, recipe.resultPropRotation.y, recipe.resultPropRotation.z,
                    2, true)
                FreezeEntityPosition(resultProp, true)
                SetEntityCollision(resultProp, false, false)
                SetEntityAsMissionEntity(resultProp, true, true)
                SetEntityAlpha(resultProp, 0, false)
            end
        end

        -- Camera above the station
        local cam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
        SetCamCoord(cam, station.coords.x, station.coords.y, station.coords.z + 1.2)
        SetCamRot(cam, -70.0, 0.0, GetEntityHeading(ped), 2)
        SetCamActive(cam, true)
        RenderScriptCams(true, true, 1000, true, true)
        FreezeEntityPosition(ped, true)

        -- Tell React to switch panel to crafting mode (no NUI focus)
        SendNUIMessage({
            action = "startICCrafting",
            data = {
                station    = station,
                recipe     = recipe,
                currentStep = currentStep,
                totalSteps  = totalSteps,
            }
        })

        -- Main interaction loop
        CreateThread(function()
            while isInteractiveCrafting do
                Wait(0)

                -- Allow camera orbit with right stick / mouse
                local axisX = GetControlNormal(0, 220)
                local axisY = GetControlNormal(0, 221)
                if axisX ~= 0.0 or axisY ~= 0.0 then
                    local rot = GetCamRot(cam, 2)
                    local pitch = math.max(-90.0, math.min(-30.0, rot.x - axisY * 2.0))
                    SetCamRot(cam, pitch, rot.y, rot.z - axisX * 2.0, 2)
                end

                local hit, entityHit = lib.raycast.cam(1 | 16)
                local curProp = spawnedProps[currentStep]

                if curProp and hit and entityHit == curProp then
                    lib.showTextUI("[E] Pouzit " .. recipe.ingredients[currentStep].itemName)

                    if IsControlJustReleased(0, 38) then
                        lib.hideTextUI()
                        local ingItem  = recipe.ingredients[currentStep].itemName
                        local ingCount = recipe.ingredients[currentStep].itemCount

                        local ok = lib.callback.await('pls_jobsystem:server:consumeICIngredient', 1000, ingItem, ingCount)
                        if ok then
                            -- Slide prop toward center then delete
                            local targetZ = station.coords.z + 0.5
                            for _ = 1, 25 do
                                Wait(20)
                                if DoesEntityExist(curProp) then
                                    local c = GetEntityCoords(curProp)
                                    SetEntityCoords(curProp,
                                        c.x + (station.coords.x - c.x) * 0.1,
                                        c.y + (station.coords.y - c.y) * 0.1,
                                        c.z + (targetZ             - c.z) * 0.1,
                                        false, false, false, false)
                                end
                            end
                            DeleteEntity(curProp)
                            spawnedProps[currentStep] = nil

                            -- Fade result prop in
                            if DoesEntityExist(resultProp) then
                                local alpha = math.floor(25 + (currentStep / totalSteps) * 230)
                                SetEntityAlpha(resultProp, alpha, false)
                            end

                            currentStep = currentStep + 1
                            SendNUIMessage({
                                action = "updateCraftingStep",
                                data   = { currentStep = currentStep, totalSteps = totalSteps }
                            })

                            if currentStep > totalSteps then
                                TriggerSecureEvent('pls_jobsystem:server:finishIC', recipe.resultItem, recipe.resultCount)
                                Wait(1500)
                                break
                            end
                        else
                            NUINotify({ title = "Error", description = "Nemas " .. ingItem, type = "error" })
                            break
                        end
                    end
                else
                    lib.hideTextUI()
                end

                -- X to cancel
                if IsControlJustReleased(0, 73) then break end
            end

            -- Cleanup
            lib.hideTextUI()
            isInteractiveCrafting = false
            FreezeEntityPosition(ped, false)
            RenderScriptCams(false, true, 1000, true, true)
            DestroyCam(cam, false)
            SendNUIMessage({ action = "closePanel" })

            for _, p in pairs(spawnedProps) do
                if p and DoesEntityExist(p) then DeleteEntity(p) end
            end
            if resultProp and DoesEntityExist(resultProp) then DeleteEntity(resultProp) end
        end)
    end, recipe.ingredients)
end

-- ─── Entry point — opens recipe selection panel ─────────────
function StartInteractiveCrafting(station, jobName)
    if isInteractiveCrafting then return end

    local normalized = NormalizeICStation(station)
    local recipes = normalized.recipes

    if #recipes == 0 then
        NUINotify({ title = "Error", description = "Stanice nema zadne recepty.", type = "error" })
        return
    end

    ICPendingStation = normalized
    ICPendingRecipes = recipes

    -- Open selection panel WITH NUI focus so player can pick a recipe
    SetNuiFocus(true, true)
    isNUIOpen = true
    SendNUIMessage({
        action = "openPanel",
        data = {
            panel = "interactiveCrafting",
            data = {
                station  = normalized,
                recipes  = recipes,
                mode     = "selection",
                imageDir = Config.DirectoryToInventoryImages,
            },
            items  = GetItemsArray(),
            locale = GetLocale(),
        }
    })
end

-- ─── Cancel handler ─────────────────────────────────────────
RegisterNetEvent('pls_jobsystem:client:cancelInteractiveCrafting')
AddEventHandler('pls_jobsystem:client:cancelInteractiveCrafting', function()
    isInteractiveCrafting = false
end)

local function GenerateCraftings()
  for _, job in pairs(Jobs) do
    if job.interactiveCraftings then
      for _, ic in pairs(job.interactiveCraftings) do
        local targetId = BRIDGE.AddSphereTarget({
          coords = vector3(ic.coords.x, ic.coords.y, ic.coords.z),
          options = {{
              name = 'ic_'..ic.id,
              icon = 'fa-solid fa-flask',
              label = ic.label,
              onSelect = function()
                local jobname = BRIDGE.GetPlayerJob()
                if jobname == job.job then
                  StartInteractiveCrafting(ic, job.job)
                else
                  local locale = Locales[Config.Locale or "en"] or Locales["en"]
                  NUINotify({title = locale.error or "Error", description = locale.not_your_job or "You can't use this.", type = "error"})
                end
              end
          }},
          debug = false,
          radius = 0.5,
        })
        table.insert(Targets, targetId)
      end
    end
    for _, crafting in pairs(job.craftings) do
      local targetId = BRIDGE.AddSphereTarget({
        coords = vector3(crafting.coords.x, crafting.coords.y, crafting.coords.z),
        options = {
            {
                name = 'sphere',
                icon = 'fa-solid fa-circle',
                label = crafting.label,
                onSelect = function(data)
                  local jobname = BRIDGE.GetPlayerJob()
                  if jobname == job.job then
                    generateCrafting(crafting.items)
                  else
                    local locale = Locales[Config.Locale or "en"] or Locales["en"]
                    NUINotify({
                      title = locale.error or "Error",
                      description = locale.not_your_job or "You can't use this.",
                      type = "error"
                    })
                  end
                end
            },
        },
        debug = false,
        radius = 0.2,
      })
      table.insert(Targets, targetId)
    end

    ------- CASH REGISTER
    if job.register then
      local CashRegister = BRIDGE.AddSphereTarget({
        coords = vector3(job.register.x, job.register.y, job.register.z),
        options = {
            {
                name = 'bell',
                icon = 'fa-solid fa-circle',
                label = "Cash register",
                onSelect = function(data)
                  local jobname = BRIDGE.GetPlayerJob()
                  if jobname == job.job then
                    openCashRegister(job.job)
                  else
                    local locale = Locales[Config.Locale or "en"] or Locales["en"]
                    NUINotify({
                      title = locale.error or "Error",
                      description = locale.not_your_job or "You can't use this.",
                      type = "error"
                    })
                  end
                end
            },
        },
        debug = false,
        radius = 0.2,
      })
      table.insert(Targets, CashRegister)
    end

    ------- ALARM
    if job.alarm then
      local AlarmTarget = BRIDGE.AddSphereTarget({
        coords = vector3(job.alarm.x, job.alarm.y, job.alarm.z),
        options = {
            {
                name = 'bell',
                icon = 'fa-solid fa-circle',
                label = "Alarm",
                onSelect = function(data)
                  local jobname = BRIDGE.GetPlayerJob()
                  if jobname == job.job then
                    OpenNUI("confirm", {
                      header = "Call police",
                      content = "You really want to call police?",
                      onConfirmCallback = "callAlarm",
                      callbackData = {
                        coords = { x = job.alarm.x, y = job.alarm.y, z = job.alarm.z },
                        jobLabel = job.label,
                      }
                    })
                  else
                    local locale = Locales[Config.Locale or "en"] or Locales["en"]
                    NUINotify({
                      title = locale.error or "Error",
                      description = locale.not_your_job or "You can't use this.",
                      type = "error"
                    })
                  end
                end
            },
        },
        debug = false,
        radius = 0.2,
      })
      table.insert(Targets, AlarmTarget)
    end

    if job.bossmenu then
      local BossTarget = BRIDGE.AddSphereTarget({
        coords = vector3(job.bossmenu.x, job.bossmenu.y, job.bossmenu.z),
        options = {
            {
                name = 'bell',
                icon = 'fa-solid fa-laptop',
                label = "Boss menu",
                onSelect = function(data)
                  local jobname = BRIDGE.GetPlayerJob()
                  if jobname == job.job then
                    openBossmenu(job.job)
                  else
                    local locale = Locales[Config.Locale or "en"] or Locales["en"]
                    NUINotify({
                      title = locale.error or "Error",
                      description = locale.not_your_job or "You can't use this.",
                      type = "error"
                    })
                  end
                end
            },
        },
        debug = false,
        radius = 0.2,
      })
      table.insert(Targets, BossTarget)
    end

    if job.stashes then
      for _, stash in pairs(job.stashes) do
        local stashID = BRIDGE.AddSphereTarget({
          coords = vector3(stash.coords.x, stash.coords.y, stash.coords.z),
          options = {
              {
                  name = stash.id,
                  icon = 'fa-solid fa-boxes-stacked',
                  label = stash.label,
                  onSelect = function(data)
                    if stash.job then
                      local jobname = BRIDGE.GetPlayerJob()
                      if jobname == job.job then
                        BRIDGE.OpenStash(stash.id, stash.weight, stash.slots)
                      else
                        local locale = Locales[Config.Locale or "en"] or Locales["en"]
                        NUINotify({
                          title = locale.error or "Error",
                          description = locale.not_your_job or "You can't use this.",
                          type = "error"
                        })
                      end
                    else
                      BRIDGE.OpenStash(stash.id)
                    end
                  end
              },
          },
          debug = false,
          radius = 0.2,
        })
        table.insert(Targets, stashID)
      end
    end
    if job.shops then
      for _, shop in pairs(job.shops) do
        local shopTarget = BRIDGE.AddSphereTarget({
          coords = vector3(shop.coords.x, shop.coords.y, shop.coords.z),
          options = {
              {
                  name = shop.id,
                  icon = 'fa-solid fa-store',
                  label = shop.label,
                  onSelect = function(data)
                    local jobname = BRIDGE.GetPlayerJob()
                    if jobname == job.job then
                      OpenNUI("shop", {
                        items = shop.items,
                        label = shop.label,
                        job = job.job,
                        imageDir = Config.DirectoryToInventoryImages,
                      })
                    else
                      local locale = Locales[Config.Locale or "en"] or Locales["en"]
                      NUINotify({
                        title = locale.error or "Error",
                        description = locale.not_your_job or "You can't use this.",
                        type = "error"
                      })
                    end
                  end
              },
          },
          debug = false,
          radius = 0.2,
        })
        table.insert(Targets, shopTarget)
      end
    end
    if job.peds then
      for _, ped in pairs(Peds) do
        if ped.entity then
          DeleteEntity(ped.entity)
        end
      end
      Peds = {}
      for _, ped in pairs(job.peds) do
        AddNewPed(ped)
      end
    end
  end
end


RegisterNetEvent("pls_jobsystem:client:recivieJobs")
AddEventHandler("pls_jobsystem:client:recivieJobs", function(ServerJobs)
  if Jobs then
    Jobs = ServerJobs
    GenerateCraftings()
    GenerateBlips()
    GenerateProps()
  end
end)


RegisterNetEvent("pls_jobsystem:client:Pull")
AddEventHandler("pls_jobsystem:client:Pull", function(ServerJobs)
  for _, tid in pairs(Targets) do
    BRIDGE.RemoveSphereTarget(tid)
  end
  Wait(100)
  Jobs = ServerJobs
  Wait(100)
  GenerateCraftings()
  GenerateBlips()
  GenerateProps()
  -- Update creative mode if open
  UpdateCreativeJobs(Jobs)
end)


CreateThread(function()
  while true do
    local playerCoords = GetEntityCoords(cache.ped)
    for i, ped in pairs(Peds) do
      if not Peds[i].entity then
          if #(vector3(playerCoords.x, playerCoords.y, playerCoords.z) - vector3(ped.coords.x, ped.coords.y, ped.coords.z)) < 60.0  then
              local model  = ped.model
              RequestModel(model)
              while not HasModelLoaded(model) do
                  Wait(50)
              end
              Peds[i].entity = CreatePed(4, model, ped.coords.x, ped.coords.y, ped.coords.z-1, ped.heading, false, true)
              FreezeEntityPosition(Peds[i].entity, true)
              SetEntityInvincible(Peds[i].entity, true)
              SetBlockingOfNonTemporaryEvents(Peds[i].entity, true)
              if ped.animDict and ped.animAnim then
                RequestAnimDict(ped.animDict)
                while not HasAnimDictLoaded(ped.animDict) do
                  Wait(50)
                end

                TaskPlayAnim(Peds[i].entity, ped.animDict, ped.animAnim, 8.0, 0, -1, 1, 0, 0, 0)
              end
          end
      else
          if #(vector3(playerCoords.x, playerCoords.y, playerCoords.z) - vector3(ped.coords.x, ped.coords.y, ped.coords.z)) > 60.0 then
              DeleteEntity(Peds[i].entity)
              Peds[i].entity = nil
          end
      end
    end
    Wait(8000)
  end
end)

-- Props distance-based spawn/despawn thread
CreateThread(function()
  while true do
    local playerCoords = GetEntityCoords(cache.ped)
    for i, propData in pairs(Props) do
      local dist = #(vector3(playerCoords.x, playerCoords.y, playerCoords.z)
                    - vector3(propData.coords.x, propData.coords.y, propData.coords.z))
      if not Props[i].entity then
        if dist < 60.0 then
          local model = joaat(propData.model)
          RequestModel(model)
          while not HasModelLoaded(model) do Wait(50) end
          local ent = CreateObject(model, propData.coords.x, propData.coords.y, propData.coords.z, false, false, false)
          SetEntityRotation(ent, propData.rotation.x, propData.rotation.y, propData.rotation.z, 2, true)
          FreezeEntityPosition(ent, true)
          SetModelAsNoLongerNeeded(model)
          Props[i].entity = ent
        end
      else
        if dist > 65.0 then
          DeleteEntity(Props[i].entity)
          Props[i].entity = nil
        end
      end
    end
    Wait(8000)
  end
end)
