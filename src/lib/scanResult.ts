export type ScanKind = 'website' | 'text' | 'wifi' | 'email' | 'phone' | 'sms';
export type ScanClassification = { kind: ScanKind; label: string; url?: string; values?: { label: string; value: string }[] };

const decode = (value: string) => { try { return decodeURIComponent(value.replace(/\+/g, ' ')); } catch { return value; } };
const unescapeWifi = (value: string) => value.replace(/\\([\\;,:”"])/g, '$1');
function wifiValues(value: string) {
  const fields: Record<string, string> = {};
  let segment = ''; let escaped = false;
  for (const character of value.slice(5)) {
    if (character === ';' && !escaped) { const separator = segment.indexOf(':'); if (separator > 0) fields[segment.slice(0, separator)] = unescapeWifi(segment.slice(separator + 1)); segment = ''; continue; }
    segment += character; escaped = character === '\\' && !escaped;
  }
  return [{ label: 'Network', value: fields.S || '' }, { label: 'Security', value: fields.T || '' }, ...(fields.H === 'true' ? [{ label: 'Hidden', value: 'Yes' }] : [])].filter(field => field.value);
}

export function classifyScan(value: string): ScanClassification {
  try { const url = new URL(value); if (url.protocol === 'http:' || url.protocol === 'https:') return { kind: 'website', label: 'Website', url: url.href, values: [{ label: 'Link', value: url.href }] }; } catch { /* plain text */ }
  if (/^mailto:/i.test(value)) { const [address, query = ''] = value.slice(7).split('?'); const params = new URLSearchParams(query); return { kind: 'email', label: 'Email', values: [{ label: 'Email', value: decode(address) }, ...(params.get('subject') ? [{ label: 'Subject', value: params.get('subject')! }] : []), ...(params.get('body') ? [{ label: 'Message', value: params.get('body')! }] : [])] }; }
  if (/^tel:/i.test(value)) return { kind: 'phone', label: 'Phone', values: [{ label: 'Phone', value: value.slice(4) }] };
  if (/^sms:/i.test(value)) { const [phone, query = ''] = value.slice(4).split('?'); const body = new URLSearchParams(query).get('body'); return { kind: 'sms', label: 'SMS', values: [{ label: 'Phone', value: phone }, ...(body ? [{ label: 'Message', value: body }] : [])] }; }
  if (/^WIFI:/i.test(value)) return { kind: 'wifi', label: 'Wi-Fi', values: wifiValues(value) };
  return { kind: 'text', label: 'Text', values: [{ label: 'Text', value }] };
}
