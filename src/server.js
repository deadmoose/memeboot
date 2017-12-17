// @flow
import assert from 'assert';
import bodyParser from 'body-parser';
import express from 'express';
import session from 'express-session';
import env from 'node-env-file';
import request from 'request';

import Linkify from 'commands/linkify';
import Bot from 'bot/Bot';

env(`.env`);
const clientId = process.env.SLACK_ID;
const clientSecret = process.env.SLACK_SECRET;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true },
}));

const bot = new Bot();

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

app.post('/command', async function(req, res) {
  const text = req.body.text;
  const command = text.split(' ')[0];
  console.log(JSON.stringify(req.body));
  let result = await new Linkify(req.body).getResponse();
  res.json(result);
});
