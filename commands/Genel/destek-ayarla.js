const {
  EmbedBuilder,
  InteractionType,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SelectMenuBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const db = require("croxydb");
const config = require("../../config.json");

module.exports = {
  name: "destek-sistemi",
  description: "Destek sistemi kurar ve yönetir.",
  type: ApplicationCommandType.ChatInput,
  cooldown: 10,
  options: [
    {
      name: "kanal",
      description: "Destek talebi embed'inin gönderileceği kanal",
      type: ApplicationCommandOptionType.Channel,
      required: true,
      channel_types: [ChannelType.GuildText],
    },
    {
      name: "embedmesaj",
      description: "Destek talebi embed'inin açıklaması",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "logkanal",
      description: "Destek taleplerinin loglarının gönderileceği kanal",
      type: ApplicationCommandOptionType.Channel,
      required: true,
      channel_types: [ChannelType.GuildText],
    },
  ],

  run: async (client, interaction) => {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageChannels
      )
    ) {
      return interaction.reply({
        content:
          "❌ | Bu komutu kullanmak için `Kanalları Yönet` yetkisine sahip olmalısınız!",
        ephemeral: true,
      });
    }

    const kanal = interaction.options.getChannel("kanal");
    const embedMesaj = interaction.options.getString("embedmesaj");
    const logKanal = interaction.options.getChannel("logkanal");

    if (!kanal || !logKanal) {
      return interaction.reply({
        content:
          "❌ | Belirtilen kanallar bulunamadı. Lütfen geçerli bir kanal seçin.",
        ephemeral: true,
      });
    }

    db.set(`destek_sistemi_${interaction.guild.id}`, {
      kanal: kanal.id,
      embedMesaj: embedMesaj,
      logKanal: logKanal.id,
    });

    const destekEmbed = new EmbedBuilder()
      .setTitle(`${config["bot-adi"]} - Destek Sistemi`)
      .setDescription(embedMesaj)
      .setColor("#00ff00")
      .addFields([
        {
          name: "ℹ️ Nasıl Çalışır?",
          value:
            "Aşağıdaki butona tıklayarak destek talebi açabilirsiniz. Size özel bir kanal oluşturulacak ve ekibimizle iletişim kurabileceksiniz.",
          inline: false,
        },
      ])
      .setFooter({
        text:
          config.footer ||
          "Destek talebi oluşturmak için aşağıdaki butona tıklayın!",
      })
      .setTimestamp()
      .setImage("https://i.hizliresim.com/orosrif.gif");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("destek_ac")
        .setLabel("Destek Talebi Aç")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("📬")
    );

    try {
      const mesaj = await kanal.send({
        embeds: [destekEmbed],
        components: [row],
      });

      db.set(`destek_sistemi_${interaction.guild.id}.mesajId`, mesaj.id);

      await interaction.reply({
        content: `✅ | Destek sistemi başarıyla ${kanal} kanalına kuruldu! Loglar ${logKanal}'a gönderilecek.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Destek sistemi kurulurken hata:", error);
      await interaction.reply({
        content:
          "❌ | Destek sistemi kurulurken bir hata oluştu. Lütfen kanal izinlerini kontrol edin.",
        ephemeral: true,
      });
    }
  },
};

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton() && interaction.customId === "destek_ac") {
    const mevcutKanal = db.get(
      `destek_kanal_${interaction.guild.id}_${interaction.user.id}`
    );
    if (mevcutKanal) {
      const kanal = interaction.guild.channels.cache.get(mevcutKanal.kanalId);
      if (kanal) {
        return interaction.reply({
          content: `❌ | Zaten açık bir destek talebiniz var: ${kanal}!`,
          ephemeral: true,
        });
      } else {
        db.delete(
          `destek_kanal_${interaction.guild.id}_${interaction.user.id}`
        );
      }
    }

    const modal = new ModalBuilder()
      .setCustomId("destek_talep_modal")
      .setTitle("Destek Talebi Oluştur")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("destek_konu")
            .setLabel("Destek Talebinin Konusu")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("destek_aciklama")
            .setLabel("Talebin Detaylı Açıklaması")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );

    await interaction.showModal(modal);
  }

  if (
    interaction.type === InteractionType.ModalSubmit &&
    interaction.customId === "destek_talep_modal"
  ) {
    const konu = interaction.fields.getTextInputValue("destek_konu");
    const aciklama = interaction.fields.getTextInputValue("destek_aciklama");

    const sistemVeri = db.get(`destek_sistemi_${interaction.guild.id}`);
    if (!sistemVeri || !sistemVeri.logKanal) {
      return interaction.reply({
        content:
          "❌ | Destek sistemi düzgün yapılandırılmamış. Lütfen yetkililere bildirin.",
        ephemeral: true,
      });
    }

    const logKanal = interaction.guild.channels.cache.get(sistemVeri.logKanal);
    if (!logKanal) {
      return interaction.reply({
        content: "❌ | Log kanalı bulunamadı. Lütfen yetkililere bildirin.",
        ephemeral: true,
      });
    }

    try {
      const destekKanal = await interaction.guild.channels.create({
        name: `destek-${interaction.user.username}-${interaction.user.discriminator}`,
        type: ChannelType.GuildText,
        parent: interaction.channel.parentId,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
          {
            id: interaction.guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
          {
            id:
              interaction.guild.roles.cache.find((role) =>
                role.permissions.has(PermissionsBitField.Flags.ManageChannels)
              )?.id || interaction.guild.ownerId,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
        ],
      });

      db.set(`destek_kanal_${interaction.guild.id}_${interaction.user.id}`, {
        kanalId: destekKanal.id,
        konu: konu,
        aciklama: aciklama,
        acilisZamani: Date.now(),
      });

      const kanalEmbed = new EmbedBuilder()
        .setTitle("📬 | Yeni Destek Talebi")
        .setDescription(
          `Merhaba ${interaction.user}, destek talebiniz oluşturuldu! Ekibimiz en kısa sürede size yardımcı olacak.`
        )
        .addFields([
          { name: "📝 Konu", value: `\`${konu}\``, inline: true },
          { name: "📄 Açıklama", value: aciklama, inline: false },
          {
            name: "👤 Kullanıcı",
            value: `${interaction.user.tag} (${interaction.user.id})`,
            inline: true,
          },
        ])
        .setColor("#00ff00")
        .setFooter({
          text:
            config.footer ||
            "Destek talebinizi yönetmek için aşağıdaki menüyü kullanabilirsiniz.",
        })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new SelectMenuBuilder()
          .setCustomId("destek_yonetim")
          .setPlaceholder("Talebi Yönet")
          .addOptions([
            {
              label: "Talebi Kapat",
              description: "Destek talebini kapatır ve kanalı siler",
              value: "kapat",
              emoji: "🔒",
            },
            {
              label: "Kanalı Kilitle",
              description: "Kullanıcının yazmasını engeller",
              value: "kilitle",
              emoji: "🔐",
            },
            {
              label: "Kanalın Kilidini Aç",
              description: "Kullanıcının tekrar yazmasını sağlar",
              value: "kilit_ac",
              emoji: "🔓",
            },
            {
              label: "Kullanıcıya DM Gönder",
              description: "Kullanıcıya özel mesaj gönderir",
              value: "dm_gonder",
              emoji: "📩",
            },
            {
              label: "Talep Bilgisi",
              description: "Talep detaylarını gösterir",
              value: "bilgi",
              emoji: "ℹ️",
            },
          ])
      );

      await destekKanal.send({
        content: `${interaction.user}`,
        embeds: [kanalEmbed],
        components: [row],
      });

      const logEmbed = new EmbedBuilder()
        .setTitle("📋 | Yeni Destek Talebi")
        .setDescription(`Yeni bir destek talebi açıldı.`)
        .addFields([
          {
            name: "👤 Kullanıcı",
            value: `${interaction.user.tag} (${interaction.user.id})`,
            inline: true,
          },
          { name: "📝 Konu", value: `\`${konu}\``, inline: true },
          { name: "📄 Açıklama", value: aciklama, inline: false },
          { name: "📍 Kanal", value: `<#${destekKanal.id}>`, inline: true },
        ])
        .setColor("#00ff00")
        .setTimestamp();
      await logKanal.send({ embeds: [logEmbed] });

      db.set(
        `destek_cooldown_${interaction.guild.id}_${interaction.user.id}`,
        Date.now()
      );

      await interaction.reply({
        content: `✅ | Destek talebiniz başarıyla oluşturuldu! Lütfen <#${destekKanal.id}> kanalına göz atın.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Destek kanalı oluşturulurken hata:", error);
      await interaction.reply({
        content:
          "❌ | Destek talebi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.",
        ephemeral: true,
      });
    }
  }

  if (interaction.isSelectMenu() && interaction.customId === "destek_yonetim") {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageChannels
      )
    ) {
      return interaction.reply({
        content:
          "❌ | Bu işlemi gerçekleştirmek için `Kanalları Yönet` yetkisine sahip olmalısınız!",
        ephemeral: true,
      });
    }

    const selectedValue = interaction.values[0];
    const kullanıcıId = Object.keys(db.all())
      .find(
        (key) =>
          key.startsWith(`destek_kanal_${interaction.guild.id}_`) &&
          db.get(key).kanalId === interaction.channel.id
      )
      ?.split("_")
      .pop();

    if (!kullanıcıId) {
      return interaction.reply({
        content: "❌ | Bu kanal bir destek talebine bağlı değil.",
        ephemeral: true,
      });
    }

    const sistemVeri = db.get(`destek_sistemi_${interaction.guild.id}`);
    const logKanal = sistemVeri?.logKanal
      ? interaction.guild.channels.cache.get(sistemVeri.logKanal)
      : null;

    if (selectedValue === "kapat") {
      const kanalAdi = interaction.channel.name;
      const talep = db.get(
        `destek_kanal_${interaction.guild.id}_${kullanıcıId}`
      );

      try {
        await interaction.deferReply({ ephemeral: true });
        await interaction.channel.delete();

        if (logKanal) {
          const logEmbed = new EmbedBuilder()
            .setTitle("🔒 | Destek Talebi Kapatıldı")
            .setDescription(`Bir destek talebi kapatıldı.`)
            .addFields([
              {
                name: "👤 Yetkili",
                value: `${interaction.user.tag} (${interaction.user.id})`,
                inline: true,
              },
              {
                name: "👤 Kullanıcı",
                value: `<@${kullanıcıId}>`,
                inline: true,
              },
              { name: "📍 Kanal", value: kanalAdi, inline: true },
            ])
            .setColor("#ff0000")
            .setTimestamp();
          await logKanal.send({ embeds: [logEmbed] });
        }

        try {
          const kullanıcı = await client.users.fetch(kullanıcıId);
          await kullanıcı.send({
            embeds: [
              new EmbedBuilder()
                .setTitle("🔒 | Destek Talebiniz Kapatıldı")
                .setDescription(
                  "Destek talebiniz bir yetkili tarafından kapatıldı. Yeni bir talep oluşturabilirsiniz!"
                )
                .setColor("#ff0000")
                .setFooter({ text: config.footer })
                .setTimestamp(),
            ],
          });
        } catch (error) {
          console.error("Kullanıcıya DM gönderilemedi:", error);
        }

        db.delete(`destek_kanal_${interaction.guild.id}_${kullanıcıId}`);
      } catch (error) {
        console.error("Kanal silinirken hata:", error);
        await interaction.editReply({
          content:
            "❌ | Kanal silinirken bir hata oluştu. Kanal zaten silinmiş olabilir.",
        });
      }
    } else if (selectedValue === "kilitle") {
      await interaction.channel.permissionOverwrites.edit(kullanıcıId, {
        SendMessages: false,
      });

      await interaction.reply({
        content: "🔐 | Destek kanalı kilitlendi. Kullanıcı artık yazamaz.",
        ephemeral: true,
      });

      if (logKanal) {
        const logEmbed = new EmbedBuilder()
          .setTitle("🔐 | Destek Kanalı Kilitlendi")
          .setDescription(`Destek kanalı kilitlendi.`)
          .addFields([
            {
              name: "👤 Yetkili",
              value: `${interaction.user.tag} (${interaction.user.id})`,
              inline: true,
            },
            { name: "👤 Kullanıcı", value: `<@${kullanıcıId}>`, inline: true },
            {
              name: "📍 Kanal",
              value: `<#${interaction.channel.id}>`,
              inline: true,
            },
          ])
          .setColor("#ff9900")
          .setTimestamp();
        await logKanal.send({ embeds: [logEmbed] });
      }
    } else if (selectedValue === "kilit_ac") {
      await interaction.channel.permissionOverwrites.edit(kullanıcıId, {
        SendMessages: true,
      });

      await interaction.reply({
        content: "🔓 | Destek kanalı kilidi açıldı. Kullanıcı artık yazabilir.",
        ephemeral: true,
      });

      if (logKanal) {
        const logEmbed = new EmbedBuilder()
          .setTitle("🔓 | Destek Kanalı Kilidi Açıldı")
          .setDescription(`Destek kanalı kilidi açıldı.`)
          .addFields([
            {
              name: "👤 Yetkili",
              value: `${interaction.user.tag} (${interaction.user.id})`,
              inline: true,
            },
            { name: "👤 Kullanıcı", value: `<@${kullanıcıId}>`, inline: true },
            {
              name: "📍 Kanal",
              value: `<#${interaction.channel.id}>`,
              inline: true,
            },
          ])
          .setColor("#00ff00")
          .setTimestamp();
        await logKanal.send({ embeds: [logEmbed] });
      }
    } else if (selectedValue === "dm_gonder") {
      const modal = new ModalBuilder()
        .setCustomId("destek_dm_modal")
        .setTitle("Kullanıcıya Mesaj Gönder")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("dm_mesaj")
              .setLabel("Göndermek İstediğiniz Mesaj")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          )
        );

      await interaction.showModal(modal);
    } else if (selectedValue === "bilgi") {
      const talep = db.get(
        `destek_kanal_${interaction.guild.id}_${kullanıcıId}`
      );
      if (!talep) {
        return interaction.reply({
          content: "❌ | Talep bilgileri bulunamadı.",
          ephemeral: true,
        });
      }

      const bilgiEmbed = new EmbedBuilder()
        .setTitle("ℹ️ | Destek Talebi Bilgileri")
        .setDescription(`Destek talebi detayları aşağıda yer alıyor.`)
        .addFields([
          { name: "👤 Kullanıcı", value: `<@${kullanıcıId}>`, inline: true },
          { name: "📝 Konu", value: `\`${talep.konu}\``, inline: true },
          { name: "📄 Açıklama", value: talep.aciklama, inline: false },
          {
            name: "⏰ Açılış Zamanı",
            value: `<t:${Math.floor(talep.acilisZamani / 1000)}:R>`,
            inline: true,
          },
        ])
        .setColor("#00ff00")
        .setTimestamp();

      await interaction.reply({ embeds: [bilgiEmbed], ephemeral: true });
    }
  }

  if (
    interaction.type === InteractionType.ModalSubmit &&
    interaction.customId === "destek_dm_modal"
  ) {
    const mesaj = interaction.fields.getTextInputValue("dm_mesaj");
    const kullanıcıId = Object.keys(db.all())
      .find(
        (key) =>
          key.startsWith(`destek_kanal_${interaction.guild.id}_`) &&
          db.get(key).kanalId === interaction.channel.id
      )
      ?.split("_")
      .pop();

    const sistemVeri = db.get(`destek_sistemi_${interaction.guild.id}`);
    const logKanal = sistemVeri?.logKanal
      ? interaction.guild.channels.cache.get(sistemVeri.logKanal)
      : null;

    if (kullanıcıId) {
      try {
        const kullanıcı = await client.users.fetch(kullanıcıId);
        await kullanıcı.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("📩 | Destek Ekibinden Mesaj")
              .setDescription(mesaj)
              .setColor("#00ff00")
              .setFooter({ text: config.footer })
              .setTimestamp(),
          ],
        });

        await interaction.reply({
          content: "✅ | Mesaj başarıyla kullanıcıya gönderildi!",
          ephemeral: true,
        });

        if (logKanal) {
          const logEmbed = new EmbedBuilder()
            .setTitle("📩 | Kullanıcıya DM Gönderildi")
            .setDescription(
              `Destek ekibi tarafından kullanıcıya mesaj gönderildi.`
            )
            .addFields([
              {
                name: "👤 Yetkili",
                value: `${interaction.user.tag} (${interaction.user.id})`,
                inline: true,
              },
              {
                name: "👤 Kullanıcı",
                value: `<@${kullanıcıId}>`,
                inline: true,
              },
              { name: "📄 Mesaj", value: mesaj, inline: false },
            ])
            .setColor("#00ccff")
            .setTimestamp();
          await logKanal.send({ embeds: [logEmbed] });
        }
      } catch (error) {
        console.error("Kullanıcıya DM gönderilemedi:", error);
        await interaction.reply({
          content:
            "❌ | Mesaj gönderilemedi. Kullanıcının DM'leri kapalı olabilir.",
          ephemeral: true,
        });
      }
    }
  }
});
