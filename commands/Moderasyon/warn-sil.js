const { Client, EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "warn-sil",
  description: "Bir kullanıcının uyarısını siler!",
  type: 1,
  options: [
    {
      name: "kullanıcı",
      description: "Uyarısı silinecek kullanıcı",
      type: 6,
      required: true,
    },
    {
      name: "uyarı_id",
      description: "Silinecek uyarının ID'si",
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
    const uyarıId = interaction.options.getString("uyarı_id");
    const guildId = interaction.guild.id;

    let uyarılar = db.get(`uyarılar_${guildId}_${kullanıcı.id}`) || [];
    const uyarı = uyarılar.find((u) => u.id === uyarıId);

    if (!uyarı) {
      return interaction.reply({
        content: `❌ | **${kullanıcı.tag}** kullanıcısının **${uyarıId}** ID'li bir uyarısı bulunmuyor!`,
        ephemeral: true,
      });
    }

    uyarılar = uyarılar.filter((u) => u.id !== uyarıId);
    db.set(`uyarılar_${guildId}_${kullanıcı.id}`, uyarılar);

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Uyarı Silindi!")
      .setDescription(
        `
        **Kullanıcı:** ${kullanıcı}
        **Silinen Uyarı ID:** ${uyarıId}
        **Neden:** ${uyarı.neden}
        **Silen:** ${interaction.user}
      `
      )
      .setColor("#FF0000")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    try {
      await kullanıcı.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🗑️ Uyarınız Silindi!")
            .setDescription(
              `
              **Sunucu:** ${interaction.guild.name}
              **Silinen Uyarı ID:** ${uyarıId}
              **Neden:** ${uyarı.neden}
              **Silen:** ${interaction.user.tag}
            `
            )
            .setColor("#FF0000")
            .setTimestamp(),
        ],
      });
    } catch (error) {
      console.error("DM gönderilemedi:", error);
    }
  },
};
