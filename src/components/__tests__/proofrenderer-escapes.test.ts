import { describe, expect, test } from 'bun:test';
import { renderInlineText } from '../../utils/latexText';

describe('renderInlineText escapes', () => {
  test('hash escape in heading text', () => {
    expect(renderInlineText('PKCS\\#1 v1.5 Padding')).toBe('PKCS#1 v1.5 Padding');
  });
  test('balanced wrappers still work', () => {
    expect(renderInlineText('\\textbf{Small} end')).toBe('<strong>Small</strong> end');
  });
  test('unbalanced opener from math-split is stripped, no literal backslash', () => {
    const out = renderInlineText('\\textbf{Small ');
    expect(out).not.toContain('\\');
    expect(out).toContain('Small');
  });
  test('orphan closer from math-split is stripped', () => {
    expect(renderInlineText(':} When done')).not.toContain('}');
  });
  test('legit prose untouched', () => {
    expect(renderInlineText('plain words & symbols')).toBe('plain words &amp; symbols');
  });
  test('escaped braces become literals', () => {
    expect(renderInlineText('set \\{a, b\\} done')).toBe('set {a, b} done');
    expect(renderInlineText('value \\} end')).toBe('value } end');
  });
});
