const {
  Client,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
  AuditLogEvent,
} = require("discord.js");
const db = require("croxydb");

module.exports = [
  {
    name: "mod-log",
    description: "Sunucu loglarının gönderileceği kanalı ayarlar!",
    type: 1,
    options: [
      {
        name: "kanal",
        description: "Log mesajlarının gönderileceği kanal",
        type: 7,
        required: true,
        channel_types: [ChannelType.GuildText],
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
            "❌ | Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısınız!",
          ephemeral: true,
        });
      }

      const kanal = interaction.options.getChannel("kanal");
      const guildId = interaction.guild.id;

      db.set(`modLogKanal_${guildId}`, kanal.id);

      const embed = new EmbedBuilder()
        .setTitle("Mod-Log Kanalı Ayarlandı! 🔍")
        .setDescription(
          `✅ **${kanal}** kanalına artık tüm sunucu logları gönderilecek.\nKapatmak için: \`/mod-log-kapat\``
        )
        .setColor("Green")
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    name: "mod-log-kapat",
    description: "Mod-log sistemini kapatır!",
    type: 1,
    options: [],
    run: async (client, interaction) => {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.Administrator
        )
      ) {
        return interaction.reply({
          content:
            "❌ | Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısınız!",
          ephemeral: true,
        });
      }

      const guildId = interaction.guild.id;
      const mevcutKanal = db.get(`modLogKanal_${guildId}`);

      if (!mevcutKanal) {
        return interaction.reply({
          content: "❌ | Bu sunucuda mod-log sistemi zaten ayarlı değil!",
          ephemeral: true,
        });
      }

      db.delete(`modLogKanal_${guildId}`);

      const embed = new EmbedBuilder()
        .setTitle("Mod-Log Sistemi Kapatıldı! 🔇")
        .setDescription("✅ Sunucu logları artık gönderilmeyecek.")
        .setColor("Red")
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    },
  },
];

