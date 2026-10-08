import type { Options } from 'qr-code-styling';
export const defaults: Options = {
  width: 1024, height: 1024, type: 'svg', margin: 48,
  dotsOptions: { type: 'square', color: '#242b45' },
  backgroundOptions: { color: '#ffffff' },
  cornersSquareOptions: { type: 'extra-rounded', color: '#242b45' },
  cornersDotOptions: { type: 'dot', color: '#242b45' },
  qrOptions: { errorCorrectionLevel: 'M' },
  imageOptions: { imageSize: 0.22, margin: 8, hideBackgroundDots: true },
};
