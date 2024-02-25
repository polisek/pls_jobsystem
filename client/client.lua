local Jobs = {}
local Targets = {}

local items = BRIDGE.GetItems()

local function generateCrafting(craftItems)
  local options = {}
  local metadata = {}
  if craftItems then
      options = {}
    for _, k in pairs(craftItems) do
      metadata = {
          {label = "Required items", value = ""}
      }
      for _, l in pairs(k.ingedience) do
          local label = items[l.itemName].label
          if not items[l.itemName] then
          print("[PLS] Error  ITEM NOT FOUND")
          end
          table.insert(metadata, {label = label, value = l.itemCount})
      end
      local count = 1
      if k.count then
          count = k.count
      end
      table.insert(options,
          {
          title = items[k.itemName].label.." - "..count.." ks",
          icon = 'hand',
          image = Config.DirectoryToInventoryImages..k.itemName..".png",
          onSelect = function()
              local hasAllItems = true
              for _, v in pairs(k.ingedience) do
                  if v.itemCount > BRIDGE.GetItemCount(v.itemName) then
                    hasAllItems = false
                  end
              end
              if hasAllItems then
                if lib.progressCircle({
                  duration = 10000,
                  label = 'Připravuješ '..items[k.itemName].label,
                  position = 'bottom',
                  useWhileDead = false,
                  canCancel = true,
                  disable = {
                      car = true,
                      move = true,
                  },
                  anim = {
                      dict = Config.DEFAULT_ANIM_DIC,
                      clip = Config.DEFAULT_ANIM
                  },
                }) then 
                  TriggerSecureEvent("pls_jobsystem:server:createItem", k)
                end
              else
                lib.notify({
                  title="Job",
                  description="Your dont have all items!",
                  type="error"
                })
              end
          end,
          metadata = metadata,
          }
      )
  
      end
      lib.registerContext({
          id = "job_system_crafting",
          title = "Jobs",
          options = options
      })
      lib.showContext("job_system_crafting")
    end
end

local function openCashRegister(job)
  local cashBalance = lib.callback.await('pls_jobsystem:server:getBalance',100,job)
  if cashBalance then
    lib.registerContext({
        id = "cash_register",
        title = "Cash register",
        options = {
          {
            name = 'balance',
            icon = 'fa-solid fa-dollar',
            title = "Balance: "..cashBalance,
          },
          {
            name = 'withdraw',
            icon = 'fa-solid fa-arrow-down',
            title = "Withdraw",
            -- groups = job.job,
            onSelect = function(data)
              local input = lib.inputDialog('Create new job', 
              {
                {type = 'number', label = 'Withdraw', description = 'How much you want withdraw?', icon = 'hashtag', min = 1,},
              })
              if input then
                TriggerSecureEvent("pls_jobsystem:server:makeRegisterAction", job, "withdraw", input[1])
              end
            end
          },
          {
            name = 'deposit',
            icon = 'fa-solid fa-arrow-up',
            title = "Deposit",
            -- groups = job.job,
            onSelect = function(data)
              local input = lib.inputDialog('Create new job', 
              {
                {type = 'number', label = 'Deposit', description = 'How much you want deposit', icon = 'hashtag', min = 1,},
              })
              if input then
                TriggerSecureEvent("pls_jobsystem:server:makeRegisterAction", job, "deposit", input[1])
              end
            end
          },
        }
    })
    lib.showContext("cash_register")
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
                -- groups = job.job,
                onSelect = function(data)
                  local jobname = BRIDGE.GetPlayerJob()
                  if jobname == job.job then
                    generateCrafting(crafting.items)
                  else
                    lib.notify({
                      title="Not for you",
                      description="You can't use this.",
                      type="error"
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
                -- groups = job.job,
                onSelect = function(data)
                  local jobname = BRIDGE.GetPlayerJob()
                  if jobname == job.job then
                    openCashRegister(job.job)
                  else
                    lib.notify({
                      title="Not for you",
                      description="You can't use this.",
                      type="error"
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
                -- groups = job.job,
                onSelect = function(data)
                  local jobname = BRIDGE.GetPlayerJob()
                  if jobname == job.job then
                      local alert = lib.alertDialog({
                        header = "Call police",
                        content = "You really want call police? ",
                        centered = true,
                        cancel = true
                    })
                    if alert == "confirm" then
                      SendDispatch(GetEntityCoords(cache.ped), job.label)
                    end
                  else
                    lib.notify({
                      title="Not for you",
                      description="You can't use this.",
                      type="error"
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
end)
