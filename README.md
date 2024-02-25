
![job_system](https://github.com/polisek/pls_jobsystem/assets/107623238/44215dfa-591e-4753-9d7e-b36806b4cc80)

# 📙 Job system v1.0
Job system for creating production tables.

## Dependencies
- ox_lib - https://github.com/overextended/ox_lib

## Supports 
Frameworks: ESX / QB / OX

Inventory: ox_inventory, qb_inventory, quasar_inventory.

Targets: ox_target, qb-target

## Don't want to use target?
**BRIDGE/config.lua**
```lua
BRIDGE.UseMarkers = false
```
## Commands
/createjob - This will start to create a new job.
/open_jobs - Opens the menu of all jobs.

## Configuration
All framework, inventory and target setup in BRIDGE/config.lua.

**Directory to your inventory images**
```lua
Config.DirectoryToInventoryImages = "nui://ox_inventory/web/images/"
```

**Blacklisted strings / Filter**
```lua
Config.BlacklistedStrings = {
    "weapon", "weed", "meth","coke", "ammo", "gun", "pistol", "drug", "c4", "WEAPON", "AMMO", "at_", "keycard", "gun", "money", "black_money"
}
```

**Crafting animation**
```lua
Config.DEFAULT_ANIM = "hack_loop"
Config.DEFAULT_ANIM_DIC = "mp_prison_break"
```

## Questions
**Do I need to create a job in the database or in the framework?:** Yes, this script will not create anything in your db, but you can customize it.



## Preview
https://youtu.be/BK9EfBzi-Eg


## Join my discord or check my store
**Discord**:https://discord.com/invite/HyNKsABYrb

**Store**: https://store.polisek.io

**Web**: https://polisek.io
