// @flow
import bookshelf from 'bookshelf';
import knex from 'knex';
import mockKnex from 'mock-knex';
import env from 'node-env-file';

env(`.env`);

const connection = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'memeboot',
    charset: 'utf8',
  },
});

if (process.env.NODE_ENV == 'test') {
  mockKnex.mock(connection, 'knex@0.14.2');
}

const orm = bookshelf(connection);

export default orm;
