const {
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  UserSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const db = require("croxydb");
const config = require("../../config.json");

function clearRoomData(userId, channelId) {
  db.delete(`customRoom_${userId}`);
  db.delete(`customRoom_${channelId}`);
}

module.exports = {
  name: "özel-oda",
  description: "Kişisel ses odası oluşturma sistemini başlatır.",
  options: [
    {
      name: "kategori",
      description: "Ses odalarının oluşturulacağı kategori",
      type: 7,
      required: true,
      channel_types: [4],
    },
  ],
  run: async (client, interaction) => {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content:
          "⚠️ Bu komutu kullanmak için yönetici yetkisine ihtiyacınız var!",
        ephemeral: true,
      });
    }

    const category = interaction.options.getChannel("kategori");
    if (category.type !== ChannelType.GuildCategory) {
      return interaction.reply({
        content: "❌ Lütfen bir kategori kanalı seçin!",
        ephemeral: true,
      });
    }

    db.set(`customRoomCategory_${interaction.guildId}`, category.id);

    const setupEmbed = new EmbedBuilder()
      .setColor("#FF6F61")
      .setTitle("🛋️ Kişisel Oda Sistemi")
      .setDescription(
        `Kendi ses odanızı oluşturmak için aşağıdaki butonu kullanabilirsiniz.\nOdalar **${category.name}** kategorisi altında açılacak.`
      )
      .setFooter({ text: "Kendi alanınızı yaratın!" });

    const createButton = new ButtonBuilder()
      .setCustomId("create_custom_room")
      .setLabel("Oda Oluştur")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🏠");

    const row = new ActionRowBuilder().addComponents(createButton);

    await interaction.channel.send({ embeds: [setupEmbed], components: [row] });
    await interaction.reply({
      content: "✅ Kişisel oda sistemi başarıyla kuruldu!",
      ephemeral: true,
    });
  },
};

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId === "create_custom_room") {
        await setupUserRoom(interaction);
      } else if (interaction.customId.startsWith("control_")) {
        await manageRoomSettings(interaction);
      } else if (interaction.customId.startsWith("manage_user_")) {
        await manageUserPermissions(interaction);
      } else if (interaction.customId === "user_control_menu") {
        await displayUserControlMenu(interaction);
      } else if (interaction.customId === "search_user_button") {
        await showUserSearchModal(interaction);
      } else if (interaction.customId === "room_info") {
        await showRoomInfo(interaction);
      }
    } else if (interaction.isUserSelectMenu()) {
      if (interaction.customId === "server_user_select") {
        await processUserSelection(interaction);
      }
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId === "change_room_limit") {
        await updateRoomLimit(interaction);
      } else if (interaction.customId === "change_room_name") {
        await updateRoomName(interaction);
      } else if (interaction.customId === "search_user_modal") {
        await processUserSearch(interaction);
      }
    }
  } catch (error) {
    console.error("Etkileşim hatası:", error);
    const errorMessage = {
      content: "❌ Bir hata oluştu, lütfen tekrar deneyin.",
      ephemeral: true,
    };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorMessage).catch(() => {});
    } else {
      await interaction.reply(errorMessage).catch(() => {});
    }
  }
});

