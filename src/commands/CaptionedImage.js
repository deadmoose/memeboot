// @flow
import im from 'imagemagick';
import winston from 'winston';

import Caption from 'models/Caption';
import Util from 'commands/Util';
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
    Util.mkdirRecursive(outputFilename);
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

    const width = parseInt(dimensions.substring(0, dimensions.indexOf('x')));
    const height = parseInt(dimensions.substring(dimensions.indexOf('x') + 1));
    const maxTextHeight = Math.floor(height / 5);

    const caption = this.captions[0];
    const args = [
      this.template,
      'null:', // Reference to image (the text doesn't come from an image, so null.
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
      caption.getGravity(),
      '-size',
      `${width}x${maxTextHeight}`,
      `label:${caption.get('text')}`,
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
}

export default CaptionedImage;