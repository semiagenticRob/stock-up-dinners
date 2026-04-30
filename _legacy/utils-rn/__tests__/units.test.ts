import {
  convertUnit,
  normalizeToDefaultUnit,
  formatQuantity,
  scaleForServings,
  packagesNeeded,
} from '../units';

describe('convertUnit', () => {
  it('returns same value for same unit', () => {
    expect(convertUnit(5, 'lb', 'lb')).toBe(5);
    expect(convertUnit(8, 'oz', 'oz')).toBe(8);
  });

  it('converts lb to oz', () => {
    expect(convertUnit(1, 'lb', 'oz')).toBe(16);
    expect(convertUnit(0.5, 'lb', 'oz')).toBe(8);
    expect(convertUnit(2.5, 'lb', 'oz')).toBe(40);
  });

  it('converts oz to lb', () => {
    expect(convertUnit(16, 'oz', 'lb')).toBe(1);
    expect(convertUnit(8, 'oz', 'lb')).toBe(0.5);
    expect(convertUnit(2, 'oz', 'lb')).toBe(0.125);
  });

  it('throws for incompatible units', () => {
    expect(() => convertUnit(1, 'lb', 'can')).toThrow('incompatible');
    expect(() => convertUnit(1, 'count', 'lb')).toThrow('incompatible');
    expect(() => convertUnit(1, 'fl_oz', 'lb')).toThrow('incompatible');
  });
});

describe('normalizeToDefaultUnit', () => {
  it('converts recipe oz to ingredient default lb', () => {
    // Recipe says "2 oz parm" but ingredient default is lb
    expect(normalizeToDefaultUnit(2, 'oz', 'lb')).toBeCloseTo(0.125);
  });

  it('passes through same units', () => {
    expect(normalizeToDefaultUnit(6.5, 'lb', 'lb')).toBe(6.5);
    expect(normalizeToDefaultUnit(2, 'can', 'can')).toBe(2);
  });

  it('throws for incompatible units', () => {
    expect(() => normalizeToDefaultUnit(1, 'can', 'lb')).toThrow(
      'not compatible'
    );
  });
});

describe('formatQuantity', () => {
  it('formats pounds', () => {
    expect(formatQuantity(6.5, 'lb')).toBe('6.5 lb');
    expect(formatQuantity(1, 'lb')).toBe('1 lb');
    expect(formatQuantity(2, 'lb')).toBe('2 lb');
  });

  it('shows oz for sub-pound weights', () => {
    expect(formatQuantity(0.125, 'lb')).toBe('2 oz');
    expect(formatQuantity(0.5, 'lb')).toBe('8 oz');
    expect(formatQuantity(0.25, 'lb')).toBe('4 oz');
  });

  it('formats cans with correct plural', () => {
    expect(formatQuantity(1, 'can')).toBe('1 can');
    expect(formatQuantity(2, 'can')).toBe('2 cans');
    expect(formatQuantity(6, 'can')).toBe('6 cans');
  });

  it('formats counts without unit label', () => {
    expect(formatQuantity(4, 'count')).toBe('4');
    expect(formatQuantity(24, 'count')).toBe('24');
  });

  it('formats fl_oz', () => {
    expect(formatQuantity(8, 'fl_oz')).toBe('8 fl oz');
  });

  it('formats oz that are >= 16 as lb', () => {
    expect(formatQuantity(32, 'oz')).toBe('2 lb');
    expect(formatQuantity(16, 'oz')).toBe('1 lb');
  });
});

describe('scaleForServings', () => {
  it('scales linearly', () => {
    expect(scaleForServings(0.75, 4)).toBe(3); // 0.75 lb per serving × 4
    expect(scaleForServings(0.75, 1)).toBe(0.75);
    expect(scaleForServings(0.75, 10)).toBe(7.5);
  });

  it('handles zero', () => {
    expect(scaleForServings(0.5, 0)).toBe(0);
  });
});

describe('packagesNeeded', () => {
  it('rounds up to whole packages', () => {
    expect(packagesNeeded(3, 6.5)).toBe(1); // 3 lb needed, 6.5 lb package
    expect(packagesNeeded(7, 6.5)).toBe(2); // 7 lb needed, need 2 bags
    expect(packagesNeeded(6.5, 6.5)).toBe(1); // exact match
  });

  it('returns 0 when nothing needed', () => {
    expect(packagesNeeded(0, 6.5)).toBe(0);
    expect(packagesNeeded(-1, 6.5)).toBe(0);
  });
});