async function setupUserRoom(interaction) {
  const { user, guild } = interaction;

  const existingRoomId = db.get(`customRoom_${user.id}`);
  if (existingRoomId) {
    const existingRoom = guild.channels.cache.get(existingRoomId);
    if (!existingRoom) {
      clearRoomData(user.id, existingRoomId);
    } else {
      return interaction.reply({
        content: "⚠️ Zaten bir kişisel odanız var!",
        ephemeral: true,
      });
    }
  }

  const categoryId = db.get(`customRoomCategory_${guild.id}`);
  const category = guild.channels.cache.get(categoryId);
  if (!category) {
    return interaction.reply({
      content: "❌ Kategori bulunamadı!",
      ephemeral: true,
    });
  }

  const permissionOverwrites = category.permissionOverwrites.cache.map(
    (overwrite) => ({
      id: overwrite.id,
      allow: overwrite.allow,
      deny: overwrite.deny,
      type: overwrite.type,
    })
  );

  permissionOverwrites.push({
    id: user.id,
    allow: [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.Speak,
      PermissionsBitField.Flags.Stream,
      PermissionsBitField.Flags.ManageChannels,
    ],
  });

  permissionOverwrites.push({
    id: client.user.id,
    allow: [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.ManageChannels,
    ],
  });

  let roomSettings = {
    name: `🏠 ${user.username}'in Alanı`,
    userLimit: 0,
    access: true,
    visibility: true,
    audio: true,
  };

  const savedSettings = db.get(`roomSettings_${user.id}`);
  if (savedSettings) {
    roomSettings = { ...roomSettings, ...savedSettings };
  }

  let channel;
  try {
    channel = await guild.channels.create({
      name: roomSettings.name,
      type: ChannelType.GuildVoice,
      parent: category,
      userLimit: roomSettings.userLimit,
      permissionOverwrites: permissionOverwrites,
    });

    await channel.permissionOverwrites.edit(guild.roles.everyone, {
      Connect: roomSettings.access,
      ViewChannel: roomSettings.visibility,
      Speak: roomSettings.audio,
    });
  } catch (error) {
    console.error("Oda oluşturma hatası:", error);
    return interaction.reply({
      content: "❌ Oda oluşturulamadı, botun izinlerini kontrol edin!",
      ephemeral: true,
    });
  }

  db.set(`customRoom_${user.id}`, channel.id);
  db.set(`customRoom_${channel.id}`, user.id);
  db.set(`roomSettings_${user.id}`, roomSettings);

  await user
    .send(
      `🎉 Yeni kişisel odanız **${guild.name}** sunucusunda oluşturuldu! Kanal: <#${channel.id}>`
    )
    .catch(() => console.log("DM gönderilemedi:", user.id));

  setTimeout(async () => {
    const currentChannel = guild.channels.cache.get(channel.id);
    if (!currentChannel) {
      console.log(`Oda zaten silinmiş: ${channel.id}`);
      clearRoomData(user.id, channel.id);
      return;
    }

    const ownerId = db.get(`customRoom_${currentChannel.id}`);
    const ownerInChannel = currentChannel.members.has(ownerId);
    if (currentChannel.members.size === 0 || !ownerInChannel) {
      try {
        console.log(`Oda siliniyor, boş veya sahip yok: ${currentChannel.id}`);
        await currentChannel.delete();
        clearRoomData(user.id, channel.id);
      } catch (error) {
        console.error("Oda silme hatası:", error);
      }
    }
  }, 60000);

  await interaction.reply({
    content: `✅ Kişisel odanız oluşturuldu: <#${channel.id}>`,
    ephemeral: true,
  });
  await sendRoomDashboard(channel, user);
}

