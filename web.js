require('dotenv-flow').config({
  silent: true
});
const Discord = require('discord.js');
const http = require('http');
const https = require('https');
const packageData = require('./package');

const VERSION = String(packageData.version);
const DEBUG = Boolean(process.env.DEBUG == 1);
const PORT = Number(process.env.PORT) || 37405; //unused port and since now the OFFICIAL ttt_discord_bot port ;)
const DISCORD_GUILD = String(process.env.DISCORD_GUILD);
const DISCORD_CHANNEL = String(process.env.DISCORD_CHANNEL);
const DISCORD_TOKEN = String(process.env.DISCORD_TOKEN);
const KEEPALIVE_HOST = String(process.env.KEEPALIVE_HOST);
const KEEPALIVE_PORT = Number(process.env.KEEPALIVE_PORT) || PORT;
const KEEPALIVE_ENABLED = Boolean(process.env.KEEPALIVE_ENABLED == 1);
const API_KEY = String(process.env.API_KEY) || false;

// Secure logging (for initial log of information)
const slog = (...msgs) => {
  if (!DEBUG) return;
  console.log(...msgs);
}
// Regular logging (for requests/responses)
const log = (...msgs) => {
  if (!DEBUG) return;
  console.log(...msgs.map((m) => {
    if (typeof m === 'string') {
      return m.replace(API_KEY, "API_KEY_OBFUSCATED");
    }
    return m;
  }));
};
const br = () => console.log('');
const { error } = console;

slog('Constants: ');
slog("  VERSION:", VERSION, `(${typeof VERSION})`);
slog("  DEBUG: ", DEBUG, `(${typeof DEBUG})`);
slog("  PORT: ", PORT, `(${typeof PORT})`);
slog("  DISCORD_GUILD: ", DISCORD_GUILD, `(${typeof DISCORD_GUILD})`);
slog("  DISCORD_CHANNEL: ", DISCORD_CHANNEL, `(${typeof DISCORD_CHANNEL})`);
slog("  DISCORD_TOKEN: ", DISCORD_TOKEN, `(${typeof DISCORD_TOKEN})`);
slog("  KEEPALIVE_HOST: ", KEEPALIVE_HOST, `(${typeof KEEPALIVE_HOST})`);
slog("  KEEPALIVE_PORT: ", KEEPALIVE_PORT, `(${typeof KEEPALIVE_PORT})`);
slog("  KEEPALIVE_ENABLED: ", KEEPALIVE_ENABLED, `(${typeof KEEPALIVE_ENABLED})`);
slog("  API_KEY: ", API_KEY, `(${typeof API_KEY})`);
br(); // New Line


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

  log(
    "[Connect][Requesting]",
    `Tag: ${tag}`
  );

  let found = discordGuild.members.filterArray(val => val.user.tag.match(new RegExp('.*' + tag + '.*')));
  if (found.length > 1) {
    ret({
      answer: 1 //pls specify
    });
    error(
      "[Connect][Error]",
      `${found.length} users found with tag "${tag}".`
    );
  } else if (found.length < 1) {
    ret({
      answer: 0 //no found
    });
    error(
      "[Connect][Error]",
      `0 users found with tag "${tag}".`
    );
  } else {
    ret({
      tag: found[0].user.tag,
      id: found[0].id
    });
    log(
      "[Connect][Success]",
      `Connecting ${found[0].user.tag} (${found[0].id})`
    );
  }
};

