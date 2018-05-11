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
const _mockYamlString = `
dataset-name: ${_mockDatasetName}
dataset:
  _foe: _tom
`;
const _mockDatasetCodeBlock = `
\`\`\`yaml
${_mockYamlString}
\`\`\`
`;
const _mockReleaseId = '2333';
const _mockReleaseNote = `
${_mockTagName}
${_mockDatasetCodeBlock}
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

const _mockNewDataset = { _friend: '_pug' };
const _mockNewYamlString = `
dataset-name: ${_mockTagName}
dataset:
  _friend: _pug
`;
const _mockNewDatasetCodeBlock = `
\`\`\`yaml
${_mockNewYamlString}
\`\`\`
`;
const _mockNewReleaseNote = `
${_mockTagName}
${_mockNewDatasetCodeBlock}
`;

let s;
const {
  readDatasets: mockedReadDatasets,
  buildDatasetObj: mockedBuildDatasetObj,
  buildCodeBlock: mockedBuildCodeBlock,
  insertIntoNote: mockedInsertIntoNote,
  getNewDataset: mockedGetNewDataset,
  getSplicedNote: mockedGetSplicedNote,
} = require('../src/utils');
const { dump: mockedDump } = require('js-yaml');

describe('getRelease', () => {
  beforeEach(() => {
    s = new Smuggler();
  });

  it('should return cached release if exists', async () => {
    s.releases[_mockTagName] = _mockRelease;

    expect(await s.getRelease(_mockTagName)).toEqual(_mockRelease);
    expect(s.g.repos.getReleaseByTag.mock).toBeTruthy();
  });

  it('should return get release and cache it and return', async () => {
    s.g.repos.getReleaseByTag.mockResolvedValue(_mockRelease);

    const result = await s.getRelease(_mockTagName);
    expect(s.g.repos.getReleaseByTag.mock.calls.length).toBe(1);
    expect(s.g.repos.getReleaseByTag.mock.calls[0][0].tag).toBe(_mockTagName);
    expect(result).toEqual(_mockReleaseData);
    expect(s.releases[_mockTagName]).toEqual(_mockReleaseData);
  });

  it('should rethrow an error when get remote relase failed', async () => {
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
  beforeEach(() => {
    s = new Smuggler();
  });

  it('update a release with valid payload and udpate cache', async () => {
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
  beforeEach(() => {
    jest.resetAllMocks();

    s = new Smuggler();
    s.getRelease = jest.fn();
    s.updateReleaseNote = jest.fn();
    s.getRelease.mockResolvedValueOnce({});
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

describe('updateDataset', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    s = new Smuggler();
    s.getRelease = jest.fn();
    s.getRelease.mockResolvedValueOnce({ body: _mockReleaseNote });
    s.addDataset = jest.fn();
    s.updateReleaseNote = jest.fn();
  });

  it('should add if dataset not exits', async () => {
    mockedReadDatasets.mockReturnValueOnce([]);

    try {
      await s.updateDataset(_mockTagName, _mockDatasetName, _mockNewDataset);
    } catch (e) {
      expect(s.getRelease).toHaveBeenCalledTimes(1);
      expect(mockedReadDatasets).toHaveBeenCalledTimes(1);
      expect(e.message).toMatchSnapshot();
    }
  });

  it("should add if dataset does't not exit", async () => {
    mockedReadDatasets.mockReturnValueOnce([]);
    mockedGetNewDataset.mockReturnValueOnce(_mockNewDataset);

    await s.updateDataset(
      _mockTagName,
      _mockDatasetName,
      _mockNewDataset,
      true
    );

    expect(s.addDataset).toHaveBeenCalledTimes(1);
    expect(s.addDataset.mock.calls[0][0]).toBe(_mockTagName);
    expect(s.addDataset.mock.calls[0][1]).toBe(_mockDatasetName);
    expect(s.addDataset.mock.calls[0][2]).toEqual(_mockNewDataset);

    expect(s.updateReleaseNote).toHaveBeenCalledTimes(0);
  });

  it('should update the dataset', async () => {
    const start = 2;
    const length = 3;
    mockedReadDatasets.mockReturnValueOnce([
      { dataset: _mockDataset, start, length },
    ]);
    mockedGetNewDataset.mockReturnValueOnce(_mockNewDataset);
    mockedBuildDatasetObj.mockReturnValueOnce({
      'dateset-name': _mockDatasetName,
      dataset: _mockNewDataset,
    });
    mockedDump.mockReturnValueOnce(_mockNewYamlString);
    mockedBuildCodeBlock.mockReturnValueOnce(_mockNewDatasetCodeBlock);
    mockedGetSplicedNote.mockReturnValueOnce(_mockNewReleaseNote);

    await s.updateDataset(_mockTagName, _mockDatasetName, _mockNewDataset);

    expect(mockedReadDatasets).toHaveBeenCalledTimes(1);
    expect(mockedReadDatasets.mock.calls[0][0]).toBe(_mockReleaseNote);
    expect(mockedReadDatasets.mock.calls[0][1]).toBe(_mockDatasetName);

    expect(mockedGetNewDataset).toHaveBeenCalledTimes(1);
    expect(mockedGetNewDataset.mock.calls[0][0]).toBe(_mockNewDataset);
    expect(mockedGetNewDataset.mock.calls[0][1]).toBe(_mockDataset);

    expect(mockedBuildDatasetObj).toHaveBeenCalledTimes(1);
    expect(mockedBuildDatasetObj.mock.calls[0][0]).toBe(_mockDatasetName);
    expect(mockedBuildDatasetObj.mock.calls[0][1]).toBe(_mockNewDataset);

    expect(mockedDump).toHaveBeenCalledTimes(1);
    expect(mockedDump.mock.calls[0][0]).toEqual({
      'dateset-name': _mockDatasetName,
      dataset: _mockNewDataset,
    });

    expect(mockedBuildCodeBlock).toHaveBeenCalledTimes(1);
    expect(mockedBuildCodeBlock.mock.calls[0][0]).toBe(_mockNewYamlString);

    expect(mockedGetSplicedNote).toHaveBeenCalledTimes(1);
    expect(mockedGetSplicedNote.mock.calls[0][0]).toBe(_mockReleaseNote);
    expect(mockedGetSplicedNote.mock.calls[0][1]).toBe(start);
    expect(mockedGetSplicedNote.mock.calls[0][2]).toBe(length);
    expect(mockedGetSplicedNote.mock.calls[0][3]).toBe(
      _mockNewDatasetCodeBlock
    );

    expect(s.updateReleaseNote).toHaveBeenCalledTimes(1);
    expect(s.updateReleaseNote.mock.calls[0][0]).toBe(_mockTagName);
    expect(s.updateReleaseNote.mock.calls[0][1]).toBe(_mockNewReleaseNote);
  });
});
