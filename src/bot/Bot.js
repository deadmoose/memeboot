// @flow
import Botkit from 'botkit';
import env from 'node-env-file';

import Linkify from 'commands/linkify';
import Memify from 'commands/Memify';

env(`.env`);

// Schema of RTM:
// {
//   "type":"direct_message",
//   "channel":"D8BPR6V28",
//   "user":"U72SYPFSR",
//   "text":"thing are l/ooking up",
//   "ts":"1513533005.000018",
//   "source_team":"T70GX9U4U",
//   "team":"T70GX9U4U",
//   "_pipeline":{"stage":"receive"}
// }
class Bot {
  botkit: Botkit;

  constructor() {
    this.botkit = Botkit.slackbot({
      clientId: process.env.SLACK_ID,
      clientSecret: process.env.SLACK_SECRET,
      debug: true,
    });

    var bot = this.botkit.spawn({
      token: process.env.SLACKBOT_TOKEN,
    }).startRTM((err) => {
      if (err) {
        console.log(err);
      }
    });

    this.botkit.on('ambient', this.ambient);
    this.botkit.on('direct_message', this.direct_message);
    this.botkit.on('file_share', this.file_share);
  }

  async ambient(bot: Object, message: Object) {
    console.log(JSON.stringify(message));
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
  }

  async direct_message(bot: Object, message: Object) {
    console.log(JSON.stringify(message));
    const memify = await Memify.create(message);
    bot.reply(message, await memify.handleMessage());
  }

  async file_share(bot: Object, message: Object) {
    console.log(JSON.stringify(message));
    const memify = await Memify.create(message);
    bot.reply(message, await memify.uploadFile(message.file.url_private));
  }

};

export default Bot;
