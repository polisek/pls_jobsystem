--[[
   _____      _                 _                      _                   
  / ____|    | |               (_)                    | |                  
 | (___   ___| |_ _   _ _ __    _ _ ____   _____ _ __ | |_ ___  _ __ _   _ 
  \___ \ / _ \ __| | | | '_ \  | | '_ \ \ / / _ \ '_ \| __/ _ \| '__| | | |
  ____) |  __/ |_| |_| | |_) | | | | | \ V /  __/ | | | || (_) | |  | |_| |
 |_____/ \___|\__|\__,_| .__/  |_|_| |_|\_/ \___|_| |_|\__\___/|_|   \__, |
                       | |                                            __/ |
                       |_|                                           |___/ 
]]--

local Inventory = nil

local Stashes = {}
local Drops = {}

if BRIDGE.Inventory  == "ox_inventory" then
    Inventory = exports.ox_inventory
end

if BRIDGE.Inventory == "qb_inventory" then
    Inventory = exports['qb-inventory']
end

if BRIDGE.Inventory == "quasar_inventory" then
    Inventory = exports['qs-inventory']
end

--[[
   _____      _     _____ _                     
  / ____|    | |   |_   _| |                    
 | |  __  ___| |_    | | | |_ ___ _ __ ___  ___ 
 | | |_ |/ _ \ __|   | | | __/ _ \ '_ ` _ \/ __|
 | |__| |  __/ |_   _| |_| ||  __/ | | | | \__ \
  \_____|\___|\__| |_____|\__\___|_| |_| |_|___/
                                                
                                                
]]--

BRIDGE.GetItems = function()
    local items = nil
    if BRIDGE.Inventory == "ox_inventory" then
        items = Inventory:Items()
    elseif BRIDGE.Inventory == "qb_inventory" then
        items = Framework.Shared.Items
    elseif BRIDGE.Inventory == "quasar_inventory" then
        items = Inventory:GetItemList()
    end
    return items
end

--[[
   _____      _     _____ _                    _____                  _   
  / ____|    | |   |_   _| |                  / ____|                | |  
 | |  __  ___| |_    | | | |_ ___ _ __ ___   | |     ___  _   _ _ __ | |_ 
 | | |_ |/ _ \ __|   | | | __/ _ \ '_ ` _ \  | |    / _ \| | | | '_ \| __|
 | |__| |  __/ |_   _| |_| ||  __/ | | | | | | |___| (_) | |_| | | | | |_ 
  \_____|\___|\__| |_____|\__\___|_| |_| |_|  \_____\___/ \__,_|_| |_|\__|
                                                                                                                                          
]]--

BRIDGE.GetItemCount = function(playerId, itemName)
    local count = nil
    if BRIDGE.Inventory == "ox_inventory" then
        count = Inventory:Search(playerId, 'count', itemName)
    elseif BRIDGE.Inventory == "qb_inventory" then
        local xPlayer = Framework.Functions.GetPlayer(playerId)
        local item = xPlayer.Functions.GetItemByName(itemName)
        if item ~= nil then 
            count = item.amount 
        else
           count = 0
        end
        if itemName == "money" then
           count = xPlayer.PlayerData.money["cash"]
        end
    elseif BRIDGE.Inventory == "quasar_inventory" then
        count = Inventory:GetItemTotalAmount(playerId, itemName)
    end
    return count
end

--[[ 
           _____  _____ _____ _______ ______ __  __ 
     /\   |  __ \|  __ \_   _|__   __|  ____|  \/  |
    /  \  | |  | | |  | || |    | |  | |__  | \  / |
   / /\ \ | |  | | |  | || |    | |  |  __| | |\/| |
  / ____ \| |__| | |__| || |_   | |  | |____| |  | |
 /_/    \_\_____/|_____/_____|  |_|  |______|_|  |_|
                                                    
                                                    
]]--

