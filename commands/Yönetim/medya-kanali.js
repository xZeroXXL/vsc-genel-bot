const {
  Client,
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");
const db = require("croxydb");

module.exports = [
  {
    name: "medya-kanalı",
    description: "Belirtilen kanalı sadece fotoğraf gönderimine kısıtlar!",
    type: 1,
    options: [
      {
        name: "kanal",
        description: "Fotoğraf gönderimine kısıtlanacak kanalı seçin",
        type: 7,
        required: true,
        channel_types: [ChannelType.GuildText],
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

      const kanal = interaction.options.getChannel("kanal");
      const guildId = interaction.guild.id;

      const mevcutKanal = db.get(`medyaKanal_${guildId}`);
      if (mevcutKanal && mevcutKanal !== kanal.id) {
        return interaction.reply({
          content:
            "❌ | Bu sunucuda zaten bir medya kanalı ayarlanmış! Önce mevcut medya kanalını kapatmalısınız.",
          ephemeral: true,
        });
      }

      db.set(`medyaKanal_${guildId}`, kanal.id);

      const embed = new EmbedBuilder()
        .setTitle("Medya Kanalı Ayarlandı!")
        .setDescription(
          `📸 **${kanal}** kanalı artık sadece fotoğraf gönderimine açık! Yöneticiler bu kısıtlamadan muaf.\n\nKapatmak için: \`/medya-kanalı-kapat\``
        )
        .setColor("Green");

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    name: "medya-kanalı-kapat",
    description: "Medya kanalı kısıtlamasını kaldırır!",
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
      const mevcutKanal = db.get(`medyaKanal_${guildId}`);

      if (!mevcutKanal) {
        return interaction.reply({
          content: "❌ | Bu sunucuda ayarlanmış bir medya kanalı bulunmuyor!",
          ephemeral: true,
        });
      }

      db.delete(`medyaKanal_${guildId}`);

      const embed = new EmbedBuilder()
        .setTitle("Medya Kanalı Kapatıldı!")
        .setDescription(
          `✅ Medya kanalı kısıtlaması kaldırıldı. Artık tüm kanallarda her türlü içerik gönderilebilir.`
        )
        .setColor("Red");

      await interaction.reply({ embeds: [embed] });
    },
  },
];

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const medyaKanalId = db.get(`medyaKanal_${guildId}`);

  if (medyaKanalId && message.channel.id === medyaKanalId) {
    if (message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    if (
      !message.attachments.some((attachment) =>
        attachment.contentType?.startsWith("image/")
      )
    ) {
      await message.delete();
      await message.author
        .send({
          content: `❌ | **${message.channel.name}** kanalına sadece fotoğraf gönderilebilir!`,
        })
        .catch(() => {});
    }
  }
});

