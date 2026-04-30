fx_version 'cerulean'
game 'gta5'

author 'winstondev'
description 'Comprehensive EMS/Medic Framework for FiveM — Standalone or Framework-Agnostic'
version '1.0.0'

shared_scripts {
    'shared/*.lua'
}

client_scripts {
    'client/*.lua'
}

server_scripts {
    'server/*.lua'
}

ui_page 'html/index.html'

files {
    'html/*.html',
    'html/*.css',
    'html/*.js'
}

lua54 'yes'
