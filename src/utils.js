const COMMENT =
  '# GENERATED BY https://github.com/oHaiyang/github-release-dataset, DO NOT MODIFY';
const DATASET_KEY = 'dataset-name';
const YAML_CODE_BLOCK_REG = /```yaml *[\r\n]+([\s\S]*?)[\r\n]+```/gi;
const yaml = require('js-yaml');

function buildCodeBlock(string) {
  return '```yaml' + '\n' + COMMENT + '\n\n' + string + '```';
}

function buildDatasetObj(name, dataset) {
  return {
    [DATASET_KEY]: name,
    dataset,
  };
}

function readDatasets(releaseNote, datasetName) {
  let datasetMatch;
  let results = [];

  do {
    datasetMatch = YAML_CODE_BLOCK_REG.exec(releaseNote);
    if (datasetMatch) {
      const length = datasetMatch[0].length;
      const start = datasetMatch.index;
      const body = datasetMatch[1];
      const name = yaml.load(body)[DATASET_KEY];

      // If datasetName are specified, return name matched dataset,
      // otherwist return all datasets
      if (datasetName ? name === datasetName : !!name) {
        results.push({
          start,
          length,
          name,
          body,
        });
      }
    }
  } while (datasetMatch);

  return results;
}

module.exports = {
  buildCodeBlock,
  buildDatasetObj,
  readDatasets,
};
