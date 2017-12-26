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
    it('should return multiple captions', function () {
      const captions = Caption.parse('"clean" "all the things"');
      assert.lengthOf(captions, 2);
      assert.equal(captions[0].get('text'), "CLEAN");
      assert.equal(captions[1].get('text'), "ALL THE THINGS");
    });
    it('should collect options', function () {
      const captions = Caption.parse('"clean" -gravity south "all the things" -gravity north');
      assert.lengthOf(captions, 2);
      assert.equal(captions[0].get('text'), "CLEAN");
      assert.deepEqual(captions[0].get('options'), ['-gravity', 'south']);
      assert.equal(captions[1].get('text'), "ALL THE THINGS");
      assert.deepEqual(captions[1].get('options'), ['-gravity', 'north']);
    });
  });
});