async function sendRoomDashboard(channel, user) {
  const existingPanel = await channel.messages
    .fetch({ limit: 1 })
    .then((messages) => messages.first());
  if (existingPanel && existingPanel.author.id === client.user.id) {
    await existingPanel.delete().catch(() => {});
  }

  const dashboardEmbed = new EmbedBuilder()
    .setColor("#FF6F61")
    .setTitle("🛠️ Oda Kontrol Paneli")
    .setDescription("Aşağıdaki seçeneklerle odanızı özelleştirin.")
    .setFooter({ text: "Kişisel alanınızı yönetin!" });

  const settings = db.get(`roomSettings_${user.id}`) || {
    access: true,
    visibility: true,
    audio: true,
  };

  const controls1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("control_access")
      .setLabel("Erişim Kontrolü")
      .setStyle(settings.access ? ButtonStyle.Success : ButtonStyle.Danger)
      .setEmoji("🔐"),
    new ButtonBuilder()
      .setCustomId("control_visibility")
      .setLabel("Görünürlük")
      .setStyle(settings.visibility ? ButtonStyle.Success : ButtonStyle.Danger)
      .setEmoji("👀"),
    new ButtonBuilder()
      .setCustomId("control_audio")
      .setLabel("Ses Kontrolü")
      .setStyle(settings.audio ? ButtonStyle.Success : ButtonStyle.Danger)
      .setEmoji("🔇")
  );

  const controls2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("control_name")
      .setLabel("İsim Değiştir")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📝"),
    new ButtonBuilder()
      .setCustomId("control_limit")
      .setLabel("Kişi Sınırı")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("👥"),
    new ButtonBuilder()
      .setCustomId("user_control_menu")
      .setLabel("Kullanıcı Yönetimi")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🛡️"),
    new ButtonBuilder()
      .setCustomId("room_info")
      .setLabel("Oda Bilgisi")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("ℹ️")
  );

  const controls3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("control_reset")
      .setLabel("Ayarları Sıfırla")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🗑️")
  );

  try {
    await channel.send({
      content: `<@${user.id}>, işte odanızın kontrol paneli:`,
      embeds: [dashboardEmbed],
      components: [controls1, controls2, controls3],
    });
  } catch (error) {
    console.error("Kontrol paneli gönderilirken hata:", error);
    await channel
      .send({
        content: `<@${user.id}>, kontrol paneli gönderilemedi. Lütfen botun kanal izinlerini kontrol edin.`,
        embeds: [dashboardEmbed],
      })
      .catch(() => {});
  }
}

async function manageRoomSettings(interaction) {
  const roomOwnerId = db.get(`customRoom_${interaction.channel.id}`);
  const isAdmin = db.get(
    `admin_${interaction.channel.id}_${interaction.user.id}`
  );

  if (interaction.user.id !== roomOwnerId && !isAdmin) {
    return interaction.reply({
      content: "⚠️ Bu odanın sahibi veya yöneticisi değilsiniz!",
      ephemeral: true,
    });
  }

  const action = interaction.customId.split("_")[1];

  switch (action) {
    case "access":
      await toggleRoomAccess(interaction);
      break;
    case "visibility":
      await toggleRoomVisibility(interaction);
      break;
    case "audio":
      await toggleRoomAudio(interaction);
      break;
    case "name":
      await displayRoomNameModal(interaction);
      break;
    case "limit":
      await displayRoomLimitModal(interaction);
      break;
    case "reset":
      await resetRoomSettings(interaction);
      break;
    case "info":
      await showRoomInfo(interaction);
      break;
  }
}

async function updateButtonState(interaction, customId, isEnabled) {
  const actionRow = interaction.message.components.find((row) =>
    row.components.some((c) => c.data.custom_id === customId)
  );
  const button = actionRow.components.find(
    (c) => c.data.custom_id === customId
  );
  if (button) {
    button.data.style = isEnabled ? ButtonStyle.Success : ButtonStyle.Danger;
  }
  await interaction.update({ components: interaction.message.components });
}

async function toggleRoomAccess(interaction) {
  const channel = interaction.channel;
  const isAccessible = channel
    .permissionsFor(channel.guild.roles.everyone)
    .has(PermissionsBitField.Flags.Connect);

  await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
    Connect: !isAccessible,
  });

  const settings = db.get(`roomSettings_${interaction.user.id}`) || {};
  settings.access = !isAccessible;
  db.set(`roomSettings_${interaction.user.id}`, settings);

  await updateButtonState(interaction, "control_access", !isAccessible);
  await interaction.followUp({
    content: `Oda erişimi ${isAccessible ? "kapatıldı" : "açıldı"}.`,
    ephemeral: true,
  });
}

