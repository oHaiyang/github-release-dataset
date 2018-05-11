/* eslint-env jest */
import Smuggler from '../src/index';

jest.mock('@octokit/rest');
jest.mock('js-yaml');
jest.mock('../src/utils');

const _mockTagName = '_v2.3.3';
const _mockDatasetName = '_jerry';
const _mockDataset = {
  _foe: '_tom',
};
const _mockReleaseId = '2333';
const _mockReleaseNote = `
\`\`\`yaml
dataset-name: ${_mockTagName}
dataset:
  _foe: _tom
\`\`\`
`;
const _mockReleaseData = {
  id: _mockReleaseId,
  tag_name: _mockTagName,
  body: _mockReleaseNote,
};
const _mockRelease = {
  meta: {},
  data: _mockReleaseData,
};

describe('getRelease', () => {
  it('should return cached release if exists', async () => {
    const s = new Smuggler();
    s.releases[_mockTagName] = _mockRelease;

    expect(await s.getRelease(_mockTagName)).toEqual(_mockRelease);
    expect(s.g.repos.getReleaseByTag.mock).toBeTruthy();
  });

  it('should return get release and cache it and return', async () => {
    const s = new Smuggler();
    s.g.repos.getReleaseByTag.mockResolvedValue(_mockRelease);

    const result = await s.getRelease(_mockTagName);
    expect(s.g.repos.getReleaseByTag.mock.calls.length).toBe(1);
    expect(s.g.repos.getReleaseByTag.mock.calls[0][0].tag).toBe(_mockTagName);
    expect(result).toEqual(_mockReleaseData);
    expect(s.releases[_mockTagName]).toEqual(_mockReleaseData);
  });

  it('should rethrow an error when get remote relase failed', async () => {
    const s = new Smuggler();
    const errorMessage = 'error message';
    s.g.repos.getReleaseByTag.mockRejectedValueOnce(new Error(errorMessage));

    try {
      await s.getRelease(_mockTagName);
    } catch (e) {
      expect(e.message).toBe(
        `Failed to get release ${_mockTagName}. ${errorMessage}`
      );
    }
  });
});

describe('updateReleaseNote', () => {
  const _mockNewReleaseNote = 'Heyo';

  it('update a release with valid payload and udpate cache', async () => {
    const s = new Smuggler();
    s.getRelease = jest.fn();
    s.getRelease.mockResolvedValueOnce(_mockReleaseData);
    s.releases[_mockTagName] = _mockReleaseData;

    await s.updateReleaseNote(_mockTagName, _mockNewReleaseNote);
    expect(s.g.repos.editRelease).toHaveBeenCalledTimes(1);
    expect(s.g.repos.editRelease.mock.calls[0][0]).toMatchObject({
      id: _mockReleaseId,
      tag_name: _mockTagName,
      body: _mockNewReleaseNote,
    });
    expect(s.releases[_mockTagName].body).toBe(_mockNewReleaseNote);
  });

  it('should rethrow an error when update failed', async () => {
    const s = new Smuggler();
    s.getRelease = jest.fn().mockResolvedValueOnce({ id: '_id' });
    const errorMessage = 'error message';
    s.g.repos.editRelease.mockRejectedValueOnce(new Error(errorMessage));

    try {
      await s.updateReleaseNote(_mockTagName, _mockNewReleaseNote);
    } catch (e) {
      expect(e.message).toBe(
        `Failed to update releaseNote of ${_mockTagName}. ${errorMessage}`
      );
    }
  });
});

describe('getDataset', () => {
  it('should read datasets', async () => {
    const s = new Smuggler();
    s.getRelease = jest.fn().mockResolvedValueOnce({ body: _mockReleaseNote });
    const mockedReadDatasets = require('../src/utils').readDatasets;
    mockedReadDatasets.mockReturnValueOnce([{ dataset: _mockDataset }]);

    const result = await s.getDataset(_mockTagName, _mockDatasetName);
    expect(s.getRelease).toHaveBeenCalledTimes(1);
    expect(s.getRelease.mock.calls[0][0]).toBe(_mockTagName);
    expect(mockedReadDatasets).toHaveBeenCalledTimes(1);
    expect(mockedReadDatasets.mock.calls[0][0]).toEqual(_mockReleaseNote);
    expect(mockedReadDatasets.mock.calls[0][1]).toEqual(_mockDatasetName);
    expect(result).toEqual(_mockDataset);
  });
});

describe('addDataset', () => {
  let s;
  let mockedReadDatasets;
  let mockedBuildDatasetObj;
  let mockedBuildCodeBlock;
  let mockedInsertIntoNote;
  let mockedDump;

  beforeEach(() => {
    jest.resetAllMocks();

    s = new Smuggler();
    s.getRelease = jest.fn();
    s.updateReleaseNote = jest.fn();
    s.getRelease.mockResolvedValueOnce({});
    ({
      readDatasets: mockedReadDatasets,
      buildDatasetObj: mockedBuildDatasetObj,
      buildCodeBlock: mockedBuildCodeBlock,
      insertIntoNote: mockedInsertIntoNote,
    } = require('../src/utils'));
    ({ dump: mockedDump } = require('js-yaml'));
  });

  it('should throw if dataset exists', async () => {
    mockedReadDatasets.mockReturnValueOnce(new Array(1));

    try {
      await s.addDataset();
    } catch (e) {
      expect(e).toMatchSnapshot();
    }
  });

  it('should add a dataset', async () => {
    mockedReadDatasets.mockReturnValueOnce([]);

    await s.addDataset();
    expect(s.getRelease).toHaveBeenCalledTimes(1);
    expect(mockedReadDatasets).toHaveBeenCalledTimes(1);
    expect(mockedBuildDatasetObj).toHaveBeenCalledTimes(1);
    expect(mockedDump).toHaveBeenCalledTimes(1);
    expect(mockedBuildCodeBlock).toHaveBeenCalledTimes(1);
    expect(mockedInsertIntoNote).toHaveBeenCalledTimes(1);
    expect(s.updateReleaseNote).toHaveBeenCalledTimes(1);
  });
});
