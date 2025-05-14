const { Client, EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "reroll",
  description: "Tamamlanmış bir çekilişin kazananlarını yeniden seçer!",
  type: 1,
  options: [
    {
      name: "çekiliş_id",
      description: "Yeniden çekiliş yapılacak çekilişin mesaj ID'si",
      type: 3,
      required: true,
    },
  ],
  run: async (client, interaction) => {
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
    ) {
      return interaction.reply({
        content:
          "❌ | Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısınız!",
        ephemeral: true,
      });
    }

    const cekilisId = interaction.options.getString("çekiliş_id");

    const aktifCekilis = db.get(`cekilis_${cekilisId}`);
    if (aktifCekilis) {
      return interaction.reply({
        content:
          "❌ | Bu çekiliş hala devam ediyor! Lütfen çekilişin tamamlanmasını bekleyin.",
        ephemeral: true,
      });
    }

    const cekilisData = db.get(`tamamlanmis_cekilis_${cekilisId}`);
    if (!cekilisData) {
      return interaction.reply({
        content:
          "❌ | Bu ID'ye sahip tamamlanmış bir çekiliş bulunamadı! Lütfen doğru mesaj ID'sini girin.",
        ephemeral: true,
      });
    }

    const kanal = await client.channels
      .fetch(cekilisData.kanalId)
      .catch(() => null);
    if (!kanal) {
      return interaction.reply({
        content: "❌ | Çekilişin kanalı bulunamadı! Kanal silinmiş olabilir.",
        ephemeral: true,
      });
    }

    let kazananlar = [];
    if (cekilisData.katılımcılar.length > 0) {
      const shuffled = cekilisData.katılımcılar.sort(() => 0.5 - Math.random());
      kazananlar = shuffled.slice(
        0,
        Math.min(cekilisData.kazananSayısı, cekilisData.katılımcılar.length)
      );
    }

    const resultEmbed = new EmbedBuilder()
      .setTitle("🔄 Çekiliş Yeniden Çekildi!")
      .setDescription(
        `
        **Ödül:** ${cekilisData.ödül}
        **Yeni Kazananlar:** ${
          kazananlar.length > 0
            ? kazananlar.map((id) => `<@${id}>`).join(", ")
            : "Katılım olmadı!"
        }
        **Önceki Kazananlar:** ${
          cekilisData.sonKazananlar.length > 0
            ? cekilisData.sonKazananlar.map((id) => `<@${id}>`).join(", ")
            : "Yok"
        }
        **Katılımcı Sayısı:** ${cekilisData.katılımcılar.length}
        **Başlatan:** <@${cekilisData.başlatan}>
        **Yeniden Çeken:** ${interaction.user}
      `
      )
      .setColor("#00CED1")
      .setFooter({
        text: `Çekiliş ID: ${cekilisId}`,
        iconURL: interaction.guild.iconURL(),
      })
      .setTimestamp();

    cekilisData.sonKazananlar = kazananlar;
    db.set(`tamamlanmis_cekilis_${cekilisId}`, cekilisData);

    await interaction.reply({
      content:
        kazananlar.length > 0
          ? `🎉 **${
              cekilisData.ödül
            }** çekilişinin yeni kazananları: ${kazananlar
              .map((id) => `<@${id}>`)
              .join(", ")}! Tebrikler!`
          : "❌ Katılım olmadı, yeni kazanan seçilemedi!",
      embeds: [resultEmbed],
    });
  },
};
