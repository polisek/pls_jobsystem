-- VARIABLES
local items = BRIDGE.GetItems()
local selectedJob = {}

-- DEFINE ITEMS for lib select
local item_select = {}
local cached = {
  crafting_table_id = nil,
  crafting_item_id = nil,
  crafting_ingredience_id = nil,
}


-- FUNCTIONS
local function IsBlacklistedString(text)
  for _, v in pairs(Config.BlacklistedStrings) do
    if string.find(string.lower(text),string.lower(v)) then
      return true
    end
  end
  return false
end


for _, v in pairs(items) do
  if not IsBlacklistedString(v.name) then
    table.insert(item_select, {
      label = v.label,
      value = v.name,
    })  
  end
end



local function CreateNewCraftingPoint()
  lib.notify({
    title="Select point",
    description="Confirm by [ E ]",
    type="inform"
  })
  while true do
    Wait(0)
    local hit, entity, coords = lib.raycast.cam(1|16)
    if hit then
      DrawSphere(coords.x,coords.y,coords.z, 0.2, 0, 0, 255, 0.2)
      if IsControlJustPressed(1, 38) then -- E
        return coords
      end
    end
  end
end

local function CreateCraftingTable()
  local coords = CreateNewCraftingPoint()
  if coords then
    if selectedJob.craftings then
      local input = lib.inputDialog('Create new job', 
      {
        {type = 'input', label = 'Label', description = 'Add crafting table label', required = true, min = 4, max = 32},
      })
      if not input then return end
      table.insert(selectedJob.craftings,{
        id = selectedJob.job..#selectedJob.craftings.."_"..math.random(1,9999),
        label = input[1],
        coords = coords,
        items = {

        }
      })
      local alert = lib.alertDialog({
        header = 'Crafting creation',
        content = '# Crafting done! You want create new crafting point? ',
        centered = true,
        cancel = true
      })

      if alert == "confirm" then
        CreateCraftingTable()
      else
        TriggerSecureEvent("pls_jobsystem:server:saveNewJob", selectedJob)
      end
    end
  end
end


local function CreateNewStash()
  local coords = CreateNewCraftingPoint()
  if coords then

      local input = lib.inputDialog('Create stash', 
      {
        {type = 'input', label = 'Label', description = 'Stash label', required = true, min = 4, max = 32},
        {type = 'number', label = 'Slots', description = 'How many slots do you want?', required = true},
        {type = 'number', label = 'Weight', description = 'Maximum weight', required = true},
        {type="select", label = "Limited by job", description = "You want limite by job?",required = true,
        options={
          {
            label = "Yes",
            value = "yyy",
          },
          {
            label = "No",
            value = "nah",
          },
        } }
      })
      if not input then return end
      if not selectedJob.stashes then
        selectedJob.stashes = {}
      end
      local limitedByJob = false
      if input[4] == "yyy" then
        limitedByJob = true
      end
      table.insert(selectedJob.stashes,{
        id = selectedJob.job..#selectedJob.stashes.."_"..math.random(1,9999),
        label = input[1],
        coords = coords,
        slots = input[2],
        weight = input[3],
        job = limitedByJob,
      })
      TriggerSecureEvent("pls_jobsystem:server:saveNewJob", selectedJob)
  end
end


local function CreateNewPed()
    local input = lib.inputDialog('Create ped', 
    {
      {type = 'input', label = 'Label', description = 'Ped name', required = true, min = 4, max = 32},
      {type = 'input', label = 'Ped model', description = 'Enter ped model', required = true, min = 0, max = 64},
      {type = 'input', label = 'Animation', description = 'Enter animation', required = false, min = 0, max = 64},
      {type = 'input', label = 'Animation DICT', description = 'Enter animation dict', required = false, min = 0, max = 64},
    })
    if not input then return end
    if not selectedJob.peds then
      selectedJob.peds = {}
    end
    table.insert(selectedJob.peds,{
      label = input[1],
      model = input[2],
      coords = GetEntityCoords(cache.ped),
      heading = GetEntityHeading(cache.ped),
      animAnim = input[3],
      animDict = input[4],
    })
    TriggerSecureEvent("pls_jobsystem:server:saveNewJob", selectedJob)
