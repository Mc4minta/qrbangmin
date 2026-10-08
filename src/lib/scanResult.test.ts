import { describe, expect, it } from 'vitest';
import { classifyScan } from './scanResult';

describe('scan result classification', () => {
  it('offers links only for HTTP URLs', () => {
    expect(classifyScan('https://example.com/path').url).toBe('https://example.com/path');
    expect(classifyScan('javascript:alert(1)').kind).toBe('text');
  });
  it('identifies common QR payloads', () => {
    expect(classifyScan('mailto:a@example.com').kind).toBe('email');
    expect(classifyScan('tel:+15551234').kind).toBe('phone');
    expect(classifyScan('sms:+15551234').kind).toBe('sms');
    expect(classifyScan('WIFI:T:WPA;S:Home;;').values).toContainEqual({ label: 'Network', value: 'Home' });
  });
});
