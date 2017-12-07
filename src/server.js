// @flow
import bodyParser from 'body-parser';
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

function validateSubcommand(res, text) {
  const parts = text.split(' ');
  if (parts.length == 0) {
    // This doesn't seem to ever happen, but just in case.
    res.json({ text: 'Couldn\'t find a subcommand, try checking the help.' });
    return false;
  }
  const subcommand = parts[0];
  const invalidChars = /[^-0-9A-Za-z]/;
  const result = invalidChars.exec(subcommand);
  if (result && result.length > 0) {
    res.json({
      text: `I only know how to handle letters, numbers, and dashes (found "${result[0]}").`
    });
    return false;
  }
  return true;
}

app.post('/command', async function(req, res) {
  const command = req.body.command;
  const text = req.body.text;
  console.log(JSON.stringify(req.body));

  if (!validateSubcommand(res, text)) {
    return;
  }

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
