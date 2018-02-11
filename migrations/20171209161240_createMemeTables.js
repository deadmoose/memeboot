
exports.up = function(knex, Promise) {
  return knex.schema.createTable('meme', function(table) {
    table.increments('id').primary();
    table.string('user');
    table.string('team');
    table.integer('phase');
    table.string('template');
    table.string('image');
    table.timestamps(true);
  }).createTable('caption', function(table) {
    table.increments('id').primary();
    table.string('text');
    table.specificType('options', 'text[]');
    table.integer('meme_id').references('meme.id');
    table.timestamps(true);
  }).createTable('search_result', function(table) {
    table.increments('id').primary();
    table.integer('meme_id').references('meme.id'),
    table.integer('index');
    table.json('images');
    table.string('query');
    table.timestamps(true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('search_results').dropTable('captions').dropTable('memes');
};
