const { Client, EmbedBuilder, GatewayIntentBits } = require("discord.js");
const moment = require("moment");
const config = require("../../config.json");

module.exports = {
  name: "sunucu-bilgi",
  description: "Sunucu hakkında detaylı bilgiler gösterir.",
  type: 1,
  options: [],

  run: async (client, interaction) => {
    await interaction.guild.members.fetch();

    const channels = interaction.guild.channels.cache;
    const categories = channels.filter((c) => c.type === 4).size;
    const voice = channels.filter((c) => c.type === 2).size;
    const text = channels.filter((c) => c.type === 0).size;
    const threads = channels.filter((c) => c.type === 11).size;

    const owner = await interaction.guild.fetchOwner();

    const region = interaction.guild.preferredLocale;
    const countryMap = {
      tr: "Türkiye",
      "en-US": "Amerika",
    };
    const country = countryMap[region] || region;

    const verificationLevel = interaction.guild.verificationLevel;
    const verificationMap = {
      0: "Yok",
      1: "Düşük",
      2: "Orta",
      3: "Yüksek",
      4: "Çok Yüksek",
    };
    const verification = verificationMap[verificationLevel] || "Bilinmiyor";

    const emojis = interaction.guild.emojis.cache;
    const emojiList = emojis.size
      ? emojis
          .map((e) => e.toString())
          .slice(0, 32)
          .join(" ") || "Emoji Yok"
      : "Emoji Yok";

    const roles = interaction.guild.roles.cache;
    const roleList =
      roles.size < 5
        ? "Yönetilebilir Rol Yok"
        : roles
            .map((r) => (r.name !== "@everyone" ? r.toString() : ""))
            .filter(Boolean)
            .slice(0, 8)
            .join(" ");

    const embed = new EmbedBuilder()
      .setColor("Purple")
      .setThumbnail(
        interaction.guild.iconURL({ dynamic: true }) ||
          "https://cdn.discordapp.com/attachments/985147469363036232/1001388484868714527/6134072535d460dc1097a60a729b43c2.png"
      )
      .addFields(
        {
          name: "Sunucu Adı",
          value: `\`${interaction.guild.name}\``,
          inline: true,
        },
        {
          name: "Sunucu ID",
          value: `\`${interaction.guild.id}\``,
          inline: true,
        },
        { name: "Sunucu Sahibi", value: `\`${owner.user.tag}\``, inline: true },
        { name: "Bölge", value: `\`${country}\``, inline: true },
        {
          name: "Oluşturulma Tarihi",
          value: `\`${moment(interaction.guild.createdAt).format(
            "D MMMM YYYY"
          )}\``,
          inline: true,
        },
        {
          name: "Takviye Seviyesi",
          value: `\`${interaction.guild.premiumTier}. Seviye - ${interaction.guild.premiumSubscriptionCount} Takviye\``,
          inline: true,
        },
        {
          name: "Üye Sayısı",
          value: `\`${interaction.guild.memberCount} (${
            interaction.guild.members.cache.filter((x) => x.user.bot).size
          } Bot)\``,
          inline: true,
        },
        {
          name: "Doğrulama Seviyesi",
          value: `\`${verification}\``,
          inline: true,
        },
        {
          name: "Kanal Sayısı",
          value: `\`${channels.size}\` (\`${categories}\` Kategori, \`${voice}\` Ses, \`${text}\` Yazı, \`${threads}\` Thread)`,
          inline: true,
        },
        {
          name: "Emojiler",
          value: `\`${emojis.filter((e) => e.animated).size}\` Hareketli, \`${
            emojis.filter((e) => !e.animated).size
          }\` Sabit\n${emojiList}`,
          inline: true,
        },
        { name: "Roller", value: `\`${roles.size}\` ${roleList}`, inline: true }
      )
      .setFooter({ text: `İsteyen: ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });
  },
};