BRIDGE.AddItem = function(playerId, itemName, count, metadata)
    local returns = false
    if BRIDGE.Inventory == "ox_inventory" then
        returns = Inventory:AddItem(playerId, itemName, count, metadata)
    elseif BRIDGE.Inventory == "qb_inventory" then
        local QBPlayer = Framework.Functions.GetPlayer(playerId)
        if itemName == "money" then
            returns = QBPlayer.Functions.AddMoney('cash', count)
        else
            returns = QBPlayer.Functions.AddItem(itemName, count,  false, {})
        end
    elseif BRIDGE.Inventory == "quasar_inventory" then
        returns = Inventory:AddItem(playerId, itemName, count)
    end
    return returns
end

--[[ 
  _____  ______ __  __  ______      ________ _____ _______ ______ __  __ 
 |  __ \|  ____|  \/  |/ __ \ \    / /  ____|_   _|__   __|  ____|  \/  |
 | |__) | |__  | \  / | |  | \ \  / /| |__    | |    | |  | |__  | \  / |
 |  _  /|  __| | |\/| | |  | |\ \/ / |  __|   | |    | |  |  __| | |\/| |
 | | \ \| |____| |  | | |__| | \  /  | |____ _| |_   | |  | |____| |  | |
 |_|  \_\______|_|  |_|\____/   \/   |______|_____|  |_|  |______|_|  |_|
                                                                                                                                                                                                
]]--

BRIDGE.RemoveItem = function(playerId, itemName, count)
    local returns = false
    if BRIDGE.Inventory == "ox_inventory" then
        returns = Inventory:RemoveItem(playerId, itemName, count)
    elseif BRIDGE.Inventory == "qb_inventory" then
        local QBPlayer = Framework.Functions.GetPlayer(playerId)
        if itemName == "money" then
            returns = QBPlayer.Functions.RemoveMoney('cash', count)
        else
            returns = QBPlayer.Functions.RemoveItem(itemName, count)
        end
    elseif BRIDGE.Inventory == "quasar_inventory" then
        returns = Inventory:RemoveItem(playerId, itemName, count)
    end
    return returns
end

--[[

 _____           _                   ______                 
/  __ \         | |                  |  _  \                
| /  \/_   _ ___| |_ ___  _ __ ___   | | | |_ __ ___  _ __  
| |   | | | / __| __/ _ \| '_ ` _ \  | | | | '__/ _ \| '_ \ 
| \__/\ |_| \__ \ || (_) | | | | | | | |/ /| | | (_) | |_) |
 \____/\__,_|___/\__\___/|_| |_| |_| |___/ |_|  \___/| .__/ 
                                                     | |    
                                                     |_|    
                                                     
]]--

RegisterNetEvent(GetCurrentResourceName()..':playerLoaded')
AddEventHandler(GetCurrentResourceName()..':playerLoaded',function(playerId)
    TriggerClientEvent(GetCurrentResourceName().."send_data", playerId, Drops)
end)


local function CreateCustomDrop(prop, itemName,itemCount, coords)
    local identifier = "CUSTOM_DROP_"..math.random(1, 99999)
    local dropData = {
        identifier = identifier,
        prop = prop,
        itemName = itemName,
        itemCount = itemCount,
        coords = coords,
    }
    table.insert(Drops, dropData)
    TriggerClientEvent(GetCurrentResourceName().."drops_create", -1, dropData)
end

local function TakeDrop(playerId, dropName)
    for i,v in pairs(Drops) do
        if v.identifier == dropName then
            local ped = GetPlayerPed(playerId)
            local playerCoords = GetEntityCoords(ped)
            if #(v.coords - playerCoords) < 5.0 then
                BRIDGE.AddItem(playerId, v.itemName, v.itemCount)
                table.remove(Drops, i)
                TriggerClientEvent(GetCurrentResourceName().."remove_drop", -1, dropName)
                return true 
            end
        end
    end
    return false
end