requests['mute'] = (params, ret) => {
  let id = params.id;
  let mute = params.mute;
  if (typeof id !== 'string' || typeof mute !== 'boolean') {
    ret({
      success: false,
      error: "ID or Mute value missing", //legacy
      errorMsg: "ID or Mute value missing",
      errorId: "INVALID_PARAMS"
    });
    error(
      "[Mute][Missing Params]",
      `id: "${id}" (${typeof id}), mute: "${mute}" (${typeof mute})`
    );
    return;
  }
  log(
    "[Mute][Requesting]",
    params
  );

  //let member = discordGuild.members.find(user => user.id === id);
  let member = discordGuild.members.get(id);
  if (member) {
    if (isMemberInVoiceChannel(member)) {
      if (!member.serverMute && mute) {
        member.setMute(true, "dead players can't talk!").then(() => {
          setMemberMutedByBot(member);
          ret({
            success: true
          });
          log(
            "[Mute][Discord:SetMute][Success]",
            `Muted ${id}`
          );
        }).catch((err) => {
          ret({
            success: false,
            error: err, //Legacy
            errorMsg: err,
            errorId: "DISCORD_ERROR"
          });
          error(
            "[Mute][Discord:SetMute][Error]",
            `Mute: ${id} - ${err}`
          );
        });
      }
      if (member.serverMute && !mute) {
        member.setMute(false).then(() => {
          setMemberMutedByBot(member, false);
          ret({
            success: true
          });
          log(
            "[Mute][Discord:SetMute][Success]",
            `Unmuted ${id}`
          );
        }).catch((err) => {
          ret({
            success: false,
            error: err, //Legacy
            errorMsg: err,
            errorId: "DISCORD_ERROR"
          });
          error(
            "[Mute][Discord:SetMute][Error]",
            `Unmute: ${id} - ${err}`
          );
        });
      }
    } else {
      ret({
        success: false,
        error: "member not in voice channel", //legacy
        errorMsg: "member not in voice channel",
        errorId: "DISCORD_MEMBER_NOT_IN_CHANNEL"
      });
      error(
        "[Mute][Error]",
        `Member not in voice channel.`
      );
    }

  } else {
    ret({
      success: false,
      error: "member not found", //Legacy
      errorMsg: "member not found",
      errorId: "DISCORD_UNKNOWN_MEMBER"
    });
    error(
      "[Mute][Error]",
      `Member not found.`
    );
  }
};

requests['keep_alive'] = (params, ret) => {
  ret({
    success: true,
  });
  log(
    "[KeepAlive][Request]",
    params
  );
};

requests['sync'] = (params, ret) => {
  ret({
    success: true,
    version: VERSION,
    debugMode: DEBUG,
    discordGuild: DISCORD_GUILD,
    discordChannel: DISCORD_CHANNEL
  });
  log(
    "[Sync][Request]",
    params
  );
};

const keepAliveReq = () => {
  const options = {
    host: KEEPALIVE_HOST,
    port: KEEPALIVE_PORT,
    path: '/keep_alive',
    headers: {
      req: 'keep_alive',
      params: '{}',
      authorization: `Basic ${API_KEY}`
    },
    timeout: 5 * 1000 // 5 second request timeout.
  };
  log(
    "[KeepAlive][Requesting]",
    options
  );
  https.get(options, (res) => {
    const { statusCode } = res;
    if (statusCode === 200) {
      log(
        "[KeepAlive][Success]",
        `Request successful`
      );
    } else {
      error(
        "[KeepAlive][Error]",
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
      error(
        "[ERROR][Request]",
        `No valid JSON in params`
      );
      error(
        "[ERROR][Request Headers]",
        req.headers
      )
    }
  } else {
    error(
      "[ERROR][Request Headers]",
      req.headers
    )
    if (typeof API_KEY === 'string' && req.headers.authorization !== `Basic ${API_KEY}`) {
      res.writeHead(401);
      res.end(JSON.stringify({
        error: "Authorisation Miss-Match", //Legacy
        errorMsg: "Authorisation Miss-Match",
        errorId: "AUTHORIZATION_MISSMATCH"
      }));
      error(
        "[ERROR][Authorisation]",
        `"${req.headers.authorization}" !== "Basic ${API_KEY}"`
      );
    } else if (requests[req.headers.req] !== 'function') {
      res.writeHead(400);
      res.end(JSON.stringify({
        error: `Unknown request "${req.headers.req}"`, //Legacy
        errorMsg: `Unknown request "${req.headers.req}"`,
        errorId: "UNKNOWN_REQUEST"
      }));
      error(
        "[ERROR][Request]",
        `Unknown request "${req.headers.req}"`
      );
    } else {
      res.writeHead(400);
      res.end(JSON.stringify({
        error: `Unknown`, //Legacy
        errorMsg: `Unknown`,
        errorId: "UNKNOWN_ERROR"
      }));
      error(
        "[ERROR][Request]",
        `Unknown request "${req.headers.req}"`
      );
    }
  }
}).listen({
  port: PORT
}, () => {
  log(`Bot endpoint is running: https://${KEEPALIVE_HOST}:${KEEPALIVE_PORT}`);

  if (KEEPALIVE_ENABLED) {
    log(
      "[KeepAlive][Startup]",
      `Initialisation`
    );

    setInterval(keepAliveReq, 20 * 60 * 1000); // load every 20 minutes
    setTimeout(keepAliveReq, 3 * 1000); // load first attempt after 3 seconds.
  }
});
