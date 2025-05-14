const {
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "temizle",
  description: "Belirtilen sayıda mesajı siler!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 5,
  options: [
    {
      name: "miktar",
      description: "Silinecek mesaj sayısı (1-100)",
      type: ApplicationCommandOptionType.Integer,
      required: true,
      minValue: 1,
      maxValue: 100,
    },
  ],

  run: async (client, interaction) => {
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.errorColor)
            .setDescription(
              "❌ | Bu komutu kullanmak için **Mesajları Yönet** yetkisine sahip olmalısın!"
            ),
        ],
        ephemeral: true,
      });
    }

    const miktar = interaction.options.getInteger("miktar");

    try {
      await interaction.channel.bulkDelete(miktar, true);

      const embed = new EmbedBuilder()
        .setColor(client.config.successColor)
        .setDescription(`✅ | Başarıyla **${miktar}** adet mesaj silindi!`)
        .setFooter({ text: client.config.footer })
        .setTimestamp();

      interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(error);

      const embed = new EmbedBuilder()
        .setColor(client.config.errorColor)
        .setDescription(
          "❌ | Mesajlar silinirken bir hata oluştu! 14 günden eski mesajlar silinemez."
        )
        .setFooter({ text: client.config.footer })
        .setTimestamp();

      interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
