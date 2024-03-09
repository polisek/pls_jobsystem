local Jobs = {}


AddEventHandler('onResourceStart', function(resourceName)
    if (GetCurrentResourceName() == resourceName) then
        local loadFile = LoadResourceFile(GetCurrentResourceName(), "./server/jobs.json")
        if not loadFile then
            SaveResourceFile(GetCurrentResourceName(), "./server/jobs.json", json.encode({}), -1)
            loadFile = {}
        end
        Jobs = json.decode(loadFile)
        for _, job in pairs(Jobs) do 
            if job.stashes then
                for _, stash in pairs(job.stashes) do
                    BRIDGE.RegisterStash(stash.id, stash.label,stash.slots, stash.weight)
                end
            else
                job.stashes = {}
            end
        end
        Wait(2000)
        TriggerClientEvent("pls_jobsystem:client:recivieJobs", -1, Jobs)
    end
end)

AddEventHandler(GetCurrentResourceName()..':playerLoaded', function(playerId)
    Wait(2000)
    TriggerClientEvent("pls_jobsystem:client:recivieJobs", playerId, Jobs)
end)

local function SaveJobs()
    SaveResourceFile(GetCurrentResourceName(), "./server/jobs.json", json.encode(Jobs), -1)
end

local function IsJobExist(jobName) 
    for _, job in pairs(Jobs) do
        if job.job == jobName then
            return true
        end
    end
    return false
end

local function IsPlayerHasCustomPerms(playerId)
    -- THIS IS FOR YOUR CUSTOM PERMS
    return true
end


lib.callback.register('pls_jobsystem:server:getBalance', function(source,jobName)
    for _, job in pairs(Jobs) do
        if job.job == jobName then
            if not job.balance then
                job.balance = 0
            end
            return job.balance
        end
    end
end)

RegisterNetEvent("pls_jobsystem:server:saveNewJob")
AddEventHandler("pls_jobsystem:server:saveNewJob", function(jobData)
    local src = source
    if CanTrustPlayer(src) then
        if IsPlayerHasCustomPerms(src) then
            if not IsJobExist(jobData.job) then
                    table.insert(Jobs, jobData)
                    lib.notify(src, {
                        title="Hell yeah!",
                        description="A new job has been created!",
                        type="success"
                    })
                    SaveJobs()
            else
                for i, v in pairs(Jobs) do
                    if v.job == jobData.job then
                        Jobs[i] = jobData
                        SaveJobs()
                        lib.notify(src, {
                            title="Hell yeah!",
                            description="Job has been saved!",
                            type="success"
                        })
                    end
                end
            end 
        end
    end
end)

RegisterNetEvent("pls_jobsystem:server:saveJob")
AddEventHandler("pls_jobsystem:server:saveJob", function(jobData)
    local src = source
    if CanTrustPlayer(src) then
        if IsPlayerHasCustomPerms(src) then
            if IsJobExist(jobData.job) then
                    for i, v in pairs(Jobs) do
                        if v.job == jobData.job then
                            Jobs[i] = jobData
                            SaveJobs()
                            lib.notify(src, {
                                title="Hell yeah!",
                                description="Job has been saved!",
                                type="success"
                            })
                        end
                    end
            else
                lib.notify(src, {
                    title="WTF Bro?",
                    description="Someone propably delete this job.. :( ",
                    type="error"
                })
            end 
        end
    end
end)

RegisterNetEvent("pls_jobsystem:server:deleteJob")
AddEventHandler("pls_jobsystem:server:deleteJob", function(jobData)
    local src = source
    if CanTrustPlayer(src) then
        if IsPlayerHasCustomPerms(src) then
            if IsJobExist(jobData.job) then
                for i, v in pairs(Jobs) do
                    if v.job == jobData.job then
                        table.remove(Jobs, i)
                        SaveJobs()
                        lib.notify(src, {
                            title="Hell yeah!",
                            description="Job has been deleted!",
                            type="success"
                        })
                    end
                end
            else
                lib.notify(src, {
                    title="WTF Bro?",
                    description="This job doesnt exist! ",
                    type="error"
                })
            end 
        end
    end
end)



