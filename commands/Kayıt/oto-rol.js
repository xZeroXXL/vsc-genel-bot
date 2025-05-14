const {
  Client,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const db = require("croxydb");

module.exports = [
  {
    name: "otorol-ayarla",
    description:
      "Yeni üyelere otomatik rol atar ve bilgilendirme mesajı gönderir!",
    type: 1,
    options: [
      {
        name: "rol",
        description: "Yeni üyelere verilecek rol",
        type: 8,
        required: true,
      },
      {
        name: "kanal",
        description: "Bilgilendirme mesajının gönderileceği kanal",
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

      const rol = interaction.options.getRole("rol");
      const kanal = interaction.options.getChannel("kanal");
      const guildId = interaction.guild.id;

      const botMember = interaction.guild.members.me;
      if (
        !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
        botMember.roles.highest.position <= rol.position
      ) {
        return interaction.reply({
          content:
            "❌ | Botun bu rolü atamak için yeterli yetkisi yok veya rol, botun en yüksek rolünden daha yüksek!",
          ephemeral: true,
        });
      }

      db.set(`otorol_${guildId}`, { rolId: rol.id, kanalId: kanal.id });

      const embed = new EmbedBuilder()
        .setTitle("Otorol Ayarlandı! 🎭")
        .setDescription(
          `
          ✅ **${rol}** rolü artık yeni üyelere otomatik olarak verilecek.
          📢 Bilgilendirme mesajları **${kanal}** kanalına gönderilecek.
          Kapatmak için: \`/otorol-kapat\`
        `
        )
        .setColor("Green")
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    name: "otorol-kapat",
    description: "Otorol sistemini kapatır!",
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
      const otorolAyar = db.get(`otorol_${guildId}`);

      if (!otorolAyar) {
        return interaction.reply({
          content: "❌ | Bu sunucuda otorol sistemi zaten ayarlı değil!",
          ephemeral: true,
        });
      }

      db.delete(`otorol_${guildId}`);

      const embed = new EmbedBuilder()
        .setTitle("Otorol Sistemi Kapatıldı! 🔧")
        .setDescription(
          "✅ Otorol sistemi devre dışı bırakıldı. Yeni üyelere artık otomatik rol verilmeyecek."
        )
        .setColor("Red")
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    },
  },
];

client.on("guildMemberAdd", async (member) => {
  const guildId = member.guild.id;
  const otorolAyar = db.get(`otorol_${guildId}`);

  if (!otorolAyar) return;

  const { rolId, kanalId } = otorolAyar;

  const rol = await member.guild.roles.fetch(rolId).catch(() => null);
  const kanal = await member.guild.channels.fetch(kanalId).catch(() => null);

  if (!rol || !kanal) {
    db.delete(`otorol_${guildId}`);
    return;
  }

  await member.roles.add(rol).catch(() => {});

  const embed = new EmbedBuilder()
    .setTitle("Yeni Üye! 🎉")
    .setDescription(
      `
      **${member.user.tag}** sunucumuza katıldı! 😊
      **Verilen Rol:** ${rol}
      **Üye Sayısı:** ${member.guild.memberCount}
    `
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setColor("Blue")
    .setTimestamp();

  await kanal.send({ embeds: [embed] }).catch(() => {});
});

