/* eslint-env jest */
import Smuggler from '../src/index';

jest.mock('@octokit/rest');

const _mockTagName = '_v2.3.3';
const _mockDatasetName = '_jerry';
const _mockDataset = {
  _foe: '_tom',
}
const _mockReleaseNote = `
\`\`\`yaml
dataset-name: ${_mockTagName}
dataset:
  _foe: _tom
\`\`\`
`;
const _mockRelease = {
  meta: {},
  data: {
    tag_name: '_mockRelease',
    body: _mockReleaseNote,
  }
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
    expect(result).toEqual(_mockRelease.data);
    expect(s.releases[_mockTagName]).toEqual(_mockRelease.data);
  });

  it('should re throw an error when get remote relase failed', async () => {
    const s = new Smuggler();
    s.g.repos.getReleaseByTag.mockReturnValueOnce();

    try {
      await s.getRelease(_mockTagName);
    } catch (e) {
      expect(e.message).toMatch(new RegExp(`Failed to get release ${_mockTagName}. `)) 
    }
  });

});
