export type QRType = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms';
export interface Fields { url: string; text: string; ssid: string; password: string; security: 'WPA' | 'WEP' | 'nopass'; hidden: boolean; email: string; subject: string; body: string; phone: string; message: string }
export const emptyFields: Fields = { url: '', text: '', ssid: '', password: '', security: 'WPA', hidden: false, email: '', subject: '', body: '', phone: '', message: '' };
export type PayloadResult = { data: string; error?: never } | { data?: never; error: string };
const escapeWifi = (value: string) => value.replace(/[\\;,:\"]/g, '\\$&');
export function buildPayload(type: QRType, fields: Fields): PayloadResult {
  let data: string;
  switch (type) {
    case 'url': {
      if (!fields.url.trim()) return { error: 'Enter a website URL to get started.' };
      try { const input = fields.url.trim(); if (/^[a-z][a-z\d+.-]*:/i.test(input) && !/^https?:\/\//i.test(input)) throw new Error(); const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`); if (!['https:', 'http:'].includes(url.protocol) || !url.hostname) throw new Error(); data = url.href; }
      catch { return { error: 'Enter a complete http:// or https:// URL.' }; }
      break;
    }
    case 'text':
      if (!fields.text.trim()) return { error: 'Enter the text you want to share.' };
      data = fields.text; break;
    case 'wifi':
      if (!fields.ssid.trim()) return { error: 'Enter your network name.' };
      if (fields.security !== 'nopass' && !fields.password) return { error: 'Enter your Wi-Fi password.' };
      data = `WIFI:T:${fields.security};S:${escapeWifi(fields.ssid)};${fields.security !== 'nopass' ? `P:${escapeWifi(fields.password)};` : ''}H:${fields.hidden};;`; break;
    case 'email': {
      const email = fields.email.trim();
      if (!/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)) return { error: 'Enter a valid email address.' };
      const query = [fields.subject && `subject=${encodeURIComponent(fields.subject)}`, fields.body && `body=${encodeURIComponent(fields.body)}`].filter(Boolean).join('&');
      data = `mailto:${encodeURIComponent(email).replace(/%40/g, '@')}${query ? '?' + query : ''}`; break;
    }
    case 'phone':
    case 'sms': {
      const phone = fields.phone.trim().replace(/[\s().-]/g, '');
      if (!/^\+?\d{3,15}$/.test(phone)) return { error: 'Enter a phone number with 3–15 digits and an optional + prefix.' };
      data = type === 'phone' ? `tel:${phone}` : `sms:${phone}${fields.message ? `?body=${encodeURIComponent(fields.message)}` : ''}`; break;
    }
  }
  return { data };
}
