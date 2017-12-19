
exports.up = function(knex, Promise) {
  return knex.schema.createTable('memes', function(table) {
    table.increments('id').primary();
    table.string('user');
    table.string('team');
    table.integer('phase');
    table.string('template');
    table.string('image');
    table.timestamps(true);
  }).createTable('captions', function(table) {
    table.increments('id').primary();
    table.string('text');
    table.specificType('options', 'text[]');
    table.integer('meme_id').references('memes.id');
    table.timestamps(true);
  }).createTable('search_results', function(table) {
    table.increments('id').primary();
    table.integer('meme_id').references('memes.id'),
    table.integer('index');
    table.json('images');
    table.timestamps(true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('memes').dropTable('captions').dropTable('search_results');
};
