import type { Fields, QRType } from '../lib/qrPayload';
interface Props { type: QRType; fields: Fields; setFields: (fields: Fields) => void }
export default function QRInputForm({ type, fields, setFields }: Props) {
  const input = (key: keyof Fields, label: string, placeholder: string, inputType = 'text') => <label className="field" key={key} htmlFor={key}>{label}<input id={key} type={inputType} value={String(fields[key])} placeholder={placeholder} onChange={e => setFields({ ...fields, [key]: e.target.value })} autoComplete="off" spellCheck={false}/></label>;
  const area = (key: 'text' | 'body' | 'message', label: string, placeholder: string) => <label className="field" htmlFor={key}>{label}<textarea id={key} rows={3} value={fields[key]} placeholder={placeholder} onChange={e => setFields({ ...fields, [key]: e.target.value })}/></label>;
  return <div className="input-form">
    {type === 'url' && <>{input('url', 'Website URL', 'https://example.com', 'url')}<p className="hint">Send someone straight to your website, portfolio, or favorite link.</p></>}
    {type === 'text' && area('text', 'Your text', 'A little message worth sharing…')}
    {type === 'wifi' && <>{input('ssid', 'Network name (SSID)', 'Your Wi-Fi network')}<label className="field" htmlFor="security">Security<select id="security" value={fields.security} onChange={e => setFields({ ...fields, security: e.target.value as Fields['security'] })}><option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">No password</option></select></label>{fields.security !== 'nopass' && input('password', 'Password', 'Network password', 'password')}<label className="check"><input type="checkbox" checked={fields.hidden} onChange={e => setFields({ ...fields, hidden: e.target.checked })}/> Hidden network</label></>}
    {type === 'email' && <>{input('email', 'Email address', 'hello@example.com', 'email')}{input('subject', 'Subject (optional)', 'Say hello')}{area('body', 'Message (optional)', 'Your message…')}</>}
    {(type === 'phone' || type === 'sms') && input('phone', 'Phone number', '+1 555 123 4567', 'tel')}
    {type === 'sms' && area('message', 'Message (optional)', 'Your message…')}
  </div>;
}
