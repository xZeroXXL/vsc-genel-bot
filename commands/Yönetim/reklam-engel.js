const { Client, EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "reklam-engel",
  description: "Reklam engel sistemini açar veya kapatır!",
  type: 1,
  options: [
    {
      name: "durum",
      description: "Reklam engel sistemini aç veya kapat",
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
      db.set(`reklamEngel_${guildId}`, true);
      const embed = new EmbedBuilder()
        .setTitle("Reklam Engel Açıldı!")
        .setDescription(
          "🔗 Artık mesajlarda reklam bağlantıları engellenecek. Yöneticiler bu kısıtlamadan muaf."
        )
        .setColor("Green");
      await interaction.reply({ embeds: [embed] });
    } else {
      db.delete(`reklamEngel_${guildId}`);
      const embed = new EmbedBuilder()
        .setTitle("Reklam Engel Kapatıldı!")
        .setDescription("✅ Reklam engel sistemi devre dışı bırakıldı.")
        .setColor("Red");
      await interaction.reply({ embeds: [embed] });
    }
  },
};

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const reklamEngel = db.get(`reklamEngel_${guildId}`);

  if (reklamEngel) {
    if (message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    const content = message.content.toLowerCase();
    const reklamRegex = /(discord\.gg\/|http[s]?:\/\/|www\.)/i;

    if (reklamRegex.test(content)) {
      await message.delete();
      await message.author
        .send({
          content: `❌ | **${message.channel.name}** kanalında reklam bağlantısı tespit edildi! Reklam göndermek yasaktır.`,
        })
        .catch(() => {});
    }
  }
});