async function toggleRoomVisibility(interaction) {
  const channel = interaction.channel;
  const isVisible = channel
    .permissionsFor(channel.guild.roles.everyone)
    .has(PermissionsBitField.Flags.ViewChannel);

  await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
    ViewChannel: !isVisible,
  });

  const settings = db.get(`roomSettings_${interaction.user.id}`) || {};
  settings.visibility = !isVisible;
  db.set(`roomSettings_${interaction.user.id}`, settings);

  await updateButtonState(interaction, "control_visibility", !isVisible);
  await interaction.followUp({
    content: `Oda görünürlüğü ${isVisible ? "kapatıldı" : "açıldı"}.`,
    ephemeral: true,
  });
}

async function toggleRoomAudio(interaction) {
  const channel = interaction.channel;
  const isAudioEnabled = channel
    .permissionsFor(channel.guild.roles.everyone)
    .has(PermissionsBitField.Flags.Speak);

  await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
    Speak: !isAudioEnabled,
  });

  const settings = db.get(`roomSettings_${interaction.user.id}`) || {};
  settings.audio = !isAudioEnabled;
  db.set(`roomSettings_${interaction.user.id}`, settings);

  await updateButtonState(interaction, "control_audio", !isAudioEnabled);
  await interaction.followUp({
    content: `Ses ${isAudioEnabled ? "kapatıldı" : "açıldı"}.`,
    ephemeral: true,
  });
}

async function resetRoomSettings(interaction) {
  const channel = interaction.channel;
  const defaultSettings = {
    name: `🏠 ${interaction.user.username}'in Alanı`,
    userLimit: 0,
    access: true,
    visibility: true,
    audio: true,
  };

  await channel.setName(defaultSettings.name);
  await channel.setUserLimit(defaultSettings.userLimit);
  await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
    Connect: defaultSettings.access,
    ViewChannel: defaultSettings.visibility,
    Speak: defaultSettings.audio,
  });

  db.set(`roomSettings_${interaction.user.id}`, defaultSettings);

  await sendRoomDashboard(channel, interaction.user);
  await interaction.reply({
    content: "✅ Oda ayarları sıfırlandı.",
    ephemeral: true,
  });
}

async function displayUserControlMenu(interaction) {
  const userSelectMenu = new UserSelectMenuBuilder()
    .setCustomId("server_user_select")
    .setPlaceholder("Yönetilecek kullanıcıyı seçin")
    .setMaxValues(1);

  const selectRow = new ActionRowBuilder().addComponents(userSelectMenu);

  const searchButton = new ButtonBuilder()
    .setCustomId("search_user_button")
    .setLabel("ID ile Kullanıcı Ara")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("🔎");

  const buttonRow = new ActionRowBuilder().addComponents(searchButton);

  await interaction.reply({
    content: "Yönetmek istediğiniz kullanıcıyı seçin:",
    components: [selectRow, buttonRow],
    ephemeral: true,
  });
}

async function showUserSearchModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("search_user_modal")
    .setTitle("Kullanıcı Arama");

  const userIdInput = new TextInputBuilder()
    .setCustomId("user_id_input")
    .setLabel("Kullanıcı ID'si")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(userIdInput));
  await interaction.showModal(modal);
}

async function processUserSearch(interaction) {
  const userId = interaction.fields.getTextInputValue("user_id_input");
  try {
    const member = await interaction.guild.members.fetch(userId);
    if (!member) {
      return interaction.reply({
        content: "❌ Kullanıcı bulunamadı.",
        ephemeral: true,
      });
    }
    await displayUserManagementOptions(interaction, member);
  } catch (error) {
    console.error("Kullanıcı arama hatası:", error);
    await interaction.reply({
      content: "❌ Geçerli bir kullanıcı ID'si girin.",
      ephemeral: true,
    });
  }
}

