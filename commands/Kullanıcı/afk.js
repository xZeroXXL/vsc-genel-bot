const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "afk",
  description: "Afk Olursun!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 5,
  options: [
    {
      name: "sebep",
      description: "Afk Olma Sebebini Gir!",
      type: ApplicationCommandOptionType.String,
      required: true
    },
  ],

  run: async(client, interaction) => {
    const sebep = interaction.options.getString('sebep');
    
    db.set(`afk_${interaction.user.id}`, sebep);
    db.set(`afkDate_${interaction.user.id}`, { date: Date.now() });
    
    const embed = new EmbedBuilder()
      .setColor(client.config.successColor)
      .setDescription(`✅ | Başarıyla AFK moduna geçtiniz!\n\n📝 **Sebep:** ${sebep}`)
      .setFooter({ text: client.config.footer })
      .setTimestamp();
    
    interaction.reply({ embeds: [embed] });
  }
};