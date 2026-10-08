export type ScanClassification = { label: string; url?: string };

export function classifyScan(value: string): ScanClassification {
  try { const url = new URL(value); if (url.protocol === 'http:' || url.protocol === 'https:') return { label: 'Website link', url: url.href }; } catch { /* plain text */ }
  if (/^mailto:/i.test(value)) return { label: 'Email' };
  if (/^tel:/i.test(value)) return { label: 'Phone number' };
  if (/^sms:/i.test(value)) return { label: 'SMS message' };
  if (/^WIFI:/i.test(value)) return { label: 'Wi-Fi network' };
  return { label: 'Text' };
}