async function displayUserManagementOptions(interaction, member) {
  const currentPermissions = interaction.channel.permissionOverwrites.resolve(
    member.id
  );
  const isAdmin =
    currentPermissions &&
    currentPermissions.allow.has(PermissionsBitField.Flags.ManageChannels);
  const canView =
    currentPermissions &&
    currentPermissions.allow.has(PermissionsBitField.Flags.ViewChannel);
  const canConnect =
    currentPermissions &&
    currentPermissions.allow.has(PermissionsBitField.Flags.Connect);

  const userButtons1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(
        `manage_user_${member.id}_${isAdmin ? "revokeAdmin" : "grantAdmin"}`
      )
      .setLabel(isAdmin ? "Yönetici İzni Kaldır" : "Yönetici Yap")
      .setStyle(isAdmin ? ButtonStyle.Danger : ButtonStyle.Success)
      .setEmoji(isAdmin ? "⛔" : "🛠️"),
    new ButtonBuilder()
      .setCustomId(
        `manage_user_${member.id}_${canView ? "blockView" : "allowView"}`
      )
      .setLabel(canView ? "Görünürlüğü Kaldır" : "Görünürlük Ver")
      .setStyle(canView ? ButtonStyle.Danger : ButtonStyle.Success)
      .setEmoji(canView ? "⛔" : "👁️")
  );

  const userButtons2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(
        `manage_user_${member.id}_${
          canConnect ? "blockConnect" : "allowConnect"
        }`
      )
      .setLabel(canConnect ? "Bağlantıyı Kaldır" : "Bağlantı İzni Ver")
      .setStyle(canConnect ? ButtonStyle.Danger : ButtonStyle.Success)
      .setEmoji(canConnect ? "⛔" : "🔌"),
    new ButtonBuilder()
      .setCustomId(`manage_user_${member.id}_transfer`)
      .setLabel("Oda Sahipliğini Aktar")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("👑"),
    new ButtonBuilder()
      .setCustomId(`manage_user_${member.id}_kick`)
      .setLabel("Kanaldan Çıkar")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🚪")
  );

  await interaction
    .update({
      content: `${member.user.tag} için bir işlem seçin:`,
      components: [userButtons1, userButtons2],
      ephemeral: true,
    })
    .catch((err) => console.error("Yönetim menüsü güncelleme hatası:", err));
}

async function processUserSelection(interaction) {
  const selectedUserId = interaction.values[0];
  const member = await interaction.guild.members
    .fetch(selectedUserId)
    .catch(() => null);

  if (!member) {
    return interaction.reply({
      content: "❌ Seçilen kullanıcı bulunamadı.",
      ephemeral: true,
    });
  }

  await displayUserManagementOptions(interaction, member);
}

