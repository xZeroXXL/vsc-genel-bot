const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");


function successEmbed(message) {
  return new EmbedBuilder()
    .setColor(config.successColor)
    .setDescription(`✅ | ${message}`)
    .setFooter({ text: config.footer })
    .setTimestamp();
}


function errorEmbed(message) {
  return new EmbedBuilder()
    .setColor(config.errorColor)
    .setDescription(`❌ | ${message}`)
    .setFooter({ text: config.footer })
    .setTimestamp();
}


function infoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle(`ℹ️ | ${title}`)
    .setDescription(description)
    .setFooter({ text: config.footer })
    .setTimestamp();
}

module.exports = { successEmbed, errorEmbed, infoEmbed };