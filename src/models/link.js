// @flow
import orm from 'models/db';

const Link = orm.Model.extend({
  tableName: 'linkify',
  idAttribute: 'slug',  // This should actually be slug & domain, but bookshelf doesn't support 
                        // that yet.
});

export default Link;
