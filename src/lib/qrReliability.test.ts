import { describe, expect, it } from 'vitest';
import { hasSafeContrast, validateQRPayload } from './qrReliability';

describe('QR reliability checks', () => {
  it('encodes English, Thai, mixed Unicode, URLs, and Wi-Fi payloads', () => {
    for (const value of ['Hello 123', 'สวัสดีครับ', 'Hello สวัสดี 🌏', 'https://example.com/a?query=hello', 'WIFI:T:WPA;S:บ้าน;P:รหัสผ่าน;;']) expect(validateQRPayload(value, false).valid).toBe(true);
  });
  it('uses stronger correction for compact payloads and adapts dense ones', () => {
    const short = validateQRPayload('short text', false);
    expect(short.valid && short.value.level).toBe('H');
    const logo = validateQRPayload('short text', true);
    expect(logo.valid && logo.value.level).toBe('H');
    const dense = validateQRPayload('a'.repeat(500), false);
    expect(dense.valid).toBe(true);
    if (dense.valid) expect(['Q', 'M', 'L']).toContain(dense.value.level);
  });
  it('rejects payloads beyond capacity or safe density', () => expect(validateQRPayload('😀'.repeat(2000), false).valid).toBe(false));
  it('requires contrast suitable for scanning', () => { expect(hasSafeContrast('#000000', '#ffffff')).toBe(true); expect(hasSafeContrast('#aaaaaa', '#ffffff')).toBe(false); });
});
