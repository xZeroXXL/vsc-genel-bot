const fs = require("fs");


function loadEvents(client) {
  const eventFolders = fs.readdirSync("./events");
  
  for (const folder of eventFolders) {
    const eventFiles = fs
      .readdirSync(`./events/${folder}`)
      .filter(file => file.endsWith(".js"));

    for (const file of eventFiles) {
      const event = require(`../events/${folder}/${file}`);
      
      if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args));
      } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
      }
      
      console.log(`📋 | Olay yüklendi: ${event.name}`);
    }
  }
}

module.exports = { loadEvents };