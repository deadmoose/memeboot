// @flow
import _ from 'lodash';
import assert from 'assert';
import Link from 'models/link';

class Linkify {
  _owner: string;
  _domain: string;
  _response: {};

  constructor(body: {text: string, user_name: string, team_domain: string}) {
    this._owner = body.user_name;
    this._domain = body.team_domain;
    const text = body.text;
    const parts = text.split(' ');
    if (parts.length == 2) {
      this._response = this.create(parts);
    } else {
      assert(parts.length > 0);
      this._response = this.query(parts[0]);
    }
  }

  getResponse() {
    return this._response;
  }

  async query(slug: string) {
    const link = await Link.forge({slug, domain: this._domain}).fetch().catch(err => {
      console.log(err);
      return null;
    });
    if (link) {
      return {text: link.get('url')};
    } else {
      return {text: `Short link "${slug}" not found, create it with "/linkify ${slug} <url>"`};
    }
  }

  async create(parts: Array<string>) {
    // TODO: verify it just uses URI-valid chars.
    const slug = parts[0];
    const url = parts[1];
    const description = _.join(_.slice(parts, 2, parts.length), ' ');

    const link = Link.forge({slug, domain: this._domain});
    return await link.fetch().then(existing => {
      if (existing) {
        const oldLink = existing.get('url');
        if (existing.get('owner') !== this._owner) {
          return {text: `${slug} already exists, talk to ${link.get('owner')} about editing it.`};
        }
        link.set({url, description});
        link.save();
        return {text: `Updated ${slug} from ${oldLink} to ${link.get('url')}`};
      }
      // Because the unique id is specified, Bookshelf assumes this is an update, not an insert.
      link.set({url, description});
      link.save(null, {method: 'insert'});
      return {text: `Created! Type "/linkify ${slug}" to use.`}
    }).catch(err => {
      console.log(err);
      return null;
    });
  }
}

export default Linkify;