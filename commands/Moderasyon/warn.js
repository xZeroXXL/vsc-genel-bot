const { Client, EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "warn",
  description: "Bir kullanıcıyı uyarır!",
  type: 1,
  options: [
    {
      name: "kullanıcı",
      description: "Uyarılacak kullanıcı",
      type: 6,
      required: true,
    },
    {
      name: "neden",
      description: "Uyarı nedeni",
      type: 3,
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
    const neden = interaction.options.getString("neden");
    const guildId = interaction.guild.id;

    if (kullanıcı.id === interaction.user.id) {
      return interaction.reply({
        content: "❌ | Kendinizi uyaramazsınız!",
        ephemeral: true,
      });
    }

    if (kullanıcı.bot) {
      return interaction.reply({
        content: "❌ | Botları uyaramazsınız!",
        ephemeral: true,
      });
    }

    const uyarıId = Date.now().toString();
    const uyarılar = db.get(`uyarılar_${guildId}_${kullanıcı.id}`) || [];
    uyarılar.push({
      id: uyarıId,
      neden,
      tarih: Date.now(),
      ayarlayan: interaction.user.id,
    });
    db.set(`uyarılar_${guildId}_${kullanıcı.id}`, uyarılar);

    const embed = new EmbedBuilder()
      .setTitle("⚠️ Kullanıcı Uyarıldı!")
      .setDescription(
        `
        **Uyarılan Kullanıcı:** ${kullanıcı}
        **Neden:** ${neden}
        **Ayarlayan:** ${interaction.user}
        **Uyarı ID:** ${uyarıId}
      `
      )
      .setColor("#FFA500")
      .setTimestamp();

    try {
      await kullanıcı.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("⚠️ Uyarı Aldınız!")
            .setDescription(
              `
              **Sunucu:** ${interaction.guild.name}
              **Neden:** ${neden}
              **Ayarlayan:** ${interaction.user.tag}
              **Uyarı ID:** ${uyarıId}
            `
            )
            .setColor("#FFA500")
            .setTimestamp(),
        ],
      });
    } catch (error) {
      console.error("DM gönderilemedi:", error);
    }

    await interaction.reply({ embeds: [embed] });
  },
};
