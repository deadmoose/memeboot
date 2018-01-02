// @flow
import env from 'node-env-file';
import fs from 'fs';
import hash from 'object-hash';
import request from 'request-promise';
import path from 'path';
import uuidv4 from 'uuid';
import winston from 'winston';

import CaptionedImage from 'commands/CaptionedImage';
import Util from 'commands/Util';
import Caption from 'models/Caption';
import Config from 'config';
import Meme from 'models/Meme';
import SearchResults from 'models/SearchResults';

env('.env');

const Phase = {
  QUERY: 0,
  SEARCH_RESULTS: 1,
  CHOOSE_IMAGE: 2,
  CAPTION: 3,
  DONE: 4,
};

class Memify {
  meme: Meme;
  message: Object;

  static async create(message: Object) {
    const memify = new Memify(message);
    memify.meme = await memify.getMeme();
    return memify;
  }

  constructor(message: Object) {
    this.message = message;
  }

  async getMeme() {
    let meme = await Meme.forge({ user: this.message.user, team: this.message.team })
      .orderBy('updated_at', 'DESC').fetch();
    if (meme) {
      if (meme.get('phase') === Phase.DONE && this.message.text.startsWith('search "')) {
        meme = null;
      }
    }

    if (!meme) {
      meme = await Meme.forge({
        user: this.message.user,
        team: this.message.team,
        phase: Phase.QUERY
      }).save();
    }
    return meme;
  }

  async uploadFile(url: string) {
    const data = await request({
      uri: url,
      headers: { Authorization: `Bearer ${Config.SLACK_TOKEN}`
    }, encoding: null });
    const filename = `static/templates/${this.message.team}/${this.message.user}/${hash(data)}${path.extname(url)}`;
    return this.writeTemplate(url, filename, data);
  }

  async handleMessage() {
    let phase = this.meme.get('phase');
    winston.info(`phase ${phase}: ${this.message.text}`);
    switch (phase) {
      case Phase.QUERY:
        return this.newSearch();
      case Phase.SEARCH_RESULTS:
        const text = this.message.text.trim();
        if (text === 'next' || text === 'previous') {
          return this.nav(text);
        }
        // Otherwise, fallthrough.
      case Phase.CHOOSE_IMAGE:
        await this.downloadImage();
        // Fallthrough.
      case Phase.DONE:
      case Phase.CAPTION:
        return this.caption();
    }
  }

  async newSearch() {
    let query = this.message.text;
    if (query.startsWith('search "')) {
      query = query.substring('search "'.length, query.lastIndexOf('"'));
    }
    const results = await SearchResults.search(query, this.meme.get('id'));
    if (!results.hasNext()) {
      return { text: "No images found" };
    }
    this.meme.save({ phase: Phase.SEARCH_RESULTS });
    return results.getAttachment();
  }

  async nav(direction: string) {
    if (direction !== 'next' && direction !== 'previous') {
      return { text: 'I don\'t recognize that, type \'next\' or \'previous\' to navigate results, or \'search "query"\' for a new search.' };
    }
    const results = await SearchResults.latest(this.meme.get('id'));
    if (direction === 'next' && results.hasNext()) {
      results.next();
      winston.info(`getting attachment ${results.get('index')}`);
      return results.getAttachment();
    } else if (direction === 'previous' && results.hasPrevious()) {
      results.preivous();
      return results.getAttachment();
    }
    await this.meme.save({ phase: Phase.QUERY });
    return { text: 'That\'s all I found! Try another search?' };
  }

  async downloadImage() {
    const results = await SearchResults.latest(this.meme.get('id'));
    const image = results.get('images')[results.get('index')];
    const url = image.url;
    const data = await request(url, { encoding: null });
    const filename = `static/templates/cas/${hash(data)}${path.extname(url)}`;
    return { text: await this.writeTemplate(url, filename, data) };
  }

  async writeTemplate(url: string, filename: string, data: string) {
    Util.mkdirRecursive(filename);
    if (fs.existsSync(filename)) {
      winston.info(`Using cached copy of ${url}: ${filename}`);
    } else {
      winston.info(`saving ${url} as ${filename}`);
      fs.writeFileSync(filename, data, { encoding: null });
    }
    await this.meme.save({ template: filename });
    return 'Type "your caption" to add a caption.';
  }

  async caption() {
    winston.info(`captioning`);
    const captions = Caption.parse(this.message.text);
    for (const caption of captions) {
      caption.save({ meme_id: this.meme.get('id') });
    }
    const template = this.meme.get('template');
    const filename = `static/memes/${this.message.team}/${this.message.user}/${hash({ template, captions })}${path.extname(template)}`;
    const image = await new CaptionedImage(template, captions, filename).getObject();
    await this.meme.save({ image: filename, phase: Phase.DONE });
    return {
      attachments: [
        {
          title: `Tada! ${image.url}`,
          text: 'To recaption type `"your new caption". To start a new search, type \'search "your query terms"\'.',
          image_url: image.url,
        },
      ],
    };
  }
}

export default Memify;
