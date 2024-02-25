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
Framework = {}
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
AddEventHandler('esx:playerLoaded',function(xPlayer, isNew, skin)
    TriggerEvent(GetCurrentResourceName()..':playerLoaded', xPlayer, isNew, skin)
end)

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    local PlayerData = Framework.Functions.GetPlayerData()
    TriggerEvent(GetCurrentResourceName()..':playerLoaded', PlayerData)
    TriggerServerEvent("pls_bridge:server:configPlayerLoaded")
end)

AddEventHandler('ox:playerLoaded', function(data)
    TriggerEvent(GetCurrentResourceName()..':playerLoaded', data)
end)


RegisterNetEvent(GetCurrentResourceName()..':playerLoaded')
AddEventHandler(GetCurrentResourceName()..':playerLoaded',function(playerData, isNew, skin)
    --print("PLS BRIDGE - Player loaded")
end)





--[[
   _____      _       _       _     
  / ____|    | |     | |     | |    
 | |  __  ___| |_    | | ___ | |__  
 | | |_ |/ _ \ __|   | |/ _ \| '_ \ 
 | |__| |  __/ || |__| | (_) | |_) |
  \_____|\___|\__\____/ \___/|_.__/                                                                                                                                                                     
]]--

BRIDGE.GetPlayerJob = function ()
    local JobName = nil
    if BRIDGE.Framework == "ESX" then
        local PlayerData = Framework.GetPlayerData()
        JobName = PlayerData.job.name
    elseif BRIDGE.Framework == "QB" then
        local Player = Framework.Functions.GetPlayerData()
        JobName = Player.job.name
    elseif BRIDGE.Framework == "OX" then
        JobName = player.get("inService").name
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

BRIDGE.GetPlayerGrade = function ()
    local JobName = nil
    if BRIDGE.Framework == "ESX" then
        local PlayerData = Framework.GetPlayerData()
        JobName = PlayerData.job.grade
    elseif BRIDGE.Framework == "QB" then
        local Player = Framework.Functions.GetPlayerData()
        JobName = Player.job.grade
    elseif BRIDGE.Framework == "OX" then
        JobName = player.get("inService").grade
    end
    return JobName
 end