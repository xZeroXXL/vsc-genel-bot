const {
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "ban",
  description: "Belirtilen kullanıcıyı sunucudan yasaklar!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,
  default_member_permissions: PermissionFlagsBits.BanMembers,
  options: [
    {
      name: "kullanıcı",
      description: "Yasaklanacak kullanıcı",
      type: ApplicationCommandOptionType.User,
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
    const user = interaction.options.getUser("kullanıcı");
    const reason =
      interaction.options.getString("sebep") || "Sebep belirtilmedi";

    try {
      const member = await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

      if (member) {
        if (member.id === interaction.user.id) {
          return interaction.reply({
            content: "⚠️ Kendinizi banlayamazsınız!",
            ephemeral: true,
          });
        }

        if (member.id === client.user.id) {
          return interaction.reply({
            content: "⚠️ Beni banlayamazsınız!",
            ephemeral: true,
          });
        }

        if (member.id === interaction.guild.ownerId) {
          return interaction.reply({
            content: "⚠️ Sunucu sahibini banlayamazsınız!",
            ephemeral: true,
          });
        }

        if (
          member.roles.highest.position >=
            interaction.member.roles.highest.position &&
          interaction.user.id !== interaction.guild.ownerId
        ) {
          return interaction.reply({
            content:
              "⚠️ Bu kullanıcıyı banlayamazsınız çünkü sizinle aynı veya daha yüksek bir role sahip!",
            ephemeral: true,
          });
        }
      }

      await interaction.guild.members.ban(user.id, {
        reason: `${interaction.user.tag} tarafından: ${reason}`,
      });

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle("🚫 | Kullanıcı Yasaklandı")
        .setDescription(`**${user.tag}** sunucudan başarıyla yasaklandı!`)
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
          "⚠️ Kullanıcıyı banlarken bir hata oluştu. Yetkilere sahip olduğumdan emin olun.",
        ephemeral: true,
      });
    }
  },
};
