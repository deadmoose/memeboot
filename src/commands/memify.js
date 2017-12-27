// @flow
import env from 'node-env-file';
import fs from 'fs';
import hash from 'object-hash';
import request from 'request-promise';
import path from 'path';
import uuidv4 from 'uuid';

import CaptionedImage from 'commands/CaptionedImage';
import Caption from 'models/Caption';
import Meme from 'models/Meme';
import SearchResults from 'models/SearchResults';

env(`.env`);

const Phase = {
  QUERY: 0,
  SEARCH_RESULTS: 1,
  CHOOSE_IMAGE: 2,
  CAPTION: 3,
  DONE: 4,
};

class Memify {
  promise: Promise<Meme>;
  meme: Meme;
  message: Object;

  constructor(message: Object) {
    this.message = message;
    this.meme = Meme.forge({ user: message.user, team: message.team })
    this.promise = this.meme.orderBy('updated_at', 'DESC').fetch();
  }

  async doThing() {
    let meme = await this.promise;
    if (meme) {
      this.meme = meme;
    } else {
      // Generate an id.
      this.meme = await this.meme.save();
    }
    let phase = this.meme.get('phase');
    if (!phase || this.message.text.startsWith('search "')) {
      // New query.
      phase = Phase.QUERY;
      this.meme = await Meme.forge({ user: this.message.user, team: this.message.team }).save();
    }
    switch (phase) {
      case Phase.QUERY:
        return this.searchForImages();
      case Phase.SEARCH_RESULTS:
        const text = this.message.text;
        if (text.trim() === 'next') {
          return this.next();
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

  searchForImages() {
    const query = this.message.text;
    const results = SearchResults.search(query, this.meme.id);
    if (!results.hasNext()) {
      return { text: "No images found" };
    }
    this.meme.save({ phase: Phase.SEARCH_RESULTS });
    return results.getAttachment();
  }

  async next() {
    const results = await SearchResults.forge({ meme_id: this.meme.id }).fetch({ require: true });
    if (results.hasNext()) {
      results.next();
      return results.getAttachment();
    }
    await this.meme.save({ phase: Phase.QUERY });
    return { text: 'That\'s all I found! Try another search?' };
  }

  async downloadImage() {
    const results = await SearchResults.forge({ meme_id: this.meme.id }).fetch({ require: true });
    const image = results.get('images')[results.get('index')];
    const url = image['url'];
    const data = await request(url, { encoding: null });
    const filename = `static/templates/cas/${hash(data)}${path.extname(url)}`;
    fs.writeFileSync(filename, data, { encoding: null });
    await this.meme.save({ template: filename });
  }

  async caption() {
    const captions = Caption.parse(this.message.text);
    for (const caption of captions) {
      caption.save({ meme_id: this.meme.id });
    }
    const template = this.meme.get('template');
    const filename = `static/memes/${this.message.team}/${this.message.user}/${hash({ template, captions })}${path.extname(template)}`;
    const image = await new CaptionedImage(template, captions, filename).getObject();
    await this.meme.save({ image: filename, phase: Phase.DONE });
    return {
      attachments: [
        {
          title: 'Tada! To recaption use `"your new caption". To start a new search, use \'search "your query terms"\'.',
          image_url: image.url,
        },
      ],
    };
  }
}

export default Memify;
