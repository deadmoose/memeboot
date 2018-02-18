// @flow
import Botkit from 'botkit';
import _ from 'lodash';
import env from 'node-env-file';

import Linkify from 'commands/Linkify';
import Memify from 'commands/Memify';
import Util from 'commands/Util';

env(`.env`);

// Schema of RTM:
// {
//   "type":"direct_message",
//   "channel":"D8BPR6V28",
//   "user":"U72SYPFSR",
//   "text":"things are l/ooking up",
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
    });

    var bot = this.botkit.spawn({
      token: process.env.SLACKBOT_TOKEN,
    }).startRTM((err) => {
      if (err) {
        console.log(err);
      }
    });

    this.botkit.on('ambient', (bot, message) => {
      this.ambient(bot, message);
    });
    this.botkit.on('direct_message', (bot, message) => {
      this.direct_message(bot, message)
    });
    this.botkit.on('file_share', (bot, message) => {
      this.file_share(bot, message);
    });
  }

  async ambient(bot: Object, message: Object) {
    console.log(JSON.stringify(message));
    let links = [];
    if (message.attachments) {
      _.forEach(message.attachments, async (attachment) => {
        links = links.concat(await Linkify.mention(attachment.fallback));
      });
    }
    links = links.concat(await Linkify.mention(message.text));
    bot.reply(message, links.join('\n'));
  }

  async direct_message(bot: Object, message: Object) {
    console.log(JSON.stringify(message));
    const memify = await Memify.create(message);
    bot.reply(message, await memify.handleMessage());
  }

  async file_share(bot: Object, message: Object) {
    if (!message.channel.startsWith('D')) {
      // Not a direct message.
      return;
    }

    const url = message.file.url_private;
    if (!this.isImage(url)) {
      bot.reply(message, `I don't know how to memify a ${Util.getExtension(url)} file`);
      return;
    }
    const memify = await Memify.create(message);
    bot.reply(message, await memify.uploadFile(url));
  }

  isImage(filename: string) {
    filename = filename.toLowerCase();
    return _.includes(['gif', 'jpg', 'jpeg', 'png'], Util.getExtension(filename));
  }

};

export default Bot;
