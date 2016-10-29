var request = require('request');
require('dotenv').load();
var TelegramBot = require('node-telegram-bot-api');
console.log(process.env.DATA_KEY);

const DATA_KEY = process.env.DATA_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;

var text = '';
var users = [];
var thing = {id:"", name:"", alert:""}; //0  for not subscribed, 1 for all the time, 
var prev_time = '';

console.log('Starting...');

//options for psi request
const psi_options = {
  method: 'GET',
  uri:'https://api.data.gov.sg/v1/environment/psi',
  headers: {
    'api-key': DATA_KEY
  }
}
//callback for psi request
function psi_callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    var info = JSON.parse(body);
    if (prev_time != info.items[0].update_timestamp){//only update text if there's a new update
      prev_time = info.items[0].update_timestamp;
      var readings = (info.items[0].readings.psi_three_hourly);
      text = '\n\nCurrent 3 Hour PSI Readings:\n'
        + '\nNational: ' + readings.national
        + '\nNorth: ' + readings.north
        + '\nSouth: ' + readings.south
        + '\nEast: ' + readings.east
        + '\nWest: ' + readings.west;
        request(pm25_options, pm25_callback);
    }
  }
}
//options for pm2.5 request
const pm25_options = {
  method: 'GET',
  uri:'https://api.data.gov.sg/v1/environment/pm25',
  headers: {
    'api-key': DATA_KEY
  }
}
//callback for pm2.5 request
function pm25_callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    var info = JSON.parse(body);
      var readings = (info.items[0].readings.pm25_one_hourly);
      var rawTime = info.items[0].update_timestamp;
      text = text + '\n\nCurrent 1 Hour PM2.5 Readings:\n'
        + '\nNorth: ' + readings.north
        + '\nSouth: ' + readings.south
        + '\nEast: ' + readings.east
        + '\nWest: ' + readings.west
        + '\n\n' + 'Updated '
        + rawTime.substring(0, rawTime.indexOf('T')) + ' '
        + rawTime.substring(rawTime.indexOf('T')+1, rawTime.indexOf('+'));
        console.log('New data obtained');
  }
}

request(psi_options, psi_callback); //initial data grab

//bot things
var bot = new TelegramBot(BOT_TOKEN, {polling: true});

console.log('Bot started');

bot.onText(/\/start/, function (msg, match){
  bot.sendMessage(msg.chat.id, 'Hi! I\'m HazeBot, /update to get the latest data!');
  if (findUser(msg.chat.id)) {
    users[users.length].id = msg.chat.id;
  }
  for (var i = 0; i < users.length; i++) {
    console.log(i + ':' + users[i].name);
  }
});

bot.onText(/\/update/, function(msg) {
  bot.sendMessage(msg.chat.id, text);
  console.log("message was sent");
})

// bot.onText(/\/subscribe/, function (msg) {
//   var u = findUser(msg.chat.id);
//   if (u != -1) {
//     users[i].alert = true;
//     bot.sendMessage(msg.chat.id, "Subscribed");
//   }
// })

// bot.onText(/\/unsubscribe/, function (msg) {
//   var u = findUser(msg.chat.id);
//   if (u != -1) {
//     users[i].alert = false;
//     bot.sendMessage(msg.chat.id, "Unsubscribed");
//   }
// })

function findUser(id) {
  var user = -1;
  for(var i = 0; i < users.length; i++){
    if (id == users[i].id) {
      user = i;
      break;
    }
  }
  return user;
}

setInterval(function() {request(psi_options, psi_callback)}, 30000);