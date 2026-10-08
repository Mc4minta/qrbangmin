import qrcode from 'qrcode-generator';
import type { ErrorCorrectionLevel } from 'qr-code-styling';

export type QRValidation = { level: ErrorCorrectionLevel; modules: number; mode: 'Numeric' | 'Alphanumeric' | 'Byte' };
export type QRValidationResult = { valid: true; value: QRValidation } | { valid: false; error: string };

// qrcode-generator defaults to legacy byte conversion. Use UTF-8 for Thai and all Unicode input.
qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

function modeFor(value: string): QRValidation['mode'] {
  if (/^\d+$/.test(value)) return 'Numeric';
  if (/^[0-9A-Z $%*+\-./:]+$/.test(value)) return 'Alphanumeric';
  return 'Byte';
}

function encode(value: string, level: ErrorCorrectionLevel): QRValidation | undefined {
  try {
    const code = qrcode(0, level);
    const mode = modeFor(value);
    code.addData(value, mode);
    code.make();
    return { level, modules: code.getModuleCount(), mode };
  } catch { return undefined; }
}

export function validateQRPayload(value: string, hasLogo: boolean): QRValidationResult {
  const limits: Record<ErrorCorrectionLevel, number> = hasLogo ? { H: 65, Q: 70, M: 76, L: 80 } : { H: 69, Q: 74, M: 80, L: 84 };
  for (const level of ['H', 'Q', 'M', 'L'] as const) {
    const candidate = encode(value, level);
    if (candidate && candidate.modules <= limits[level]) return { valid: true, value: candidate };
  }
  const encodable = (['H', 'Q', 'M', 'L'] as const).some(level => Boolean(encode(value, level)));
  return { valid: false, error: encodable ? 'This content creates a QR code that is too dense to scan reliably. Shorten it or use fewer details.' : 'This content exceeds QR code capacity. Shorten it and try again.' };
}

function channel(value: string) {
  const component = (offset: number) => { const normalized = Number.parseInt(value.slice(offset, offset + 2), 16) / 255; return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4; };
  return component(1) * .2126 + component(3) * .7152 + component(5) * .0722;
}
export function hasSafeContrast(foreground: string, background: string) {
  if (!/^#[0-9a-f]{6}$/i.test(foreground) || !/^#[0-9a-f]{6}$/i.test(background)) return false;
  const a = channel(foreground); const b = channel(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5;
}
