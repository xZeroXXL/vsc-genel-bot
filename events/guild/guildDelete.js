const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "guildDelete",
  once: false,
  async execute(client, guild) {
    const logChannel = client.channels.cache.get(client.config.log);
    if (!logChannel) return;
    
    const embed = new EmbedBuilder()
      .setColor(client.config.errorColor)
      .setTitle("❌ | Sunucudan Çıkarıldım!")
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields([
        { name: "📝 Sunucu Adı", value: guild.name, inline: true },
        { name: "👥 Üye Sayısı", value: guild.memberCount.toString(), inline: true },
        { name: "🆔 Sunucu ID", value: guild.id, inline: true }
      ])
      .setFooter({ text: client.config.footer })
      .setTimestamp();
    
    logChannel.send({ embeds: [embed] });
  }
};