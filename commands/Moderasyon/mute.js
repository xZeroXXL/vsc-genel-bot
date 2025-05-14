const {
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "mute",
  description: "Discord'un timeout sistemi ile kullanıcıyı susturur!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,
  default_member_permissions: PermissionFlagsBits.ModerateMembers,
  options: [
    {
      name: "kullanıcı",
      description: "Susturulacak kullanıcı",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "süre",
      description: "Susturma süresi",
      type: ApplicationCommandOptionType.Integer,
      required: true,
      choices: [
        { name: "60 saniye", value: 60 * 1000 },
        { name: "5 dakika", value: 5 * 60 * 1000 },
        { name: "10 dakika", value: 10 * 60 * 1000 },
        { name: "1 saat", value: 60 * 60 * 1000 },
        { name: "1 gün", value: 24 * 60 * 60 * 1000 },
        { name: "1 hafta", value: 7 * 24 * 60 * 60 * 1000 },
      ],
    },
    {
      name: "sebep",
      description: "Susturma sebebi",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  run: async (client, interaction) => {
    const user = interaction.options.getUser("kullanıcı");
    const duration = interaction.options.getInteger("süre");
    const reason =
      interaction.options.getString("sebep") || "Sebep belirtilmedi";

    try {
      const member = await interaction.guild.members.fetch(user.id);

      if (member.id === interaction.user.id) {
        return interaction.reply({
          content: "⚠️ Kendinizi susturamazsınız!",
          ephemeral: true,
        });
      }

      if (member.id === client.user.id) {
        return interaction.reply({
          content: "⚠️ Beni susturamazsınız!",
          ephemeral: true,
        });
      }

      if (member.id === interaction.guild.ownerId) {
        return interaction.reply({
          content: "⚠️ Sunucu sahibini susturamazsınız!",
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
            "⚠️ Bu kullanıcıyı susturamazsınız çünkü sizinle aynı veya daha yüksek bir role sahip!",
          ephemeral: true,
        });
      }

      await member.timeout(
        duration,
        `${interaction.user.tag} tarafından: ${reason}`
      );

      let timeString;
      if (duration < 60000) {
        timeString = `${duration / 1000} saniye`;
      } else if (duration < 3600000) {
        timeString = `${duration / 60000} dakika`;
      } else if (duration < 86400000) {
        timeString = `${duration / 3600000} saat`;
      } else {
        timeString = `${duration / 86400000} gün`;
      }

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle("🔇 | Kullanıcı Susturuldu")
        .setDescription(`**${user.tag}** başarıyla susturuldu!`)
        .addFields([
          { name: "⏱️ Süre", value: timeString, inline: true },
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
          "⚠️ Kullanıcı susturulurken bir hata oluştu. Yetkilere sahip olduğumdan emin olun.",
        ephemeral: true,
      });
    }
  },
};
