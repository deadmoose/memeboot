import { assert } from 'chai';
import mockKnex from 'mock-knex';

import SearchResults from 'models/SearchResults';

describe('SearchResults', function() {
  describe('#search()', function() {
    it('should return one caption for plain string', async function () {
      // Fake knex.
      const tracker = mockKnex.getTracker();
      tracker.install();
      tracker.on('query', (query) => {
        query.response([456]);
      });
      // Fake Google Search client.
      const searchResults = [
        { url: 'https://example.com/foo.png', thumbnail: { url: 'https://example.com/thumb.png' } }
      ];
      SearchResults.CLIENT = {
        search: () => {
          return Promise.resolve(searchResults);
        }
      };
      const results = await SearchResults.search('all the things', 123);
      // TODO: figure out how to make the mocker handle this correctly.
      results.set({ images: searchResults });
      assert.isTrue(results.hasNext());
      const current = results.getAttachment();
      assert.equal(current.attachments[0].image_url, 'https://example.com/foo.png');
      results.next();
      assert.isFalse(results.hasNext());
    });
  });
});
