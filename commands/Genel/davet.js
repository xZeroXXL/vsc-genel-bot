const {
  EmbedBuilder,
  ApplicationCommandType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "davet",
  description: "Bot davet bağlantılarını gösterir!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 5,

  run: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle("🔗 | Davet Bağlantıları")
      .setDescription(
        "Aşağıdaki butonları kullanarak botu sunucuna ekleyebilir veya destek sunucusuna katılabilirsin!"
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: client.config.footer })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Sunucuya Ekle")
        .setStyle(ButtonStyle.Link)
        .setURL(client.config["bot-davet"]),

      new ButtonBuilder()
        .setLabel("Destek Sunucusu")
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.desteksunucusu)
    );

    interaction.reply({ embeds: [embed], components: [row] });
  },
};
