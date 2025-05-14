const {
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
} = require("discord.js");

module.exports = {
  name: "komut-şablonu",
  description: "Yeni komut oluşturmak için şablondur!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,
  options: [
    {
      name: "parametre",
      description: "Örnek parametre",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "kullanıcı",
      description: "Örnek kullanıcı seçimi",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  run: async (client, interaction) => {
    const parametre = interaction.options.getString("parametre");
    const kullanıcı = interaction.options.getUser("kullanıcı");

    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle("📋 | Komut Şablonu")
      .setDescription(
        `Bu bir komut şablonudur. Buraya komut açıklaması gelecek.`
      )
      .addFields([
        { name: "📝 Parametre", value: `\`${parametre}\``, inline: true },
        {
          name: "👤 Kullanıcı",
          value: kullanıcı ? `${kullanıcı}` : "Belirtilmedi",
          inline: true,
        },
      ])
      .setFooter({ text: client.config.footer })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("button_example")
        .setLabel("Örnek Buton")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("📋")
    );

    interaction.reply({
      embeds: [embed],
      components: [row],
    });

    const filter = (i) =>
      i.customId === "button_example" && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000,
    });

    collector.on("collect", async (i) => {
      await i.reply({
        content:
          "Butona tıkladınız! Burada butonun işlevini gerçekleştirebilirsiniz.",
        ephemeral: true,
      });
    });
  },
};
