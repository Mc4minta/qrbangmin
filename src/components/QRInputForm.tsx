import type { Fields, QRType } from '../lib/qrPayload';
import { t, type Language } from '../i18n';
interface Props { type: QRType; fields: Fields; setFields: (fields: Fields) => void; language: Language }
const limit = (value: string, max: number) => Array.from(value).slice(0, max).join('');
export default function QRInputForm({ type, fields, setFields, language }: Props) {
  const input = (key: keyof Fields, label: string, placeholder: string, inputType = 'text') => { const max = key === 'url' ? 2048 : key === 'password' ? 256 : key === 'ssid' ? 128 : key === 'email' ? 254 : key === 'phone' ? 32 : 200; return <label className="field" key={key} htmlFor={key}>{label}<input id={key} type={inputType} maxLength={max} value={String(fields[key])} placeholder={placeholder} onChange={e => setFields({ ...fields, [key]: e.target.value })} autoComplete="off" spellCheck={false}/></label>; };
  const area = (key: 'text' | 'body' | 'message', label: string, placeholder: string, max = 500) => <label className="field" htmlFor={key}>{label}<textarea id={key} rows={3} value={fields[key]} placeholder={placeholder} onChange={e => setFields({ ...fields, [key]: limit(e.target.value, max) })}/>{key === 'text' && <span className={`character-counter ${Array.from(fields.text).length >= 450 ? 'near-limit' : ''}`}>{Array.from(fields.text).length} / 500 {t(language, 'characters')}{Array.from(fields.text).length >= 450 ? ` · ${t(language, 'approachingLimit')}` : ''}</span>}</label>;
  return <div className="input-form">
    {type === 'url' && input('url', t(language, 'websiteUrl'), 'https://example.com', 'url')}
    {type === 'text' && area('text', t(language, 'yourText'), t(language, 'textPlaceholder'))}
    {type === 'wifi' && <>{input('ssid', t(language, 'networkName'), 'Home Wi-Fi')}<label className="field" htmlFor="security">{t(language, 'security')}<select id="security" value={fields.security} onChange={e => setFields({ ...fields, security: e.target.value as Fields['security'] })}><option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">{t(language, 'noPassword')}</option></select></label>{fields.security !== 'nopass' && input('password', t(language, 'password'), 'Password', 'password')}<label className="check"><input type="checkbox" checked={fields.hidden} onChange={e => setFields({ ...fields, hidden: e.target.checked })}/> {t(language, 'hiddenNetwork')}</label></>}
    {type === 'email' && <>{input('email', t(language, 'emailAddress'), 'hello@example.com', 'email')}{input('subject', t(language, 'subject'), 'Subject')}{area('body', t(language, 'message'), 'Message')}</>}
    {(type === 'phone' || type === 'sms') && input('phone', t(language, 'phoneNumber'), '+1 555 123 4567', 'tel')}
    {type === 'sms' && area('message', t(language, 'message'), 'Message')}
  </div>;
}
