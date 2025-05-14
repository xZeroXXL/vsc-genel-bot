
const { ActivityType } = require("discord.js");
const figlet = require("figlet");
const chalk = require("chalk");
const gradient = require("gradient-string");

module.exports = {
  name: "ready",
  once: true,
  execute(client) {

    console.log('\n\n');
    
    const botName = client.user.username.toUpperCase();
    figlet(botName, {
      font: 'ANSI Shadow',
      horizontalLayout: 'fitted'
    }, function(err, data) {
      if (err) {
        console.log(chalk.red('ASCII başlık oluşturulamadı!'));
        return;
      }

      
      console.log(gradient.pastel.multiline(data));
      
      client.user.setPresence({
        activities: [{ name: `youtube.com/@WraithsDev`, type: ActivityType.Watching }],
        status: 'idle',
      });
      
      console.log(`🎮 | ${client.user.username} başarıyla giriş yaptı!`);
    });
  },
};

