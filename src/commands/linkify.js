// @flow
import _ from 'lodash';
import assert from 'assert';

import Link from 'models/link';

const HELP = 'help';
const DELETE = 'delete';
const INVALID_CHARS = /[^-0-9A-Za-z]/;
const MAX_RESULTS = 10;


class Linkify {
  static COMMAND: string;
  _owner: string;
  _domain: string;
  _response: {};

  constructor(body: {text: string, user_name: string, team_domain: string}) {
    this._owner = body.user_name;
    this._domain = body.team_domain;
    const text = body.text;
    const parts = text.split(' ');
    assert(parts.length > 0);
    switch (parts[0]) {
      case HELP:
        this._response = this.usage();
        break;
      case DELETE:
        this._response = this.delete(parts);
        break;
      default:
      if (parts.length == 2) {
        this._response = this.create(parts);
      } else {
        this._response = Linkify.query(parts[0]);
      }
    }
  }

  getResponse() {
    return this._response;
  }

  usage() {
    return {text: `Create short, memorable aliases for links. Usage:
      Create or update an alias: "${Linkify.COMMAND} _alias_ _url_"
      Use an alias: "${Linkify.COMMAND} _alias_"
      Delete an alias: "${Linkify.COMMAND} delete _alias_"`};
  }

  async delete(parts: Array<string>) {
    if (parts.length < 2) {
      return {
        text: `Nothing to do. "${Linkify.COMMAND} delete _alias_" to delete the _alias_ mapping.`,
      }
    }
    const slug = parts[1];
    return await Link.forge({ slug }).fetch().then(link => {
      if (!link) {
        return {text: `Link ${slug} not found.`}
      }
      if (link.get('owner') !== this._owner) {
        return {text: `${link.get('owner')} owns ${slug}, you cannot delete it.`};
      }
      link.destroy();
      return {text: `${slug} deleted.`};
    });
  }

  static async query(slug: string) {
    const splitLink = Linkify.splitLink(slug);
    const link = await Link.forge({ slug: splitLink.base })
      .fetch()
      .catch(err => {
        console.log(err);
        return null;
      });
    if (link) {
      return { text: `${link.get('url')}${splitLink.ext}` };
    } else {
      return { text: `Short link "${splitLink.base}" not found, create it with "${Linkify.COMMAND} ${splitLink.base} <url>"` };
    }
  }

  async create(parts: Array<string>) {
    const slug = parts[0];
    const errorMessage = this.validateAlias(slug);
    if (errorMessage) {
      return errorMessage;
    }
    const url = parts[1];
    const description = _.join(_.slice(parts, 2, parts.length), ' ');
    const directions = `Type "${Linkify.COMMAND} ${slug}" to use.`;

    const link = Link.forge({ slug });
    return await link.fetch().then(existing => {
      if (existing) {
        const oldLink = existing.get('url');
        if (existing.get('owner') !== this._owner) {
          return {text: `${slug} already exists, talk to ${existing.get('owner')} about editing it.`};
        }
        link.set({ url, description, owner: this._owner });
        link.save();
        return {text: `Updated ${slug} from ${oldLink} to ${link.get('url')}. ${directions}`};
      }
      // Because the unique id is specified, Bookshelf assumes this is an update, not an insert.
      link.set({ url, description, owner: this._owner });
      link.save(null, {method: 'insert'});
      return {text: `Created! ${directions}`}
    }).catch(err => {
      console.log(err);
      return null;
    });
  }

  validateAlias(alias: string) {
    const result = INVALID_CHARS.exec(alias);
    if (result && result.length > 0) {
      return {
        text: `I only know how to handle letters, numbers, and dashes (found "${result[0]}").`
      }
    }
    return null;
  }

  static async mention(text: string) {
    // Certainly not going to match all valid URLs, but basically looking for:
    // * l/base
    // * l/base/something
    // * l/base#target
    const linkifyRegex = /\bl\/([-0-9A-Za-z]+(?:[?/#][-0-9A-Za-z?/#=.]+)?)/g;
    const links = [];
    let current = linkifyRegex.exec(text);
    let count = 0;
    while (current && count < MAX_RESULTS) {
      const alias = current[1];
      const response = await Linkify.query(alias);
      links.push(`${alias} -> ${response.text}`);
      current = linkifyRegex.exec(text);
      count++;
    }
    return links;
  }

  static splitLink(url: string) {
    const result = INVALID_CHARS.exec(url);
    if (result && result.length > 0) {
      const extIndex = url.indexOf(result[0]);
      return { base: url.substring(0, extIndex), ext: url.substring(extIndex) };
    }
    return { base: url, ext: ''};
  }
}

Linkify.COMMAND = '/l';

export default Linkify;