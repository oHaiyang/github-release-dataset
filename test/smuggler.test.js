/* eslint-env jest */
import Smuggler from '../src/index';

jest.mock('@octokit/rest');
jest.mock('js-yaml');
jest.mock('../src/utils');

const _mockedTagName = '_v2.3.3';
const _mockedDatasetName = '_jerry';
const _mockedDataset = {
  _foe: '_tom',
};
const _mockedYamlString = `
dataset-name: ${_mockedDatasetName}
dataset:
  _foe: _tom
`;
const _mockedDatasetCodeBlock = `
\`\`\`yaml
${_mockedYamlString}
\`\`\`
`;
const _mockedReleaseId = '2333';
const _mockedReleaseNote = `
${_mockedTagName}
${_mockedDatasetCodeBlock}
`;
const _mockedReleaseData = {
  id: _mockedReleaseId,
  tag_name: _mockedTagName,
  body: _mockedReleaseNote,
};
const _mockedRelease = {
  meta: {},
  data: _mockedReleaseData,
};

const _mockedNewDataset = { _friend: '_pug' };
const _mockedNewYamlString = `
dataset-name: ${_mockedTagName}
dataset:
  _friend: _pug
`;
const _mockedNewDatasetCodeBlock = `
\`\`\`yaml
${_mockedNewYamlString}
\`\`\`
`;
const _mockedNewReleaseNote = `
${_mockedTagName}
${_mockedNewDatasetCodeBlock}
`;

let s;
const {
  readDatasets: _mockedReadDatasets,
  buildDatasetObj: _mockedBuildDatasetObj,
  buildCodeBlock: _mockedBuildCodeBlock,
  insertIntoNote: _mockedInsertIntoNote,
  getNewDataset: _mockedGetNewDataset,
  getSplicedNote: _mockedGetSplicedNote,
} = require('../src/utils');
const { dump: _mockedDump } = require('js-yaml');

