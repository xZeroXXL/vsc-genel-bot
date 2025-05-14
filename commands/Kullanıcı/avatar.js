const {
  EmbedBuilder,
  ApplicationCommandType,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  ApplicationCommandOptionType,
} = require("discord.js");

module.exports = {
  name: "avatar",
  description: "Kullanıcının avatarını gösterir!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 5,
  options: [
    {
      name: "kullanıcı",
      description: "Avatar gösterilecek kullanıcı",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  run: async (client, interaction) => {
    const user = interaction.options.getUser("kullanıcı") || interaction.user;

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle(`🖼️ | ${user.tag} Avatarı`)
      .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
      .setFooter({ text: client.config.footer })
      .setTimestamp();

    const avatarButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Avatar Bağlantısı")
        .setStyle(ButtonStyle.Link)
        .setURL(user.displayAvatarURL({ size: 1024, dynamic: true }))
    );

    interaction.reply({ embeds: [embed], components: [avatarButton] });
  },
};