end
local function AddonsExists(value)
  if value then
    return "Created"
  else
    return "Not created"
  end
end

local function selectJob(jobData)
  selectedJob = jobData
  lib.registerContext({
    id = 'job_manipulate',
    title = 'Job menu',
    options = {
      {
        title = selectedJob.label,
        description = "Click here for rename",
        icon = 'quote-left',
        onSelect = function()
          local input = lib.inputDialog('Editing job', 
          {
            {type = 'input', label = 'Label', description = 'Put some name for this job.', required = true, min = 4, max = 16},
          })
          if not input then return end
          selectedJob.label = input[1]
          TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
        end,
      },
      {
        title = "Area size: "..selectedJob.area,
        description = "Click here for change job area",
        icon = 'expand',
        onSelect = function()
          local input = lib.inputDialog('Editing job', 
          {
            {type = 'number', label = 'Area', description = 'How big is the work area?', icon = 'hashtag', min = 10, max = 100},
          })
          if not input then return end
          selectedJob.area = input[1]
          TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
        end,
      },
      {
        title = "Cash register",
        description = "Status: "..AddonsExists(selectedJob.register),
        icon = 'dollar',
        onSelect = function()
          if selectedJob.register then
            local alert = lib.alertDialog({
                header = "Delete cash register",
                content = "Do you really want to delete? ",
                centered = true,
                cancel = true
            })
            if alert == "confirm" then
              selectedJob.register = nil
              TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
            end
          else
            local coords = CreateNewCraftingPoint()
            if coords then
              selectedJob.register = coords
              TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
            end
          end
        end,
      },
      {
        title = "Alarm",
        description = "Status: "..AddonsExists(selectedJob.alarm),
        icon = 'bell',
        onSelect = function()
          if selectedJob.alarm then
            local alert = lib.alertDialog({
                header = "Delete alarm",
                content = "Do you really want to delete? ",
                centered = true,
                cancel = true
            })
            if alert == "confirm" then
              selectedJob.alarm = nil
              TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
            end
          else
            local coords = CreateNewCraftingPoint()
            if coords then
              selectedJob.alarm = coords
              TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
            end
          end
        end,
      },
      {
        title = "Bossmenu",
        description = "Status: "..AddonsExists(selectedJob.bossmenu).." / Export config.lua - function openBossmenu",
        icon = 'laptop',
        onSelect = function()
          if selectedJob.bossmenu then
            local alert = lib.alertDialog({
                header = "Delete bossmenu",
                content = "Do you really want to delete? ",
                centered = true,
                cancel = true
            })
            if alert == "confirm" then
              selectedJob.bossmenu = nil
              TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
            end
          else
            local coords = CreateNewCraftingPoint()
            if coords then
              selectedJob.bossmenu = coords
              TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
            end
          end
        end,
      },
      {
        title = "Craftings",
        description = "Click here for open crafting menu",
        icon = 'box',
        onSelect = function()
          EditCrafings()
        end,
      },
      {
        title = "Stashes",
        description = "Click here for open stashes menu",
        icon = 'boxes-stacked',
        onSelect = function()
          EditStashes()
        end,
      },
      {
        title = "Peds",
        description = "Click here for open ped menu",
        icon = 'person',
        onSelect = function()
          EditPeds()
        end,
      },
      {
        title = "Delete job",
        description = "Click here for delete this job.",
        icon = 'trash',
        onSelect = function()
          local alert = lib.alertDialog({
              header = 'Delete job '..selectedJob.label,
              content = "Do you really want to delete the job? ",
              centered = true,
              cancel = true
          })
          if alert == "confirm" then
            TriggerSecureEvent("pls_jobsystem:server:deleteJob", selectedJob)
          end
        end,
      },
      {
        title = "Pull for ME",
        description = "This pull changes in jobs for you!",
        icon = 'arrow-up',
        onSelect = function()
          TriggerSecureEvent("pls_jobsystem:server:pullChanges", "creator")
        end,
      },
      {
        title = "Pull for ALL",
        description = "This pull changes in jobs for all players on server!",
        icon = 'arrow-up',
        onSelect = function()
          TriggerSecureEvent("pls_jobsystem:server:pullChanges", "all")
        end,
      },
      {
        title = "Back-up",
        description = "This is great if something goes wrong. ( This is backup for ALL JOBS! )",
        icon = 'floppy-disk',
        onSelect = function()
          local options = {
            {
              title="Create backup",
              description="This create backup..",
              icon = "plus",
              onSelect = function()
                TriggerSecureEvent("pls_jobsystem:server:createBackup")
              end
            },
            {
              title="Use last backup!",
              description="This use last backup! FIRST CHECK PLEASE server/backup.json if it is not empty!",
              icon = "floppy-disk",
              onSelect = function()
                local alert = lib.alertDialog({
                  header = 'Restore backup',
                  content = 'Do you really want to do this?  **Please check backup.json in server/backup.json to see if the file exists or is empty!**',
                  centered = true,
                  cancel = true
                })
                if alert == "confirm" then
                  TriggerSecureEvent("pls_jobsystem:server:setBackup")
                end
              end
            }
          }      
          lib.registerContext({
            id = 'job_backupmenu',
            title = "Backup",
            options = options
          })
          lib.showContext("job_backupmenu")
        end,
      }
    }
  })
  lib.showContext("job_manipulate")
