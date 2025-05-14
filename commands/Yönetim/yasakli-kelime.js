const { Client, EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("croxydb");

module.exports = [
  {
    name: "yasaklı-kelime-ekle",
    description: "Yasaklı kelime listesine kelime ekler!",
    type: 1,
    options: [
      {
        name: "kelime",
        description: "Eklenecek yasaklı kelime",
        type: 3,
        required: true,
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

      const kelime = interaction.options.getString("kelime").toLowerCase();
      const guildId = interaction.guild.id;

      let yasaklıKelimeler = db.get(`yasakliKelimeler_${guildId}`) || [];
      if (yasaklıKelimeler.includes(kelime)) {
        return interaction.reply({
          content: `❌ | **${kelime}** zaten bu sunucunun yasaklı kelime listesinde!`,
          ephemeral: true,
        });
      }

      yasaklıKelimeler.push(kelime);
      db.set(`yasakliKelimeler_${guildId}`, yasaklıKelimeler);

      const embed = new EmbedBuilder()
        .setTitle("Yasaklı Kelime Eklendi!")
        .setDescription(
          `✅ **${kelime}** bu sunucunun yasaklı kelime listesine eklendi.`
        )
        .setColor("Green");
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    name: "yasaklı-kelime-çıkar",
    description: "Yasaklı kelime listesinden kelime çıkarır!",
    type: 1,
    options: [
      {
        name: "kelime",
        description: "Çıkarılacak yasaklı kelime",
        type: 3,
        required: true,
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

      const kelime = interaction.options.getString("kelime").toLowerCase();
      const guildId = interaction.guild.id;

      let yasaklıKelimeler = db.get(`yasakliKelimeler_${guildId}`) || [];
      if (!yasaklıKelimeler.includes(kelime)) {
        return interaction.reply({
          content: `❌ | **${kelime}** bu sunucunun yasaklı kelime listesinde bulunmuyor!`,
          ephemeral: true,
        });
      }

      yasaklıKelimeler = yasaklıKelimeler.filter((k) => k !== kelime);
      db.set(`yasakliKelimeler_${guildId}`, yasaklıKelimeler);

      const embed = new EmbedBuilder()
        .setTitle("Yasaklı Kelime Çıkarıldı!")
        .setDescription(
          `✅ **${kelime}** bu sunucunun yasaklı kelime listesinden çıkarıldı.`
        )
        .setColor("Red");
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    name: "yasaklı-kelime-liste",
    description: "Yasaklı kelime listesini gösterir!",
    type: 1,
    options: [],
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

      const guildId = interaction.guild.id;
      const yasaklıKelimeler = db.get(`yasakliKelimeler_${guildId}`) || [];

      if (yasaklıKelimeler.length === 0) {
        return interaction.reply({
          content: "📋 Bu sunucunun yasaklı kelime listesi boş!",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("Yasaklı Kelime Listesi")
        .setDescription(
          `📋 **Bu Sunucunun Yasaklı Kelimeleri:**\n${yasaklıKelimeler
            .map((k) => `- ${k}`)
            .join("\n")}`
        )
        .setColor("Blue");
      await interaction.reply({ embeds: [embed], ephemeral: true });
    },
  },
];
