// @flow
import bodyParser from 'body-parser';
import express from 'express';
import env from 'node-env-file';
import request from 'request';

import Linkify from 'commands/linkify';
import Search from 'commands/search';
import setupHttps from 'setup-https';

env(`.env`);
const clientId = process.env.SLACK_ID;
const clientSecret = process.env.SLACK_SECRET;

const SEARCH_COMMAND = "/go";
const LINK_COMMAND = "/linkify";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'production') {
  setupHttps(app);
} else {
  const port=4390;
  app.listen(port, function () {
    console.log("Listening on port " + port);
  });
}

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
    case LINK_COMMAND:
      result = await new Linkify(req.body).getResponse();
      break;
    default:
      res.send(`Watchoo talkin bout, Willis?`);
      return;
  }
  res.json(result);
});
