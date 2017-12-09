// @flow
import GoogleImages from 'google-images';
import env from 'node-env-file';

env(`.env`);

class Memify {
  static COMMAND: string;
  static CLIENT: GoogleImages;
  _text: string;

  constructor(text: string) {
    this._text = text;
  }

  getAttachments() {
    const query = this._text;
    return Memify.CLIENT.search(query, { size: 'medium' }).then(images => {
      if (images.length == 0) {
        return { text: "No images found" };
      }
      const image = images[0];
      return {
        attachments: [
          {
            title: `Here's what I found for "${query}":`,
            image_url: image.url,
            thumb_url: image.thumbnail.url,
          },
        ],
      };
    }).catch(err => err);
  }
}

Memify.COMMAND = 'meme';
Memify.CLIENT = new GoogleImages(process.env.GOOGLE_CUSTOM_ENGINE_ID, process.env.GOOGLE_API_KEY);

export default Memify;