describe('getRelease', () => {
  beforeEach(() => {
    s = new Smuggler();
  });

  it('should return cached release if exists', async () => {
    s.releases[_mockedTagName] = _mockedRelease;

    expect(await s.getRelease(_mockedTagName)).toEqual(_mockedRelease);
    expect(s.g.repos.getReleaseByTag.mock).toBeTruthy();
  });

  it('should return get release and cache it and return', async () => {
    s.g.repos.getReleaseByTag.mockResolvedValue(_mockedRelease);

    const result = await s.getRelease(_mockedTagName);
    expect(s.g.repos.getReleaseByTag.mock.calls.length).toBe(1);
    expect(s.g.repos.getReleaseByTag.mock.calls[0][0].tag).toBe(_mockedTagName);
    expect(result).toEqual(_mockedReleaseData);
    expect(s.releases[_mockedTagName]).toEqual(_mockedReleaseData);
  });

  it('should rethrow an error when get remote relase failed', async () => {
    const errorMessage = 'error message';
    s.g.repos.getReleaseByTag.mockRejectedValueOnce(new Error(errorMessage));

    try {
      await s.getRelease(_mockedTagName);
    } catch (e) {
      expect(e.message).toBe(
        `Failed to get release ${_mockedTagName}. ${errorMessage}`
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
    s.getRelease.mockResolvedValueOnce(_mockedReleaseData);
    s.releases[_mockedTagName] = _mockedReleaseData;

    await s.updateReleaseNote(_mockedTagName, _mockedNewReleaseNote);
    expect(s.g.repos.editRelease).toHaveBeenCalledTimes(1);
    expect(s.g.repos.editRelease.mock.calls[0][0]).toMatchObject({
      id: _mockedReleaseId,
      tag_name: _mockedTagName,
      body: _mockedNewReleaseNote,
    });
    expect(s.releases[_mockedTagName].body).toBe(_mockedNewReleaseNote);
  });

  it('should rethrow an error when update failed', async () => {
    s.getRelease = jest.fn().mockResolvedValueOnce({ id: '_id' });
    const errorMessage = 'error message';
    s.g.repos.editRelease.mockRejectedValueOnce(new Error(errorMessage));

    try {
      await s.updateReleaseNote(_mockedTagName, _mockedNewReleaseNote);
    } catch (e) {
      expect(e.message).toBe(
        `Failed to update releaseNote of ${_mockedTagName}. ${errorMessage}`
      );
    }
  });
});

describe('getDataset', () => {
  it('should read datasets', async () => {
    s.getRelease = jest
      .fn()
      .mockResolvedValueOnce({ body: _mockedReleaseNote });
    const _mockedReadDatasets = require('../src/utils').readDatasets;
    _mockedReadDatasets.mockReturnValueOnce([{ dataset: _mockedDataset }]);

    const result = await s.getDataset(_mockedTagName, _mockedDatasetName);
    expect(s.getRelease).toHaveBeenCalledTimes(1);
    expect(s.getRelease.mock.calls[0][0]).toBe(_mockedTagName);
    expect(_mockedReadDatasets).toHaveBeenCalledTimes(1);
    expect(_mockedReadDatasets.mock.calls[0][0]).toEqual(_mockedReleaseNote);
    expect(_mockedReadDatasets.mock.calls[0][1]).toEqual(_mockedDatasetName);
    expect(result).toEqual(_mockedDataset);
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
    _mockedReadDatasets.mockReturnValueOnce(new Array(1));

    try {
      await s.addDataset();
    } catch (e) {
      expect(e).toMatchSnapshot();
    }
  });

  it('should add a dataset', async () => {
    _mockedReadDatasets.mockReturnValueOnce([]);

    await s.addDataset();
    expect(s.getRelease).toHaveBeenCalledTimes(1);
    expect(_mockedReadDatasets).toHaveBeenCalledTimes(1);
    expect(_mockedBuildDatasetObj).toHaveBeenCalledTimes(1);
    expect(_mockedDump).toHaveBeenCalledTimes(1);
    expect(_mockedBuildCodeBlock).toHaveBeenCalledTimes(1);
    expect(_mockedInsertIntoNote).toHaveBeenCalledTimes(1);
    expect(s.updateReleaseNote).toHaveBeenCalledTimes(1);
  });
});

describe('updateDataset', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    s = new Smuggler();
    s.getRelease = jest.fn();
    s.getRelease.mockResolvedValueOnce({ body: _mockedReleaseNote });
    s.addDataset = jest.fn();
    s.updateReleaseNote = jest.fn();
  });

  it('should add if dataset not exits', async () => {
    _mockedReadDatasets.mockReturnValueOnce([]);

    try {
      await s.updateDataset(
        _mockedTagName,
        _mockedDatasetName,
        _mockedNewDataset
      );
    } catch (e) {
      expect(s.getRelease).toHaveBeenCalledTimes(1);
      expect(_mockedReadDatasets).toHaveBeenCalledTimes(1);
      expect(e.message).toMatchSnapshot();
    }
  });

  it("should add if dataset does't not exit", async () => {
    _mockedReadDatasets.mockReturnValueOnce([]);
    _mockedGetNewDataset.mockReturnValueOnce(_mockedNewDataset);

    await s.updateDataset(
      _mockedTagName,
      _mockedDatasetName,
      _mockedNewDataset,
      true
    );

    expect(s.addDataset).toHaveBeenCalledTimes(1);
    expect(s.addDataset.mock.calls[0][0]).toBe(_mockedTagName);
    expect(s.addDataset.mock.calls[0][1]).toBe(_mockedDatasetName);
    expect(s.addDataset.mock.calls[0][2]).toEqual(_mockedNewDataset);

    expect(s.updateReleaseNote).toHaveBeenCalledTimes(0);
  });

  it('should update the dataset', async () => {
    const start = 2;
    const length = 3;
    _mockedReadDatasets.mockReturnValueOnce([
      { dataset: _mockedDataset, start, length },
    ]);
    _mockedGetNewDataset.mockReturnValueOnce(_mockedNewDataset);
    _mockedBuildDatasetObj.mockReturnValueOnce({
      'dateset-name': _mockedDatasetName,
      dataset: _mockedNewDataset,
    });
    _mockedDump.mockReturnValueOnce(_mockedNewYamlString);
    _mockedBuildCodeBlock.mockReturnValueOnce(_mockedNewDatasetCodeBlock);
    _mockedGetSplicedNote.mockReturnValueOnce(_mockedNewReleaseNote);

    await s.updateDataset(
      _mockedTagName,
      _mockedDatasetName,
      _mockedNewDataset
    );

    expect(_mockedReadDatasets).toHaveBeenCalledTimes(1);
    expect(_mockedReadDatasets.mock.calls[0][0]).toBe(_mockedReleaseNote);
    expect(_mockedReadDatasets.mock.calls[0][1]).toBe(_mockedDatasetName);

    expect(_mockedGetNewDataset).toHaveBeenCalledTimes(1);
    expect(_mockedGetNewDataset.mock.calls[0][0]).toBe(_mockedNewDataset);
    expect(_mockedGetNewDataset.mock.calls[0][1]).toBe(_mockedDataset);

    expect(_mockedBuildDatasetObj).toHaveBeenCalledTimes(1);
    expect(_mockedBuildDatasetObj.mock.calls[0][0]).toBe(_mockedDatasetName);
    expect(_mockedBuildDatasetObj.mock.calls[0][1]).toBe(_mockedNewDataset);

    expect(_mockedDump).toHaveBeenCalledTimes(1);
    expect(_mockedDump.mock.calls[0][0]).toEqual({
      'dateset-name': _mockedDatasetName,
      dataset: _mockedNewDataset,
    });

    expect(_mockedBuildCodeBlock).toHaveBeenCalledTimes(1);
    expect(_mockedBuildCodeBlock.mock.calls[0][0]).toBe(_mockedNewYamlString);

    expect(_mockedGetSplicedNote).toHaveBeenCalledTimes(1);
    expect(_mockedGetSplicedNote.mock.calls[0][0]).toBe(_mockedReleaseNote);
    expect(_mockedGetSplicedNote.mock.calls[0][1]).toBe(start);
    expect(_mockedGetSplicedNote.mock.calls[0][2]).toBe(length);
    expect(_mockedGetSplicedNote.mock.calls[0][3]).toBe(
      _mockedNewDatasetCodeBlock
    );

    expect(s.updateReleaseNote).toHaveBeenCalledTimes(1);
    expect(s.updateReleaseNote.mock.calls[0][0]).toBe(_mockedTagName);
    expect(s.updateReleaseNote.mock.calls[0][1]).toBe(_mockedNewReleaseNote);
  });
});
