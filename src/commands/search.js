import GoogleImages from 'google-images';

class Search {
  constructor(text) {
    this.client = new GoogleImages(process.env.GOOGLE_CUSTOM_ENGINE_ID, process.env.GOOGLE_API_KEY);
    this._text = text;
  }

  getAttachments() {
    const query = this._text;
    return this.client.search(query, { size: 'medium' }).then(images => {
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

export default Search;
