const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "guildCreate",
  once: false,
  async execute(client, guild) {
    const logChannel = client.channels.cache.get(client.config.log);
    if (!logChannel) return;
    
    const owner = await guild.fetchOwner();
    
    const embed = new EmbedBuilder()
      .setColor(client.config.successColor)
      .setTitle("🎉 | Yeni Sunucu!")
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields([
        { name: "📝 Sunucu Adı", value: guild.name, inline: true },
        { name: "👑 Sunucu Sahibi", value: `${owner.user.tag} (${owner.user.id})`, inline: true },
        { name: "👥 Üye Sayısı", value: guild.memberCount.toString(), inline: true },
        { name: "🆔 Sunucu ID", value: guild.id, inline: true }
      ])
      .setFooter({ text: client.config.footer })
      .setTimestamp();
    
    logChannel.send({ embeds: [embed] });
  }
};