end


local function openCraftingTable(id)
  local selectedCrafting = selectedJob.craftings[id]
  cached.crafting_table_id = id
  if selectedCrafting then
    local options = {    }
    for itemId, craftingItem in pairs(selectedCrafting.items) do
      local newOption = {
        title = items[craftingItem.itemName].label,
        description = "Edit existing item.",
        icon = 'circle',
        onSelect = function()
          cached.crafting_item_id = itemId
          EditCraftingItem()
        end,
      }
      table.insert(options, newOption)
    end
    table.insert(options, {
        title = "Create new item",
        description = "Create new item for this crafting table.",
        icon = 'circle',
        onSelect = function()
          local FilterData = {
            useFilter = false,
            filteredData = {}
          }
          :: BackToFilter :: 
          local showedItems = {}
          if FilterData.useFilter then
            for _, filterWorld in pairs(FilterData.filteredData) do
              for _, item in pairs(item_select) do 
                if string.find(string.lower(item.label), string.lower(filterWorld)) then
                  table.insert(showedItems, item)
                end
              end
            end
          else
            showedItems = item_select
            FilterData.filteredData = {}
          end
          local input = lib.inputDialog('Select item and ingedience', {
            { type = 'textarea', label = "Filter - Filled search / Unfilled saves", description =  "Write the labels of the items you want to filter. Separate them with ,",required = false, placeholder = "Meat, Fish, Bone", clearable = true },
            { type = 'select', label = "Main item", description =  "This is the item you want to crafting.",required = true, options = showedItems, clearable = true },
            { type = 'multi-select', label = "Ingedience", description =  "Required",required = true, options = showedItems, clearable = true },
          })
          if input then
            if tostring(input[1]) ~= "" then
              local searched_value = tostring(input[1])
              FilterData.useFilter = true
              for word in searched_value:gmatch("[^,%s]+") do
                  table.insert(FilterData.filteredData, word)
              end
              goto BackToFilter
            end
            if input[1] == "" then
              

                local defineIngedience = {}
                for _, selectedIngedience in pairs(input[3]) do
                  table.insert(defineIngedience, {
                    itemName = selectedIngedience,
                    itemCount = 1,
                  })
                end

                local newTable = {
                  itemName = input[2],
                  itemCount = 1,
                  ingedience = defineIngedience
                }
                table.insert(selectedJob.craftings[id].items, newTable)
                TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
                lib.notify({
                  title="New recipe created",
                  description="Congrats! New recepie has been created.",
                  type="success"
                })
                openCraftingTable(cached.crafting_table_id)
              end
            end
        end,
    })

    table.insert(options, {
      title = "Delete table",
      description = "Click here for delete this table",
      icon = 'trash',
      onSelect = function()
        table.remove(selectedJob.craftings, id)
        lib.notify({
          title="Deleted",
          description = "Crafting table has been deleted",
          type="success" 
        })
        TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
      end
    })

    lib.registerContext({
      id = 'create_new_crafting_item',
      title = 'Job menu',
      options = options
    })
    lib.showContext("create_new_crafting_item")
  end
end

