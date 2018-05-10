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
  tag_name: '_mockRelease',
  body: _mockReleaseNote,
};


describe('getRelease', () => {
  it('should return cached release if exists', async () => {
    const s = new Smuggler();
    s.releases[_mockTagName] = _mockRelease;

    expect(await s.getRelease(_mockTagName)).toEqual(_mockRelease);
    expect(s.g.repos.getReleaseByTag.mock).toBeTruthy(); 
  });
});
