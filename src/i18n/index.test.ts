import { describe, expect, it } from 'vitest';
import { t, translateValidationError } from './index';

describe('translations', () => {
  it('provides English and Thai UI labels', () => { expect(t('en', 'generate')).toBe('Generate'); expect(t('th', 'generate')).toBe('สร้าง'); });
  it('translates capacity errors without changing user content', () => expect(translateValidationError('th', 'This content exceeds QR code capacity. Shorten it and try again.')).toContain('เกินความจุ'));
});
