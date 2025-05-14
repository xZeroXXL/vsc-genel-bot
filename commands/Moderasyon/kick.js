const {
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "kick",
  description: "Belirtilen kullanıcıyı sunucudan atar!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,
  default_member_permissions: PermissionFlagsBits.KickMembers,
  options: [
    {
      name: "kullanıcı",
      description: "Atılacak kullanıcı",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "sebep",
      description: "Atma sebebi",
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

      if (member.id === interaction.user.id) {
        return interaction.reply({
          content: "⚠️ Kendinizi atamazsınız!",
          ephemeral: true,
        });
      }

      if (member.id === client.user.id) {
        return interaction.reply({
          content: "⚠️ Beni atamazsınız!",
          ephemeral: true,
        });
      }

      if (member.id === interaction.guild.ownerId) {
        return interaction.reply({
          content: "⚠️ Sunucu sahibini atamazsınız!",
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
            "⚠️ Bu kullanıcıyı atamazsınız çünkü sizinle aynı veya daha yüksek bir role sahip!",
          ephemeral: true,
        });
      }

      await member.kick(`${interaction.user.tag} tarafından: ${reason}`);

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle("👢 | Kullanıcı Atıldı")
        .setDescription(`**${user.tag}** sunucudan başarıyla atıldı!`)
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
          "⚠️ Kullanıcı atılırken bir hata oluştu. Kullanıcının sunucuda olduğundan ve yetkilere sahip olduğumdan emin olun.",
        ephemeral: true,
      });
    }
  },
};
