const {
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "forceban",
  description: "ID ile kullanıcıyı sunucudan yasaklar (sunucuda olmasa bile)!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,
  default_member_permissions: PermissionFlagsBits.BanMembers,
  options: [
    {
      name: "id",
      description: "Yasaklanacak kullanıcının ID'si",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "sebep",
      description: "Yasaklama sebebi",
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
      if (banList.some((ban) => ban.user.id === userId)) {
        return interaction.reply({
          content: "⚠️ Bu kullanıcı zaten sunucudan yasaklanmış!",
          ephemeral: true,
        });
      }

      await interaction.guild.members.ban(userId, {
        reason: `${interaction.user.tag} tarafından (Forceban): ${reason}`,
      });

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle("🚫 | Kullanıcı Yasaklandı")
        .setDescription(
          `**${userId}** ID'li kullanıcı sunucudan başarıyla yasaklandı!`
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
          "⚠️ Kullanıcı banlanırken bir hata oluştu. Geçerli bir ID girdiğinizden ve yetkilere sahip olduğumdan emin olun.",
        ephemeral: true,
      });
    }
  },
};
