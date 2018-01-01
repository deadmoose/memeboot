// @flow
import env from 'node-env-file';
import winston from 'winston';

env('.env');

const Config = ((process.env: any): {
  URL: string,
  [string]: string,
});

export default Config;
