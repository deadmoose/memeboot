// @flow
import GoogleImages from 'google-images';

import orm from 'models/db';

const SearchResults = orm.Model.extend({
  tableName: 'search_result',
  hasTimestamps: true,

  getAttachment: function () {
    const index = this.get('index');
    const image = this.get('images')[index];
    let text = '';
    if (this.hasNext() && this.hasPrevious()) {
      text = 'Type \'next\' or \'previous\' for more results, or \'search "new query"\' for a new search.';
    } else if (this.hasNext()) {
      text = 'Type \'next\' for the next result.';
    } else if (this.hasPrevious()) {
      text = 'Type \'previous\' for the previous result.';
    }
    return {
      attachments: [
        {
          title: `Results for "${this.get('query')}":`,
          text,
          image_url: image.url,
          thumb_url: image.thumbnail.url,
        },
      ],
    };
  },

  hasNext: function () {
    return this.get('images') && this.get('index') < this.get('images').length;
  },

  hasPrevious: function () {
    return this.get('index') > 0;
  },

  next: async function () {
    // 'images' isn't a string so we can't resave it.
    const index = this.get('index') + 1;
    await this.save({ index }, { patch: true });
  },

  previous: async function () {
    // 'images' isn't a string so we can't resave it.
    const index = this.get('index') - 1;
    await this.save({ index }, { patch: true });
  },
}, {
  CLIENT: new GoogleImages(process.env.GOOGLE_CUSTOM_ENGINE_ID, process.env.GOOGLE_API_KEY),

  latest: (memeId) => {
    return SearchResults.forge({ meme_id: memeId })
      .orderBy('updated_at', 'DESC')
      .fetch({ require: true });
  },

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
      }).save()
        .then(model => SearchResults.forge({ id: model.get('id') }).fetch({ require: true }));
    }).catch(err => ({ text: err }));
  },
});

export default SearchResults;