client.on("messageDelete", async (message) => {
  if (!message.guild || message.author.bot) return;

  const guildId = message.guild.id;
  const kanalId = db.get(`modLogKanal_${guildId}`);
  if (!kanalId) return;

  const kanal = await message.guild.channels.fetch(kanalId).catch(() => null);
  if (!kanal) {
    db.delete(`modLogKanal_${guildId}`);
    return;
  }

  let messageContent = message.content;
  if (messageContent.length > 1024) {
    messageContent = messageContent.substring(0, 1021) + "...";
  }

  let attachments = [];
  if (message.attachments.size > 0) {
    message.attachments.forEach((attachment) => {
      attachments.push(`[${attachment.name}](${attachment.url})`);
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("🗑️ Mesaj Silindi")
    .setDescription(
      `
      **Kanal:** ${message.channel}
      **Yazan:** ${message.author} (${message.author.tag})
      **ID:** ${message.author.id}
    `
    )
    .setColor("#FF5555")
    .setTimestamp();

  if (messageContent) {
    embed.addFields({ name: "Mesaj İçeriği", value: messageContent });
  }

  if (attachments.length > 0) {
    embed.addFields({ name: "Ekler", value: attachments.join("\n") });
  }

  await kanal.send({ embeds: [embed] }).catch(() => {});
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (!oldMessage.guild || !newMessage.content || oldMessage.author.bot) return;
  if (oldMessage.content === newMessage.content) return;

  const guildId = oldMessage.guild.id;
  const kanalId = db.get(`modLogKanal_${guildId}`);
  if (!kanalId) return;

  const kanal = await oldMessage.guild.channels
    .fetch(kanalId)
    .catch(() => null);
  if (!kanal) {
    db.delete(`modLogKanal_${guildId}`);
    return;
  }

  let oldContent = oldMessage.content;
  let newContent = newMessage.content;

  if (oldContent.length > 1024) {
    oldContent = oldContent.substring(0, 1021) + "...";
  }

  if (newContent.length > 1024) {
    newContent = newContent.substring(0, 1021) + "...";
  }

  const embed = new EmbedBuilder()
    .setTitle("✏️ Mesaj Düzenlendi")
    .setDescription(
      `
      **Kanal:** ${oldMessage.channel}
      **Yazan:** ${oldMessage.author} (${oldMessage.author.tag})
      **ID:** ${oldMessage.author.id}
      **Mesaj Bağlantısı:** [Tıkla](${newMessage.url})
    `
    )
    .addFields(
      { name: "Eski Mesaj", value: oldContent || "*İçerik boş*" },
      { name: "Yeni Mesaj", value: newContent || "*İçerik boş*" }
    )
    .setColor("#FFAA00")
    .setTimestamp();

  await kanal.send({ embeds: [embed] }).catch(() => {});
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  const guildId = newMember.guild.id;
  const kanalId = db.get(`modLogKanal_${guildId}`);
  if (!kanalId) return;

  const kanal = await newMember.guild.channels.fetch(kanalId).catch(() => null);
  if (!kanal) {
    db.delete(`modLogKanal_${guildId}`);
    return;
  }

  const oldNick = oldMember.nickname ?? null;
  const newNick = newMember.nickname ?? null;

  if (oldNick !== newNick) {
    const embed = new EmbedBuilder()
      .setTitle("📝 Kullanıcı Takma Adı Değiştirildi")
      .setDescription(
        `
  **Kullanıcı:** ${newMember.user} (${newMember.user.tag})
  **ID:** ${newMember.user.id}
        `
      )
      .addFields(
        {
          name: "Eski Takma Ad",
          value: oldNick || "*Takma ad yoktu*",
          inline: true,
        },
        {
          name: "Yeni Takma Ad",
          value: newNick || "*Takma ad kaldırıldı*",
          inline: true,
        }
      )
      .setColor("#00AAFF")
      .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    await kanal.send({ embeds: [embed] }).catch(() => {});
  }

  const addedRoles = newMember.roles.cache.filter(
    (role) => !oldMember.roles.cache.has(role.id)
  );
  const removedRoles = oldMember.roles.cache.filter(
    (role) => !newMember.roles.cache.has(role.id)
  );

  if (addedRoles.size > 0) {
    const embed = new EmbedBuilder()
      .setTitle("🛡️ Kullanıcıya Rol Verildi")
      .setDescription(
        `
  **Kullanıcı:** ${newMember.user} (${newMember.user.tag})
  **ID:** ${newMember.user.id}
  **Verilen Roller:** ${addedRoles.map((role) => `${role}`).join(", ")}
        `
      )
      .setColor("#55FF55")
      .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    try {
      const auditLogs = await newMember.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberRoleUpdate,
        limit: 1,
      });

      const roleAddLog = auditLogs.entries.first();
      if (
        roleAddLog &&
        roleAddLog.target.id === newMember.user.id &&
        roleAddLog.createdTimestamp > Date.now() - 5000
      ) {
        embed.addFields({
          name: "Rolü Veren",
          value: `${roleAddLog.executor} (${roleAddLog.executor.tag})`,
        });
      }
    } catch (err) {
      console.error("Rol verme audit log okuma hatası:", err);
    }

    await kanal.send({ embeds: [embed] }).catch(() => {});
  }

  if (removedRoles.size > 0) {
    const embed = new EmbedBuilder()
      .setTitle("🛡️ Kullanıcıdan Rol Alındı")
      .setDescription(
        `
  **Kullanıcı:** ${newMember.user} (${newMember.user.tag})
  **ID:** ${newMember.user.id}
  **Alınan Roller:** ${removedRoles.map((role) => `${role}`).join(", ")}
        `
      )
      .setColor("#FF5555")
      .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    try {
      const auditLogs = await newMember.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberRoleUpdate,
        limit: 1,
      });

      const roleRemoveLog = auditLogs.entries.first();
      if (
        roleRemoveLog &&
        roleRemoveLog.target.id === newMember.user.id &&
        roleRemoveLog.createdTimestamp > Date.now() - 5000
      ) {
        embed.addFields({
          name: "Rolü Alan",
          value: `${roleRemoveLog.executor} (${roleRemoveLog.executor.tag})`,
        });
      }
    } catch (err) {
      console.error("Rol alma audit log okuma hatası:", err);
    }

    await kanal.send({ embeds: [embed] }).catch(() => {});
  }
});

