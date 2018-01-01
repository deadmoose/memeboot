// @flow
import orm from 'models/db';

import Caption from 'models/Caption';

const Meme = orm.Model.extend({
  tableName: 'memes',
  hasTimestamps: true,

  captions() {
    return this.hasMany(Caption);
  }
});

export default Meme;
