// @flow
import _ from 'lodash';
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
    if (parts.length == 0) {
      // TODO: show all existing, but maybe only on memeboot channel.
      this._response = this.all();
    } else if (parts.length == 1) {
      // Query for an existing link.
      this._response = this.query(parts[0]);
    } else {
      // Create a new link.
      this._response = this.create(parts);
    }
  }

  getResponse() {
    return this._response;
  }

  all() {
    return {};
  }

  async query(slug: string) {
    const link = await Link.forge({slug, domain: this._domain}).fetch().catch(err => {
      console.log(err);
      return null;
    });
    if (link) {
      return {text: link.get('url')};
    } else {
      return {text: `Short link ${slug} not found, create it with "/linkify ${slug} <url>"`};
    }
  }

  async create(parts: Array<string>) {
    // TODO: verify it just uses URI-valid chars.
    const slug = parts[0];
    const url = parts[1];
    const description = _.join(_.slice(parts, 2, parts.length), ' ');

    const link = Link.forge({slug, url, description, domain: this._domain});
    const existing = await link.fetch().catch(err => {
      console.log(err);
      return null;
    });
    if (existing) {
      return {text: `${slug} already exists, talk to ${link.get('owner')} about editing it.`};
    }

    link.set({owner: this._owner});
    // Because the unique id is specified, Bookshelf assumes this is an update, not an insert.
    link.save(null, {method: 'insert'});
    return {text: `Created! Type "/linkify ${slug}" to use.`}
  }
}

export default Linkify;