RegisterNetEvent("pls_jobsystem:server:pullChanges")
AddEventHandler("pls_jobsystem:server:pullChanges", function(pullType)
    local src = source
    if CanTrustPlayer(src) then
        if IsPlayerHasCustomPerms(src) then
            for _, job in pairs(Jobs) do 
                if job.stashes then
                    for _, stash in pairs(job.stashes) do
                        BRIDGE.RegisterStash(stash.id, stash.label,stash.slots, stash.weight)
                    end
                else
                    job.stashes = {}
                end
            end
            if pullType == "creator" then
                TriggerClientEvent("pls_jobsystem:client:Pull", src, Jobs)
            elseif pullType == "all" then
                TriggerClientEvent("pls_jobsystem:client:Pull", -1, Jobs)
            end
        end
    end
end)


RegisterNetEvent("pls_jobsystem:server:createItem")
AddEventHandler("pls_jobsystem:server:createItem", function(craftingData)
    local src = source
    if CanTrustPlayer(src) then
        if IsPlayerHasCustomPerms(src) then
            local hasAllItems = true
              for _, v in pairs(craftingData.ingedience) do
                  if v.itemCount > BRIDGE.GetItemCount(src, v.itemName) then
                    hasAllItems = false
                  end
              end
              if hasAllItems then
                for _, v in pairs(craftingData.ingedience) do
                    BRIDGE.RemoveItem(src, v.itemName, v.itemCount)
                end
                BRIDGE.AddItem(src, craftingData.itemName, craftingData.itemCount)
              else
                lib.notify(src,{
                  title="Job",
                  description="Your dont have all items!",
                  type="error"
                })
              end
        end
    end
end)

RegisterNetEvent("pls_jobsystem:server:makeRegisterAction")
AddEventHandler("pls_jobsystem:server:makeRegisterAction", function(jobName, action, number)
    local src = source
    if CanTrustPlayer(src) then
        if IsJobExist(jobName) then
            for _, job in pairs(Jobs) do
                if job.job == jobName then
                    if not job.balance then
                        job.balance = 0
                    end
                    if action == "withdraw" then
                        if job.balance > 0 and job.balance >= number and job.balance-number > 0 then
                            job.balance = job.balance - number
                            BRIDGE.AddItem(src, "money", number)
                            lib.notify(src, {
                                title="Withdraw",
                                description="Done!",
                                type="success"
                            })
                            SaveJobs()
                        else
                            lib.notify(src, {
                                title="Withdraw",
                                description="Cannot be done",
                                type="error"
                            })
                        end
                    elseif action == "deposit" then
                        local playerMoney = BRIDGE.GetItemCount(src, "money")
                        if playerMoney >= number then
                            job.balance = job.balance + number
                            BRIDGE.RemoveItem(src, "money", number)
                            lib.notify(src, {
                                title="Deposit",
                                description="Done!",
                                type="success"
                            })
                            SaveJobs()
                        else
                            lib.notify(src, {
                                title="Deposit",
                                description="You don't have enough money",
                                type="error"
                            })
                        end
                    end
                end
            end
        end
    end
end)


RegisterNetEvent("pls_jobsystem:server:createBackup")
AddEventHandler("pls_jobsystem:server:createBackup", function(pullType)
    local src = source
    if CanTrustPlayer(src) then
        SaveResourceFile(GetCurrentResourceName(), "./server/backup.json", json.encode(Jobs), -1)
        lib.notify(src, {
            title="Backup done!",
            description="Congrats! Now you can do stupid things.",
            type="success"
        })
    end
end)



RegisterNetEvent("pls_jobsystem:server:setBackup")
AddEventHandler("pls_jobsystem:server:setBackup", function(pullType)
    local src = source
    if CanTrustPlayer(src) then
        local loadFile = LoadResourceFile(GetCurrentResourceName(), "./server/backup.json")
        if loadFile then
            Jobs = json.decode(loadFile)
            SaveJobs()
        end
    end
end)


lib.addCommand('createjob', {
    help = 'This command create job',
    restricted = 'group.admin'
}, function(source, args, raw)
    TriggerClientEvent("pls_jobsystem:client:createjob", source)
end)

lib.addCommand('open_jobs', {
    help = 'This command open your job menu.',
    restricted = 'group.admin'
}, function(source, args, raw)
    TriggerClientEvent("pls_jobsystem:client:openJobMenu", source, Jobs)
end)