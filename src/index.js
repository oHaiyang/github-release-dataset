const GitHub = require('@octokit/rest');
const yaml = require('js-yaml');
const { buildCodeBlock, buildDatasetObj, readDatasets } = require('./utils');

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

    this.releases = {};
  }

  async updateReleaseNote(tag, releaseNote) {
    const { id } = await this.getRelease(tag);

    try {
      await this.g.repos.editRelease({
        ...this.target,
        id,
        tag_name: tag,
        body: releaseNote,
      });
      if (this.releases[tag]) this.releases[tag].body = releaseNote;
    } catch (e) {
      throw new Error(`Failed to update releaseNote of ${tag}. ` + e.message);
    }
  }

  async getRelease(tag) {
    if (this.releases[tag]) return this.releases[tag];

    try {
      const { data: release } = await this.g.repos.getReleaseByTag({
        ...this.target,
        tag,
      });

      this.releases[tag] = release;
      return release;
    } catch (e) {
      throw new Error(`Failed to get release ${tag}. ` + e.message);
    }
  }

  async addDataset(tag, datasetName, dataset, insertBeforeTop = false) {
    let { body: releaseNote } = await this.getRelease(tag);

    let datasets = readDatasets(releaseNote, datasetName);
    if (datasets.length > 0) {
      throw new Error(
        `Dataset named ${datasetName} already exists in ${tag}, failed to add.`
      );
    }

    const yamlString = yaml.dump(buildDatasetObj(datasetName, dataset));
    const codeBlock = buildCodeBlock(yamlString);
    if (insertBeforeTop) {
      releaseNote = codeBlock + '\n' + releaseNote;
    } else {
      releaseNote = releaseNote + '\n' + codeBlock;
    }

    await this.updateReleaseNote(tag, releaseNote);
  }

  async updateDataset(tag, datasetName, dataset) {}

  async deleteDataset(tag, datasetName) {
    let { body: releaseNote } = await this.getRelease(tag);

    // Only delete first meeted block
    let [firstDataset] = readDatasets(releaseNote, datasetName);

    if (firstDataset) {
      const { start, length } = firstDataset;
      releaseNote =
        releaseNote.slice(0, start) + releaseNote.slice(start + length);
    } else {
      console.warn("Dataset doesn't exist, deletion not performed.");
    }

    await this.updateReleaseNote(tag, releaseNote);
  }
}

module.exports = Smuggler;