function EditCrafings()
  if selectedJob then
    local options = {}
    for i, crafting in pairs(selectedJob.craftings) do
      local newOption = {
        title = crafting.label,
        description = "Click here for open crafting.",
        icon = 'circle',
        onSelect = function()
          openCraftingTable(i)
        end,
      }
      table.insert(options, newOption)
    end

    table.insert(options, {
      title="New table",
      description="Create new crafting table",
      icon = "plus",
      onSelect = function()
        CreateCraftingTable()
      end
    })

    lib.registerContext({
      id = 'job_crafting_list',
      title = selectedJob.label.. " - Crafting list",
      options = options
    })
    lib.showContext("job_crafting_list")
  end
end


function EditStashes()
  if selectedJob then
    local options = {}
    if not selectedJob.stashes then
      selectedJob.stashes = {}
    end
    for i, stashes in pairs(selectedJob.stashes) do
      local newOption = {
        title = stashes.label,
        description = "Click here for edit stashes. (ox_inventory, quasar_inventory)",
        icon = 'circle',
        onSelect = function()

          local options = {
            {
              title = "Change stash ID",
              description = "Click here if you want to change the stash ID! If you don't know what you are doing don't touch this.",
              icon = 'circle',
              onSelect = function()
                local input = lib.inputDialog('Change stash ID', {'Enter new ID/Name'})
                if input then
                  stashes.id = input[1]
                  TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
                end
              end
            }
            ,{
              title = "Delete stash",
              description = "Click here for delete stash.",
              icon = 'trash',
              onSelect = function()
                print("Stash "..stashes.id.." deleted!")
                print("This message is a last resort if you are an idiot and accidentally clicked.")
                table.remove(selectedJob.stashes, i)
                lib.notify({
                  title="Deleted",
                  description = "Stash deleted!",
                  type="success" 
                })
                TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
              end
            }
          }
          lib.registerContext({
            id = 'job_system_stashes_edit',
            title = 'Job menu',
            options = options
          })
          lib.showContext("job_system_stashes_edit")
        end,
      }
      table.insert(options, newOption)
    end

    table.insert(options, {
      title="New stash",
      description="Create stash (ox_inventory, quasar_inventory)",
      icon = "plus",
      onSelect = function()
        CreateNewStash()
      end
    })

    lib.registerContext({
      id = 'job_stashes_list',
      title = selectedJob.label.. " - Stashes",
      options = options
    })
    lib.showContext("job_stashes_list")
  end
end



function EditPeds()
  if selectedJob then
    local options = {}
    if not selectedJob.peds then
      selectedJob.peds = {}
    end
    for i, ped in pairs(selectedJob.peds) do
      local newOption = {
        title = ped.label,
        description = "Click here for edit ped",
        icon = 'circle',
        onSelect = function()
          local options = {
            {
              title = "Delete ped",
              description = "Click here for delete ped.",
              icon = 'trash',
              onSelect = function()
                table.remove(selectedJob.peds, i)
                lib.notify({
                  title="Deleted",
                  description = "Ped deleted!",
                  type="success" 
                })
                TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
              end
            }
          }
          lib.registerContext({
            id = 'job_system_peds_edit',
            title = 'Job menu',
            options = options
          })
          lib.showContext("job_system_peds_edit")
        end,
      }
      table.insert(options, newOption)
    end

    table.insert(options, {
      title="New ped",
      description="Create ped",
      icon = "plus",
      onSelect = function()
        CreateNewPed()
      end
    })

    lib.registerContext({
      id = 'job_stashes_list',
      title = selectedJob.label.. " - Stashes",
      options = options
    })
    lib.showContext("job_stashes_list")
  end
end

---- EVENTS
RegisterNetEvent("pls_jobsystem:client:createjob")
AddEventHandler("pls_jobsystem:client:createjob", function()
  local newJob = Config.DefaultDataJob
  local input = lib.inputDialog('Create new job', 
  {
    {type = 'input', label = 'Label', description = 'Put some name for this job.', required = true, min = 4, max = 16},
    {type = 'input', label = 'Job name', description = 'Insert existing job name.', required = true, min = 1, max = 16},
    {type = 'number', label = 'Area', description = 'How big is the work area?', icon = 'hashtag', min = 10, max = 100},
  })
 
  if not input then return end
  newJob.label = input[1]
  newJob.coords = GetEntityCoords(cache.ped)
  newJob.job = input[2]
  newJob.area = tonumber(input[3])

  local alert = lib.alertDialog({
    header = 'Crafting creation',
    content = '# Want to create crafting? ',
    centered = true,
    cancel = true
  })

  if alert == "confirm" then
    selectedJob = newJob
    CreateCraftingTable()
  else
    TriggerSecureEvent("pls_jobsystem:server:saveNewJob", newJob)
  end

end)


