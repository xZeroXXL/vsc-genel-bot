const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const moment = require("moment");
require("moment-duration-format");
moment.locale("tr");

module.exports = {
  name: "kullanıcı-bilgi",
  description: "Kullanıcı hakkında bilgi verir!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 5,
  options: [
    {
      name: "kullanıcı",
      description: "Bilgisi görüntülenecek kullanıcı",
      type: ApplicationCommandOptionType.User,
      required: false
    },
  ],
  
  run: async(client, interaction) => {
    const user = interaction.options.getUser("kullanıcı") || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);
    
    
    const createdAt = moment(user.createdAt).format("DD MMMM YYYY, HH:mm");
    const createdAtFromNow = moment(user.createdAt).fromNow();
    
    
    const joinedAt = moment(member.joinedAt).format("DD MMMM YYYY, HH:mm");
    const joinedAtFromNow = moment(member.joinedAt).fromNow();
    
    
    const roles = member.roles.cache
      .filter(role => role.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(role => role.toString())
      .join(", ") || "Rol bulunmuyor.";
    
    const embed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle(`👤 | ${user.tag} Kullanıcı Bilgisi`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields([
        { name: "🆔 Kullanıcı ID", value: `\`${user.id}\``, inline: true },
        { name: "👤 Kullanıcı Adı", value: `\`${user.username}\``, inline: true },
        { name: "🏷️ Etiket", value: `\`#${user.discriminator}\``, inline: true },
        { name: "🗓️ Hesap Oluşturulma Tarihi", value: `\`${createdAt}\` (${createdAtFromNow})`, inline: false },
        { name: "📥 Sunucuya Katılma Tarihi", value: `\`${joinedAt}\` (${joinedAtFromNow})`, inline: false },
        { name: `📋 Roller [${member.roles.cache.size - 1}]`, value: roles, inline: false }
      ])
      .setFooter({ text: client.config.footer })
      .setTimestamp();
    
    interaction.reply({ embeds: [embed] });
  }
};