async function manageUserPermissions(interaction) {
  const [_, userId, operation] = interaction.customId.split("_").slice(1);
  const channel = interaction.channel;
  const member = await channel.guild.members.fetch(userId).catch(() => null);

  if (!member) {
    return interaction.reply({
      content: "❌ Kullanıcı bulunamadı.",
      ephemeral: true,
    });
  }

  const messages = {
    grantAdmin: `${member.user.tag} artık yönetici.`,
    revokeAdmin: `${member.user.tag} yöneticilikten çıkarıldı.`,
    allowView: `${member.user.tag} odayı görebilir.`,
    blockView: `${member.user.tag} artık odayı göremez.`,
    allowConnect: `${member.user.tag} odaya bağlanabilir.`,
    blockConnect: `${member.user.tag} artık odaya bağlanamaz.`,
    kick: `${member.user.tag} odadan çıkarıldı.`,
  };

  if (operation === "transfer") {
    const roomOwnerId = db.get(`customRoom_${channel.id}`);
    if (interaction.user.id !== roomOwnerId) {
      return interaction.reply({
        content: "⚠️ Bu odanın sahibi değilsiniz!",
        ephemeral: true,
      });
    }

    const settings = db.get(`roomSettings_${roomOwnerId}`) || {};
    db.set(`roomSettings_${member.id}`, settings);
    db.delete(`roomSettings_${roomOwnerId}`);

    await channel.permissionOverwrites.edit(interaction.user, {
      ManageChannels: null,
      Connect: null,
      Speak: null,
      Stream: null,
    });

    await channel.permissionOverwrites.edit(member, {
      ManageChannels: true,
      Connect: true,
      Speak: true,
      Stream: true,
    });

    db.delete(`customRoom_${roomOwnerId}`);
    db.set(`customRoom_${channel.id}`, member.id);
    db.set(`customRoom_${member.id}`, channel.id);

    await channel.send(`<@${member.id}>, bu odanın yeni sahibi sizsiniz!`);
    await interaction.reply({
      content: `✅ Oda sahipliği ${member.user.tag}'a aktarıldı.`,
      ephemeral: true,
    });
  } else if (operation === "kick") {
    if (member.voice.channel && member.voice.channel.id === channel.id) {
      await member.voice.disconnect();
      await interaction.reply({
        content: messages[operation],
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "⚠️ Kullanıcı odada değil.",
        ephemeral: true,
      });
    }
  } else {
    if (operation === "grantAdmin") {
      db.set(`admin_${channel.id}_${member.id}`, true);
      await channel.permissionOverwrites.edit(member, { ManageChannels: true });
    } else if (operation === "revokeAdmin") {
      db.delete(`admin_${channel.id}_${member.id}`);
      await channel.permissionOverwrites.edit(member, {
        ManageChannels: false,
      });
    } else {
      const permissionUpdates = {
        allowView: { ViewChannel: true },
        blockView: { ViewChannel: false },
        allowConnect: { Connect: true },
        blockConnect: { Connect: false },
      };
      await channel.permissionOverwrites.edit(
        member,
        permissionUpdates[operation]
      );
    }
    await interaction.update({
      content: messages[operation],
      components: [],
      ephemeral: true,
    });
  }
}

async function showRoomInfo(interaction) {
  const channel = interaction.channel;
  const ownerId = db.get(`customRoom_${channel.id}`);
  const owner = await interaction.guild.members
    .fetch(ownerId)
    .catch(() => null);
  const createdAt = channel.createdAt;
  const now = new Date();
  const diff = now - createdAt;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let timeString = "";
  if (days > 0) timeString += `${days} gün `;
  if (hours > 0) timeString += `${hours} saat `;
  timeString += `${minutes} dakika`;

  const settings = db.get(`roomSettings_${ownerId}`) || {};

  const infoEmbed = new EmbedBuilder()
    .setColor("#FF6F61")
    .setTitle("ℹ️ Oda Bilgileri")
    .addFields(
      {
        name: "Oda Sahibi",
        value: owner ? `<@${owner.id}>` : "Bilinmiyor",
        inline: true,
      },
      { name: "Oluşturulma Süresi", value: timeString, inline: true },
      { name: "Kişi Sayısı", value: `${channel.members.size}`, inline: true },
      {
        name: "Kişi Sınırı",
        value: `${settings.userLimit === 0 ? "Sınırsız" : settings.userLimit}`,
        inline: true,
      },
      {
        name: "Erişim",
        value: settings.access ? "Herkese Açık" : "Kısıtlı",
        inline: true,
      },
      {
        name: "Görünürlük",
        value: settings.visibility ? "Herkese Görünür" : "Gizli",
        inline: true,
      },
      { name: "Ses", value: settings.audio ? "Açık" : "Kapalı", inline: true }
    )
    .setFooter({ text: "Kişisel odanızın detayları!" });

  await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
}

async function displayRoomNameModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("change_room_name")
    .setTitle("Oda İsmini Güncell");

  const nameInput = new TextInputBuilder()
    .setCustomId("new_name")
    .setLabel("Yeni oda ismi")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
  await interaction.showModal(modal);
}