RegisterNetEvent(GetCurrentResourceName().."take_drop")
AddEventHandler(GetCurrentResourceName().."take_drop", function(dropName)
    local src = source
    TakeDrop(src, dropName)
end)


BRIDGE.CreateCustomDrop = function(prop, itemName, itemCount, coords)
    CreateCustomDrop(prop,itemName,itemCount, coords)
end

--[[
 _____ _            _                               _                 
/  ___| |          | |                             | |                
\ `--.| |_ __ _ ___| |__   ___  ___   ___ _   _ ___| |_ ___ _ __ ___  
 `--. \ __/ _` / __| '_ \ / _ \/ __| / __| | | / __| __/ _ \ '_ ` _ \ 
/\__/ / || (_| \__ \ | | |  __/\__ \ \__ \ |_| \__ \ ||  __/ | | | | |
\____/ \__\__,_|___/_| |_|\___||___/ |___/\__, |___/\__\___|_| |_| |_|
                                           __/ |                      
                                          |___/                                                                 
]]--



local function CreateStash(name)
    if not Stashes[name] then
        Stashes[name] = {}
    end
end

local function AddItemToStash(stashName, itemName, count)
    if Stashes[stashName] then
        local itemData = {
            itemName = itemName,
            count = count
        }
        table.insert(Stashes[stashName], itemData)
    else
        print("Stash doesnt exist! "..stashName)
    end
end

local function GetItemsInStash(stashName)
    if Stashes[stashName] then
        return Stashes[stashName]
    end
    return false
end

local function TakeItemFromStash(stashName, playerId, position)
    if Stashes[stashName] then
        if Stashes[stashName][position] then
            local itemData = Stashes[stashName][position]
            BRIDGE.AddItem(playerId, itemData.itemName, itemData.count)
            table.remove(Stashes[stashName], position)
        end
    else
        print("Stash doesnt exist! "..stashName)
    end
end
local function clearStash(stashName)
    if Stashes[stashName] then
        Stashes[stashName] = {}
    else
        print("Stash doesnt exist! "..stashName)
    end
end

if BRIDGE.QBStashesReplaceByPLS then
    lib.callback.register(GetCurrentResourceName()..'_open_stash', function(source, stashName)
        local items = GetItemsInStash(stashName)
        return items
    end)
end

RegisterNetEvent(GetCurrentResourceName().."takeItemFromStash")
AddEventHandler(GetCurrentResourceName().."takeItemFromStash", function(stashName, position)
    local src = source
    TakeItemFromStash(stashName, src, position)
end)



BRIDGE.RegisterStash = function(stashName, stashLabel, stashSlots, stashWeight)
    if BRIDGE.Inventory == "ox_inventory" then
        returns = Inventory:RegisterStash(stashName, stashLabel, stashSlots, stashWeight)
    elseif BRIDGE.Inventory == "qb_inventory" then
        returns = CreateStash(stashName)
    elseif BRIDGE.Inventory == "quasar_inventory" then
        returns = Inventory:RegisterStash(stashName, stashSlots, stashWeight) 
    end
end


BRIDGE.ClearStash = function (stashName)
    if BRIDGE.Inventory == "ox_inventory" then
        returns = Inventory:ClearInventory(stashName)
    elseif BRIDGE.Inventory == "qb_inventory" then
        returns = clearStash(stashName)
    elseif BRIDGE.Inventory == "quasar_inventory" then
        returns = Inventory:ClearInventory(stashName, {})
    end
end



BRIDGE.AddStashItem = function(stashName, itemName, itemCount, metadata)
    if BRIDGE.Inventory == "ox_inventory" then
        returns = Inventory:AddItem(stashName, itemName, itemCount, metadata)
    elseif BRIDGE.Inventory == "qb_inventory" then
        returns = AddItemToStash(stashName, itemName, itemCount)
    elseif BRIDGE.Inventory == "quasar_inventory" then
        returns = Inventory:AddItemIntoStash(stashName, stashSlots, stashWeight) 
    end
end

