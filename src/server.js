// @flow
import assert from 'assert';
import bodyParser from 'body-parser';
import Botkit from 'botkit';
import express from 'express';
import env from 'node-env-file';
import request from 'request';

import Linkify from 'commands/linkify';
import Search from 'commands/search';

env(`.env`);
const clientId = process.env.SLACK_ID;
const clientSecret = process.env.SLACK_SECRET;

const SEARCH_COMMAND = "/go";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port=4390;
app.listen(port, function () {
  console.log("Listening on port " + port);
});

const botkit = Botkit.slackbot({ clientId, clientSecret });
var bot = botkit.spawn({
  token: process.env.SLACKBOT_TOKEN,
}).startRTM((err) => {
  if (err) {
    console.log(err);
  }
});
botkit.on('ambient', async function(bot, message) {
  const text = message.text;
  const linkifyRegex = /\bl\/([-0-9A-Za-z]+)/g;
  const links = [];
  let current = linkifyRegex.exec(text);
  while (current) {
    const alias = current[1];
    const url = await Linkify.mention(alias);
    if (url) {
      links.push(`${alias} -> ${url}`);
    } else {
      links.push(`Alias ${alias} not found.`);
    }
    current = linkifyRegex.exec(text);
  }

  bot.reply(message, links.join('\n'));
});

app.get('/', function(req, res) {
  res.send('Ngrok is working! Path Hit: ' + req.url);
});

app.get('/oauth', function(req, res) {
  if (!req.query.code) {
    res.status(500);
    res.send({"Error": "Looks like we're not getting code."});
    console.log("Looks like we're not getting code.");
  } else {
    request({
      url: 'https://slack.com/api/oauth.access', //URL to hit
      qs: {code: req.query.code, client_id: clientId, client_secret: clientSecret}, //Query string data
      method: 'GET', //Specify the method
    }, function (error, response, body) {
      if (error) {
        console.log(error);
      } else {
        res.json(body);
      }
    })
  }
});

app.post('/command', async function(req, res) {
  const command = req.body.command;
  const text = req.body.text;
  console.log(JSON.stringify(req.body));
  let result = {};
  switch (command) {
    case SEARCH_COMMAND:
      const search = new Search(text);
      result = await search.getAttachments();
      break;
    case Linkify.COMMAND:
      result = await new Linkify(req.body).getResponse();
      break;
    default:
      res.send(`Watchoo talkin bout, Willis?`);
      return;
  }
  res.json(result);
});
