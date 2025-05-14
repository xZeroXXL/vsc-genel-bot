const {
  Client,
  EmbedBuilder,
  PermissionsBitField,
  ApplicationCommandType,
  ApplicationCommandOptionType,
} = require("discord.js");
const db = require("croxydb");

module.exports = [
  {
    name: "seviye-ekle",
    description: "Bir kullanıcının seviyesine ekleme yapar!",
    type: ApplicationCommandType.ChatInput,
    options: [
      {
        name: "kullanıcı",
        description: "Seviye eklenecek kullanıcı",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "miktar",
        description: "Eklenecek seviye miktarı",
        type: ApplicationCommandOptionType.Integer,
        required: true,
        min_value: 1,
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

      const kullanıcı = interaction.options.getUser("kullanıcı");
      const miktar = interaction.options.getInteger("miktar");
      const guildId = interaction.guild.id;

      if (kullanıcı.bot) {
        return interaction.reply({
          content: "❌ | Botlara seviye eklenemez!",
          ephemeral: true,
        });
      }

      const currentLevel = db.get(`level_${kullanıcı.id}_${guildId}`) || 1;
      const newLevel = currentLevel + miktar;
      db.set(`level_${kullanıcı.id}_${guildId}`, newLevel);

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor || "#00FF00")
        .setTitle("📈 Seviye Eklendi!")
        .setDescription(
          `
          **Kullanıcı:** ${kullanıcı}
          **Eklendi:** ${miktar} seviye
          **Yeni Seviye:** ${newLevel}
          **Ayarlayan:** ${interaction.user}
        `
        )
        .setThumbnail(kullanıcı.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: client.config.footer || "Seviye Sistemi" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    name: "seviye-xp-ekle",
    description: "Bir kullanıcının XP'sine ekleme yapar!",
    type: ApplicationCommandType.ChatInput,
    options: [
      {
        name: "kullanıcı",
        description: "XP eklenecek kullanıcı",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "miktar",
        description: "Eklenecek XP miktarı",
        type: ApplicationCommandOptionType.Integer,
        required: true,
        min_value: 1,
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

      const kullanıcı = interaction.options.getUser("kullanıcı");
      const miktar = interaction.options.getInteger("miktar");
      const guildId = interaction.guild.id;

      if (kullanıcı.bot) {
        return interaction.reply({
          content: "❌ | Botlara XP eklenemez!",
          ephemeral: true,
        });
      }

      const currentXp = db.get(`xp_${kullanıcı.id}_${guildId}`) || 0;
      const newXp = currentXp + miktar;
      db.set(`xp_${kullanıcı.id}_${guildId}`, newXp);

      const level = db.get(`level_${kullanıcı.id}_${guildId}`) || 1;
      const requiredXp = level * (client.config.levelXp || 100);

      if (newXp >= requiredXp) {
        const newLevel = Math.floor(newXp / (client.config.levelXp || 100)) + 1;
        db.set(`level_${kullanıcı.id}_${guildId}`, newLevel);
        db.set(
          `xp_${kullanıcı.id}_${guildId}`,
          newXp % (client.config.levelXp || 100)
        );
      }

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor || "#00FF00")
        .setTitle("⭐ XP Eklendi!")
        .setDescription(
          `
          **Kullanıcı:** ${kullanıcı}
          **Eklendi:** ${miktar} XP
          **Yeni XP:** ${newXp % (client.config.levelXp || 100)}/${requiredXp}
          **Seviye:** ${db.get(`level_${kullanıcı.id}_${guildId}`) || 1}
          **Ayarlayan:** ${interaction.user}
        `
        )
        .setThumbnail(kullanıcı.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: client.config.footer || "Seviye Sistemi" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    name: "seviye-sil",
    description: "Bir kullanıcının seviyesini sıfırlar!",
    type: ApplicationCommandType.ChatInput,
    options: [
      {
        name: "kullanıcı",
        description: "Seviyesi sıfırlanacak kullanıcı",
        type: ApplicationCommandOptionType.User,
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
          content:
            "❌ | Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısınız!",
          ephemeral: true,
        });
      }

      const kullanıcı = interaction.options.getUser("kullanıcı");
      const guildId = interaction.guild.id;

      if (kullanıcı.bot) {
        return interaction.reply({
          content: "❌ | Botların seviyesi sıfırlanamaz!",
          ephemeral: true,
        });
      }

      const currentLevel = db.get(`level_${kullanıcı.id}_${guildId}`) || 1;
      if (currentLevel === 1) {
        return interaction.reply({
          content: `❌ | **${kullanıcı.tag}** kullanıcısının zaten seviye 1!`,
          ephemeral: true,
        });
      }

      db.set(`level_${kullanıcı.id}_${guildId}`, 1);
      db.delete(`xp_${kullanıcı.id}_${guildId}`);

      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("🗑️ Seviye Sıfırlandı!")
        .setDescription(
          `
          **Kullanıcı:** ${kullanıcı}
          **Eski Seviye:** ${currentLevel}
          **Yeni Seviye:** 1
          **XP:** 0
          **Ayarlayan:** ${interaction.user}
        `
        )
        .setThumbnail(kullanıcı.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: client.config.footer || "Seviye Sistemi" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    name: "seviye-xp-sil",
    description: "Bir kullanıcının XP'sini sıfırlar veya azaltır!",
    type: ApplicationCommandType.ChatInput,
    options: [
      {
        name: "kullanıcı",
        description: "XP'si silinecek/azaltılacak kullanıcı",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "miktar",
        description: "Silinecek XP miktarı (0 = tüm XP)",
        type: ApplicationCommandOptionType.Integer,
        required: true,
        min_value: 0,
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

      const kullanıcı = interaction.options.getUser("kullanıcı");
      const miktar = interaction.options.getInteger("miktar");
      const guildId = interaction.guild.id;

      if (kullanıcı.bot) {
        return interaction.reply({
          content: "❌ | Botların XP'si silinemez!",
          ephemeral: true,
        });
      }

      const currentXp = db.get(`xp_${kullanıcı.id}_${guildId}`) || 0;
      if (currentXp === 0 && miktar > 0) {
        return interaction.reply({
          content: `❌ | **${kullanıcı.tag}** kullanıcısının zaten 0 XP'si var!`,
          ephemeral: true,
        });
      }

      let newXp;
      if (miktar === 0) {
        db.delete(`xp_${kullanıcı.id}_${guildId}`);
        newXp = 0;
      } else {
        newXp = Math.max(0, currentXp - miktar);
        db.set(`xp_${kullanıcı.id}_${guildId}`, newXp);
      }

      const level = db.get(`level_${kullanıcı.id}_${guildId}`) || 1;
      const requiredXp = level * (client.config.levelXp || 100);

      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("🗑️ XP Silindi!")
        .setDescription(
          `
          **Kullanıcı:** ${kullanıcı}
          **Silinen XP:** ${miktar === 0 ? "Tüm XP" : miktar}
          **Yeni XP:** ${newXp}/${requiredXp}
          **Seviye:** ${level}
          **Ayarlayan:** ${interaction.user}
        `
        )
        .setThumbnail(kullanıcı.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: client.config.footer || "Seviye Sistemi" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    name: "seviye-ayarla",
    description: "Bir kullanıcının seviyesini ve XP'sini ayarlar!",
    type: ApplicationCommandType.ChatInput,
    options: [
      {
        name: "kullanıcı",
        description: "Seviyesi ayarlanacak kullanıcı",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "seviye",
        description: "Ayarlanacak seviye",
        type: ApplicationCommandOptionType.Integer,
        required: true,
        min_value: 1,
      },
      {
        name: "xp",
        description: "Ayarlanacak XP (isteğe bağlı)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 0,
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

      const kullanıcı = interaction.options.getUser("kullanıcı");
      const seviye = interaction.options.getInteger("seviye");
      const xp = interaction.options.getInteger("xp") || 0;
      const guildId = interaction.guild.id;

      if (kullanıcı.bot) {
        return interaction.reply({
          content: "❌ | Botların seviyesi ayarlanamaz!",
          ephemeral: true,
        });
      }

      db.set(`level_${kullanıcı.id}_${guildId}`, seviye);
      db.set(`xp_${kullanıcı.id}_${guildId}`, xp);

      const requiredXp = seviye * (client.config.levelXp || 100);

      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor || "#00FF00")
        .setTitle("⚙️ Seviye Ayarlandı!")
        .setDescription(
          `
          **Kullanıcı:** ${kullanıcı}
          **Yeni Seviye:** ${seviye}
          **Yeni XP:** ${xp}/${requiredXp}
          **Ayarlayan:** ${interaction.user}
        `
        )
        .setThumbnail(kullanıcı.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: client.config.footer || "Seviye Sistemi" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    },
  },
];
