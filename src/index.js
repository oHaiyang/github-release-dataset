const GitHub = require('@octokit/rest');

class Smuggler {
  constructor(token, owner, repo) {
    this.target = {
      owner,
      repo,
    };

    this.g = GitHub();

    this.g.authenticate({
      type: 'token',
      token,
    });
  }

  async getUser() {
    const user = await this.g.users.get();
    return user;
  }

  async getReleases() {
    const release = await this.g.repos.getReleases({
      ...this.target,
    });
    return release;
  }

  async getReleaseNote(tag) {
    const release = await this.g.repos.getReleaseByTag({
      ...this.target,
      tag
    })
    return release;
  }

  async readSnippets(tag) {
    return { text: '', snippets: [{ startLine: 0, lineCount: 0, name: '' }] }
  }

  async addSnippet(tag, insertBeforeTop = false, dataset) {
  }

  async updateSnippet(issueNumber, commentIndex, snippetName, snippet) {
  }

  async deleteSnippet(issueNumber, commentIndex, snippet) {
  }
}

module.exports = Smuggler;
