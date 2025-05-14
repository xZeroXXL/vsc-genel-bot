const {
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "unmute",
  description: "Susturulmuş bir kullanıcının susturmasını kaldırır!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,
  default_member_permissions: PermissionFlagsBits.ModerateMembers,
  options: [
    {
      name: "kullanıcı",
      description: "Susturması kaldırılacak kullanıcı",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "sebep",
      description: "Susturma kaldırma sebebi",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  run: async (client, interaction) => {
    const user = interaction.options.getUser("kullanıcı");
    const reason =
      interaction.options.getString("sebep") || "Sebep belirtilmedi";

    try {
      const member = await interaction.guild.members.fetch(user.id);

      if (!member.communicationDisabledUntil) {
        return interaction.reply({
          content: "⚠️ Bu kullanıcı zaten susturulmuş değil!",
          ephemeral: true,
        });
      }

      await member.timeout(
        null,
        `${interaction.user.tag} tarafından: ${reason}`
      );

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("🔊 | Susturma Kaldırıldı")
        .setDescription(
          `**${user.tag}** adlı kullanıcının susturması kaldırıldı!`
        )
        .addFields([
          { name: "📝 Sebep", value: reason, inline: true },
          { name: "👤 Yetkili", value: `${interaction.user}`, inline: true },
        ])
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: client.config.footer })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "⚠️ Kullanıcının susturması kaldırılırken bir hata oluştu. Yetkilere sahip olduğumdan emin olun.",
        ephemeral: true,
      });
    }
  },
};
