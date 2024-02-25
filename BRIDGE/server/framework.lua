--[[
   _____      _               
  / ____|    | |              
 | (___   ___| |_ _   _ _ __  
  \___ \ / _ \ __| | | | '_ \ 
  ____) |  __/ |_| |_| | |_) |
 |_____/ \___|\__|\__,_| .__/ 
                       | |    
                       |_|    
]]--
Framework = nil
if BRIDGE.Framework == "ESX" then
   if BRIDGE.ESXOld then
      TriggerEvent('esx:getSharedObject', function(obj) Framework = obj end)
   else 
      Framework = exports["es_extended"]:getSharedObject()
   end
elseif BRIDGE.Framework == "QB" then
   Framework = exports['qb-core']:GetCoreObject()
end

RegisterNetEvent('esx:playerLoaded')
RegisterNetEvent('esx:playerLoaded', function(player, xPlayer, isNew)
    TriggerEvent(GetCurrentResourceName()..':playerLoaded', player, xPlayer, isNew)
end)

RegisterNetEvent('pls_bridge:server:configPlayerLoaded', function()
    local playerId = source
    TriggerEvent(GetCurrentResourceName()..':playerLoaded',playerId)
end)

AddEventHandler('ox:playerLoaded', function(source, userid, charid)
    TriggerEvent(GetCurrentResourceName()..':playerLoaded', source, userid, charid)
end)


RegisterNetEvent(GetCurrentResourceName()..':playerLoaded')
AddEventHandler(GetCurrentResourceName()..':playerLoaded',function(playerId, value1, value2)

end)


--[[
  _____  _                       _____        _        
 |  __ \| |                     |  __ \      | |       
 | |__) | | __ _ _   _  ___ _ __| |  | | __ _| |_ __ _ 
 |  ___/| |/ _` | | | |/ _ \ '__| |  | |/ _` | __/ _` |
 | |    | | (_| | |_| |  __/ |  | |__| | (_| | || (_| |
 |_|    |_|\__,_|\__, |\___|_|  |_____/ \__,_|\__\__,_|
                  __/ |                                
                 |___/                                                                                                                                                                                              
]]--

BRIDGE.GetPlayerData = function(playerId)
   local playerData = nil
   if BRIDGE.Framework == "ESX" then
      Framework.GetPlayerFromId(playerId)
   elseif BRIDGE.Framework == "QB" then
      playerData = Framework.Functions.GetPlayer(playerId)
   elseif BRIDGE.Framework == "OX" then
      playerData = player
   end
   return playerData
end 


--[[
   _____      _       _       _     
  / ____|    | |     | |     | |    
 | |  __  ___| |_    | | ___ | |__  
 | | |_ |/ _ \ __|   | |/ _ \| '_ \ 
 | |__| |  __/ || |__| | (_) | |_) |
  \_____|\___|\__\____/ \___/|_.__/                                                                                                                                                                     
]]--

BRIDGE.GetPlayerJob = function (playerId)
   local JobName = nil
   if BRIDGE.Framework == "ESX" then
       local PlayerData = Framework.GetPlayerData(playerId)
       JobName = PlayerData.job.name
   elseif BRIDGE.Framework == "QB" then
       local Player = Framework.Functions.GetPlayerData(playerId)
       JobName = Player.job.name
   elseif BRIDGE.Framework == "OX" then
      local player = Ox.GetPlayer(playerId)
      local Job = player.get("inService")
      JobName = Job.name
   end
   return JobName
end


--[[
   _____      _    _____               _      
  / ____|    | |  / ____|             | |     
 | |  __  ___| |_| |  __ _ __ __ _  __| | ___ 
 | | |_ |/ _ \ __| | |_ | '__/ _` |/ _` |/ _ \
 | |__| |  __/ |_| |__| | | | (_| | (_| |  __/
  \_____|\___|\__|\_____|_|  \__,_|\__,_|\___|
                                              
                                                                                                                                                                                                            
]]--

BRIDGE.GetPlayerJob = function (playerId)
   local JobName = nil
   if BRIDGE.Framework == "ESX" then
       local PlayerData = Framework.GetPlayerData(playerId)
       JobName = PlayerData.job.grade
   elseif BRIDGE.Framework == "QB" then
       local Player = Framework.Functions.GetPlayerData(playerId)
       JobName = Player.job.grade
   elseif BRIDGE.Framework == "OX" then
      local player = Ox.GetPlayer(playerId)
      local Job = player.get("inService")
      JobName = Job.grade
   end
   return JobName
end




--[[
   _____            _      _                                            
  / ____|          (_)    | |                                           
 | (___   ___   ___ _  ___| |_ _   _   _ __ ___   ___  _ __   ___ _   _ 
  \___ \ / _ \ / __| |/ _ \ __| | | | | '_ ` _ \ / _ \| '_ \ / _ \ | | |
  ____) | (_) | (__| |  __/ |_| |_| | | | | | | | (_) | | | |  __/ |_| |
 |_____/ \___/ \___|_|\___|\__|\__, | |_| |_| |_|\___/|_| |_|\___|\__, |
                                __/ |                              __/ |
                               |___/                              |___/                                      
                                                                                                                                                                                                            
]]--

BRIDGE.AddSocietyMoney = function (jobName, money)
   local JobName = nil
   if BRIDGE.Framework == "ESX" then
      TriggerEvent('esx_society:getSociety',jobName, function (society)
         if society ~= nil then
             TriggerEvent('esx_addonaccount:getSharedAccount', society.account, function (account)
                 if account then
                     account.addMoney(money)
                 end
             end)
         end
     end)
   elseif BRIDGE.Framework == "QB" then
      exports['qb-management']:AddMoney(jobName, money)
   elseif BRIDGE.Framework == "OX" then
      print("[PLS_BRIDGE] SOCIETY MONEY OX not support for now please change to your system. BRIDGE/server/framework.lua - AddSocietyMoney")
   end
   return JobName
end




--[[
   _____                _         _    _           _     _        _____ _                 
  / ____|              | |       | |  | |         | |   | |      |_   _| |                
 | |     _ __ ___  __ _| |_ ___  | |  | |___  __ _| |__ | | ___    | | | |_ ___ _ __ ___  
 | |    | '__/ _ \/ _` | __/ _ \ | |  | / __|/ _` | '_ \| |/ _ \   | | | __/ _ \ '_ ` _ \ 
 | |____| | |  __/ (_| | ||  __/ | |__| \__ \ (_| | |_) | |  __/  _| |_| ||  __/ | | | | |
  \_____|_|  \___|\__,_|\__\___|  \____/|___/\__,_|_.__/|_|\___| |_____|\__\___|_| |_| |_|
                                                                                          
                                                                                          
]]--


BRIDGE.RegisterUsableItem = function(itemName, clientEvent)
   if BRIDGE.Framework == "ESX" then
      Framework.RegisterUsableItem(itemName, function(playerId)
         TriggerClientEvent(clientEvent, playerId, {item = item})
      end)
   elseif BRIDGE.Framework == "QB" then
      Framework.Functions.CreateUseableItem(itemName, function(source, item)
         local Player = Framework.Functions.GetPlayer(source)
         if not Player.Functions.GetItemByName(item.name) then return end
         TriggerClientEvent(clientEvent, source, {item = item})
      end)
   end
end

