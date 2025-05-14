const {
  Client,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const db = require("croxydb");

module.exports = [
  {
    name: "giriş-çıkış",
    description:
      "Kullanıcı giriş-çıkış mesajlarının gönderileceği kanalı ayarlar!",
    type: 1,
    options: [
      {
        name: "kanal",
        description: "Giriş-çıkış mesajlarının gönderileceği kanal",
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

      db.set(`girisCikisKanal_${guildId}`, kanal.id);

      const embed = new EmbedBuilder()
        .setTitle("Giriş-Çıkış Kanalı Ayarlandı! 🎉")
        .setDescription(
          `✅ **${kanal}** kanalına artık kullanıcı giriş ve çıkış mesajları gönderilecek.\nKapatmak için: \`/giriş-çıkış-kapat\``
        )
        .setColor("Green")
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    name: "giriş-çıkış-kapat",
    description: "Giriş-çıkış mesaj sistemini kapatır!",
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
      const mevcutKanal = db.get(`girisCikisKanal_${guildId}`);

      if (!mevcutKanal) {
        return interaction.reply({
          content: "❌ | Bu sunucuda giriş-çıkış sistemi zaten ayarlı değil!",
          ephemeral: true,
        });
      }

      db.delete(`girisCikisKanal_${guildId}`);

      const embed = new EmbedBuilder()
        .setTitle("Giriş-Çıkış Sistemi Kapatıldı! 🔇")
        .setDescription("✅ Giriş-çıkış mesajları artık gönderilmeyecek.")
        .setColor("Red")
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    },
  },
];

client.on("guildMemberAdd", async (member) => {
  const guildId = member.guild.id;
  const kanalId = db.get(`girisCikisKanal_${guildId}`);

  if (!kanalId) return;

  const kanal = await member.guild.channels.fetch(kanalId).catch(() => null);
  if (!kanal) {
    db.delete(`girisCikisKanal_${guildId}`);
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("🎉 Yeni Bir Üye Katıldı!")
    .setDescription(
      `
      **Hoş Geldin ${member.user.tag}!** 🎊
      Sunucumuza katıldığın için teşekkürler! 😊

      **Kullanıcı Bilgileri:**
      🆔 **ID:** ${member.user.id}
      📅 **Hesap Oluşturma:** <t:${Math.floor(member.user.createdAt / 1000)}:R>

      **Sunucu Bilgileri:**
      👥 **Üye Sayısı:** ${member.guild.memberCount}
      🌐 **Sunucu:** ${member.guild.name}
    `
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setImage(
      "https://media.tenor.com/1c8Um5VErzwAAAAM/deep-turkish-web-hosgeldin.gif"
    )
    .setColor("#00FF00")
    .setFooter({
      text: `Sunucumuza hoş geldin!`,
      iconURL: member.guild.iconURL(),
    })
    .setTimestamp();

  await kanal.send({ embeds: [embed] }).catch(() => {});
});

client.on("guildMemberRemove", async (member) => {
  const guildId = member.guild.id;
  const kanalId = db.get(`girisCikisKanal_${guildId}`);

  if (!kanalId) return;

  const kanal = await member.guild.channels.fetch(kanalId).catch(() => null);
  if (!kanal) {
    db.delete(`girisCikisKanal_${guildId}`);
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("👋 Bir Üye Ayrıldı")
    .setDescription(
      `
      **${member.user.tag}** sunucudan ayrıldı. 😔
      Umarız tekrar aramıza dönersin!

      **Kullanıcı Bilgileri:**
      🆔 **ID:** ${member.user.id}
      📅 **Katılma Tarihi:** <t:${Math.floor(member.joinedAt / 1000)}:R>

      **Sunucu Bilgileri:**
      👥 **Üye Sayısı:** ${member.guild.memberCount}
      🌐 **Sunucu:** ${member.guild.name}
    `
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setImage("https://i.gifer.com/W1ph.gif")
    .setColor("#FF0000")
    .setFooter({ text: `Güle güle!`, iconURL: member.guild.iconURL() })
    .setTimestamp();

  await kanal.send({ embeds: [embed] }).catch(() => {});
});
