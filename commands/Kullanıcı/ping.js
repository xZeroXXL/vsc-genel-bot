const { EmbedBuilder, ApplicationCommandType } = require("discord.js");

module.exports = {
  name: "ping",
  description: "Botun ping değerini gösterir!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 5,

  run: async (client, interaction) => {
    const start = Date.now();

    interaction.deferReply().then(() => {
      const end = Date.now();

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle("🏓 | Ping Bilgileri")
        .addFields([
          {
            name: "Bot Gecikmesi",
            value: `\`${end - start}ms\``,
            inline: true,
          },
          {
            name: "API Gecikmesi",
            value: `\`${Math.round(client.ws.ping)}ms\``,
            inline: true,
          },
        ])
        .setFooter({ text: client.config.footer })
        .setTimestamp();

      interaction.followUp({ embeds: [embed] });
    });
  },
};
