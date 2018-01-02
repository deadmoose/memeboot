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
}

export default Util;
