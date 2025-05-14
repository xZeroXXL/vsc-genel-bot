const { Client, EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "warn-liste",
  description: "Bir kullanıcının uyarılarını listeler!",
  type: 1,
  options: [
    {
      name: "kullanıcı",
      description: "Uyarıları listelenecek kullanıcı",
      type: 6,
      required: true,
    },
  ],
  run: async (client, interaction) => {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ModerateMembers
      )
    ) {
      return interaction.reply({
        content:
          "❌ | Bu komutu kullanmak için **Üyeleri Yönet** yetkisine sahip olmalısınız!",
        ephemeral: true,
      });
    }

    const kullanıcı = interaction.options.getUser("kullanıcı");
    const guildId = interaction.guild.id;

    const uyarılar = db.get(`uyarılar_${guildId}_${kullanıcı.id}`) || [];

    if (uyarılar.length === 0) {
      return interaction.reply({
        content: `📋 **${kullanıcı.tag}** kullanıcısının bu sunucuda uyarısı bulunmuyor!`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📋 ${kullanıcı.tag} Kullanıcısının Uyarıları`)
      .setDescription(
        uyarılar
          .map(
            (uyarı) => `
          **Uyarı ID:** ${uyarı.id}
          **Neden:** ${uyarı.neden}
          **Ayarlayan:** <@${uyarı.ayarlayan}>
          **Tarih:** <t:${Math.floor(parseInt(uyarı.id) / 1000)}:R>
        `
          )
          .join("\n\n")
      )
      .setColor("#FFA500")
      .setThumbnail(kullanıcı.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
