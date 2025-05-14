const { EmbedBuilder, ApplicationCommandType, version } = require("discord.js");
const moment = require("moment");
require("moment-duration-format");
moment.locale("tr");

module.exports = {
  name: "istatistik",
  description: "Bot istatistiklerini gösterir!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 5,

  run: async (client, interaction) => {
    const uptime = moment
      .duration(client.uptime)
      .format("D [gün], H [saat], m [dakika], s [saniye]");

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle("📊 | Bot İstatistikleri")
      .setThumbnail(client.user.displayAvatarURL())
      .addFields([
        {
          name: "👤 Toplam Kullanıcı",
          value: client.users.cache.size.toString(),
          inline: true,
        },
        {
          name: "🌐 Toplam Sunucu",
          value: client.guilds.cache.size.toString(),
          inline: true,
        },
        {
          name: "💬 Toplam Kanal",
          value: client.channels.cache.size.toString(),
          inline: true,
        },
        { name: "⚡ Çalışma Süresi", value: uptime, inline: true },
        { name: "📚 Discord.js", value: `v${version}`, inline: true },
        { name: "🔧 Node.js", value: process.version, inline: true },
      ])
      .setFooter({ text: client.config.footer })
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  },
};
