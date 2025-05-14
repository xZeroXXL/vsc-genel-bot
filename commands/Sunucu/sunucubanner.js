const {
  Client,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  name: "sunucubanner",
  description: "Sunucunun banner görselini gösterir.",
  type: 1,
  options: [],

  run: async (client, interaction) => {
    const bannerUrl = interaction.guild.bannerURL({
      dynamic: true,
      size: 1024,
    });

    if (!bannerUrl) {
      return interaction.reply({
        content: "Bu sunucunun banner görseli bulunmuyor!",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle(`${interaction.guild.name} Sunucu Bannerı`)
      .setDescription(`[Banner Linki](${bannerUrl})`)
      .setImage(bannerUrl)
      .setFooter({ text: `İsteyen: ${interaction.user.tag}` });

    const button = new ButtonBuilder()
      .setLabel("Bannerı Görüntüle")
      .setStyle(5)
      .setURL(bannerUrl);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};
