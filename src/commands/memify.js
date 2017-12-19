// @flow
import GoogleImages from 'google-images';
import env from 'node-env-file';
import fs from 'fs';
import hash from 'object-hash';
import request from 'request-promise';
import path from 'path';
import uuidv4 from 'uuid';

import Caption from 'models/Caption';
import Meme from 'models/Meme';
import SearchResults from 'models/SearchResults';

env(`.env`);

const Phase = {
  QUERY: 0,
  SEARCH_RESULTS: 1,
  CHOOSE_IMAGE: 2,
  CAPTION: 3,
};

class Memify {
  static CLIENT: GoogleImages;
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
    phase = phase ? phase : Phase.QUERY;
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
      case Phase.CAPTION:
        return this.caption();
    }
  }

  searchForImages() {
    const query = this.message.text;
    return Memify.CLIENT.search(query, { size: 'medium' }).then(images => {
      if (images.length == 0) {
        return { text: "No images found" };
      }
      SearchResults.forge({
        meme_id: this.meme.id,
        images: JSON.stringify(images),
        index: 0,
      }).save();
      this.meme.save({ phase: Phase.SEARCH_RESULTS });
      return this.getAttachment(images[0]);
    }).catch(err => ({ text: err }));
  }

  getAttachment(image: Object) {
    return {
      attachments: [
        {
          title: 'Here\'s what I found', // TODO: make configurable.
          image_url: image.url,
          thumb_url: image.thumbnail.url,
        },
      ],
    };
  }

  async next() {
    const results = await SearchResults.forge({ meme_id: this.meme.id }).fetch({ require: true });
    let index = results.get('index');
    index++;
    const images = results.get('images');
    if (index >= images.length) {
      await this.meme.save({ phase: Phase.QUERY });
      return { text: 'That\'s all I found! Try another search?' };
    }
    await results.save({ index });
    return this.getAttachment(images[index]);
  }

  async downloadImage() {
    const results = await SearchResults.forge({ meme_id: this.meme.id }).fetch({ require: true });
    const image = results.get('images')[results.get('index')];
    const url = image['url'];
    const data = await request(url, { encoding: null });
    const filename = `cas/${hash(data)}${path.extname(url)}`;
    fs.writeFileSync(filename, data, { encoding: null });
    await this.meme.save({ template: filename });
  }

  async caption() {
    const captions = Caption.parse(this.message.text);
    for (const caption of captions) {
      caption.save({ meme_id: this.meme.id });
    }
    const image = this.convertImage();
    await this.meme.save({ image: image.filename });
    return this.getAttachment(image);
  }

  convertImage() {
    return {filename: 'todo', url: 'http://todo', thumbnail: {url: 'todo'}};
  }
}

Memify.CLIENT = new GoogleImages(process.env.GOOGLE_CUSTOM_ENGINE_ID, process.env.GOOGLE_API_KEY);

export default Memify;
