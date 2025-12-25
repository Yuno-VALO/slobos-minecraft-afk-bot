const mineflayer = require('mineflayer');
const settings = require('./settings.json');

// Slobos plugins
const autoeat = require('mineflayer-auto-eat').plugin;
const armorManager = require('mineflayer-armor-manager');
const pvp = require('mineflayer-pvp').plugin;

let bot;

function startBot() {
  bot = mineflayer.createBot({
    host: settings.server.ip,
    port: settings.server.port,
    username: settings['bot-account'].username,
    version: settings.server.version
  });

  // load plugins
  bot.loadPlugin(autoeat);
  bot.loadPlugin(armorManager);
  bot.loadPlugin(pvp);

  bot.once('spawn', () => {
    console.log('Bot spawned and joined server');

    // auto-eat events
    bot.on('autoeat_started', () => {
      console.log('Auto Eat started!');
    });

    bot.on('autoeat_stopped', () => {
      console.log('Auto Eat stopped!');
    });

    bot.autoEat.options = {
      priority: 'foodPoints',
      startAt: 14,
      bannedFood: []
    };

    // anti-AFK loop (simple movement + rotation)
    setInterval(() => {
      if (!bot.entity || !bot.entity.position) return;

      bot.setControlState('jump', true);
      setTimeout(() => {
        bot.setControlState('jump', false);
      }, 300);

      bot.look(bot.entity.yaw + 0.5, 0, true);

      bot.setControlState('forward', true);
      setTimeout(() => {
        bot.setControlState('forward', false);
      }, 500);
    }, 10000); // every 10 seconds

    // log chat
    bot.on('chat', (username, message) => {
      if (username === bot.username) return;
      console.log(`<${username}> ${message}`);
    });
  });

  bot.on('kicked', (reason) => {
    console.log('Bot kicked:', reason);
  });

  bot.on('error', (err) => {
    console.log('Bot error:', err.code, err.message);
    if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
      console.log('Connection reset/broken, restarting in 10s');
      safeRestart();
    }
  });

  bot.on('end', () => {
    console.log('Bot ended, restarting in 10s');
    safeRestart();
  });
}

function safeRestart() {
  try {
    if (bot) bot.end();
  } catch (e) {}
  setTimeout(startBot, 10000);
}

// start first instance
startBot();
