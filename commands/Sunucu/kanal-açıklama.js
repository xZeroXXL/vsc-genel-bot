const {
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");

module.exports = {
  name: "kanal-açıklama",
  description: "Kanalın açıklamasını değiştirir!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,
  default_member_permissions: PermissionFlagsBits.ManageChannels,
  options: [
    {
      name: "açıklama",
      description: "Yeni kanal açıklaması",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "kanal",
      description: "Açıklaması değiştirilecek kanal",
      type: ApplicationCommandOptionType.Channel,
      channel_types: [
        ChannelType.GuildText,
        ChannelType.GuildVoice,
        ChannelType.GuildAnnouncement,
      ],
      required: false,
    },
  ],

  run: async (client, interaction) => {
    const channel =
      interaction.options.getChannel("kanal") || interaction.channel;
    const description = interaction.options.getString("açıklama");

    try {
      await channel.setTopic(description);

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle("✏️ | Kanal Açıklaması Değiştirildi")
        .setDescription(
          `${channel} kanalının açıklaması başarıyla değiştirildi!`
        )
        .addFields([
          { name: "📝 Yeni Açıklama", value: description, inline: false },
          { name: "👤 Değiştiren", value: `${interaction.user}`, inline: true },
        ])
        .setFooter({ text: client.config.footer })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "⚠️ Kanal açıklaması değiştirilirken bir hata oluştu. Yetkilere sahip olduğumdan emin olun.",
        ephemeral: true,
      });
    }
  },
};
