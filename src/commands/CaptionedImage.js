// @flow
import fs from 'fs';
import im from 'imagemagick';
import env from 'node-env-file';
import path from 'path';
import winston from 'winston';

import Caption from 'models/Caption';
import Config from 'config';


class CaptionedImage {
  captions: Array<Caption>;
  outputFilename: string;
  template: string;
  uri: string;

  constructor(template: string, captions: Array<Caption>, outputFilename: string) {
    this.template = template;
    this.captions = captions;
    this.outputFilename = outputFilename;
    this.mkdirRecursive(outputFilename);
    this.uri = outputFilename.substring(outputFilename.indexOf('/') + 1);
  }

  async getObject() {
    const dimensions = await new Promise((resolve, reject) => {
      // This works on non-gifs, too.
      const firstFrame = `${this.template}[0]`;
      im.identify(['-format', '%wx%h', firstFrame], function(err, output) {
        if (err) {
          reject(err);
        }
        winston.info(`dimensions: ${output}`);
        resolve(output);
      });
    });

    const args = [
      this.template,
      'null:',
      '-font',
      'Impact',
      '-fill',
      'white',
      '-stroke',
      'black',
      '-strokewidth',
      '1',
      '-background',
      'none',
      '-gravity',
      'south',
      '-size',
      dimensions,
      `label:${this.captions[0].get('text')}`,
      '-layers',
      'composite',
      '-layers',
      'optimize',
      this.outputFilename
    ];
    winston.info(`calling imagemagick with ${JSON.stringify(args)}`);
    await new Promise((resolve, reject) => {
      im.convert(args, (err, stdout) => {
        winston.info('done converting');
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
    const url = `${Config.URL}/${this.uri}`;
    return { url, thumbnail: { url } };
  }

  mkdirRecursive(filename: string) {
    const parent = path.dirname(filename);
    if (parent.length <= 1 || fs.existsSync(parent)) {
      return;
    }
    this.mkdirRecursive(parent);
    fs.mkdirSync(parent);
  }

}

export default CaptionedImage;