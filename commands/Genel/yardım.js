const {
  EmbedBuilder,
  ApplicationCommandType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const fs = require("fs");
const config = require("../../config.json");

module.exports = {
  name: "yardım",
  description: "Botun komutlarını listeler!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 5,

  run: async (client, interaction) => {
    const commandFolders = fs.readdirSync("./commands");

    let totalCommands = 0;
    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(`./commands/${folder}`)
        .filter((file) => file.endsWith(".js"));
      for (const file of commandFiles) {
        const commandModule = require(`../../commands/${folder}/${file}`);
        if (Array.isArray(commandModule)) {
          totalCommands += commandModule.length;
        } else {
          totalCommands += 1;
        }
      }
    }

    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId("category-select")
      .setPlaceholder("Bir kategori seçin")
      .addOptions(
        commandFolders.map((folder) => ({
          label: folder.charAt(0).toUpperCase() + folder.slice(1),
          description: `${
            folder.charAt(0).toUpperCase() + folder.slice(1)
          } kategorisindeki komutları görüntüle`,
          value: folder,
        }))
      );

    const mainEmbed = new EmbedBuilder()
      .setColor(client.config.embedColor)
      .setTitle("📚 | Komut Listesi")
      .setDescription(
        `Aşağıdaki menüden bir kategori seçerek komutları görüntüleyebilirsiniz.\nKomut aramak için "Komut Ara" butonunu kullanabilirsiniz.\n\n**Toplam Komut Sayısı: ${totalCommands}**`
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: client.config.footer })
      .setTimestamp();

    const categoryRow = new ActionRowBuilder().addComponents(categorySelect);

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("search-commands")
        .setLabel("Komut Ara")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔍"),
      new ButtonBuilder()
        .setLabel("Sunucuya Ekle")
        .setStyle(ButtonStyle.Link)
        .setURL(config["bot-davet"]),
      new ButtonBuilder()
        .setLabel("Destek Sunucusu")
        .setStyle(ButtonStyle.Link)
        .setURL(config.desteksunucusu)
    );

    const response = await interaction.reply({
      embeds: [mainEmbed],
      components: [categoryRow, buttonRow],
      fetchReply: true,
    });

    const collector = response.createMessageComponentCollector({
      time: 300000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "category-select") {
        const selectedCategory = i.values[0];

        const commandFiles = fs
          .readdirSync(`./commands/${selectedCategory}`)
          .filter((file) => file.endsWith(".js"));

        let commandList = "";

        for (const file of commandFiles) {
          const commandModule = require(`../../commands/${selectedCategory}/${file}`);

          if (Array.isArray(commandModule)) {
            for (const cmd of commandModule) {
              if (cmd.name && cmd.description) {
                const commandId = client.commandIds.get(cmd.name);
                if (commandId) {
                  commandList += `> </${cmd.name}:${commandId}> - ${cmd.description}\n`;
                } else {
                  commandList += `> \`/${cmd.name}\` - ${cmd.description}\n`;
                }
              }
            }
          } else {
            if (commandModule.name && commandModule.description) {
              const commandId = client.commandIds.get(commandModule.name);
              if (commandId) {
                commandList += `> </${commandModule.name}:${commandId}> - ${commandModule.description}\n`;
              } else {
                commandList += `> \`/${commandModule.name}\` - ${commandModule.description}\n`;
              }
            }
          }
        }

        const categoryEmbed = new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setTitle(
            `📁 ${
              selectedCategory.charAt(0).toUpperCase() +
              selectedCategory.slice(1)
            } Komutları`
          )
          .setDescription(commandList || "Bu kategoride komut bulunamadı.")
          .setThumbnail(client.user.displayAvatarURL())
          .setFooter({ text: client.config.footer })
          .setTimestamp();

        await i.update({
          embeds: [categoryEmbed],
          components: [categoryRow, buttonRow],
        });
      }

      if (i.customId === "search-commands") {
        const searchModal = new ModalBuilder()
          .setCustomId("command-search-modal")
          .setTitle("Komut Arama");

        const searchInput = new TextInputBuilder()
          .setCustomId("search-input")
          .setLabel("Aramak istediğiniz komut veya anahtar kelime")
          .setPlaceholder(
            "Aramak istediğiniz komutun adını veya açıklamasındaki anahtar kelimeyi girin"
          )
          .setRequired(true)
          .setStyle(TextInputStyle.Short);

        const firstActionRow = new ActionRowBuilder().addComponents(
          searchInput
        );
        searchModal.addComponents(firstActionRow);

        await i.showModal(searchModal);
      }
    });

    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isModalSubmit()) return;

      if (interaction.customId === "command-search-modal") {
        const searchQuery = interaction.fields
          .getTextInputValue("search-input")
          .toLowerCase();

        let allCommands = [];
        let matchedCommands = [];

        for (const folder of commandFolders) {
          const commandFiles = fs
            .readdirSync(`./commands/${folder}`)
            .filter((file) => file.endsWith(".js"));

          for (const file of commandFiles) {
            const commandModule = require(`../../commands/${folder}/${file}`);

            if (Array.isArray(commandModule)) {
              for (const cmd of commandModule) {
                if (cmd.name && cmd.description) {
                  allCommands.push({
                    name: cmd.name,
                    description: cmd.description,
                    category: folder,
                  });
                }
              }
            } else {
              if (commandModule.name && commandModule.description) {
                allCommands.push({
                  name: commandModule.name,
                  description: commandModule.description,
                  category: folder,
                });
              }
            }
          }
        }

        matchedCommands = allCommands.filter(
          (cmd) =>
            cmd.name.toLowerCase().includes(searchQuery) ||
            cmd.description.toLowerCase().includes(searchQuery)
        );

        let resultDescription = "";

        if (matchedCommands.length > 0) {
          matchedCommands.forEach((cmd) => {
            const commandId = client.commandIds.get(cmd.name);
            if (commandId) {
              resultDescription += `> </${cmd.name}:${commandId}> *(${cmd.category})* - ${cmd.description}\n`;
            } else {
              resultDescription += `> **/${cmd.name}** *(${cmd.category})* - ${cmd.description}\n`;
            }
          });
        } else {
          resultDescription = "Aradığınız kriterlere uygun komut bulunamadı.";
        }

        const searchResultEmbed = new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setTitle(`🔍 Komut Arama Sonuçları: "${searchQuery}"`)
          .setDescription(resultDescription)
          .setFooter({
            text: `${matchedCommands.length} komut bulundu • ${client.config.footer}`,
          })
          .setTimestamp();

        await interaction.reply({
          embeds: [searchResultEmbed],
          ephemeral: true,
        });
      }
    });

    collector.on("end", () => {
      categorySelect.setDisabled(true);
      interaction
        .editReply({
          components: [
            new ActionRowBuilder().addComponents(categorySelect),
            buttonRow,
          ],
        })
        .catch(() => {});
    });
  },
};
