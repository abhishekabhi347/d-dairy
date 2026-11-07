import { shadeHex, withAlpha } from '@/utils/color';

describe('withAlpha', () => {
  it('appends a hex alpha channel', () => {
    expect(withAlpha('#C25E46', 0.5)).toBe('#C25E4680');
    expect(withAlpha('C25E46', 1)).toBe('#C25E46ff');
  });

  it('clamps alpha to a valid range', () => {
    expect(withAlpha('#000000', -1)).toBe('#00000000');
    expect(withAlpha('#000000', 2)).toBe('#000000ff');
  });

  it('returns malformed colors unchanged', () => {
    expect(withAlpha('rgb(1, 2, 3)', 0.5)).toBe('rgb(1, 2, 3)');
    expect(withAlpha('#fff', 0.5)).toBe('#fff');
  });
});

describe('shadeHex', () => {
  it('lightens and darkens a color', () => {
    expect(shadeHex('#000000', 0.5)).toBe('#808080');
    expect(shadeHex('#ffffff', -0.5)).toBe('#808080');
    expect(shadeHex('#C25E46', 0)).toBe('#c25e46');
  });

  it('clamps the amount', () => {
    expect(shadeHex('#123456', 5)).toBe('#ffffff');
    expect(shadeHex('#123456', -5)).toBe('#000000');
  });

  it('returns malformed colors unchanged', () => {
    expect(shadeHex('nope', 0.5)).toBe('nope');
  });
});
