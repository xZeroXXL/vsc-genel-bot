const {
  Client,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  AttachmentBuilder,
} = require("discord.js");
const db = require("croxydb");
const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");
const fs = require("fs");
const config = require("../../config.json");
const voiceXpIntervals = new Map();

const fontPath = path.join(__dirname, "../../fonts");
const fonts = [
  { file: "Orbitron-Bold.ttf", family: "Orbitron", weight: "bold" },
  { file: "Poppins-Bold.ttf", family: "Poppins", weight: "bold" },
  { file: "Inter-Regular.ttf", family: "Inter", weight: "normal" },
];

fonts.forEach(({ file, family, weight }) => {
  const fullPath = path.join(fontPath, file);
  try {
    if (!fs.existsSync(fullPath)) {
      console.error(`Font file not found: ${fullPath}`);
      return;
    }

    registerFont(fullPath, { family, weight });
  } catch (error) {
    console.error(`Error loading font: ${family} (${fullPath})`, error);
  }
});

module.exports = {
  name: "seviye",
  description: "Seviye bilgilerini görsel olarak gösterir!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 5,
  options: [
    {
      name: "kullanıcı",
      description: "Seviyesi görüntülenecek kullanıcı",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  run: async (client, interaction) => {
    await interaction.deferReply();

    const user = interaction.options.getUser("kullanıcı") || interaction.user;
    const guildId = interaction.guild.id;

    try {
      const xp = db.get(`xp_${user.id}_${guildId}`) || 0;
      const level = db.get(`level_${user.id}_${guildId}`) || 1;
      const requiredXp = level * (db.get(`xpKatsayisi_${guildId}`) || 100);
      const progress = Math.min((xp / requiredXp) * 100, 100);

      const canvas = createCanvas(800, 400);
      const ctx = canvas.getContext("2d");

      const gradient = ctx.createLinearGradient(0, 0, 800, 400);
      gradient.addColorStop(0, "#0A0A23");
      gradient.addColorStop(1, "#1E3A8A");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 400);

      let avatar;
      try {
        let avatarUrl = user.displayAvatarURL({ format: "png", size: 128 });
        if (avatarUrl.includes(".webp")) {
          avatarUrl = avatarUrl.replace(".webp", ".png");
        }

        avatar = await loadImage(avatarUrl);
      } catch (err) {
        console.warn(
          `Avatar yüklenemedi: ${user.tag}, varsayılan avatar kullanılıyor.`,
          err
        );
        avatar = await loadImage(
          "https://discordapp.com/assets/1f0bfc0865d324c2587920a7d80c609b.png"
        );
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(100, 100, 75, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, 25, 25, 150, 150);
      ctx.restore();
      ctx.strokeStyle = "#60A5FA";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(100, 100, 75, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#FACC15";
      ctx.beginPath();
      ctx.moveTo(750, 50);
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(
          750 + 20 * Math.cos((Math.PI * 2 * i) / 5 - Math.PI / 2),
          50 + 20 * Math.sin((Math.PI * 2 * i) / 5 - Math.PI / 2)
        );
        ctx.lineTo(
          750 + 10 * Math.cos((Math.PI * (i + 0.5)) / 2.5 - Math.PI / 2),
          50 + 10 * Math.sin((Math.PI * (i + 0.5)) / 2.5 - Math.PI / 2)
        );
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#C084FC";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 350);
      ctx.lineTo(150, 350);
      ctx.stroke();

      try {
        ctx.fillStyle = "#FFFFFF";

        ctx.font = "bold 40px 'Orbitron', 'Arial', sans-serif";

        ctx.fillText(user.tag, 200, 80);

        ctx.fillStyle = "#F472B6";
        ctx.font = "bold 32px 'Poppins', 'Arial', sans-serif";

        ctx.textAlign = "right";
        ctx.fillText(`Seviye: ${level}`, 750, 150);

        ctx.fillStyle = "#E5E7EB";
        ctx.font = "24px 'Inter', 'Arial', sans-serif";

        ctx.fillText(`XP: ${xp}/${requiredXp}`, 750, 190);

        ctx.fillStyle = "#4B5563";
        ctx.fillRect(100, 250, 600, 40);

        ctx.fillStyle = "#4ADE80";
        ctx.fillRect(100, 250, (600 * progress) / 100, 40);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 20px 'Poppins', 'Arial', sans-serif";

        ctx.textAlign = "center";
        ctx.fillText(`${Math.round(progress)}%`, 400, 275);

        ctx.fillStyle = "#9CA3AF";
        ctx.font = "16px 'Inter', 'Arial', sans-serif";

        ctx.textAlign = "center";
        ctx.fillText(`Seviye Sistemi | ${config["bot-adi"]}`, 400, 380);
      } catch (fontError) {
        console.error("Font rendering error:", fontError);

        ctx.font = "bold 40px sans-serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "left";
        ctx.fillText(user.tag, 200, 80);

        ctx.font = "bold 32px sans-serif";
        ctx.fillStyle = "#F472B6";
        ctx.textAlign = "right";
        ctx.fillText(`Seviye: ${level}`, 750, 150);

        ctx.font = "24px sans-serif";
        ctx.fillStyle = "#E5E7EB";
        ctx.fillText(`XP: ${xp}/${requiredXp}`, 750, 190);

        ctx.font = "bold 20px sans-serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.round(progress)}%`, 400, 275);

        ctx.font = "16px sans-serif";
        ctx.fillStyle = "#9CA3AF";
        ctx.fillText("Seviye Sistemi | Botun Adı", 400, 380);
      }

      const attachment = new AttachmentBuilder(canvas.toBuffer(), {
        name: "level-card.png",
      });
      await interaction.editReply({ files: [attachment] });
    } catch (error) {
      console.error("Seviye kartı oluşturulurken hata:", error);
      await interaction.editReply({
        content: "Seviye kartı oluşturulurken bir hata oluştu. Tekrar deneyin!",
        ephemeral: true,
      });
    }
  },
};

function createProgressBar(current, max) {
  const progress = Math.min(Math.round((current / max) * 10), 10);
  const progressBar = "▰".repeat(progress) + "▱".repeat(10 - progress);
  return `\`${progressBar}\` (${Math.round((current / max) * 100)}%)`;
}

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const userId = message.author.id;

  const seviyeSistemi = db.get(`seviyeSistemi_${guildId}`);
  if (!seviyeSistemi) return;

  try {
    const sonXpZamani = db.get(`sonXpZamani_${userId}_${guildId}`) || 0;
    const simdikiZaman = Date.now();

    if (simdikiZaman - sonXpZamani < 60000) return;

    const kazanilanXp = Math.floor(Math.random() * 15) + 5;
    const mevcutXp = db.get(`xp_${userId}_${guildId}`) || 0;
    const mevcutLevel = db.get(`level_${userId}_${guildId}`) || 1;
    const requiredXp = mevcutLevel * (db.get(`xpKatsayisi_${guildId}`) || 100);

    const yeniXp = mevcutXp + kazanilanXp;
    db.set(`xp_${userId}_${guildId}`, yeniXp);
    db.set(`sonXpZamani_${userId}_${guildId}`, simdikiZaman);

    if (yeniXp >= requiredXp) {
      const yeniLevel = mevcutLevel + 1;
      db.set(`level_${userId}_${guildId}`, yeniLevel);
      db.set(`xp_${userId}_${guildId}`, 0);

      const levelUpEmbed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("🎉 Seviye Atladın!")
        .setDescription(
          `Tebrikler ${message.author}! **${yeniLevel}** seviyesine ulaştın.`
        )
        .setTimestamp();

      await message.channel
        .send({ embeds: [levelUpEmbed] })
        .catch((e) => console.error("Seviye mesajı gönderilemedi:", e));
    }
  } catch (error) {
    console.error("Mesaj XP'si işlenirken hata oluştu:", error);
  }
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (newState.member.user.bot) return;

  const userId = newState.member.user.id;
  const guildId = newState.guild.id;

  const seviyeSistemi = db.get(`seviyeSistemi_${guildId}`);
  if (!seviyeSistemi) return;

  try {
    if (!oldState.channelId && newState.channelId) {
      if (
        !newState.guild.afkChannelId ||
        newState.guild.afkChannelId !== newState.channelId
      ) {
        startVoiceXP(newState.member, guildId);
      }
    } else if (oldState.channelId && !newState.channelId) {
      stopVoiceXP(oldState.member, guildId);
    } else if (
      oldState.channelId &&
      newState.channelId &&
      oldState.channelId !== newState.channelId
    ) {
      if (
        newState.guild.afkChannelId &&
        newState.guild.afkChannelId === newState.channelId
      ) {
        stopVoiceXP(newState.member, guildId);
      } else if (oldState.guild.afkChannelId === oldState.channelId) {
        startVoiceXP(newState.member, guildId);
      }
    }
  } catch (error) {
    console.error("Ses durumu güncellenirken hata oluştu:", error);
  }
});

function startVoiceXP(member, guildId) {
  const userId = member.user.id;
  const userKey = `${userId}-${guildId}`;

  try {
    if (voiceXpIntervals.has(userKey)) {
      clearInterval(voiceXpIntervals.get(userKey));
    }

    db.set(`voiceJoinTime_${userId}_${guildId}`, Date.now());

    const interval = setInterval(() => {
      if (!member.voice.channelId) {
        stopVoiceXP(member, guildId);
        return;
      }

      try {
        const mevcutXp = db.get(`xp_${userId}_${guildId}`) || 0;
        const mevcutLevel = db.get(`level_${userId}_${guildId}`) || 1;
        const levelXp = db.get(`xpKatsayisi_${guildId}`) || 100;
        const requiredXp = mevcutLevel * levelXp;

        const kazanilanXp = Math.floor(Math.random() * 10) + 10;
        const yeniXp = mevcutXp + kazanilanXp;

        db.set(`xp_${userId}_${guildId}`, yeniXp);

        if (yeniXp >= requiredXp) {
          const yeniLevel = mevcutLevel + 1;
          db.set(`level_${userId}_${guildId}`, yeniLevel);
          db.set(`xp_${userId}_${guildId}`, 0);

          member
            .send({
              embeds: [
                new EmbedBuilder()
                  .setColor("Green")
                  .setTitle("🎉 Seviye Atladın!")
                  .setDescription(
                    `**${member.guild.name}** sunucusunda ses kanalında bulunarak **${yeniLevel}** seviyesine ulaştın!`
                  )
                  .setTimestamp(),
              ],
            })
            .catch(() => {});

          const levelLogChannelId = db.get(`levelLogChannel_${guildId}`);
          if (levelLogChannelId) {
            const levelLogChannel =
              member.guild.channels.cache.get(levelLogChannelId);
            if (levelLogChannel) {
              levelLogChannel
                .send({
                  embeds: [
                    new EmbedBuilder()
                      .setColor("Green")
                      .setTitle("🎉 Seviye Atladı!")
                      .setDescription(
                        `${member} ses kanalında bulunarak **${yeniLevel}** seviyesine ulaştı!`
                      )
                      .setTimestamp(),
                  ],
                })
                .catch(() => {});
            }
          }
        }
      } catch (error) {
        console.error("Ses XP'si işlenirken hata oluştu:", error);
      }
    }, 60000);

    voiceXpIntervals.set(userKey, interval);
  } catch (error) {
    console.error("Ses XP intervali başlatılırken hata oluştu:", error);
  }
}

function stopVoiceXP(member, guildId) {
  const userId = member.user.id;
  const userKey = `${userId}-${guildId}`;

  try {
    if (voiceXpIntervals.has(userKey)) {
      clearInterval(voiceXpIntervals.get(userKey));
      voiceXpIntervals.delete(userKey);
    }

    const joinTime = db.get(`voiceJoinTime_${userId}_${guildId}`);
    if (!joinTime) return;

    const currentTime = Date.now();
    const timeSpent = Math.floor((currentTime - joinTime) / 60000);

    if (timeSpent < 1) return;

    db.delete(`voiceJoinTime_${userId}_${guildId}`);
  } catch (error) {
    console.error("Ses XP intervali durdurulurken hata oluştu:", error);
  }
}
