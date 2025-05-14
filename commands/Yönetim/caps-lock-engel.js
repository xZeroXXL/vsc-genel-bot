const { Client, EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "caps-lock-koruma",
  description: "Caps Lock korumasını açar veya kapatır!",
  type: 1,
  options: [
    {
      name: "durum",
      description: "Caps Lock korumasını aç veya kapat",
      type: 3,
      required: true,
      choices: [
        { name: "Aç", value: "ac" },
        { name: "Kapat", value: "kapat" },
      ],
    },
  ],
  run: async (client, interaction) => {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content:
          "❌ | Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısınız!",
        ephemeral: true,
      });
    }

    const durum = interaction.options.getString("durum");
    const guildId = interaction.guild.id;

    if (durum === "ac") {
      db.set(`capsLockKoruma_${guildId}`, true);
      const embed = new EmbedBuilder()
        .setTitle("Caps Lock Koruması Açıldı!")
        .setDescription(
          "📢 Artık mesajlarda aşırı büyük harf kullanımı engellenecek. Yöneticiler bu kısıtlamadan muaf."
        )
        .setColor("Green");
      await interaction.reply({ embeds: [embed] });
    } else {
      db.delete(`capsLockKoruma_${guildId}`);
      const embed = new EmbedBuilder()
        .setTitle("Caps Lock Koruması Kapatıldı!")
        .setDescription("✅ Caps Lock koruması devre dışı bırakıldı.")
        .setColor("Red");
      await interaction.reply({ embeds: [embed] });
    }
  },
};

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const capsLockKoruma = db.get(`capsLockKoruma_${guildId}`);

  if (capsLockKoruma) {
    if (message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    const content = message.content;
    const upperCaseCount = content.replace(/[^A-Z]/g, "").length;
    const totalLetters = content.replace(/[^A-Za-z]/g, "").length;

    if (totalLetters > 5 && upperCaseCount / totalLetters > 0.7) {
      await message.delete();
      await message.author
        .send({
          content: `❌ | **${message.channel.name}** kanalında aşırı büyük harf kullanımı tespit edildi! Lütfen daha az büyük harf kullan.`,
        })
        .catch(() => {});
    }
  }
});
