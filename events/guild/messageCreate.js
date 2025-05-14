const db = require("croxydb");
const { EmbedBuilder } = require("discord.js");
const moment = require("moment");
require("moment-duration-format");
moment.locale("tr");

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(client, message) {
    if (message.author.bot) return;

    const userXp = db.get(`xp_${message.author.id}_${message.guild.id}`) || 0;
    const userLevel =
      db.get(`level_${message.author.id}_${message.guild.id}`) || 1;
    const requiredXp = userLevel * client.config.levelXp;

    db.add(
      `xp_${message.author.id}_${message.guild.id}`,
      client.config.mesajXp
    );

    if (userXp + client.config.mesajXp >= requiredXp) {
      db.set(`level_${message.author.id}_${message.guild.id}`, userLevel + 1);
      db.set(`xp_${message.author.id}_${message.guild.id}`, 0);

      const levelUpEmbed = new EmbedBuilder()
        .setColor(client.config.successColor)
        .setDescription(
          `🎉 | Tebrikler ${message.author}! **${
            userLevel + 1
          }** seviyesine ulaştın!`
        )
        .setFooter({ text: client.config.footer })
        .setTimestamp();

      message.channel.send({ embeds: [levelUpEmbed] });
    }

    if (db.has(`afk_${message.author.id}`)) {
      const afkSebep = db.get(`afk_${message.author.id}`);
      const afkDate = db.get(`afkDate_${message.author.id}`);

      const timeAgo = moment
        .duration(Date.now() - afkDate.date)
        .format("D [gün], H [saat], m [dakika], s [saniye]");

      db.delete(`afk_${message.author.id}`);
      db.delete(`afkDate_${message.author.id}`);

      const embed = new EmbedBuilder()
        .setColor("#57F287")
        .setDescription(
          `✅ | AFK modundan çıktınız. ${timeAgo} boyunca AFK'daydınız.`
        )
        .setFooter({ text: client.config.footer })
        .setTimestamp();

      message.reply({ embeds: [embed] }).then((msg) => {
        setTimeout(() => {
          msg.delete().catch((e) => {});
        }, 5000);
      });
    }

    if (message.mentions.users.size > 0) {
      const mentionedUser = message.mentions.users.first();

      if (db.has(`afk_${mentionedUser.id}`)) {
        const afkSebep = db.get(`afk_${mentionedUser.id}`);
        const afkDate = db.get(`afkDate_${mentionedUser.id}`);

        const timeAgo = moment
          .duration(Date.now() - afkDate.date)
          .format("D [gün], H [saat], m [dakika], s [saniye]");

        const embed = new EmbedBuilder()
          .setColor("#5865F2")
          .setDescription(
            `ℹ️ | ${mentionedUser.tag} kullanıcısı **${timeAgo}** önce AFK oldu.\n\n📝 **Sebep:** ${afkSebep}`
          )
          .setFooter({ text: client.config.footer })
          .setTimestamp();

        message.reply({ embeds: [embed] });
      }
    }
  },
};
