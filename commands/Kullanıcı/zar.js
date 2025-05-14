const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType, AttachmentBuilder } = require("discord.js");
const Canvas = require("canvas");

module.exports = {
  name: "zar",
  description: "Zarı at ve şansını dene!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 3,
  options: [
    {
      name: "zar-sayısı",
      description: "Atmak istediğin zar sayısı (1-5)",
      type: ApplicationCommandOptionType.Integer,
      required: false,
      minValue: 1,
      maxValue: 5
    }
  ],
  
  run: async(client, interaction) => {
    await interaction.deferReply();
    
    
    const zarSayısı = interaction.options.getInteger("zar-sayısı") || 1;
    
    try {
      
      const canvas = Canvas.createCanvas(200 * zarSayısı, 220);
      const ctx = canvas.getContext("2d");
      
      
      ctx.fillStyle = "#2f3136"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      
      const zarlar = [];
      let toplam = 0;
      
      for (let i = 0; i < zarSayısı; i++) {
        
        const zarDeğeri = Math.floor(Math.random() * 6) + 1;
        zarlar.push(zarDeğeri);
        toplam += zarDeğeri;
        
        
        const x = i * 200 + 20;
        const y = 20;
        const size = 160;
        
        
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 20);
        ctx.fill();
        
        
        ctx.fillStyle = "#333333";
        
        
        drawDots(ctx, zarDeğeri, x, y, size);
      }
      
      
      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'zarlar.png' });
      
      
      let şansMesajı = "";
      
      if (zarSayısı === 1) {
        if (zarlar[0] === 6) {
          şansMesajı = "🍀 Harika bir atış! Bugün şanslı günündesin!";
        } else if (zarlar[0] === 1) {
          şansMesajı = "😬 Pek şanslı görünmüyorsun... Tekrar dene!";
        }
      } else if (zarSayısı > 1) {
        
        const hepsiAynı = zarlar.every(zar => zar === zarlar[0]);
        
        if (hepsiAynı && zarlar[0] === 6) {
          şansMesajı = "🎉 İNANILMAZ! Hepsi 6! Şans tanrıları seni koruyor!";
        } else if (hepsiAynı) {
          şansMesajı = `🎯 ETKİLEYİCİ! Hepsi ${zarlar[0]} geldi! Bu çok nadir bir durum!`;
        } else if (toplam === zarSayısı) {
          şansMesajı = "😅 Tüm zarlar 1 geldi... Bugün biraz dikkatli ol!";
        } else if (toplam >= zarSayısı * 5) {
          şansMesajı = "🌟 Yüksek bir toplam! Şansın bugün seninle!";
        }
      }
      
      
      const embed = new EmbedBuilder()
        .setColor("#4CAF50")
        .setTitle(`🎲 Zar At - ${interaction.user.username}`)
        .setDescription(`${zarSayısı} zar attın!\n**Toplam:** ${toplam}${şansMesajı ? `\n\n${şansMesajı}` : ""}`)
        .setImage('attachment://zarlar.png')
        .setFooter({ text: client.config.footer })
        .setTimestamp();
      
      
      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (error) {
      console.error("Zar atma hatası:", error);
      await interaction.editReply({ content: `Zar atılırken bir hata oluştu! Hata: ${error.message}` });
    }
  }
};


function drawDots(ctx, value, x, y, size) {
  const dotSize = size / 10;
  const space = size / 4;
  
  
  const center = {
    x: x + size / 2,
    y: y + size / 2
  };
  
  
  if (value === 1 || value === 3 || value === 5) {
    drawDot(ctx, center.x, center.y, dotSize);
  }
  
  
  if (value >= 2) {
    drawDot(ctx, x + space, y + space, dotSize);
    drawDot(ctx, x + size - space, y + size - space, dotSize);
  }
  
  
  if (value >= 4) {
    drawDot(ctx, x + size - space, y + space, dotSize);
    drawDot(ctx, x + space, y + size - space, dotSize);
  }
  
  
  if (value === 6) {
    drawDot(ctx, x + space, center.y, dotSize);
    drawDot(ctx, x + size - space, center.y, dotSize);
  }
}


function drawDot(ctx, x, y, size) {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}