const GitHub = require('@octokit/rest');
const yaml = require('js-yaml');

const COMMENT = '# THIS SNIPPET IS GENERATED BY https://github.com/oHaiyang/github-release-dataset, DO NOT MANUALLY MODIFY IT';
const DATASET_KEY = 'dataset-name';

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

    this.releases = {
    };
  }

  buildCodeBlock(string) {
    return '```yaml' + '\n' + COMMENT + '\n\n' + string + '```';
  }

  buildDatasetObj(name, dataset) {
    return {
      [DATASET_KEY]: name,
      dataset,
    }
  }

  async updateReleaseNote(tag, releaseNote) {
    await this.getRelease(tag);
    const { id } = this.releases[tag];

    try {
      await this.g.repos.editRelease({
        ...this.target,
        id,
        tag_name: tag,
        body: releaseNote,
      });
    } catch(e) {
      throw new Error(`Failed to update releaseNote of ${tag}. ` + e.message);
    }
  }

  async getRelease(tag) {
    if (this.releases[tag]) return;

    try {
      const { data: release } = await this.g.repos.getReleaseByTag({
        ...this.target,
        tag
      })

      this.releases[tag] = release;
    } catch(e) {
      throw new Error(`Failed to get release ${tag}. ` + e.message);
    }
  }

  async readDatasets(tag) {
    return { text: '', datasets: [{ startLine: 0, lineCount: 0, name: '' }] }
  }

  async addDataset(tag, datasetName, dataset, insertBeforeTop = false) {
    await this.getRelease(tag); 
    let { body: releaseNote } = this.releases[tag];

    const yamlString = yaml.dump(this.buildDatasetObj(datasetName, dataset));
    const codeBlock = this.buildCodeBlock(yamlString);
    if (insertBeforeTop) {
      releaseNote = codeBlock + '\n' + releaseNote;
    } else {
      releaseNote = releaseNote + '\n' + codeBlock;
    }
    
    await this.updateReleaseNote(tag, releaseNote);
  }

  async updateDataset(issueNumber, commentIndex, datasetName, dataset) {
  }

  async deleteDataset(issueNumber, commentIndex, dataset) {
  }
}

module.exports = Smuggler;
