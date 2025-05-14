const {
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "unban",
  description: "Yasaklanmış bir kullanıcının yasağını kaldırır!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,
  default_member_permissions: PermissionFlagsBits.BanMembers,
  options: [
    {
      name: "id",
      description: "Yasağı kaldırılacak kullanıcının ID'si",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "sebep",
      description: "Yasak kaldırma sebebi",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  run: async (client, interaction) => {
    const userId = interaction.options.getString("id");
    const reason =
      interaction.options.getString("sebep") || "Sebep belirtilmedi";

    if (!/^\d{17,19}$/.test(userId)) {
      return interaction.reply({
        content:
          "⚠️ Geçersiz kullanıcı ID'si! Lütfen doğru bir Discord ID'si girin.",
        ephemeral: true,
      });
    }

    try {
      const banList = await interaction.guild.bans.fetch();
      const bannedUser = banList.find((ban) => ban.user.id === userId);

      if (!bannedUser) {
        return interaction.reply({
          content: "⚠️ Bu kullanıcı sunucudan yasaklanmamış!",
          ephemeral: true,
        });
      }

      await interaction.guild.members.unban(
        userId,
        `${interaction.user.tag} tarafından: ${reason}`
      );

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("🔓 | Yasak Kaldırıldı")
        .setDescription(
          `**${bannedUser.user.tag}** (${userId}) adlı kullanıcının yasağı kaldırıldı!`
        )
        .addFields([
          { name: "📝 Sebep", value: reason, inline: true },
          { name: "👤 Yetkili", value: `${interaction.user}`, inline: true },
        ])
        .setFooter({ text: client.config.footer })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "⚠️ Kullanıcının yasağı kaldırılırken bir hata oluştu. Geçerli bir ID girdiğinizden ve yetkilere sahip olduğumdan emin olun.",
        ephemeral: true,
      });
    }
  },
};
