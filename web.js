const Discord = require('discord.js');
const http = require('http');
const https = require('https');

const DEBUG = Boolean(process.env.DEBUG == 1);
const PORT = Number(process.env.PORT) || 37405; //unused port and since now the OFFICIAL ttt_discord_bot port ;)
const DISCORD_GUILD = String(process.env.DISCORD_GUILD);
const DISCORD_CHANNEL = String(process.env.DISCORD_CHANNEL);
const DISCORD_TOKEN = String(process.env.DISCORD_TOKEN);
const KEEPALIVE_HOST = String(process.env.KEEPALIVE_HOST);
const KEEPALIVE_PORT = Number(process.env.KEEPALIVE_PORT) || PORT;
const KEEPALIVE_ENABLED = Boolean(process.env.KEEPALIVE_ENABLED == 1);
const API_KEY = String(process.env.API_KEY) || false;

const log = (...msg) => (DEBUG ? console.log(...msg) : () => {});
const { error } = console;

log('Constants: ');
log("  DEBUG: ", DEBUG, `(${typeof DEBUG})`);
log("  PORT: ", PORT, `(${typeof PORT})`);
log("  DISCORD_GUILD: ", DISCORD_GUILD, `(${typeof DISCORD_GUILD})`);
log("  DISCORD_CHANNEL: ", DISCORD_CHANNEL, `(${typeof DISCORD_CHANNEL})`);
log("  DISCORD_TOKEN: ", DISCORD_TOKEN, `(${typeof DISCORD_TOKEN})`);
log("  KEEPALIVE_HOST: ", KEEPALIVE_HOST, `(${typeof KEEPALIVE_HOST})`);
log("  KEEPALIVE_PORT: ", KEEPALIVE_PORT, `(${typeof KEEPALIVE_PORT})`);
log("  KEEPALIVE_ENABLED: ", KEEPALIVE_ENABLED, `(${typeof KEEPALIVE_ENABLED})`);
log("  API_KEY: ", API_KEY, `(${typeof API_KEY})`);


let discordGuild;
let discordChannel;

const mutedPlayers = {};

const requests = [];

//create discord client
const client = new Discord.Client();
client.login(DISCORD_TOKEN);

client.on('ready', () => {
  log('Bot is ready to mute them all! :)');
  discordGuild = client.guilds.get(DISCORD_GUILD);
  // guild = client.guilds.find('id', DISCORD_GUILD);
  discordChannel = discordGuild.channels.get(DISCORD_CHANNEL);
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
isMemberMutedByBot = (member) => mutedPlayers[member] == true;
setMemberMutedByBot = (member, set = true) => mutedPlayers[member] = set;

requests['connect'] = (params, ret) => {
  let tag_utf8 = params.tag.split(" ");
  let tag = "";

  tag_utf8.forEach((e) => {
    tag = tag + String.fromCharCode(e);
  });

  let found = discordGuild.members.filterArray(val => val.user.tag.match(new RegExp('.*' + tag + '.*')));
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
    log(
      "[Connect]",
      `Connecting ${found[0].user.tag} (${found[0].id})`
    );
  }
};

requests['mute'] = (params, ret) => {
  let id = params.id;
  let mute = params.mute;
  if (typeof id !== 'string' || typeof mute !== 'boolean') {
    ret();
    return;
  }
  log(
    "[Mute]",
    `Muted ${id}`
  );
  //let member = guild.members.find('id', id);
  let member = discordGuild.members.find(user => user.id === id);

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

requests['keep_alive'] = (params, ret) => {
  ret({
    success: true,
  });
  log(
    "[KeepAlive]",
    `Requested`
  );
};

const keepAliveReq = () => {
  const options = {
    host: KEEPALIVE_HOST,
    port: KEEPALIVE_PORT,
    path: '/keep_alive',
    headers: {
      req: 'keep_alive',
      authorization: `Basic ${API_KEY}`
    },
    timeout: 5 * 1000 // 5 second request timeout.
  };
  log(
    '[KeepAlive]',
    'Requesting',
    options
  );
  https.get(options, (res) => {
    const { statusCode } = res;
    if (statusCode === 200) {
      log(
        '[KeepAlive]',
        'Success',
        `Request successful`
      );
    } else {
      log(
        '[KeepAlive]',
        'Error',
        `Request Failed Status Code: ${statusCode}`
      );
    }
  });
};

http.createServer((req, res) => {
  if (
    typeof req.headers.params === 'string' &&
    typeof req.headers.req === 'string' &&
    typeof requests[req.headers.req] === 'function' &&
    typeof API_KEY === 'string' && req.headers.authorization === `Basic ${API_KEY}`
  ) {
    try {
      let params = JSON.parse(req.headers.params);
      requests[req.headers.req](
        params,
        (ret) => res.end(
          JSON.stringify(ret)
        )
      );
    } catch (e) {
      res.end('no valid JSON in params');
    }
  } else {
    res.end();
    if (typeof API_KEY === 'string' && req.headers.authorization !== `Basic ${API_KEY}`) {
      error(
        '[ERROR]',
        '[Authorisation Miss-Match]:',
        `"${req.headers.authorization}" !== "Basic ${API_KEY}"`
      );
      error(
        '[ERROR]',
        '[Request Headers]:',
        req.headers
      )
    }
  }
}).listen({
  port: PORT
}, () => {
  log(`Bot endpoint is running: https://${KEEPALIVE_HOST}:${KEEPALIVE_PORT}`);

  if (KEEPALIVE_ENABLED) {
    log(
      '[KeepAlive]',
      '[Startup]',
      'Initialisation'
    );

    setInterval(keepAliveReq, 20 * 60 * 1000); // load every 20 minutes
    setTimeout(keepAliveReq, 3 * 1000); // load first attempt after 3 seconds.
  }
});
