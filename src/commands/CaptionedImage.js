// @flow
import fs from 'fs';
import im from 'imagemagick';
import env from 'node-env-file';
import path from 'path';

import Caption from 'models/Caption';
import config from 'config';

env(`.env`);


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
      im.identify(['-format', '%wx%h', this.template], function(err, output) {
        if (err) {
          reject(err);
        }
        resolve(output);
      });
    });

    const args = [
      this.template,
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
      '-composite',
      this.outputFilename
    ];
    await new Promise((resolve, reject) => {
      im.convert(args, (err, stdout) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
    const url = `${config.url}/${this.uri}`;
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