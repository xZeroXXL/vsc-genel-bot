const { Client, EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("croxydb");

let kufurler = ["küfür1", "küfür2", "küfür3"];

module.exports = {
  name: "küfür-engel",
  description: "Küfür engel sistemini açar veya kapatır!",
  type: 1,
  options: [
    {
      name: "durum",
      description: "Küfür engel sistemini aç veya kapat",
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
      db.set(`kufurEngel_${guildId}`, true);
      const embed = new EmbedBuilder()
        .setTitle("Küfür Engel Açıldı!")
        .setDescription(
          "🤬 Artık mesajlarda küfür içeren kelimeler ve yasaklı kelimeler engellenecek. Yöneticiler bu kısıtlamadan muaf."
        )
        .setColor("Green");
      await interaction.reply({ embeds: [embed] });
    } else {
      db.delete(`kufurEngel_${guildId}`);
      const embed = new EmbedBuilder()
        .setTitle("Küfür Engel Kapatıldı!")
        .setDescription("✅ Küfür engel sistemi devre dışı bırakıldı.")
        .setColor("Red");
      await interaction.reply({ embeds: [embed] });
    }
  },
};

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const kufurEngel = db.get(`kufurEngel_${guildId}`);

  if (kufurEngel) {
    if (message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    const yasaklıKelimeler = db.get(`yasakliKelimeler_${guildId}`) || [];
    const content = message.content.toLowerCase();

    if (
      kufurler.some((kelime) => content.includes(kelime)) ||
      yasaklıKelimeler.some((kelime) => content.includes(kelime))
    ) {
      await message.delete();
      await message.author
        .send({
          content: `❌ | **${message.channel.name}** kanalında yasaklı veya küfür içeren kelime tespit edildi! Lütfen uygun dil kullan.`,
        })
        .catch(() => {});
    }
  }
});