client.on("channelCreate", async (channel) => {
  if (!channel.guild) return;

  const guildId = channel.guild.id;
  const kanalId = db.get(`modLogKanal_${guildId}`);
  if (!kanalId) return;

  const logKanal = await channel.guild.channels
    .fetch(kanalId)
    .catch(() => null);
  if (!logKanal) {
    db.delete(`modLogKanal_${guildId}`);
    return;
  }

  let channelType = "Bilinmeyen";
  if (channel.type === ChannelType.GuildText) channelType = "Yazı Kanalı";
  else if (channel.type === ChannelType.GuildVoice) channelType = "Ses Kanalı";
  else if (channel.type === ChannelType.GuildCategory) channelType = "Kategori";
  else if (channel.type === ChannelType.GuildAnnouncement)
    channelType = "Duyuru Kanalı";
  else if (channel.type === ChannelType.GuildStageVoice)
    channelType = "Sahne Kanalı";
  else if (channel.type === ChannelType.GuildForum)
    channelType = "Forum Kanalı";

  const embed = new EmbedBuilder()
    .setTitle("📝 Kanal Oluşturuldu")
    .setDescription(
      `
      **Kanal:** ${channel}
      **Kanal ID:** ${channel.id}
      **Kanal Türü:** ${channelType}
    `
    )
    .setColor("#00FF00")
    .setTimestamp();

  try {
    const auditLogs = await channel.guild.fetchAuditLogs({
      type: AuditLogEvent.ChannelCreate,
      limit: 1,
    });

    const createLog = auditLogs.entries.first();
    if (createLog && createLog.target.id === channel.id) {
      embed.addFields({
        name: "Oluşturan",
        value: `${createLog.executor} (${createLog.executor.tag})`,
      });
    }
  } catch (err) {
    console.error("Kanal oluşturma audit log okuma hatası:", err);
  }

  await logKanal.send({ embeds: [embed] }).catch(() => {});
});

client.on("channelDelete", async (channel) => {
  if (!channel.guild) return;

  const guildId = channel.guild.id;
  const kanalId = db.get(`modLogKanal_${guildId}`);
  if (!kanalId) return;

  const logKanal = await channel.guild.channels
    .fetch(kanalId)
    .catch(() => null);
  if (!logKanal) {
    db.delete(`modLogKanal_${guildId}`);
    return;
  }

  let channelType = "Bilinmeyen";
  if (channel.type === ChannelType.GuildText) channelType = "Yazı Kanalı";
  else if (channel.type === ChannelType.GuildVoice) channelType = "Ses Kanalı";
  else if (channel.type === ChannelType.GuildCategory) channelType = "Kategori";
  else if (channel.type === ChannelType.GuildAnnouncement)
    channelType = "Duyuru Kanalı";
  else if (channel.type === ChannelType.GuildStageVoice)
    channelType = "Sahne Kanalı";
  else if (channel.type === ChannelType.GuildForum)
    channelType = "Forum Kanalı";

  const embed = new EmbedBuilder()
    .setTitle("🗑️ Kanal Silindi")
    .setDescription(
      `
      **Kanal Adı:** ${channel.name}
      **Kanal ID:** ${channel.id}
      **Kanal Türü:** ${channelType}
    `
    )
    .setColor("#FF0000")
    .setTimestamp();

  try {
    const auditLogs = await channel.guild.fetchAuditLogs({
      type: AuditLogEvent.ChannelDelete,
      limit: 1,
    });

    const deleteLog = auditLogs.entries.first();
    if (deleteLog && deleteLog.target.id === channel.id) {
      embed.addFields({
        name: "Silen",
        value: `${deleteLog.executor} (${deleteLog.executor.tag})`,
      });
    }
  } catch (err) {
    console.error("Kanal silme audit log okuma hatası:", err);
  }

  await logKanal.send({ embeds: [embed] }).catch(() => {});
});

