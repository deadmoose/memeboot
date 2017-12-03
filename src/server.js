// @flow
import express from 'express';
import request from 'request';
import bodyParser from 'body-parser';

const clientId = process.env.SLACK_ID;
const clientSecret = process.env.SLACK_SECRET;
const SEARCH_COMMAND = "search";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT=4390;

app.listen(PORT, function () {
  if (!clientId || !clientSecret) {
    console.log("SLACK_ID and SLACK_SECRET must be set.");
    process.exit();
  }
  console.log("Example app listening on port " + PORT);
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

app.post('/command', function(req, res) {
  console.log(`x: ${JSON.stringify(req.body)}`);
  const command = req.body.command;
  const text = req.body.text;
  if (command == SEARCH_COMMAND) {

  } else {
    console.log(`Unrecognized command: ${command} ${text}`);
  }
  res.send('Your ngrok tunnel is up and running!');
});
