import { describe, expect, it } from 'vitest';
import { classifyScan } from './scanResult';

describe('scan result classification', () => {
  it('offers links only for HTTP URLs', () => {
    expect(classifyScan('https://example.com/path')).toEqual({ label: 'Website link', url: 'https://example.com/path' });
    expect(classifyScan('javascript:alert(1)')).toEqual({ label: 'Text' });
  });
  it('identifies common QR payloads', () => {
    expect(classifyScan('mailto:a@example.com').label).toBe('Email');
    expect(classifyScan('tel:+15551234').label).toBe('Phone number');
    expect(classifyScan('sms:+15551234').label).toBe('SMS message');
    expect(classifyScan('WIFI:T:WPA;S:Home;;').label).toBe('Wi-Fi network');
  });
});
