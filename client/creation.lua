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


local function selectJob(jobData)
  selectedJob = jobData
  lib.registerContext({
    id = 'job_manipulate',
    title = 'Job menu',
    options = {
      {
        title = selectedJob.label,
        description = "Click here for rename",
        icon = 'circle',
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
        icon = 'circle',
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
        title = "Craftings",
        description = "Click here for open crafting menu",
        icon = 'circle',
        onSelect = function()
          EditCrafings()
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
      }
    }
  })
  lib.showContext("job_manipulate")
end


local function openCraftingTable(id)
  local selectedCrafting = selectedJob.craftings[id]
  cached.crafting_table_id = id
  if selectedCrafting then
    local options = {}
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
          local input = lib.inputDialog('Select item and ingedience', {
            { type = 'select', label = "Main item", description =  "This is the item you want to crafting.",required = true, options = item_select, clearable = true },
            { type = 'multi-select', label = "Ingedience", description =  "Required",required = true, options = item_select, clearable = true },
          })
          if input then

            local defineIngedience = {}
            for _, selectedIngedience in pairs(input[2]) do
              table.insert(defineIngedience, {
                itemName = selectedIngedience,
                itemCount = 1,
              })
            end

            local newTable = {
              itemName = input[1],
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
  local options = {}
  if cached.crafting_item_id then
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

