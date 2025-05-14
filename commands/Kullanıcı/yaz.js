const {
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");

module.exports = {
  name: "yaz",
  description: "Bot üzerinden belirlenen kanala mesaj gönderir!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,
  default_member_permissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "mesaj",
      description: "Gönderilecek mesaj",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "kanal",
      description: "Mesajın gönderileceği kanal",
      type: ApplicationCommandOptionType.Channel,
      channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
      required: false,
    },
    {
      name: "embed",
      description: "Mesajı embed olarak gönder",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],

  run: async (client, interaction) => {
    const channel =
      interaction.options.getChannel("kanal") || interaction.channel;
    const message = interaction.options.getString("mesaj");
    const useEmbed = interaction.options.getBoolean("embed") || false;

    try {
      if (useEmbed) {
        const embed = new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setDescription(message)
          .setFooter({ text: `${interaction.user.tag} tarafından gönderildi` })
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      } else {
        await channel.send(message);
      }

      await interaction.reply({
        content: `✅ Mesaj başarıyla ${channel} kanalına gönderildi.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "⚠️ Mesaj gönderilirken bir hata oluştu. Kanala mesaj gönderme yetkisine sahip olduğumdan emin olun.",
        ephemeral: true,
      });
    }
  },
};
