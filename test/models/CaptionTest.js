import { assert } from 'chai';

import Caption from 'models/Caption';

describe('Caption', function() {
  describe('#parse()', function() {
    it('should return one caption for plain string', function () {
      const captions = Caption.parse('all the things');
      assert.lengthOf(captions, 1);
      assert.equal(captions[0].get('text'), "ALL THE THINGS");
    });
    it('should return the caption without quotes', function () {
      const captions = Caption.parse('"all the things"');
      assert.lengthOf(captions, 1);
      assert.equal(captions[0].get('text'), "ALL THE THINGS");
    });
  });
});