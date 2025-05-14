const {
  Client,
  EmbedBuilder,
  ApplicationCommandType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");
const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");
const fs = require("fs");
const db = require("croxydb");

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
    console.log(`Font loaded: ${family} (${fullPath}) with weight: ${weight}`);
  } catch (error) {
    console.error(`Error loading font: ${family} (${fullPath})`, error);
  }
});

module.exports = {
  name: "top",
  description:
    "Sunucudaki en yüksek seviyeli kullanıcıları resimli olarak listeler!",
  type: ApplicationCommandType.ChatInput,
  run: async (client, interaction) => {
    await interaction.deferReply();

    const guildId = interaction.guild.id;
    const pageSize = 5;
    let currentPage = 0;

    let allData = db.all() || {};
    if (!Array.isArray(allData)) {
      allData = Object.entries(allData).map(([ID, data]) => ({ ID, data }));
    }

    if (allData.length === 0) {
      console.warn("Veritabanında veri bulunamadı.");
      return interaction.editReply({
        content: "📊 Bu sunucuda henüz seviye kaydı yok!",
        ephemeral: true,
      });
    }

    const levelData = allData
      .filter(
        (entry) =>
          entry.ID &&
          entry.ID.startsWith(`level_`) &&
          entry.ID.includes(guildId)
      )
      .map((entry) => ({
        userId: entry.ID.split("_")[1],
        level: entry.data,
        xp: db.get(`xp_${entry.ID.split("_")[1]}_${guildId}`) || 0,
      }));

    if (levelData.length === 0) {
      return interaction.editReply({
        content: "📊 Bu sunucuda henüz seviye kaydı yok!",
        ephemeral: true,
      });
    }

    const sortedData = levelData.sort((a, b) => {
      if (b.level === a.level) return b.xp - a.xp;
      return b.level - a.level;
    });

    const userRank =
      sortedData.findIndex((data) => data.userId === interaction.user.id) + 1;
    const userLevel = db.get(`level_${interaction.user.id}_${guildId}`) || 1;
    const userXp = db.get(`xp_${interaction.user.id}_${guildId}`) || 0;
    const userRequiredXp = userLevel * (client.config?.levelXp || 100);

    const generateLeaderboardImage = async (page) => {
      const start = page * pageSize;
      const end = start + pageSize;
      const pageData = sortedData.slice(start, end);

      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext("2d");

      const gradient = ctx.createLinearGradient(0, 0, 0, 600);
      gradient.addColorStop(0, "#0A0A23");
      gradient.addColorStop(1, "#1E3A8A");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);

      ctx.fillStyle = "#2563EB";
      ctx.fillRect(0, 0, 800, 80);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 36px 'Orbitron', 'Arial', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🏆 Seviye Sıralaması", 400, 50);

      try {
        if (interaction.guild.iconURL()) {
          const iconURL = interaction.guild.iconURL({
            extension: "png",
            size: 64,
          });
          if (iconURL) {
            const serverIcon = await loadImage(iconURL);
            ctx.save();
            ctx.beginPath();
            ctx.arc(60, 40, 30, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(serverIcon, 30, 10, 60, 60);
            ctx.restore();

            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(60, 40, 30, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      } catch (err) {
        console.error("Sunucu ikonu yüklenemedi:", err);
      }

      const startY = 110;
      const entryHeight = 85;

      for (let i = 0; i < pageData.length; i++) {
        const data = pageData[i];
        const positionY = startY + i * entryHeight;
        const rank = start + i + 1;

        try {
          const user = await client.users.fetch(data.userId).catch(() => null);
          if (!user) continue;

          const requiredXp = data.level * (client.config?.levelXp || 100);
          const progress = Math.min((data.xp / requiredXp) * 100, 100);

          ctx.fillStyle = rank % 2 === 0 ? "#111827" : "#1F2937";
          ctx.fillRect(20, positionY, 760, entryHeight - 10);

          ctx.fillStyle = getRankColor(rank);
          ctx.fillRect(20, positionY, 60, entryHeight - 10);
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 24px 'Poppins', 'Arial', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`#${rank}`, 50, positionY + 45);

          try {
            let avatar;
            const avatarURL = user.displayAvatarURL({
              extension: "png",
              size: 64,
            });

            if (avatarURL) {
              avatar = await loadImage(avatarURL);

              ctx.save();
              ctx.beginPath();
              ctx.arc(115, positionY + 37, 25, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(avatar, 90, positionY + 12, 50, 50);
              ctx.restore();

              ctx.strokeStyle = "#60A5FA";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(115, positionY + 37, 25, 0, Math.PI * 2);
              ctx.stroke();
            } else {
              ctx.fillStyle = "#3B82F6";
              ctx.beginPath();
              ctx.arc(115, positionY + 37, 25, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#FFFFFF";
              ctx.font = "bold 20px 'Inter', 'Arial', sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(
                user.username.charAt(0).toUpperCase(),
                115,
                positionY + 37
              );

              ctx.strokeStyle = "#60A5FA";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(115, positionY + 37, 25, 0, Math.PI * 2);
              ctx.stroke();
            }
          } catch (err) {
            console.warn(`Avatar yüklenemedi: ${user.tag}`, err);

            ctx.fillStyle = "#3B82F6";
            ctx.beginPath();
            ctx.arc(115, positionY + 37, 25, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 20px 'Inter', 'Arial', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              user.username.charAt(0).toUpperCase(),
              115,
              positionY + 37
            );

            ctx.strokeStyle = "#60A5FA";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(115, positionY + 37, 25, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 20px 'Inter', 'Arial', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(user.tag, 150, positionY + 30);

          ctx.fillStyle = "#9CA3AF";
          ctx.font = "16px 'Inter', 'Arial', sans-serif";
          ctx.fillText(
            `Seviye: ${data.level} • XP: ${data.xp}/${requiredXp}`,
            150,
            positionY + 55
          );

          ctx.fillStyle = "#4B5563";
          ctx.fillRect(400, positionY + 40, 350, 15);

          ctx.fillStyle = "#4ADE80";
          ctx.fillRect(400, positionY + 40, (350 * progress) / 100, 15);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 12px 'Inter', 'Arial', sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(`${Math.round(progress)}%`, 750, positionY + 53);
        } catch (error) {
          console.error(`Kullanıcı sıralaması oluşturulurken hata: ${error}`);
        }
      }

      const userSection = startY + pageSize * entryHeight + 20;

      ctx.fillStyle = "#60A5FA";
      ctx.fillRect(20, userSection - 10, 760, 2);

      ctx.fillStyle = "#1E40AF";
      ctx.fillRect(20, userSection, 760, 80);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px 'Poppins', 'Arial', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("📌 Senin Sıralaman", 30, userSection + 25);

      if (userRank > 0) {
        try {
          let userAvatarUrl = interaction.user.displayAvatarURL({
            format: "png",
            size: 64,
          });
          if (userAvatarUrl.includes(".webp")) {
            userAvatarUrl = userAvatarUrl.replace(".webp", ".png");
          }
          const userAvatar = await loadImage(userAvatarUrl);

          ctx.save();
          ctx.beginPath();
          ctx.arc(115, userSection + 50, 25, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(userAvatar, 90, userSection + 25, 50, 50);
          ctx.restore();

          ctx.strokeStyle = "#FACC15";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(115, userSection + 50, 25, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = getRankColor(userRank);
          ctx.fillRect(20, userSection, 60, 80);
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 24px 'Poppins', 'Arial', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`#${userRank}`, 50, userSection + 50);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 20px 'Inter', 'Arial', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(interaction.user.tag, 150, userSection + 40);

          ctx.fillStyle = "#9CA3AF";
          ctx.font = "16px 'Inter', 'Arial', sans-serif";
          ctx.fillText(
            `Seviye: ${userLevel} • XP: ${userXp}/${userRequiredXp}`,
            150,
            userSection + 65
          );

          const userProgress = Math.min((userXp / userRequiredXp) * 100, 100);

          ctx.fillStyle = "#4B5563";
          ctx.fillRect(400, userSection + 50, 350, 15);

          ctx.fillStyle = "#FACC15";
          ctx.fillRect(400, userSection + 50, (350 * userProgress) / 100, 15);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 12px 'Inter', 'Arial', sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(`${Math.round(userProgress)}%`, 750, userSection + 63);
        } catch (error) {
          console.error(`Kullanıcı bilgisi gösterilirken hata: ${error}`);
        }
      } else {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "18px 'Inter', 'Arial', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Sıralamada henüz yer almıyorsun!", 400, userSection + 50);
      }

      ctx.fillStyle = "#4B5563";
      ctx.fillRect(0, 560, 800, 40);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "16px 'Inter', 'Arial', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `Sayfa ${page + 1}/${Math.ceil(sortedData.length / pageSize)} | ${
          client.config?.footer || "Seviye Sistemi"
        }`,
        400,
        580
      );

      const now = new Date();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "14px 'Inter', 'Arial', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(now.toLocaleDateString("tr-TR"), 760, 580);

      return canvas.toBuffer();
    };

    function getRankColor(rank) {
      switch (rank) {
        case 1:
          return "#FFD700";
        case 2:
          return "#C0C0C0";
        case 3:
          return "#CD7F32";
        default:
          return "#3B82F6";
      }
    }

    const generateButtons = (page) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev_page")
          .setLabel("◀ Önceki")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("next_page")
          .setLabel("▶ Sonraki")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page >= Math.ceil(sortedData.length / pageSize) - 1)
      );
    };

    try {
      const imageBuffer = await generateLeaderboardImage(currentPage);
      const attachment = new AttachmentBuilder(imageBuffer, {
        name: "leaderboard.png",
      });
      const row = generateButtons(currentPage);

      const message = await interaction.editReply({
        files: [attachment],
        components: [row],
      });

      const collector = message.createMessageComponentCollector({
        filter: (i) =>
          i.user.id === interaction.user.id &&
          ["prev_page", "next_page"].includes(i.customId),
        time: 60000,
      });

      collector.on("collect", async (i) => {
        await i.deferUpdate();

        if (i.customId === "prev_page") currentPage--;
        if (i.customId === "next_page") currentPage++;

        try {
          const newImageBuffer = await generateLeaderboardImage(currentPage);
          const newAttachment = new AttachmentBuilder(newImageBuffer, {
            name: "leaderboard.png",
          });
          const newRow = generateButtons(currentPage);

          await i.editReply({
            files: [newAttachment],
            components: [newRow],
          });
        } catch (error) {
          console.error("Sıralama güncellenirken hata:", error);
          await i.followUp({
            content:
              "Sıralama gösterilirken bir hata oluştu. Lütfen tekrar deneyin.",
            ephemeral: true,
          });
        }
      });

      collector.on("end", async () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev_page")
            .setLabel("◀ Önceki")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("next_page")
            .setLabel("▶ Sonraki")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );

        await message.edit({ components: [disabledRow] }).catch(() => {});
      });
    } catch (error) {
      console.error("Sıralama görseli oluşturulurken hata:", error);
      await interaction.editReply({
        content:
          "Sıralama görseli oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.",
        ephemeral: true,
      });
    }
  },
};
