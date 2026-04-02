![IMAGE|1920x1080](https://imagehosting.polisek.io/uploads/69ce0c0c5332f.png)

A revamped version of the popular job system, which is completely free.
The job system allows you to create crafting stations, shops, blips, and more for your restaurants on the server.

**Important before you deploy the script to the server.**
*- The script does not include its own boss menu; you must add the export to config.lua.*
*- The script does not include a dispatch system; you must add it to config.lua.*

*- The script does not create a job in your framework’s database or config, but it can simplify the creation of existing jobs.*

**Main command**

/open_jobs

## Basic setup
![IMAGE|781x534](https://imagehosting.polisek.io/uploads/69ce0d1867738.png)

## Creating a basic crafting
![IMAGE|1919x1079](https://imagehosting.polisek.io/uploads/69ce0d3eea74b.png)
![IMAGE|1193x736](https://imagehosting.polisek.io/uploads/69ce0d52b0096.png)

## Creating Interactive Crafting
![IMAGE|746x365](https://imagehosting.polisek.io/uploads/69ce0d6e74442.png)
![IMAGE|1901x1048](https://imagehosting.polisek.io/uploads/69ce0d9dd2056.png)
![IMAGE|1331x795](https://imagehosting.polisek.io/uploads/69ce0dc95d0ef.png)

## Creating blips
![IMAGE|1158x645](https://imagehosting.polisek.io/uploads/69ce0e0992623.png)

## Creating stashes
![IMAGE|844x506](https://imagehosting.polisek.io/uploads/69ce0deff41dc.png)
## Creating peds

![IMAGE|1130x704](https://imagehosting.polisek.io/uploads/69ce0e29400ff.png)

## Creating shops
![IMAGE|1720x1035](https://imagehosting.polisek.io/uploads/69ce0e43c25bb.png)
![IMAGE|1251x935](https://imagehosting.polisek.io/uploads/69ce0e63f059d.png)
## Creating props

![IMAGE|1906x921](https://imagehosting.polisek.io/uploads/69ce0e8926142.png)

### Download link

*Do you like the script? Download it on GitHub.*

*The older version is also available among the releases.*

***Don’t forget to star the repository***

# [Download here for FREE](https://github.com/polisek/pls_jobsystem)

### Do you understand the code?

> *I’d appreciate any pull requests that make sense. In the future, I’d like to finish the Boss menu or add support for more frameworks.*

## Video

[Manual link](https://youtu.be/bCd9ncYEOyo)

https://www.youtube.com/watch?v=bCd9ncYEOyo

### Tebex

> *I wrote a few scripts a while back, so take a look…*

> [My tebex store](https://store.polisek.io/)

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

**Dispatch**

```lua

function SendDispatch(coords, jobLabel)

-- YOU DISPATCH

-- cache.ped

print(coords)

print(jobLabel)

end

```

| Feature              | Value   |
|---------------------|---------|
| Code is accessible  | Yes     |
| Subscription-based  | No      |
| Lines (approximately)| 2000+  |
| Requirements        | ox_lib  |
| Support             | Yes     |