const { InteractionType, PermissionFlagsBits } = require("discord.js");
const { errorEmbed } = require("../../function/embedCreator");

async function handleCommand(client, interaction, command) {
  if (
    command.default_member_permissions &&
    !interaction.member.permissions.has(command.default_member_permissions)
  ) {
    return interaction.reply({
      content: "⚠️ Bu komutu kullanmak için gerekli yetkiye sahip değilsiniz!",
      ephemeral: true,
    });
  }
  await command.run(client, interaction);
}

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(client, interaction) {
    if (interaction.type === InteractionType.ApplicationCommand) {
      const command = client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        const { cooldowns } = client;

        if (!cooldowns.has(command.name)) {
          cooldowns.set(command.name, new Map());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (timestamps.has(interaction.user.id)) {
          const expirationTime =
            timestamps.get(interaction.user.id) + cooldownAmount;

          if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return interaction.reply({
              embeds: [
                errorEmbed(
                  `Lütfen \`${timeLeft.toFixed(1)}\` saniye bekleyiniz!`
                ),
              ],
              ephemeral: true,
            });
          }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(
          () => timestamps.delete(interaction.user.id),
          cooldownAmount
        );

        await handleCommand(client, interaction, command);
      } catch (error) {
        console.error(
          `❌ | Komut çalıştırılırken hata: ${interaction.commandName}`
        );
        console.error(error);

        await interaction
          .reply({
            embeds: [errorEmbed("Bu komutu çalıştırırken bir hata oluştu!")],
            ephemeral: true,
          })
          .catch(console.error);
      }
    }

    if (interaction.isButton()) {
    }
  },
};
