import { describe, it, expect } from 'vitest';
import { extractUtmParams, UTM_KEYS } from '@/scripts/utm';

describe('extractUtmParams', () => {
  it('returns all 5 standard utm keys when present', () => {
    const url = 'https://stockupdinners.com/?utm_source=pinterest&utm_medium=pin&utm_campaign=launch&utm_term=costco&utm_content=v1';
    expect(extractUtmParams(url)).toEqual({
      utm_source: 'pinterest',
      utm_medium: 'pin',
      utm_campaign: 'launch',
      utm_term: 'costco',
      utm_content: 'v1',
    });
  });

  it('omits keys that are not present', () => {
    const url = 'https://stockupdinners.com/?utm_source=reddit&utm_medium=comment';
    expect(extractUtmParams(url)).toEqual({
      utm_source: 'reddit',
      utm_medium: 'comment',
    });
  });

  it('returns empty object when no utm params', () => {
    expect(extractUtmParams('https://stockupdinners.com/')).toEqual({});
  });

  it('ignores non-utm query params', () => {
    const url = 'https://stockupdinners.com/?ref=foo&utm_source=facebook';
    expect(extractUtmParams(url)).toEqual({ utm_source: 'facebook' });
  });

  it('accepts bare search string from window.location.search', () => {
    expect(extractUtmParams('?utm_source=organic&utm_medium=direct')).toEqual({
      utm_source: 'organic',
      utm_medium: 'direct',
    });
  });

  it('exports the canonical 5-key list', () => {
    expect(UTM_KEYS).toEqual([
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
    ]);
  });
});
