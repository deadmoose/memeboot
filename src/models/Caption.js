// @flow
import assert from 'assert';
import stringArgv from 'string-argv';

import orm from 'models/db';

/**
 * Captions are given in the form:
 *   - Simplest: `I am a caption`
 *   - With args: `"This is a thing" -opt1 -opt2`
 *   - Multiple captions with args: `"First part" -opt1 "OneWordCaption" -opt2 -opt3`
 * Default is bottom-aligned center-justified. Options can override this.
 * Escape quote with \ (\").
 */
const Caption = orm.Model.extend({
  tableName: 'captions',
}, {
  parse(text): Array<Caption> {
    assert(text.length > 0);

    if (!text.startsWith('"')) {
      // Simplest.
      return [Caption.forge({ text })];
    }

    const args = stringArgv(text);
    if (args.length == 0) {
      // TODO: error.
      return [];
    }

    // Split into sets of captions.
    const captions = [];
    let captionIndex = 0;
    while (captionIndex < args.length) {
      if (args[captionIndex].charAt(0) !== '"') {
        // TODO: error.
        return [];
      }
      const text = args[captionIndex];
      captionIndex++;
      const argStart = captionIndex;
      if (captionIndex === args.length) {
        captions.push(Caption.forge({ text }));
        captionIndex++;
        continue;
      }
      while (captionIndex < args.length && args[captionIndex].charAt(0) !== '"') {
        captionIndex++;
      }
      const options = args.slice(argStart, captionIndex);
      captions.push(Caption.forge({ text, options }));
    }
    return captions;
  },
});

export default Caption;