# Discord Muter for GMod (The Node Bot)

![Icon](https://raw.githubusercontent.com/manix84/discord_gmod_addon/master/images/icon/icon_128x.png)

>Dead players tell no tales!

*... and that's basically what this bot does.*

[![price](https://img.shields.io/badge/price-free-brightgreen.svg)](LICENSE)
[![gmod-addon](https://img.shields.io/badge/gmod-addon-_.svg?colorB=1194EF)](https://wiki.garrysmod.com)
[![discord-bot](https://img.shields.io/badge/discord-bot-_.svg?colorB=8C9EFF)](https://discord.js.org)
[![license](https://img.shields.io/github/license/manix84/discord_gmod_bot.svg)](LICENSE)

This mod, in conjunction with the [GMod Addon](https://github.com/manix84/discord_gmod_addon), mutes dead players for X seconds, or unil the end of the round in (Garry's Mod).

## Features
- Remote Node Bot (the node bot and the addon don't need to be on the same server, but they can be if you want).
- Secure & Authenticated connection, so no-one should be highjacking your bot communication.
- Discord Server link. When someone connects, they get told to join your server, if they're not already connected.
- Mute a Player for the entire round, or simply for a few seconds.
- Automatically connect players when they join your server. If a new player joins, they're on the Discord server already, and use the same name, they'll get connected without even prompting them.
- ULX Support:
  - Added Mute/Unmute in commands menu - Obviously, you can mute/unmute a player from the ULX menu
  - Added Discord Settings
    - "Settings" - You can change any of the Console Variables on a per Map basis.
    - "Player Connections" - You can add a Steam/Discord ID connection from the ULX menu.
- Node Bot KeepAlive. Some bot hosts kill the bot if they don't get connections after a while. This option will keep the bot running, between sessions.
    
## Getting Started
If you need a step-by-step tutorial, follow my [guide at steam](http://steamcommunity.com/sharedfiles/filedetails/?id=1351369388)

### Prerequisites
- You have to have already installed a Garry's Mod Server with the TTT Gamemode.
- You must have a [Nodejs](https://nodejs.org) installed locally on your GMod server, or on a publically accessable server (I used [Heroku.com](https://heroku.com), which is the easier of the two options)

### Usage

1. First and formost, you need to go setup the Discord Bot, so...
    - Setup your node server
        > The following assumes you're using Heroku.com. If not, please skip.
        - Create a free account on [Heroku.com](https://heroku.com).
        - Create a pipeline, which deploys the [Discord Gmod Bot](https://github.com/manix84/discord_gmod_bot.git)
        - Set the Environment Variables:
            - `API_KEY`: (Optional, but super recommended) This MUST match the GMod server. It can be anything.
            - `DISCORD_GUILD`: A copy of the Server/Guild ID.
            - `DISCORD_CHANNEL`: A copy of the Voice Channel ID.
                - !If you're stuggling to get the Discord Guild/Channel ID, Discord have a [guide](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-) to getting the ID's.
            - `DISCORD_TOKEN`: This allows the node bot to talk to the Discord Bot (You will get this in Step 3 below)
    - Make sure the Node Bot server is running. Heroku will run is as a web instance.
2. Install this Mod (I recommend using the [Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=2155238885))
    - If you don't want to use steam workshop, go over to: [manix84/discord_gmod_addon](https://github.com/manix84/discord_gmod_addon.git) and just extract the project into `/garrysmod/addons/discord'.
3. [Create a Discord Bot](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token), invite him to your server and paste the token in the config
    - Add the Bot Token to your Node Bot Environment Variables 
        -  `DISCORD_TOKEN`
    - Make sure you grant the bot the permissions to Mute Members.
4. Make sure you've got the `server convars` in `/garrysmod/cfg/server.cfg`
    - `discord_endpoint`: The Node Bot remote endpoint (EG: https://my-awesome-discord-bot.herokuapp.com:443)
    - `discord_api_key`: This MUST match any value you set for the Node Bot. 
    - `discord_server_link`: This is the share link that is advertised on your gmod server.
    - `discord_mute_round`: Do you want to mute the end of the round after death? (1=Yes, 0=No)
    - `discord_mute_duration`: How long do you want the player to be muted after death, in seconds. Does nothing if `discord_mute_round` is set to `1`.
    - `discord_auto_connect`: If enabled, when an unknown player connects, it will try to match the Steam Nickname, to the Discord Nickname.  (1=Enabled, 0=Disabled)
5. You're all setup, so now, connect your Steam and Discord accounts:
    - Connect your Steam Account with the bot by typing `!discord YourDiscordTag` in the ingame chat (E.G `!discord Manix84`).
        - If you're having trouble, try your full discord name (E.G: `!discord Manix84#8429`). This should only be necessary if there are two or more people with the same name.
    - So long as you're in correct **DISCORD_GUILD** and **DISCORD_CHANNEL**, the game state is **in progress**, you're **connected to discord** and you die in a supported GMod gamemode (TTT, TTT2 - Advanced Update, or Murder), the bot will mute you!

## Credits

- Marcel Transier - The original creator of [ttt_discord_bot](https://github.com/marceltransier/ttt_discord_bot.git), from which this is based.
- I used [discord.js](https://discord.js.org) in this project. Thanks for the easy opportunity writing a discord bot in javascript!
- Thanks for the great Garry's Mod gamemode [Trouble in Terrorist Town](http://ttt.badking.net) I made this bot for.

## Contributing

1. Fork it (<https://github.com/manix84/discord_gmod_addon/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Screenshots
### ULX Commands
![ULX Cmds](https://i.imgur.com/pWUKAO8.png)

### ULX Settings - Settings
![ULX Settings - Settings](https://i.imgur.com/IJmbEjc.png)

### ULX Settings - Player Connections
![ULX Settings - Player Connections](https://i.imgur.com/r1caKBV.png)

### Muting in action
![Muting in action](https://i.imgur.com/a2eBESP.png)
