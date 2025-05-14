const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord.js");


function loadCommands(client) {
  
  client.commandIds = new Map(); 

  const commandFolders = fs.readdirSync("./commands");
  
  for (const folder of commandFolders) {
    const commandFiles = fs
      .readdirSync(`./commands/${folder}`)
      .filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
      const commandModule = require(`../commands/${folder}/${file}`);
      
      
      if (Array.isArray(commandModule)) {
        commandModule.forEach(command => {
          if (command.name) {
            client.commands.set(command.name, command);
            console.log(`✅ | Komut yüklendi: ${command.name} (from array in ${file})`);
          } else {
            console.log(`❌ | Komut yüklenemedi: Array item in ${file}, isim özelliği yok.`);
          }
        });
      } 
      
      else if (commandModule.name) {
        client.commands.set(commandModule.name, commandModule);
        console.log(`✅ | Komut yüklendi: ${commandModule.name}`);
      } else {
        console.log(`❌ | Komut yüklenemedi: ${file}, isim özelliği yok.`);
      }
    }
  }

  
  client.once("ready", async () => {
    try {
      const commands = [];
      client.commands.forEach(command => {
        commands.push({
          name: command.name,
          description: command.description || "Açıklama yok", 
          options: command.options || [],
          type: command.type || 1, 
        });
      });

      const rest = new REST({ version: "10" }).setToken(client.config.token);

      console.log("🔄 | Slash komutları yükleniyor...");

      
      const registeredCommands = await rest.put(
        Routes.applicationCommands(client.config.clientId),
        { body: commands }
      );

      
      registeredCommands.forEach(cmd => {
        client.commandIds.set(cmd.name, cmd.id);
      });

      console.log("✅ | Slash komutları başarıyla yüklendi ve ID’ler saklandı!");
    } catch (error) {
      console.error("❌ | Slash komutları yüklenirken bir hata oluştu:", error);
    }
  });
}

module.exports = { loadCommands }; 