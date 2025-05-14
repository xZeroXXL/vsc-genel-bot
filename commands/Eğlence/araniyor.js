const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType, AttachmentBuilder } = require("discord.js");
const Canvas = require("canvas");

module.exports = {
  name: "aranıyor",
  description: "Kullanıcı için aranıyor posteri oluşturur!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 5,
  options: [
    {
      name: "kullanıcı",
      description: "Poster için kullanıcı",
      type: ApplicationCommandOptionType.User,
      required: false
    },
    {
      name: "ödül",
      description: "Yakalayana verilecek ödül miktarı (1-1000000)",
      type: ApplicationCommandOptionType.Integer,
      required: false,
      minValue: 1,
      maxValue: 1000000
    },
    {
      name: "suç",
      description: "İşlenen suç",
      type: ApplicationCommandOptionType.String,
      required: false
    }
  ],
  
  run: async(client, interaction) => {
    await interaction.deferReply();
    
    const kullanıcı = interaction.options.getUser("kullanıcı") || interaction.user;
    const ödül = interaction.options.getInteger("ödül") || 5000;
    const suç = interaction.options.getString("suç") || "Discord'da kaybolmak";
    
    try {
      const canvas = Canvas.createCanvas(800, 1000);
      const ctx = canvas.getContext("2d");
      
      ctx.fillStyle = "#D2B48C"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = "#8B4513"; 
      ctx.lineWidth = 20;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      ctx.font = "bold 100px serif";
      ctx.fillStyle = "#8B0000";
      ctx.textAlign = "center";
      ctx.fillText("ARANIYOR", canvas.width / 2, 130);
      ctx.font = "bold 50px serif";
      ctx.fillText("ÖLÜ VEYA DİRİ", canvas.width / 2, 200);
      
      try {
        const avatarSize = 300;
        const avatarX = canvas.width / 2 - avatarSize / 2;
        const avatarY = 250;
        const avatarURL = kullanıcı.displayAvatarURL({ extension: 'png', size: 512, forceStatic: true });
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const avatar = await Canvas.loadImage(avatarURL);
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2 + 10, 0, Math.PI * 2);
        ctx.strokeStyle = "#8B4513";
        ctx.lineWidth = 10;
        ctx.stroke();
      } catch (avatarError) {
        console.error("Avatar yükleme hatası:", avatarError);
        const avatarSize = 300;
        const avatarX = canvas.width / 2 - avatarSize / 2;
        const avatarY = 250;
        
        ctx.fillStyle = "#888888";
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2 + 10, 0, Math.PI * 2);
        ctx.strokeStyle = "#8B4513";
        ctx.lineWidth = 10;
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 30px serif";
        ctx.fillText("Avatar", canvas.width / 2, avatarY + avatarSize / 2 - 15);
        ctx.fillText("Yüklenemedi", canvas.width / 2, avatarY + avatarSize / 2 + 25);
      }
      
      const avatarSize = 300;
      const avatarY = 250;
      
      ctx.font = "bold 60px serif";
      ctx.fillStyle = "#000000";
      ctx.fillText(kullanıcı.username, canvas.width / 2, avatarY + avatarSize + 80);
      
      ctx.font = "bold 40px serif";
      ctx.fillText("SUÇ:", canvas.width / 2, avatarY + avatarSize + 140);
      
      ctx.font = "italic 35px serif";
      const maxWidth = 600;
      const words = suç.split(' ');
      let line = '';
      let y = avatarY + avatarSize + 190;
      
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line, canvas.width / 2, y);
          line = word + ' ';
          y += 40;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, y);
      
      y += 80;
      ctx.font = "bold 50px serif";
      ctx.fillStyle = "#8B0000";
      ctx.fillText("ÖDÜL:", canvas.width / 2, y);
      
      ctx.font = "bold 70px serif";
      ctx.fillText(`${ödül.toLocaleString()} TL`, canvas.width / 2, y + 80);
      

      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'araniyor.png' });
      

      const embed = new EmbedBuilder()
        .setColor("#8B4513")
        .setTitle(`${kullanıcı.username} İçin Aranıyor Posteri`)
        .setDescription(`**${kullanıcı.username}** için aranıyor posteri oluşturuldu!`)
        .setImage('attachment://araniyor.png')
        .setFooter({ text: client.config.footer })
        .setTimestamp();
      

      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (error) {
      console.error("Poster oluşturma hatası:", error);
      await interaction.editReply({ content: `Poster oluşturulurken bir hata oluştu! Hata: ${error.message}` });
    }
  }
};