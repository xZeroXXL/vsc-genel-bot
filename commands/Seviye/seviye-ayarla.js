const {
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "seviye-ayarla",
  description: "Kullanıcının seviyesini ayarlar!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 5,
  options: [
    {
      name: "kullanıcı",
      description: "Seviyesi ayarlanacak kullanıcı",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "seviye",
      description: "Ayarlanacak seviye (1-100)",
      type: ApplicationCommandOptionType.Integer,
      required: true,
      minValue: 1,
      maxValue: 100,
    },
  ],

  run: async (client, interaction) => {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.errorColor)
            .setDescription(
              "❌ | Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın!"
            ),
        ],
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("kullanıcı");
    const level = interaction.options.getInteger("seviye");

    db.set(`level_${user.id}_${interaction.guild.id}`, level);
    db.set(`xp_${user.id}_${interaction.guild.id}`, 0);

    const embed = new EmbedBuilder()
      .setColor(client.config.successColor)
      .setDescription(
        `✅ | ${user} kullanıcısının seviyesi **${level}** olarak ayarlandı!`
      )
      .setFooter({ text: client.config.footer })
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  },
};
