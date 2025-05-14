const {
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
} = require("discord.js");

module.exports = {
  name: "banner",
  description: "Kullanıcının afişini (banner) gösterir!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,
  options: [
    {
      name: "kullanıcı",
      description: "Afişini görmek istediğiniz kullanıcı",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  run: async (client, interaction) => {
    const user = interaction.options.getUser("kullanıcı") || interaction.user;

    try {
      const fetchedUser = await client.users.fetch(user.id, { force: true });

      if (!fetchedUser.banner) {
        return interaction.reply({
          content: `${user.username} adlı kullanıcının afişi (banner) bulunmuyor!`,
          ephemeral: true,
        });
      }

      const bannerUrl = fetchedUser.bannerURL({ dynamic: true, size: 4096 });

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle(`${user.username} Adlı Kullanıcının Afişi`)
        .setImage(bannerUrl)
        .setFooter({ text: client.config.footer })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "⚠️ Kullanıcının afişi alınırken bir hata oluştu.",
        ephemeral: true,
      });
    }
  },
};
