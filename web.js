const Discord = require('discord.js');
// const config = require('./config.json') || {
const config = {
  discord: {},
  server: {},
  keepAlive: {}
};
const log = console.log;
const http = require('http');
const https = require('https');

const DISCORD_GUILD = String(process.env.DISCORD_GUILD);
const DISCORD_CHANNEL = String(process.env.DISCORD_CHANNEL);
const PORT = Number(process.env.PORT) || 37405; //unused port and since now the OFFICIAL ttt_discord_bot port ;)
const KEEPALIVE_HOST = String(process.env.KEEPALIVE_HOST);
const KEEPALIVE_PORT = Number(process.env.KEEPALIVE_PORT) || PORT;
const KEEPALIVE_ENABLED = Boolean(process.env.KEEPALIVE_ENABLED == 1) || false;

log('Constants: ');
log("  DISCORD_GUILD: ", DISCORD_GUILD, `(${typeof DISCORD_GUILD})`);
log("  DISCORD_CHANNEL: ", DISCORD_CHANNEL, `(${typeof DISCORD_CHANNEL})`);
log("  PORT: ", PORT, `(${typeof PORT})`);
log("  KEEPALIVE_HOST: ", KEEPALIVE_HOST, `(${typeof KEEPALIVE_HOST})`);
log("  KEEPALIVE_PORT: ", KEEPALIVE_PORT, `(${typeof KEEPALIVE_PORT})`);
log("  KEEPALIVE_ENABLED: ", KEEPALIVE_ENABLED, `(${typeof KEEPALIVE_ENABLED})`);

let guild;
let channel;

const muted = {};

const get = [];

//create discord client
const client = new Discord.Client();
client.login(process.env.DISCORD_TOKEN);

client.on('ready', () => {
  log('Bot is ready to mute them all! :)');
  guild = client.guilds.get(DISCORD_GUILD);
  // guild = client.guilds.find('id', DISCORD_GUILD);
  channel = guild.channels.get(DISCORD_CHANNEL);
  // channel = guild.channels.find('id', DISCORD_CHANNEL);
});
client.on('voiceStateUpdate', (oldMember, newMember) => { //player leaves the ttt-channel
  if (oldMember.voiceChannel != newMember.voiceChannel && isMemberInVoiceChannel(oldMember)) {
    if (isMemberMutedByBot(newMember) && newMember.serverMute) newMember.setMute(false).then(() => {
      setMemberMutedByBot(newMember, false);
    });
  }
});

isMemberInVoiceChannel = (member) => member.voiceChannelID == DISCORD_CHANNEL;
isMemberMutedByBot = (member) => muted[member] == true;
setMemberMutedByBot = (member, set = true) => muted[member] = set;

get['connect'] = (params, ret) => {
  let tag_utf8 = params.tag.split(" ");
  let tag = "";

  tag_utf8.forEach((e) => {
    tag = tag + String.fromCharCode(e);
  });

  let found = guild.members.filterArray(val => val.user.tag.match(new RegExp('.*' + tag + '.*')));
  if (found.length > 1) {
    ret({
      answer: 1 //pls specify
    });
  } else if (found.length < 1) {
    ret({
      answer: 0 //no found
    });
  } else {
    ret({
      tag: found[0].user.tag,
      id: found[0].id
    });
  }
};

get['mute'] = (params, ret) => {
  let id = params.id;
  let mute = params.mute;
  if (typeof id !== 'string' || typeof mute !== 'boolean') {
    ret();
    return;
  }
  log("Muted: " + id);
  //let member = guild.members.find('id', id);
  let member = guild.members.find(user => user.id === id);

  if (member) {

    if (isMemberInVoiceChannel(member)) {
      if (!member.serverMute && mute) {
        member.setMute(true, "dead players can't talk!").then(() => {
          setMemberMutedByBot(member);
          ret({
            success: true
          });
        }).catch((err) => {
          ret({
            success: false,
            error: err
          });
        });
      }
      if (member.serverMute && !mute) {
        member.setMute(false).then(() => {
          setMemberMutedByBot(member, false);
          ret({
            success: true
          });
        }).catch((err) => {
          ret({
            success: false,
            error: err
          });
        });
      }
    } else {
      ret();
    }

  } else {
    ret({
      success: false,
      err: 'member not found!' //TODO lua: remove from ids table + file
    });
  }
};

get['keep_alive'] = (params, ret) => {
  ret({
    success: true,
  });
};

const keepAliveReq = () => {
  const options = {
    host: KEEPALIVE_HOST,
    port: KEEPALIVE_PORT,
    path: '/',
    headers: {
      req: "keep_alive"
    }
    timeout: 5 * 1000 // 5 second request timeout.
  };
  log('[KeepAlive] Requesting:', 'with options:', options);
  https.get(options, (res) => {
    res.on('data', (chunk) => {
      try {
        log('[KeepAlive] Success!');
        log('[KeepAlive] Response: ' + chunk);// disable after it's working
      } catch (err) {
        log(err.message);
      }
    });
  }).on('timeout', (e) => {
  }).on('error', (err) => {
    log('[KeepAlive] Error Message:', err.message);
    log('[KeepAlive] Error:', err)
  });
};


http.createServer((req, res) => {
  if (typeof req.headers.params === 'string' && typeof req.headers.req === 'string' && typeof get[req.headers.req] === 'function') {
    try {
      let params = JSON.parse(req.headers.params);
      get[req.headers.req](params, (ret) => res.end(JSON.stringify(ret)));
    } catch (e) {
      res.end('no valid JSON in params');
    }
  } else
    res.end();
}).listen({
  port: PORT
}, () => {
  log(`Bot endpoint is running: https://${KEEPALIVE_HOST}:${KEEPALIVE_PORT}`);

  if (KEEPALIVE_ENABLED) {
    log(`[KeepAlive] Starting.`);

    setInterval(keepAliveReq, 20 * 60 * 1000); // load every 20 minutes
    setTimeout(keepAliveReq, 10 * 1000); // load first attempt after 10 seconds.
  }
});
