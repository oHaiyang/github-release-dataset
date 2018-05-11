import GitHub from '@octokit/rest';
import yaml from 'js-yaml';
import {
  buildCodeBlock,
  buildDatasetObj,
  readDatasets,
  insertIntoNote,
  getNewDataset,
  getSplicedNote,
} from './utils';

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

  async getDataset(tag, datasetName) {
    const { body: releaseNote } = await this.getRelease(tag);
    const [{ dataset }] = readDatasets(releaseNote, datasetName);

    return dataset;
  }

  async addDataset(tag, datasetName, dataset, insertTop = true) {
    let { body: releaseNote } = await this.getRelease(tag);

    const results = readDatasets(releaseNote, datasetName);
    if (results.length > 0) {
      throw new Error(
        `Dataset named ${datasetName} already exists in ${tag}, failed to add.`
      );
    }

    const yamlString = yaml.dump(buildDatasetObj(datasetName, dataset));
    const codeBlock = buildCodeBlock(yamlString);
    releaseNote = insertIntoNote(releaseNote, codeBlock, insertTop);

    await this.updateReleaseNote(tag, releaseNote);
  }

  async updateDataset(
    tag,
    datasetName,
    datasetOrUpdater,
    addIfNotExisting = false
  ) {
    const { body: releaseNote } = await this.getRelease(tag);
    const [result] = readDatasets(releaseNote, datasetName);

    if (!result && !addIfNotExisting) {
      throw new Error(
        `Update dataset ${datasetName} for ${tag} failed, dataset doesn't exist.`
      );
    }

    const newDataset = getNewDataset(
      datasetOrUpdater,
      result && result.dataset
    );

    if (!result && addIfNotExisting) {
      await this.addDataset(tag, datasetName, newDataset);
      return;
    }

    const newDatasetCodeBlock = buildCodeBlock(
      yaml.dump(buildDatasetObj(datasetName, newDataset))
    );
    const newReleaseNote = getSplicedNote(
      releaseNote,
      result.start,
      result.length,
      newDatasetCodeBlock
    );

    await this.updateReleaseNote(tag, newReleaseNote);
  }

  async deleteDataset(tag, datasetName) {
    let { body: releaseNote } = await this.getRelease(tag);

    // Only delete first meeted block
    let [firstResult] = readDatasets(releaseNote, datasetName);

    if (firstResult) {
      const { start, length } = firstResult;
      releaseNote =
        releaseNote.slice(0, start) + releaseNote.slice(start + length);
    } else {
      console.warn("Dataset doesn't exist, deletion not performed.");
    }

    await this.updateReleaseNote(tag, releaseNote);
  }
}

export default Smuggler;
