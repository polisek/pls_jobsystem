--[[

  ____       _     _                               __ _       
 |  _ \     (_)   | |                             / _(_)      
 | |_) |_ __ _  __| | __ _  ___    ___ ___  _ __ | |_ _  __ _ 
 |  _ <| '__| |/ _` |/ _` |/ _ \  / __/ _ \| '_ \|  _| |/ _` |
 | |_) | |  | | (_| | (_| |  __/ | (_| (_) | | | | | | | (_| |
 |____/|_|  |_|\__,_|\__, |\___|  \___\___/|_| |_|_| |_|\__, |
                      __/ |                              __/ |
                     |___/                              |___/ 

]]--

local IS_SERVER = IsDuplicityVersion()

BRIDGE = {}

BRIDGE.Framework = "ESX" -- ESX / QB / OX

-- Supports inventory
-- ox_inventory  - https://github.com/overextended/ox_inventory
-- qb_inventory -  https://docs.qbcore.org/qbcore-documentation/
-- quasar_inventory - https://docs.quasar-store.com/assets-and-guides/inventory

BRIDGE.Inventory = "ox_inventory" -- ox_inventory, qb_inventory, quasar_inventory

BRIDGE.ESXOld = false -- Change on true when you use old version of ESX

BRIDGE.Target = "ox_target"  -- ox_target / qb_target
BRIDGE.UseMarkers = false -- This is for some script where u dont want use target! But not all scripts supports this.






-- This is created for pls_keycards and pls_hiddenstashes FUCK THIS in other scripts.
BRIDGE.QBStashesReplaceByPLS = false -- This is replace qb-inventory stashes.

--[[ 
  _________                                        .__    .___      
 /   _____/ ______________  __ ___________    _____|__| __| _/____  
 \_____  \_/ __ \_  __ \  \/ // __ \_  __ \  /  ___/  |/ __ |/ __ \ 
 /        \  ___/|  | \/\   /\  ___/|  | \/  \___ \|  / /_/ \  ___/ 
/_______  /\___  >__|    \_/  \___  >__|    /____  >__\____ |\___  >
        \/     \/                 \/             \/        \/    \/ 
]]--

if IS_SERVER then
    BRIDGE.Notify =  function(playerId, notifyData)
        -- notifyData.title = NOTIFY TITLE
        -- notifyData.description = NOTIFY DESCRIPTION
        -- notifyData.type = NOTIFY TYPE  | TYPES: success, inform, error
        lib.notify(playerId, notifyData)
    end
end


--[[
_________ .__  .__               __           .__    .___      
\_   ___ \|  | |__| ____   _____/  |_    _____|__| __| _/____  
/    \  \/|  | |  |/ __ \ /    \   __\  /  ___/  |/ __ |/ __ \ 
\     \___|  |_|  \  ___/|   |  \  |    \___ \|  / /_/ \  ___/ 
 \______  /____/__|\___  >___|  /__|   /____  >__\____ |\___  >
        \/             \/     \/            \/        \/    \/ 
]]--

if not IS_SERVER then
    BRIDGE.Notify = function(notifyData)
        -- notifyData.title = NOTIFY TITLE
        -- notifyData.description = NOTIFY DESCRIPTION
        -- notifyData.type = NOTIFY TYPE  | TYPES: success, inform, error
        lib.notify(notifyData)
    end
end