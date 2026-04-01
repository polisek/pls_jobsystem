
fx_version 'adamant'

game 'gta5'

description 'PLS Job System - Dynamic job management with React UI'

dependencies {'ox_lib'}

shared_scripts {
    "BRIDGE/config.lua",
    'config.lua',
    "secure.lua",
    '@ox_lib/init.lua',
    'locales/*.lua',
}


client_scripts {
    "BRIDGE/client/framework.lua",
    "BRIDGE/client/inventory.lua",
    "BRIDGE/client/target.lua",
    'client/*.lua',
}

server_scripts {
    "BRIDGE/server/framework.lua",
    "BRIDGE/server/inventory.lua",
    'server/server.lua',
}

ui_page 'web/dist/index.html'

files {
    'web/dist/**/*',
}

lua54 "yes"
