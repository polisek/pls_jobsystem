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


## Preview



## Join my discord or check my store
**Discord**:https://discord.com/invite/HyNKsABYrb

**Store**: https://store.polisek.io

**Web**: https://polisek.io
