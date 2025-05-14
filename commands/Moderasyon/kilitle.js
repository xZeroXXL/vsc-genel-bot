const {
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "kilitle",
  description: "Kanalı kilitler veya kilidini açar!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,
  default_member_permissions: PermissionFlagsBits.ManageChannels,
  options: [
    {
      name: "durum",
      description: "Kilit durumu",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Kilitli", value: "kapalı" },
        { name: "Açık", value: "açık" },
      ],
    },
    {
      name: "sebep",
      description: "Kilitleme veya açma sebebi",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  run: async (client, interaction) => {
    const status = interaction.options.getString("durum");
    const reason =
      interaction.options.getString("sebep") || "Sebep belirtilmedi";
    const channel = interaction.channel;

    try {
      if (status === "kapalı") {
        await channel.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          {
            SendMessages: false,
          }
        );

        const embed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("🔒 | Kanal Kilitlendi")
          .setDescription(`Bu kanal ${interaction.user} tarafından kilitlendi!`)
          .addFields([{ name: "📝 Sebep", value: reason, inline: true }])
          .setFooter({ text: client.config.footer })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } else {
        await channel.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          {
            SendMessages: null,
          }
        );

        const embed = new EmbedBuilder()
          .setColor("Green")
          .setTitle("🔓 | Kanal Kilidi Açıldı")
          .setDescription(
            `Bu kanalın kilidi ${interaction.user} tarafından açıldı!`
          )
          .addFields([{ name: "📝 Sebep", value: reason, inline: true }])
          .setFooter({ text: client.config.footer })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "⚠️ Kanal kilitleme/kilit açma işlemi sırasında bir hata oluştu. Yetkilere sahip olduğumdan emin olun.",
        ephemeral: true,
      });
    }
  },
};
