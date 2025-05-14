const {
  EmbedBuilder,
  ApplicationCommandType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "ban-list",
  description: "Sunucudan yasaklanan kullanıcıları listeler!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,
  default_member_permissions: PermissionFlagsBits.BanMembers,
  run: async (client, interaction) => {
    try {
      const bans = await interaction.guild.bans.fetch();

      if (bans.size === 0) {
        return interaction.reply({
          content: "📋 Sunucuda yasaklanmış kullanıcı bulunmamaktadır!",
          ephemeral: true,
        });
      }

      let banList = "";
      let page = 1;
      const perPage = 10;

      const totalPages = Math.ceil(bans.size / perPage);
      const paginatedBans = Array.from(bans.values()).slice(0, perPage);

      for (const ban of paginatedBans) {
        banList += `**${ban.user.tag}** (${ban.user.id})\n`;
        banList += `> Sebep: ${ban.reason || "Sebep belirtilmedi"}\n\n`;
      }

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle("🚫 | Yasaklı Kullanıcılar")
        .setDescription(banList)
        .setFooter({
          text: `Sayfa ${page}/${totalPages} • Toplam ${bans.size} yasaklı kullanıcı • ${client.config.footer}`,
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "⚠️ Ban listesi alınırken bir hata oluştu. Yetkilere sahip olduğunuzdan emin olun.",
        ephemeral: true,
      });
    }
  },
};
