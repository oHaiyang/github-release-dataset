/* eslint-env jest */
import {
  buildCodeBlock,
  buildDatasetObj,
  readDatasets,
  insertIntoNote,
  getNewDataset,
  getSplicedNote,
  COMMENT,
  DATASET_KEY,
} from '../src/utils';

const _jerryDatasetName = '_jerry';
const _mockedNote = `
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
    expect(readDatasets(_mockedNote)).toMatchSnapshot();
  });

  it('should read datasets have specified name', () => {
    expect(readDatasets(_mockedNote, _jerryDatasetName)).toMatchSnapshot();
  });
});

describe('insertIntoNote', () => {
  const note = '_note';
  const text = '_text';

  it('should insert and defaultly insert to bottom', () => {
    expect(insertIntoNote(note, text)).toBe(`${note}\n${text}`);
    expect(insertIntoNote(note, text, false)).toBe(`${note}\n${text}`);
  });

  it('should insert to top', () => {
    expect(insertIntoNote(note, text, true)).toBe(`${text}\n${note}`);
  });
});

describe('getNewDataset', () => {
  const _mockedNewDataset2 = { key: '_updatedByUpdater' };
  const _mockedUpdater = jest.fn(() => _mockedNewDataset2);
  const _mockedOldDataset = { key: '_old' };
  const _mockedNewDataset = { key: '_new' };

  it('should return new dataset object', () => {
    expect(getNewDataset(_mockedNewDataset, _mockedOldDataset)).toEqual(
      _mockedNewDataset
    );
  });

  it('should update dataset up updater', () => {
    expect(getNewDataset(_mockedUpdater, _mockedOldDataset)).toEqual(
      _mockedNewDataset2
    );
  });
});

describe('getSplicedNote', () => {
  it('should spliced note', () => {
    expect(getSplicedNote('yep', 0, 0)).toBe('yep');
    expect(getSplicedNote('yep', 0, 1)).toBe('ep');
    expect(getSplicedNote('yep', 1, 1)).toBe('yp');
    expect(getSplicedNote('yep', 2, 0, 'l')).toBe('yelp');
    expect(getSplicedNote('yep', 2, 1, 's')).toBe('yes');
  });
});
