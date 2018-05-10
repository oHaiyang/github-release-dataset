/* eslint-env jest */
import { buildCodeBlock, COMMENT } from '../src/utils';

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
