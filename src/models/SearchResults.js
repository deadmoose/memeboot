// @flow
import GoogleImages from 'google-images';

import orm from 'models/db';

const SearchResults = orm.Model.extend({
  tableName: 'search_results',

  getAttachment: function () {
    const image = this.get('images')[this.get('index')];
    return {
      attachments: [
        {
          title: 'Here\'s what I found',
          image_url: image.url,
          thumb_url: image.thumbnail.url,
        },
      ],
    };
  },

  hasNext: function () {
    return this.get('images') && this.get('index') < this.get('images').length;
  },

  next: async function () {
    let index = this.get('index');
    await this.set({ index: index + 1 }).save();
  },
}, {
  CLIENT: new GoogleImages(process.env.GOOGLE_CUSTOM_ENGINE_ID, process.env.GOOGLE_API_KEY),

  search: (query, memeId) => {
    return SearchResults.CLIENT.search(query, { size: 'medium' }).then(images => {
      if (images.length == 0) {
        return SearchResults.forge();
      }
      return SearchResults.forge({
        meme_id: memeId,
        images: JSON.stringify(images),
        index: 0,
        query,
      }).save();
    }).catch(err => ({ text: err }));
  },
});

export default SearchResults;
