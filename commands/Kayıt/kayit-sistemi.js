const {
  Client,
  EmbedBuilder,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const db = require("croxydb");

module.exports = [
  {
    name: "register-setup",
    description: "Sunucuda kayıt sistemini kurar.",
    type: 1,
    options: [
      {
        name: "channel",
        description: "Kayıt işlemlerinin yapılacağı kanal.",
        type: 7,
        required: true,
        channel_types: [0],
      },
      {
        name: "staff-role",
        description: "Kayıt yetkisine sahip olacak rol.",
        type: 8,
        required: true,
      },
      {
        name: "female-role",
        description: "Kız üyeler için atanacak rol.",
        type: 8,
        required: true,
      },
      {
        name: "male-role",
        description: "Erkek üyeler için atanacak rol.",
        type: 8,
        required: true,
      },
      {
        name: "unregistered-role",
        description: "Kayıtsız üyelere atanacak rol.",
        type: 8,
        required: true,
      },
    ],
    run: async (client, interaction) => {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.Administrator
        )
      ) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                "❌ | Bu komutu kullanmak için **Yönetici** yetkisine ihtiyacınız var."
              ),
          ],
          ephemeral: true,
        });
      }

      const channel = interaction.options.getChannel("channel");
      const staffRole = interaction.options.getRole("staff-role");
      const femaleRole = interaction.options.getRole("female-role");
      const maleRole = interaction.options.getRole("male-role");
      const unregisteredRole = interaction.options.getRole("unregistered-role");

      const existingSetup = db.get(`registerSystem_${interaction.guild.id}`);
      if (existingSetup) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                "❌ | Kayıt sistemi zaten kurulu. Devre dışı bırakmak için `/register-disable` komutunu kullanın."
              ),
          ],
          ephemeral: true,
        });
      }

      db.set(`registerSystem_${interaction.guild.id}`, {
        channelId: channel.id,
        staffRoleId: staffRole.id,
        femaleRoleId: femaleRole.id,
        maleRoleId: maleRole.id,
        unregisteredRoleId: unregisteredRole.id,
        setupTime: Date.now(),
      });

      const successEmbed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Kayıt Sistemi Kuruldu")
        .setDescription(
          `✅ Kayıt sistemi başarıyla ayarlandı!\n\n` +
            `**Kanal**: ${channel}\n` +
            `**Yetkili Rolü**: ${staffRole}\n` +
            `**Kız Rolü**: ${femaleRole}\n` +
            `**Erkek Rolü**: ${maleRole}\n` +
            `**Kayıtsız Rolü**: ${unregisteredRole}`
        )
        .setFooter({ text: `Kurulum yapan: ${interaction.user.tag}` });

      return interaction.reply({ embeds: [successEmbed], ephemeral: false });
    },
  },
  {
    name: "register",
    description: "Bir kullanıcıyı kaydeder.",
    type: 1,
    options: [
      {
        name: "user",
        description: "Kayıt edilecek kullanıcı.",
        type: 6,
        required: true,
      },
    ],
    run: async (client, interaction) => {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.Administrator
        )
      ) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                "❌ | Bu komutu kullanmak için **Yönetici** yetkisine ihtiyacınız var."
              ),
          ],
          ephemeral: true,
        });
      }

      const targetUser = interaction.options.getMember("user");
      const registerSystem = db.get(`registerSystem_${interaction.guild.id}`);
      if (!registerSystem) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription("❌ | Kayıt sistemi bu sunucuda kurulu değil!"),
          ],
          ephemeral: true,
        });
      }

      const registerEmbed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("Kullanıcı Kayıt Paneli")
        .setDescription(`${targetUser} için kayıt türünü seçin:`)
        .setFooter({ text: `Yetkili: ${interaction.user.tag}` });

      const femaleButton = new ButtonBuilder()
        .setCustomId(`reg_female_${targetUser.id}`)
        .setLabel("Kız Kayıt")
        .setStyle(ButtonStyle.Success)
        .setEmoji("♀️");

      const maleButton = new ButtonBuilder()
        .setCustomId(`reg_male_${targetUser.id}`)
        .setLabel("Erkek Kayıt")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("♂️");

      const row = new ActionRowBuilder().addComponents(
        femaleButton,
        maleButton
      );

      await interaction.reply({
        embeds: [registerEmbed],
        components: [row],
        ephemeral: true,
      });
    },
  },
  {
    name: "register-disable",
    description: "Kayıt sistemini devre dışı bırakır.",
    type: 1,
    run: async (client, interaction) => {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.Administrator
        )
      ) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(
                "❌ | Bu komutu kullanmak için **Yönetici** yetkisine ihtiyacınız var."
              ),
          ],
          ephemeral: true,
        });
      }

      const registerSystem = db.get(`registerSystem_${interaction.guild.id}`);
      if (!registerSystem) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription("❌ | Kayıt sistemi zaten devre dışı!"),
          ],
          ephemeral: true,
        });
      }

      db.delete(`registerSystem_${interaction.guild.id}`);

      const successEmbed = new EmbedBuilder()
        .setColor("Green")
        .setDescription("✅ | Kayıt sistemi başarıyla devre dışı bırakıldı!")
        .setFooter({ text: `İşlem yapan: ${interaction.user.tag}` });

      return interaction.reply({ embeds: [successEmbed], ephemeral: false });
    },
  },
];

