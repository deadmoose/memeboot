// @flow
import orm from 'models/db';

const SearchResults = orm.Model.extend({
  tableName: 'search_results',
});

export default SearchResults;
