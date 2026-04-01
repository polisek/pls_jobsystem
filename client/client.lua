local Jobs = {}
local Targets = {}
local Peds = {}
local items = BRIDGE.GetItems()

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

local function GenerateCraftings()
  for _, job in pairs(Jobs) do
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
