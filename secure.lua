local IS_SERVER = IsDuplicityVersion()

if IS_SERVER then
    local SCRIPT_KEY_SERVER = GetCurrentResourceName()

    local SecurePlayers = {}
    local characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    local generatePass = ''
    local charactersLength = string.len(characters)

    for i = 1, 10 do
        generatePass = generatePass .. string.sub(characters, math.random(1, charactersLength), 1)
    end

    RegisterNetEvent("secure:server:eventGen")
    AddEventHandler("secure:server:eventGen", function(randomString, password)
        local src = source
        if password == generatePass then
            SecurePlayers[src] = {randomString = randomString, timeStamp = os.time()}
        end

        -- Automaticky zrušit platnost po 6 vteřinách
        SetTimeout(6000, function()
            SecurePlayers[src] = nil
        end)
    end)

    RegisterNetEvent(SCRIPT_KEY_SERVER.."secure:server:eventCHECK")
    AddEventHandler(SCRIPT_KEY_SERVER.."secure:server:eventCHECK", function()
        local src = source
        TriggerClientEvent(SCRIPT_KEY_SERVER.."secure:get:password", src, generatePass)
    end)

    function CanTrustPlayer(source)
        if SecurePlayers[source] and SecurePlayers[source].randomString then
            -- Zkontrolujte, zda byla událost spuštěna před méně než sekundou
            if os.time() - SecurePlayers[source].timeStamp <= 1 then
                return true
            end
        end
        return false
    end 
end
if not IS_SERVER then
    local SCRIPT_KEY_CLIENT = GetCurrentResourceName()
    local SERVER_PASSWORD

    RegisterNetEvent(SCRIPT_KEY_CLIENT.."secure:get:password")
    AddEventHandler(SCRIPT_KEY_CLIENT.."secure:get:password", function(password)
       SERVER_PASSWORD = password
    end)

    function generateRandomString(length)
        local characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        local result = ''
        local charactersLength = string.len(characters)
    
        for i = 1, length do
            result = result .. string.sub(characters, math.random(1, charactersLength), 1)
        end
    
        return result
    end
    
    function TriggerSecureEvent(eventname, ...)
        local randomString = generateRandomString(10)
        TriggerServerEvent("secure:server:eventGen", randomString, SERVER_PASSWORD)
        Wait(50)
        TriggerServerEvent(eventname, ...)
    end

    Wait(1000)
    TriggerServerEvent(SCRIPT_KEY_CLIENT.."secure:server:eventCHECK")
end
