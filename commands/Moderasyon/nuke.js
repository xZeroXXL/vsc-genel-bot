const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  name: "nuke",
  description:
    "Kanalı sıfırlar (tüm mesajları siler ve kanalı yeniden oluşturur).",
  type: 1,
  permissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 10,

  data: new SlashCommandBuilder()
    .setName("nuke")
    .setDescription(
      "Kanalı sıfırlar (tüm mesajları siler ve kanalı yeniden oluşturur)."
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  run: async (client, interaction) => {
    const channel = interaction.channel;

    const position = channel.position;
    const topic = channel.topic;
    const nsfw = channel.nsfw;
    const parent = channel.parentId;
    const permissionOverwrites = channel.permissionOverwrites.cache;

    try {
      await channel.delete();

      const newChannel = await interaction.guild.channels.create({
        name: channel.name,
        type: channel.type,
        position: position,
        topic: topic,
        nsfw: nsfw,
        parent: parent,
        permissionOverwrites: permissionOverwrites,
      });

      const successEmbed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("💥 Kanal Nuke Edildi!")
        .setDescription(
          `Bu kanal sıfırlandı! Eski mesajlar silindi ve kanal yeniden oluşturuldu.\n**Yetkili:** ${interaction.user}`
        )
        .setTimestamp()
        .setFooter({ text: client.config?.footer || "Bot Footer" });

      await newChannel.send({ embeds: [successEmbed] });


    } catch (error) {
      console.error("Nuke komutu hatası:", error);
      await interaction.reply({
        content:
          "Kanalı nuke ederken bir hata oluştu. Lütfen yetkileri kontrol edin veya tekrar deneyin.",
        ephemeral: true,
      });
    }
  },
};
