const { Client, EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType, PermissionsBitField } = require("discord.js");
const db = require("croxydb");

module.exports = {
  name: "seviye-sistemi-ayarla",
  description: "Seviye sistemini açar, kapatır veya ayarlarını yapılandırır.",
  type: ApplicationCommandType.ChatInput,
  cooldown: 5,
  options: [
    {
      name: "durum",
      description: "Seviye sistemini aç veya kapat",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Açık", value: "açık" },
        { name: "Kapalı", value: "kapalı" },
      ],
    },
    {
      name: "log-kanali",
      description: "Seviye atlama bildirimlerinin gönderileceği kanal",
      type: ApplicationCommandOptionType.Channel,
      required: false,
    },
    {
      name: "xp-katsayisi",
      description: "Her seviye için gereken XP katsayısı (örneğin, 100 veya 200)",
      type: ApplicationCommandOptionType.Integer,
      required: false,
      min_value: 10,
      max_value: 5000,
    },
  ],

  run: async (client, interaction) => {
    
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısın!",
        ephemeral: true,
      });
    }

    const durum = interaction.options.getString("durum");
    const logKanal = interaction.options.getChannel("log-kanali");
    const xpKatsayisi = interaction.options.getInteger("xp-katsayisi");
    const guildId = interaction.guild.id;

    try {
      
      if (durum === "açık") {
        db.set(`seviyeSistemi_${guildId}`, true);
//        console.log(`Seviye sistemi açıldı: ${guildId}`);
      } else if (durum === "kapalı") {
        db.set(`seviyeSistemi_${guildId}`, false);
//        console.log(`Seviye sistemi kapatıldı: ${guildId}`);
      }

      
      if (logKanal) {
        
        if (logKanal.type === 0 || logKanal.type === 5) { 
          db.set(`levelLogChannel_${guildId}`, logKanal.id);
//          console.log(`Log kanalı ayarlandı: ${logKanal.id}`);
        } else {
          return interaction.reply({
            content: "Lütfen bir metin veya duyuru kanalı seç!",
            ephemeral: true,
          });
        }
      }

      
      if (xpKatsayisi) {
        db.set(`xpKatsayisi_${guildId}`, xpKatsayisi);
//        console.log(`XP katsayısı ayarlandı: ${xpKatsayisi}`);
      }

      
      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("🎉 Seviye Sistemi Ayarları Güncellendi!")
        .addFields([
          { name: "Durum", value: durum === "açık" ? "✅ Açık" : "❌ Kapalı", inline: true },
          { name: "Log Kanalı", value: logKanal ? `<#${logKanal.id}>` : "Değiştirilmedi", inline: true },
          { name: "XP Katsayısı", value: xpKatsayisi ? `\`${xpKatsayisi}\`` : "Değiştirilmedi", inline: true },
        ])
        .setFooter({ text: "Seviye Sistemi | Botun Adı" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Ayarlar kaydedilirken hata oluştu:", error);
      await interaction.reply({
        content: "Ayarlar kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
        ephemeral: true,
      });
    }
  },
};