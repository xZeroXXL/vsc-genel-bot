const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType, AttachmentBuilder } = require("discord.js");
const Canvas = require("canvas");

module.exports = {
  name: "aşkölçer",
  description: "İki kullanıcı arasındaki aşk yüzdesini görsel olarak ölçer!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,
  options: [
    {
      name: "kullanıcı1",
      description: "Birinci kullanıcı",
      type: ApplicationCommandOptionType.User,
      required: true
    },
    {
      name: "kullanıcı2",
      description: "İkinci kullanıcı (boş bırakılırsa siz seçilirsiniz)",
      type: ApplicationCommandOptionType.User,
      required: false
    }
  ],
  
  run: async(client, interaction) => {
    
    await interaction.deferReply();
    
    
    const kullanıcı1 = interaction.options.getUser("kullanıcı1");
    const kullanıcı2 = interaction.options.getUser("kullanıcı2") || interaction.user;
    
    
    if (kullanıcı1.id === kullanıcı2.id && kullanıcı1.id === interaction.user.id) {
      return interaction.editReply({
        content: "Kendine olan aşkını ölçmek yerine başka birini seç! 😄",
      });
    }
    
    try {
      
      const loveScore = Math.abs(
        (parseInt(kullanıcı1.id.substring(0, 4)) + parseInt(kullanıcı2.id.substring(0, 4))) % 101
      );
      
      
      let color, heartColor;
      
      if (loveScore < 25) {
        color = "#ff0000"; 
        heartColor = "#ff6666"; 
      } else if (loveScore < 50) {
        color = "#ff6600"; 
        heartColor = "#ff9966"; 
      } else if (loveScore < 75) {
        color = "#ff3399"; 
        heartColor = "#ff66cc"; 
      } else {
        color = "#ff00ff"; 
        heartColor = "#ff66ff"; 
      }
      
      
      let loveMessage;
      if (loveScore < 25) {
        loveMessage = "Bu ilişki pek umut vaat etmiyor...";
      } else if (loveScore < 50) {
        loveMessage = "Arkadaşlıktan ötesi olabilir!";
      } else if (loveScore < 75) {
        loveMessage = "Bu ikili çok iyi anlaşıyor!";
      } else if (loveScore < 90) {
        loveMessage = "Harika bir çift olabilirler!";
      } else {
        loveMessage = "Bu tam bir ruh eşi durumu!";
      }
      
      
      const canvas = Canvas.createCanvas(800, 600);
      const ctx = canvas.getContext("2d");
      
      
      ctx.fillStyle = "#fff0f5"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      
      ctx.font = "bold 50px Arial";
      ctx.fillStyle = "#ff3399";
      ctx.textAlign = "center";
      ctx.fillText("❤️ Aşk Ölçer ❤️", canvas.width / 2, 70);
      
      try {
        
        const avatar1URL = kullanıcı1.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
        const avatar1 = await Canvas.loadImage(avatar1URL);
        
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(200, 200, 80, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar1, 120, 120, 160, 160);
        ctx.restore();
        
        
        ctx.beginPath();
        ctx.arc(200, 200, 85, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.stroke();
        
        
        const avatar2URL = kullanıcı2.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
        const avatar2 = await Canvas.loadImage(avatar2URL);
        
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(600, 200, 80, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar2, 520, 120, 160, 160);
        ctx.restore();
        
        
        ctx.beginPath();
        ctx.arc(600, 200, 85, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.stroke();
      } catch (avatarError) {
        console.error("Avatar yükleme hatası:", avatarError);
        
        
        ctx.fillStyle = "#cccccc";
        ctx.beginPath();
        ctx.arc(200, 200, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(600, 200, 80, 0, Math.PI * 2);
        ctx.fill();
        
        
        ctx.beginPath();
        ctx.arc(200, 200, 85, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(600, 200, 85, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.stroke();
      }
      
      
      ctx.font = "bold 24px Arial";
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";
      ctx.fillText(kullanıcı1.username, 200, 310);
      ctx.fillText(kullanıcı2.username, 600, 310);
      
      
      ctx.font = "bold 100px Arial";
      ctx.fillStyle = color;
      ctx.fillText(`${loveScore}%`, canvas.width / 2, 230);
      
      
      ctx.font = "80px Arial";
      ctx.fillStyle = "#ff0000";
      ctx.fillText("❤️", canvas.width / 2, 140);
      
      
      const barWidth = 600;
      const barHeight = 40;
      const barX = (canvas.width - barWidth) / 2;
      const barY = 350;
      
      
      ctx.fillStyle = "#eeeeee";
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth, barHeight, 20);
      ctx.fill();
      
      
      ctx.fillStyle = color;
      const progressWidth = (loveScore / 100) * barWidth;
      ctx.beginPath();
      ctx.roundRect(barX, barY, progressWidth, barHeight, 20);
      ctx.fill();
      
      
      ctx.font = "16px Arial";
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";
      ctx.fillText("0%", barX, barY + barHeight + 20);
      ctx.fillText("25%", barX + barWidth * 0.25, barY + barHeight + 20);
      ctx.fillText("50%", barX + barWidth * 0.5, barY + barHeight + 20);
      ctx.fillText("75%", barX + barWidth * 0.75, barY + barHeight + 20);
      ctx.fillText("100%", barX + barWidth, barY + barHeight + 20);
      
      
      ctx.font = "bold 30px Arial";
      ctx.fillStyle = "#333333";
      ctx.fillText(loveMessage, canvas.width / 2, 450);
      
      
      ctx.fillStyle = heartColor;
      for (let i = 0; i < 20; i++) {
        const heartSize = Math.random() * 20 + 10;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        
        drawHeart(ctx, x, y, heartSize);
      }
      
      
      drawArrow(ctx, 300, 200, 500, 200, color);
      
      
      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'askolcer.png' });
      
      
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`❤️ Aşk Ölçer Sonucu ❤️`)
        .setDescription(`**${kullanıcı1.username}** ve **${kullanıcı2.username}** arasındaki aşk skoru: **%${loveScore}**\n${loveMessage}`)
        .setImage('attachment://askolcer.png')
        .setFooter({ text: client.config.footer })
        .setTimestamp();
      
      
      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (error) {
      console.error("Aşk ölçer hatası:", error);
      await interaction.editReply({ content: `Aşk ölçülürken bir hata oluştu! Hata: ${error.message}` });
    }
  }
};


function drawHeart(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  
  
  ctx.beginPath();
  ctx.moveTo(0, size / 4);
  ctx.bezierCurveTo(size / 4, -size / 4, size, 0, 0, size);
  ctx.bezierCurveTo(-size, 0, -size / 4, -size / 4, 0, size / 4);
  ctx.fill();
  
  ctx.restore();
}


function drawArrow(ctx, fromX, fromY, toX, toY, color) {
  const headLen = 20;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  
  
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.stroke();
  
  
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(toX, toY);
  ctx.fillStyle = color;
  ctx.fill();
}