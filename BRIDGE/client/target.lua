--[[
   _____      _                 _                       _   
  / ____|    | |               | |                     | |  
 | (___   ___| |_ _   _ _ __   | |_ __ _ _ __ __ _  ___| |_ 
  \___ \ / _ \ __| | | | '_ \  | __/ _` | '__/ _` |/ _ \ __|
  ____) |  __/ |_| |_| | |_) | | || (_| | | | (_| |  __/ |_ 
 |_____/ \___|\__|\__,_| .__/   \__\__,_|_|  \__, |\___|\__|
                       | |                    __/ |         
                       |_|                   |___/          
]]--


local Target = nil
local Actions = {}
if BRIDGE.Target  == "ox_target" then
    Target = exports.ox_target
end

if BRIDGE.Target == "qb_target" then
    Target = exports['qb-target']
end



local function AddAction(data)
    data.id = math.random(1,99999)
    table.insert(Actions, data)
    return data.id
end
local function RemoveAction(id)
    for i, action in pairs(Actions) do
        if action.id == id then
            table.remove(Actions, i)
            return true
        end
    end
    return false
end


--[[
              _     _  _____ _                   ______                
     /\      | |   | |/ ____| |                 |___  /                
    /  \   __| | __| | (___ | |__   ___ _ __ ___   / / ___  _ __   ___ 
   / /\ \ / _` |/ _` |\___ \| '_ \ / _ \ '__/ _ \ / / / _ \| '_ \ / _ \
  / ____ \ (_| | (_| |____) | | | |  __/ | |  __// /_| (_) | | | |  __/
 /_/    \_\__,_|\__,_|_____/|_| |_|\___|_|  \___/_____\___/|_| |_|\___|
                                                                       
                                                                                                                
]]--

local function ox_to_qb_target_convert(targetData)
    local new_options = {}
    for i, v in pairs(targetData) do 
        if v then
            local option = {}
            if not v.distance then v.distance = 5 end
            option = {
                num = i,
                type="client",
                label = v.label,
                targeticon = v.icon,
                action = v.onSelect,
                canInteract = v.canInteract,
                job = v.groups,
                drawDistance = v.distance

            }
            table.insert(new_options, option)
        end
    end
    return new_options
end

BRIDGE.AddSphereTarget = function(data)
    local targetID = nil
    if BRIDGE.UseMarkers then
        targetID = AddAction(data)
    else
        if BRIDGE.Target == "ox_target" then
            targetID = Target:addSphereZone(data)
        elseif BRIDGE.Target == "qb_target" then
            targetID = "pls_target"..math.random(1,99).."_"..math.random(1,999)
            if not data.radius then data = 1.5 end
            Target:AddCircleZone(targetID,data.coords, data.radius, {
            name = targetID,
            debugPoly = false, 
            }, {
            options = ox_to_qb_target_convert(data.options),
            distance = 2.5, 
            })
        end
    end
    return targetID
end

--[[
  _____                                _____       _                   ______                
 |  __ \                              / ____|     | |                 |___  /                
 | |__) |___ _ __ ___   _____   _____| (___  _ __ | |__   ___ _ __ ___   / / ___  _ __   ___ 
 |  _  // _ \ '_ ` _ \ / _ \ \ / / _ \\___ \| '_ \| '_ \ / _ \ '__/ _ \ / / / _ \| '_ \ / _ \
 | | \ \  __/ | | | | | (_) \ V /  __/____) | |_) | | | |  __/ | |  __// /_| (_) | | | |  __/
 |_|  \_\___|_| |_| |_|\___/ \_/ \___|_____/| .__/|_| |_|\___|_|  \___/_____\___/|_| |_|\___|
                                            | |                                              
                                            |_|                                                                                                                                                                                 
]]--

BRIDGE.RemoveSphereTarget = function(id)
    if BRIDGE.UseMarkers then
        RemoveAction(id)
    else
        if BRIDGE.Target == "ox_target" then
            Target:removeZone(id)
            return true
        elseif BRIDGE.Target == "qb_target" then
            Target:RemoveZone(id)
            return true
        end
    end
    return false
end

--[[
              _     _ __  __           _      _ 
     /\      | |   | |  \/  |         | |    | |
    /  \   __| | __| | \  / | ___   __| | ___| |
   / /\ \ / _` |/ _` | |\/| |/ _ \ / _` |/ _ \ |
  / ____ \ (_| | (_| | |  | | (_) | (_| |  __/ |
 /_/    \_\__,_|\__,_|_|  |_|\___/ \__,_|\___|_|
                                                
                                                
]]--

BRIDGE.AddModelTarget = function(models, targetData)
    local targetID = nil
    if BRIDGE.Target == "ox_target" then
        targetID = Target:addModel(models, targetData)
    elseif BRIDGE.Target == "qb_target" then
        targetID = Target:AddTargetModel(models, {
            options = ox_to_qb_target_convert(targetData),
            distance = 2.5, 
        })
    end
    return targetID
end



local function generateMenuByOptions(options)
    local newOptions = {}
    for _, v in pairs(options) do
        local new_option = {
            title = v.label,
            icon = v.icon,
            onSelect = function()
                local allowInteract = true
                if allowInteract then
                    v.onSelect()
                end
            end
        }
        table.insert(newOptions, new_option)
    end
    lib.registerContext({
        id = 'dynamic_menu_target',
        title = 'Action',
        options = newOptions
      })
    lib.showContext('dynamic_menu_target')
end


CreateThread(function()
    while true do
        local coords = GetEntityCoords(PlayerPedId())
        local waitConfig = 5000
        local isClose = false
        local lastDistance = 100.0
        local lastCoords = vector3(0,0,0)
        local options = {}
        for _, v in pairs(Actions) do 
            if #(coords - v.coords)  < 50.0 then
                isClose = true
                if #(coords - v.coords) < lastDistance then
                    lastDistance = #(coords - v.coords)
                    lastCoords = v.coords
                    options = v.options
                end
            end
            if isClose then waitConfig = 0 else  waitConfig = 5000 end
        end
        if #(coords - lastCoords) < 10.0 then
            DrawMarker(25, lastCoords.x, lastCoords.y, lastCoords.z-1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.0, 2.0, 2.0, 1, 18, 43, 90, false, false, 2, nil, nil, false)
            if IsControlJustPressed(1, 38) then -- E
                if #(coords - lastCoords) < 2.5 then
                    generateMenuByOptions(options)
                end
            end
        end 
        Wait(waitConfig)
    end
end)
