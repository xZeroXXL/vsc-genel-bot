const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const fs = require("fs");
const config = require("./config.json");
const { loadEvents } = require("./function/eventLoader");
const { loadCommands } = require("./function/commandLoader");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember
  ],
});

client.commands = new Collection();
client.config = config;
client.cooldowns = new Collection();
global.client = client;

loadEvents(client);
loadCommands(client);

client.login(config.token);