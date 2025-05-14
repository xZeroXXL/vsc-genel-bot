const { Client, EmbedBuilder, PermissionsBitField } = require("discord.js");
const config = require("../../config.json");

module.exports = {
  name: "say",
  description: "Sunucudaki üye istatistiklerini gösterir.",
  type: 1,
  options: [],

  run: async (client, interaction) => {
    await interaction.guild.members.fetch();

    const totalMembers = interaction.guild.memberCount;
    const realMembers = interaction.guild.members.cache.filter(
      (member) => !member.user.bot
    ).size;
    const botMembers = interaction.guild.members.cache.filter(
      (member) => member.user.bot
    ).size;
    const admins = interaction.guild.members.cache.filter((member) =>
      member.permissions.has(PermissionsBitField.Flags.Administrator)
    ).size;
    const fakeMembers = interaction.guild.members.cache.filter((member) => {
      const accountAge = Date.now() - member.user.createdAt.getTime();
      return accountAge < 15 * 24 * 60 * 60 * 1000;
    }).size;

    const iconURL =
      interaction.guild.iconURL({ dynamic: true }) ||
      "https://i.hizliresim.com/n5271mq.jpg";

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle(`${config["bot-adi"]} - Sunucu İstatistikleri`)
      .setThumbnail(iconURL)
      .setDescription(
        `👥 **Toplam Üye:** ${totalMembers}\n` +
          `✅ **Gerçek Üye:** ${realMembers}\n` +
          `🤖 **Bot Üye:** ${botMembers}\n` +
          `❗ **Sahte Üye:** ${fakeMembers} (Son 15 günde açılan hesaplar)\n` +
          `🛡️ **Yönetici Yetkili:** ${admins}`
      )
      .setFooter({ text: `İsteyen: ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