client.on("guildMemberAdd", async (member) => {
  const registerSystem = db.get(`registerSystem_${member.guild.id}`);
  if (!registerSystem) return;

  const unregisteredRole = member.guild.roles.cache.get(
    registerSystem.unregisteredRoleId
  );
  if (!unregisteredRole) {
    console.error("Kayıtsız rolü bulunamadı.");
    return;
  }

  try {
    await member.setNickname("İsim | Yaş");
    await member.roles.add(unregisteredRole);
  } catch (error) {
    console.error("Üye ayarları güncellenirken hata:", error);
  }

  const channel = member.guild.channels.cache.get(registerSystem.channelId);
  if (!channel) {
    console.error("Kayıt kanalı bulunamadı.");
    return;
  }

  const welcomeEmbed = new EmbedBuilder()
    .setColor("Blue")
    .setTitle(`${member.guild.name}'e Hoş Geldin!`)
    .setDescription(
      `${member}, sunucumuza hoş geldin! Kayıt olmak için aşağıdaki butonları kullanabilirsin veya bir yetkiliye ulaşabilirsin.`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

  const femaleButton = new ButtonBuilder()
    .setCustomId(`reg_female_${member.id}`)
    .setLabel("Kız Kayıt")
    .setStyle(ButtonStyle.Success)
    .setEmoji("♀️");

  const maleButton = new ButtonBuilder()
    .setCustomId(`reg_male_${member.id}`)
    .setLabel("Erkek Kayıt")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("♂️");

  const row = new ActionRowBuilder().addComponents(femaleButton, maleButton);

  channel
    .send({
      content: `Hoş geldin, ${member}!`,
      embeds: [welcomeEmbed],
      components: [row],
    })
    .catch(console.error);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    const registerSystem = db.get(`registerSystem_${interaction.guild.id}`);
    if (!registerSystem) return;

    if (
      interaction.customId.startsWith("reg_female_") ||
      interaction.customId.startsWith("reg_male_")
    ) {
      if (!interaction.member.roles.cache.has(registerSystem.staffRoleId)) {
        return interaction.reply({
          content: "❌ | Kayıt işlemi için yetkili rolüne sahip olmalısınız!",
          ephemeral: true,
        });
      }

      const userId = interaction.customId.split("_")[2];
      const targetMember = await interaction.guild.members
        .fetch(userId)
        .catch(() => null);
      if (!targetMember) {
        return interaction.reply({
          content: "❌ | Kayıt edilecek kullanıcı bulunamadı!",
          ephemeral: true,
        });
      }

      const isFemale = interaction.customId.startsWith("reg_female_");
      const modal = new ModalBuilder()
        .setCustomId(isFemale ? `female_reg_${userId}` : `male_reg_${userId}`)
        .setTitle("Kayıt Bilgileri");

      const nameInput = new TextInputBuilder()
        .setCustomId("reg_name")
        .setLabel("İsim")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Kullanıcının ismini girin")
        .setRequired(true);

      const ageInput = new TextInputBuilder()
        .setCustomId("reg_age")
        .setLabel("Yaş")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Kullanıcının yaşını girin")
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(ageInput)
      );

      await interaction.showModal(modal);
    }
  } else if (interaction.isModalSubmit()) {
    const registerSystem = db.get(`registerSystem_${interaction.guild.id}`);
    if (!registerSystem) return;

    if (
      interaction.customId.startsWith("female_reg_") ||
      interaction.customId.startsWith("male_reg_")
    ) {
      const userId = interaction.customId.split("_")[2];
      const targetMember = await interaction.guild.members
        .fetch(userId)
        .catch(() => null);
      if (!targetMember) {
        return interaction.reply({
          content: "❌ | Kayıt edilecek kullanıcı bulunamadı!",
          ephemeral: true,
        });
      }

      const name = interaction.fields.getTextInputValue("reg_name");
      const age = interaction.fields.getTextInputValue("reg_age");
      const isFemale = interaction.customId.startsWith("female_reg_");
      const roleId = isFemale
        ? registerSystem.femaleRoleId
        : registerSystem.maleRoleId;
      const role = interaction.guild.roles.cache.get(roleId);
      const unregisteredRole = interaction.guild.roles.cache.get(
        registerSystem.unregisteredRoleId
      );

      if (!role || !unregisteredRole) {
        return interaction.reply({
          content: "❌ | Gerekli roller bulunamadı!",
          ephemeral: true,
        });
      }

      try {
        await targetMember.setNickname(`${name} | ${age}`);
        await targetMember.roles.remove(unregisteredRole);
        await targetMember.roles.add(role);
        db.set(`memberData_${targetMember.id}`, {
          name,
          age,
          registeredBy: interaction.user.id,
          registeredAt: Date.now(),
        });

        const successEmbed = new EmbedBuilder()
          .setColor(isFemale ? "Pink" : "Blue")
          .setDescription(
            `✅ ${targetMember} başarıyla ${
              isFemale ? "kız" : "erkek"
            } olarak kaydedildi!\n**İsim**: ${name}\n**Yaş**: ${age}`
          )
          .setFooter({ text: `Kayıt yapan: ${interaction.user.tag}` });

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });

        const channel = interaction.guild.channels.cache.get(
          registerSystem.channelId
        );
        if (channel) {
          channel
            .send({
              embeds: [
                new EmbedBuilder()
                  .setColor(isFemale ? "Pink" : "Blue")
                  .setDescription(
                    `${targetMember} sunucuya ${
                      isFemale ? "kız" : "erkek"
                    } olarak kaydedildi!`
                  )
                  .setFooter({ text: `Kayıt yapan: ${interaction.user.tag}` }),
              ],
            })
            .catch(console.error);
        }
      } catch (error) {
        console.error("Kayıt işlemi sırasında hata:", error);
        await interaction.reply({
          content: "❌ | Kayıt işlemi sırasında bir hata oluştu!",
          ephemeral: true,
        });
      }
    }
  }
});

client.on("guildMemberRemove", async (member) => {
  db.delete(`memberData_${member.id}`);
});
