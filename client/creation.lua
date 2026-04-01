-- VARIABLES
local selectedJob = {}

-- EVENTS: Open creative mode for job creation
RegisterNetEvent("pls_jobsystem:client:createjob")
AddEventHandler("pls_jobsystem:client:createjob", function()
    -- Open creative mode with job creator panel
    -- Jobs will be empty initially, NUI will show the job creator form
    OpenCreativeMode({})
end)

-- EVENTS: Open creative mode with job list
RegisterNetEvent("pls_jobsystem:client:openJobMenu")
AddEventHandler("pls_jobsystem:client:openJobMenu", function(Jobs)
    if Jobs then
        OpenCreativeMode(Jobs)
    end
end)