function EditCraftingItem()
  local count = 1
  if cached.crafting_item_id then
    if selectedJob.craftings[cached.crafting_table_id].items[cached.crafting_item_id].itemCount then
      count = selectedJob.craftings[cached.crafting_table_id].items[cached.crafting_item_id].itemCount
    end
    local options = {
      {
        title = "Count: "..count,
        description = "This is what the player gets",
        icon = 'hashtag',
        onSelect = function()
          print(selectedJob.craftings[cached.crafting_table_id].items[cached.crafting_item_id].itemCount)
          local input = lib.inputDialog('Change count', {'Enter number'})
          if input then
            selectedJob.craftings[cached.crafting_table_id].items[cached.crafting_item_id].itemCount = tonumber(input[1])
            TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
            openCraftingTable(cached.crafting_table_id)
          end
        end
      },
      {
        title = "Change animation",
        description = "Click here for change animation!",
        icon = 'hippo',
        onSelect = function()
          if selectedJob.craftings[cached.crafting_table_id].items[cached.crafting_item_id].animation then
            local alert = lib.alertDialog({
              header = 'Animation clear',
              content = 'This clear animation! ( The default will be used / config.lua )',
              centered = true,
              cancel = true
            })
            if alert == "confirm" then
              selectedJob.craftings[cached.crafting_table_id].items[cached.crafting_item_id].animation = nil
              TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
            end
          else
            local input = lib.inputDialog('Crafting animation', {'Anim', "Dict"})
            if input then
              selectedJob.craftings[cached.crafting_table_id].items[cached.crafting_item_id].animation = { anim = input[1], dict = input[2]}
              TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
            end
          end
          openCraftingTable(cached.crafting_table_id)
        end,
      }
    }
    for ingedienceId, v in pairs(selectedJob.craftings[cached.crafting_table_id].items[cached.crafting_item_id].ingedience) do
      table.insert(options, {
        title = items[v.itemName].label.." - x"..v.itemCount,
        description = "Click here for change count",
        icon = 'circle',
        onSelect = function()
          local input = lib.inputDialog('Change count', {'Enter number'})
          if input then
            selectedJob.craftings[cached.crafting_table_id].items[cached.crafting_item_id].ingedience[ingedienceId].itemCount = tonumber(input[1])
            TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
            openCraftingTable(cached.crafting_table_id)
          end
        end,
      })
    end
    table.insert(options, {
      title = "Delete item",
      description = "Click here for delete this item from crafting",
      icon = 'trash',
      onSelect = function()
        table.remove(selectedJob.craftings[cached.crafting_table_id].items, cached.crafting_item_id)
        TriggerSecureEvent("pls_jobsystem:server:saveJob", selectedJob)
        openCraftingTable(cached.crafting_table_id)
        lib.notify({
          title="Deleted",
          description="Item has been deleted",
          type="success"
        })
      end,
    })
    lib.registerContext({
      id = 'create_new_crafting_item',
      title = 'Job menu',
      options = options
    })
    lib.showContext("create_new_crafting_item")
  end
end


RegisterNetEvent("pls_jobsystem:client:openJobMenu")
AddEventHandler("pls_jobsystem:client:openJobMenu", function(Jobs)

  if Jobs then
    local options = {}
    for _, job in pairs(Jobs) do
     local newOption = {
      title = job.label.." - "..job.job,
      description = 'Craftings '..#job.craftings.." / Area: "..job.area,
      icon = 'circle',
      onSelect = function()
        selectJob(job)
      end,
     } 
     table.insert(options, newOption)
    end
    lib.registerContext({
      id = 'job_menu_open',
      title = 'Job menu',
      options = options
    })
    lib.showContext("job_menu_open")
  end

end)