client.on("roleCreate", async (role) => {
  const guildId = role.guild.id;
  const kanalId = db.get(`modLogKanal_${guildId}`);
  if (!kanalId) return;

  const kanal = await role.guild.channels.fetch(kanalId).catch(() => null);
  if (!kanal) {
    db.delete(`modLogKanal_${guildId}`);
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("🛡️ Rol Oluşturuldu")
    .setDescription(
      `
      **Rol:** ${role}
      **Rol ID:** ${role.id}
      **Renk:** ${role.hexColor}
    `
    )
    .setColor(role.hexColor || "#00FF00")
    .setTimestamp();

  try {
    const auditLogs = await role.guild.fetchAuditLogs({
      type: AuditLogEvent.RoleCreate,
      limit: 1,
    });

    const createLog = auditLogs.entries.first();
    if (createLog && createLog.target.id === role.id) {
      embed.addFields({
        name: "Oluşturan",
        value: `${createLog.executor} (${createLog.executor.tag})`,
      });
    }
  } catch (err) {
    console.error("Rol oluşturma audit log okuma hatası:", err);
  }

  await kanal.send({ embeds: [embed] }).catch(() => {});
});

client.on("roleDelete", async (role) => {
  const guildId = role.guild.id;
  const kanalId = db.get(`modLogKanal_${guildId}`);
  if (!kanalId) return;

  const kanal = await role.guild.channels.fetch(kanalId).catch(() => null);
  if (!kanal) {
    db.delete(`modLogKanal_${guildId}`);
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("🛡️ Rol Silindi")
    .setDescription(
      `
      **Rol Adı:** ${role.name}
      **Rol ID:** ${role.id}
      **Renk:** ${role.hexColor}
    `
    )
    .setColor(role.hexColor || "#FF0000")
    .setTimestamp();

  try {
    const auditLogs = await role.guild.fetchAuditLogs({
      type: AuditLogEvent.RoleDelete,
      limit: 1,
    });

    const deleteLog = auditLogs.entries.first();
    if (deleteLog && deleteLog.target.id === role.id) {
      embed.addFields({
        name: "Silen",
        value: `${deleteLog.executor} (${deleteLog.executor.tag})`,
      });
    }
  } catch (err) {
    console.error("Rol silme audit log okuma hatası:", err);
  }

  await kanal.send({ embeds: [embed] }).catch(() => {});
});

client.on("guildBanAdd", async (ban) => {
  const guildId = ban.guild.id;
  const kanalId = db.get(`modLogKanal_${guildId}`);
  if (!kanalId) return;

  const kanal = await ban.guild.channels.fetch(kanalId).catch(() => null);
  if (!kanal) {
    db.delete(`modLogKanal_${guildId}`);
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("🔨 Kullanıcı Yasaklandı")
    .setDescription(
      `
      **Kullanıcı:** ${ban.user} (${ban.user.tag})
      **ID:** ${ban.user.id}
    `
    )
    .setColor("#FF0000")
    .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();

  try {
    const auditLogs = await ban.guild.fetchAuditLogs({
      type: AuditLogEvent.MemberBanAdd,
      limit: 1,
    });

    const banLog = auditLogs.entries.first();
    if (banLog && banLog.target.id === ban.user.id) {
      embed.addFields(
        {
          name: "Yasaklayan",
          value: `${banLog.executor} (${banLog.executor.tag})`,
        },
        { name: "Sebep", value: banLog.reason || "*Sebep belirtilmedi*" }
      );
    } else if (ban.reason) {
      embed.addFields({ name: "Sebep", value: ban.reason });
    }
  } catch (err) {
    console.error("Ban audit log okuma hatası:", err);
    if (ban.reason) {
      embed.addFields({ name: "Sebep", value: ban.reason });
    }
  }

  await kanal.send({ embeds: [embed] }).catch(() => {});
});

client.on("guildBanRemove", async (ban) => {
  const guildId = ban.guild.id;
  const kanalId = db.get(`modLogKanal_${guildId}`);
  if (!kanalId) return;

  const kanal = await ban.guild.channels.fetch(kanalId).catch(() => null);
  if (!kanal) {
    db.delete(`modLogKanal_${guildId}`);
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("🔓 Kullanıcının Yasağı Kaldırıldı")
    .setDescription(
      `
      **Kullanıcı:** ${ban.user} (${ban.user.tag})
      **ID:** ${ban.user.id}
    `
    )
    .setColor("#00AAFF")
    .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();

  try {
    const auditLogs = await ban.guild.fetchAuditLogs({
      type: AuditLogEvent.MemberBanRemove,
      limit: 1,
    });

    const unbanLog = auditLogs.entries.first();
    if (unbanLog && unbanLog.target.id === ban.user.id) {
      embed.addFields({
        name: "Yasağı Kaldıran",
        value: `${unbanLog.executor} (${unbanLog.executor.tag})`,
      });
    }
  } catch (err) {
    console.error("Unban audit log okuma hatası:", err);
  }

  await kanal.send({ embeds: [embed] }).catch(() => {});
});

