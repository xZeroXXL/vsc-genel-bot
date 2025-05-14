const {
  Client,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "yavaş-mod",
  description: "Kanalda yavaş modu ayarlar veya kapatır!",
  type: 1,
  options: [
    {
      name: "kanal",
      description: "Yavaş modun uygulanacağı kanal",
      type: 7,
      required: true,
      channel_types: [ChannelType.GuildText],
    },
    {
      name: "süre",
      description: "Yavaş mod süresi (saniye, 0-21600, 0 = kapat)",
      type: 4,
      required: true,
      min_value: 0,
      max_value: 21600,
    },
  ],
  run: async (client, interaction) => {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageChannels
      )
    ) {
      return interaction.reply({
        content:
          "❌ | Bu komutu kullanmak için **Kanalları Yönet** yetkisine sahip olmalısınız!",
        ephemeral: true,
      });
    }

    const kanal = interaction.options.getChannel("kanal");
    const süre = interaction.options.getInteger("süre");
    const guildId = interaction.guild.id;

    const botMember = interaction.guild.members.me;
    if (
      !botMember
        .permissionsIn(kanal)
        .has(PermissionsBitField.Flags.ManageChannels)
    ) {
      return interaction.reply({
        content: "❌ | Botun bu kanalda yavaş modu ayarlamak için yetkisi yok!",
        ephemeral: true,
      });
    }

    try {
      await kanal.setRateLimitPerUser(
        süre,
        `Yavaş mod ${interaction.user.tag} tarafından ayarlandı`
      );

      if (süre === 0) {
        db.delete(`yavasMod_${guildId}_${kanal.id}`);
      } else {
        db.set(`yavasMod_${guildId}_${kanal.id}`, {
          süre,
          ayarlayan: interaction.user.id,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("⏳ Yavaş Mod Ayarlandı!")
        .setDescription(
          `
          **Kanal:** ${kanal}
          **Süre:** ${süre === 0 ? "Kapatıldı" : `${süre} saniye`}
          **Ayarlayan:** ${interaction.user}
        `
        )
        .setColor(süre === 0 ? "#FF0000" : "#00FF00")
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Yavaş mod ayarlanırken hata:", error);
      await interaction.reply({
        content: "❌ | Yavaş mod ayarlanırken bir hata oluştu!",
        ephemeral: true,
      });
    }
  },
};


