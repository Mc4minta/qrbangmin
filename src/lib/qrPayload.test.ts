import { describe, expect, it } from 'vitest';
import { buildPayload, emptyFields, type Fields, type QRType } from './qrPayload';
const payload = (type: QRType, changes: Partial<Fields>) => buildPayload(type, { ...emptyFields, ...changes });
describe('QR payloads', () => {
  it('normalizes website URLs', () => expect(payload('url', { url: ' https://example.com ' }).data).toBe('https://example.com/'));
  it('normalizes bare domains and rejects unsafe URLs', () => { expect(payload('url', { url: 'example.com' }).data).toBe('https://example.com/'); for (const url of ['', 'javascript:alert(1)', 'ftp://example.com']) expect(payload('url', { url }).error).toBeTruthy(); });
  it('preserves text exactly', () => expect(payload('text', { text: ' hello\nworld 🌍 ' }).data).toBe(' hello\nworld 🌍 '));
  it('escapes Wi-Fi special characters', () => expect(payload('wifi', { ssid: 'a;b:c,d"e\\f', password: 'p;q', hidden: true }).data).toBe('WIFI:T:WPA;S:a\\;b\\:c\\,d\\"e\\\\f;P:p\\;q;H:true;;'));
  it('supports open and WEP networks', () => { expect(payload('wifi', { ssid: 'Cafe', security: 'nopass' }).data).toBe('WIFI:T:nopass;S:Cafe;H:false;;'); expect(payload('wifi', { ssid: 'Cafe', security: 'WEP', password: '12345' }).data).toContain('T:WEP'); });
  it('encodes email subject and body', () => expect(payload('email', { email: 'hello@example.com', subject: 'Hello & welcome', body: 'Line 1\nLine 2' }).data).toBe('mailto:hello@example.com?subject=Hello%20%26%20welcome&body=Line%201%0ALine%202'));
  it('normalizes phone numbers', () => expect(payload('phone', { phone: '+1 (555) 123-4567' }).data).toBe('tel:+15551234567'));
  it('encodes SMS content', () => expect(payload('sms', { phone: '+15551234567', message: 'Hi & hello?' }).data).toBe('sms:+15551234567?body=Hi%20%26%20hello%3F'));
  it('rejects empty inputs for every type', () => { for (const type of ['url', 'text', 'wifi', 'email', 'phone', 'sms'] as QRType[]) expect(payload(type, {}).error).toBeTruthy(); });
  it('rejects invalid email, phone, missing passwords, and whitespace text', () => { expect(payload('email', { email: 'wrong' }).error).toBeTruthy(); expect(payload('phone', { phone: 'abc123' }).error).toBeTruthy(); expect(payload('wifi', { ssid: 'Home' }).error).toBeTruthy(); expect(payload('text', { text: '  ' }).error).toBeTruthy(); });
  it('preserves complete content for encoder-based capacity validation', () => { expect(payload('text', { text: '🌍'.repeat(301) }).data).toBe('🌍'.repeat(301)); expect(payload('text', { text: 'a'.repeat(1200) }).data).toHaveLength(1200); });
});