async function displayRoomLimitModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("change_room_limit")
    .setTitle("Kişi Sınırı Ayarla");

  const limitInput = new TextInputBuilder()
    .setCustomId("new_limit")
    .setLabel("Yeni limit (0-99, 0 = sınırsız)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(limitInput));
  await interaction.showModal(modal);
}

async function updateRoomName(interaction) {
  const newName = interaction.fields.getTextInputValue("new_name");
  await interaction.channel.setName(newName);

  const settings = db.get(`roomSettings_${interaction.user.id}`) || {};
  settings.name = newName;
  db.set(`roomSettings_${interaction.user.id}`, settings);

  await interaction.reply({
    content: `✅ Oda ismi "${newName}" olarak güncellendi.`,
    ephemeral: true,
  });
}

async function updateRoomLimit(interaction) {
  const newLimit = parseInt(interaction.fields.getTextInputValue("new_limit"));
  if (isNaN(newLimit) || newLimit < 0 || newLimit > 99) {
    return interaction.reply({
      content: "❌ Geçersiz limit. 0-99 arası bir sayı girin.",
      ephemeral: true,
    });
  }
  await interaction.channel.setUserLimit(newLimit);

  const settings = db.get(`roomSettings_${interaction.user.id}`) || {};
  settings.userLimit = newLimit;
  db.set(`roomSettings_${interaction.user.id}`, settings);

  await interaction.reply({
    content: `✅ Oda limiti ${
      newLimit === 0 ? "sınırsız" : newLimit
    } olarak ayarlandı.`,
    ephemeral: true,
  });
}

client.on("voiceStateUpdate", async (oldState, newState) => {
  const oldChannel = oldState.channel;
  const newChannel = newState.channel;

  if (oldChannel && !newChannel) {
    const roomOwnerId = db.get(`customRoom_${oldChannel.id}`);
    if (!roomOwnerId) {
      console.log(`Oda sahibi bulunamadı: ${oldChannel.id}`);
      return;
    }

    if (roomOwnerId === oldState.member.id && oldChannel.members.size === 0) {
      try {
        console.log(`Oda siliniyor, sahip ayrıldı ve boş: ${oldChannel.id}`);
        await oldChannel.delete();
        clearRoomData(roomOwnerId, oldChannel.id);
      } catch (error) {
        console.error("Oda silme hatası (voiceStateUpdate):", error);
      }
    }
  }

  if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
    const oldRoomOwnerId = db.get(`customRoom_${oldChannel.id}`);
    if (!oldRoomOwnerId) {
      console.log(`Oda sahibi bulunamadı: ${oldChannel.id}`);
      return;
    }

    if (oldRoomOwnerId === oldState.member.id) {
      if (oldChannel.members.size === 0) {
        try {
          console.log(`Oda siliniyor, sahip ayrıldı ve boş: ${oldChannel.id}`);
          await oldChannel.delete();
          clearRoomData(oldRoomOwnerId, oldChannel.id);
        } catch (error) {
          console.error("Oda silme hatası (voiceStateUpdate):", error);
        }
      } else {
        const newOwner = oldChannel.members.random();
        if (newOwner) {
          const settings = db.get(`roomSettings_${oldRoomOwnerId}`) || {};
          db.set(`roomSettings_${newOwner.id}`, settings);
          db.delete(`roomSettings_${oldRoomOwnerId}`);

          db.set(`customRoom_${oldChannel.id}`, newOwner.id);
          db.set(`customRoom_${newOwner.id}`, oldChannel.id);
          db.delete(`customRoom_${oldRoomOwnerId}`);
          await oldChannel
            .send(`<@${newOwner.id}>, bu odanın yeni sahibi sizsiniz!`)
            .catch(() =>
              console.log("Sahiplik mesajı gönderilemedi:", oldChannel.id)
            );
          console.log(
            `Sahiplik devredildi: ${newOwner.id}, kanal: ${oldChannel.id}`
          );
        }
      }
    }
  }
});
