import fs from 'fs';
import path from 'path';

class Util {
  static mkdirRecursive(filename: string) {
    const parent = path.dirname(filename);
    if (parent.length <= 1 || fs.existsSync(parent)) {
      return;
    }
    Util.mkdirRecursive(parent);
    fs.mkdirSync(parent);
  }

  static getExtension(filename: string) {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return '';
    }
    return filename.substring(lastDotIndex + 1);
  }
}

export default Util;
