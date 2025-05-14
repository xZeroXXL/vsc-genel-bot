const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  name: "snipe",
  description: "Son silinen kullanıcı mesajını gösterir.",
  type: 1,
  options: [],

  run: async (client, interaction) => {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    ) {
      return interaction.reply({
        content:
          "Bu komutu kullanmak için 'Mesajları Yönet' yetkisine ihtiyacınız var!",
        ephemeral: true,
      });
    }

    const snipes = client.snipes.get(interaction.channel.id) || [];

    const userSnipes = snipes.filter((snipe) => !snipe.author.bot);

    if (!userSnipes.length) {
      return interaction.reply({
        content: "Bu kanalda silinmiş kullanıcı mesajı bulunmuyor!",
        ephemeral: true,
      });
    }

    const snipe = userSnipes[0];

    const embed = new EmbedBuilder()
      .setColor("Orange")
      .setAuthor({
        name: snipe.author.tag,
        iconURL: snipe.author.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(snipe.content || "*Boş mesaj*")
      .setTimestamp(snipe.timestamp)
      .setFooter({
        text: `Kullanıcı ID: ${snipe.author.id} | İsteyen: ${interaction.user.tag}`,
      });

    await interaction.reply({ embeds: [embed] });
  },
};

client.snipes = new Map();

client.on("messageDelete", (message) => {
  if (message.partial || message.author.bot) return;

  const snipes = client.snipes.get(message.channel.id) || [];

  snipes.unshift({
    content: message.content,
    author: message.author,
    timestamp: message.createdTimestamp,
  });

  if (snipes.length > 10) snipes.splice(10);

  client.snipes.set(message.channel.id, snipes);
});
