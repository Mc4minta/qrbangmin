import type { Options } from 'qr-code-styling';
export const defaults: Options = {
  width: 1024, height: 1024, type: 'svg', margin: 48,
  dotsOptions: { type: 'square', color: '#000000' },
  backgroundOptions: { color: '#ffffff' },
  cornersSquareOptions: { type: 'square', color: '#000000' },
  cornersDotOptions: { type: 'square', color: '#000000' },
  qrOptions: { errorCorrectionLevel: 'M' },
  imageOptions: { imageSize: 0.22, margin: 8, hideBackgroundDots: true },
};
