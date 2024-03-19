local IS_SERVER = IsDuplicityVersion()

Config = {}

Config.DefaultDataJob = {
    label = "", -- STRING
    job = "", -- STRING
    area = vector3(0,0,0), -- VECTOR 3
    craftings = {}, -- TABLE
}

Config.DEFAULT_ANIM = "hack_loop"
Config.DEFAULT_ANIM_DIC = "mp_prison_break"

Config.BlacklistedStrings = {
    "weapon", "weed", "meth","coke", "ammo", "gun", "pistol", "drug", "c4", "WEAPON", "AMMO", "at_", "keycard", "gun", "money", "black_money"
}

Config.DirectoryToInventoryImages = "nui://ox_inventory/web/images/"

if not IS_SERVER then
    function openBossmenu(jobname)
        print("Bossmenu open")
        -- exports.yourbossmenu:openBossmenu()
    end

    function SendDispatch(coords, jobLabel)
        -- YOU DISPATCH
        -- cache.ped
        print(coords)
        print(jobLabel)
    end
end
