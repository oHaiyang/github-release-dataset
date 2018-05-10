/* eslint-env jest */
import { buildCodeBlock, buildDatasetObj, readDatasets, COMMENT, DATASET_KEY } from '../src/utils';

const _jerryDatasetName = '_jerry';
const _tomDatasetName = '_tom';
const _mockNote = 
`
this is a test line.

\`\`\`yaml
this is not a dataset
\`\`\`

\`\`\`yaml
dataset-name: _jerry
dataset:
  _foe: _tom
\`\`\`

yohohoho

\`\`\`yaml
dataset-name: _tom
dataset:
  _food: _jerry
\`\`\`

this is another test line
`;

describe('buildCodeBlock', () => {

  it('should return a yaml block', () => {
    const _text = '---';

    const _block = `\`\`\`yaml
${COMMENT}

---
\`\`\``;

    expect(buildCodeBlock(_text)).toBe(_block);
  });

});

describe('buildDatasetObj', () => {

  it('should consturct a dataset object', () => {
    const _name = '_jerry';
    const _dataset = {
      _foe: '_tom',
    };

    expect(buildDatasetObj(_name, _dataset)).toEqual({
      [DATASET_KEY]: _name,
      dataset: _dataset,
    });
  });

});

describe('readDatasets', () => {

  it('should read all datasets when datasetName not provided', () => {
    expect(readDatasets(_mockNote)).toMatchSnapshot();
  });

  it('should read datasets have specified name', () => {
    expect(readDatasets(_mockNote, _jerryDatasetName)).toMatchSnapshot();
  });
});
