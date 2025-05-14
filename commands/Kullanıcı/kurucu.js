const { EmbedBuilder, ApplicationCommandType } = require("discord.js");

module.exports = {
  name: "kurucu",
  description: "Sunucunun kurucusunu görürsün!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,

  run: async (client, interaction) => {
    try {
      const owner = await interaction.guild.fetchOwner();

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle("👑 | Sunucu Kurucusu")
        .setDescription(
          `Bu sunucunun kurucusu: **${owner.user.tag}** (${owner})`
        )
        .setThumbnail(owner.user.displayAvatarURL({ dynamic: true }))
        .addFields([
          { name: "🆔 Kurucu ID", value: owner.id, inline: true },
          {
            name: "📅 Hesap Oluşturma Tarihi",
            value: `<t:${Math.floor(owner.user.createdTimestamp / 1000)}:R>`,
            inline: true,
          },
          {
            name: "📆 Sunucuya Katılma Tarihi",
            value: `<t:${Math.floor(owner.joinedTimestamp / 1000)}:R>`,
            inline: true,
          },
        ])
        .setFooter({ text: client.config.footer })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "⚠️ Sunucu kurucusu bilgisi alınırken bir hata oluştu.",
        ephemeral: true,
      });
    }
  },
};
