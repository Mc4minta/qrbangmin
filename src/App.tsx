import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  QrCode, Link, AlignLeft, Wifi, Mail, Phone, MessageSquare,
  RotateCcw, Moon, Sun, ScanLine,
} from 'lucide-react';
import type {
  Options, DotType, CornerSquareType, CornerDotType, ErrorCorrectionLevel,
} from 'qr-code-styling';
import { buildPayload, emptyFields, type QRType } from './lib/qrPayload';
import { defaults } from './lib/qrDefaults';
import QRInputForm from './components/QRInputForm';
import LogoUploader from './components/LogoUploader';
import QRPreview from './components/QRPreview';
const QRScanner = lazy(() => import('./components/QRScanner'));

const types = [
  { id: 'url', label: 'Website', icon: Link },
  { id: 'text', label: 'Text', icon: AlignLeft },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'phone', label: 'Phone', icon: Phone },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
] as const;

type Tab = 'generate' | 'scan';
type Theme = 'light' | 'dark';

export default function App() {
  const [tab, setTab] = useState<Tab>('generate');
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('local-qr-theme');
    return saved === 'dark' || saved === 'light' ? saved : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [type, setType] = useState<QRType>('url');
  const [fields, setFields] = useState({ ...emptyFields });
  const [foreground, setForeground] = useState('#b91c1c');
  const [background, setBackground] = useState('#ffffff');
  const [dots, setDots] = useState<DotType>('square');
  const [corner, setCorner] = useState<CornerSquareType>('extra-rounded');
  const [cornerDot, setCornerDot] = useState<CornerDotType>('dot');
  const [level, setLevel] = useState<ErrorCorrectionLevel>('M');
  const [logo, setLogo] = useState('');
  const [size, setSize] = useState(1024);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('local-qr-theme', theme);
  }, [theme]);

  function selectTab(next: Tab) { setTab(next); }
  function onTabsKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    selectTab(event.key === 'ArrowLeft' || event.key === 'Home' ? 'generate' : 'scan');
    document.getElementById(`tab-${event.key === 'ArrowLeft' || event.key === 'Home' ? 'generate' : 'scan'}`)?.focus();
  }

  const payload = buildPayload(type, fields);
  const options: Options = useMemo(() => ({
    ...defaults,
    image: logo || undefined,
    dotsOptions: { type: dots, color: foreground },
    backgroundOptions: { color: background },
    cornersSquareOptions: { type: corner, color: foreground },
    cornersDotOptions: { type: cornerDot, color: foreground },
    qrOptions: { errorCorrectionLevel: level },
  }), [logo, dots, foreground, background, corner, cornerDot, level]);

  function reset() {
    setType('url');
    setFields({ ...emptyFields });
    setForeground('#b91c1c');
    setBackground('#ffffff');
    setDots('square');
    setCorner('extra-rounded');
    setCornerDot('dot');
    setLevel('M');
    setLogo('');
    setSize(1024);
    setResetKey(n => n + 1);
  }

  function upload(value: string) {
    setLogo(value);
    if (value) setLevel('H');
  }

  return (
    <>
      <header className="site-header">
        <a href="#main" className="brand" aria-label="Local QR home">
          <span className="brand-icon"><QrCode size={22} /></span>
          local<span className="brand-qr">qr</span><span className="brand-dot">.</span>
        </a>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme(current => current === 'light' ? 'dark' : 'light')}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
        </button>
      </header>

      <main id="main">
        <div className="mode-tabs" role="tablist" aria-label="QR tools" onKeyDown={onTabsKeyDown}>
          <button id="tab-generate" role="tab" type="button" className={`mode-tab ${tab === 'generate' ? 'selected' : ''}`}
            aria-selected={tab === 'generate'} aria-controls="panel-generate" tabIndex={tab === 'generate' ? 0 : -1} onClick={() => selectTab('generate')}>
            <QrCode size={18} /> Generate
          </button>
          <button id="tab-scan" role="tab" type="button" className={`mode-tab ${tab === 'scan' ? 'selected' : ''}`}
            aria-selected={tab === 'scan'} aria-controls="panel-scan" tabIndex={tab === 'scan' ? 0 : -1} onClick={() => selectTab('scan')}>
            <ScanLine size={18} /> Scan
          </button>
        </div>

        {tab === 'generate' ? (
          <div id="panel-generate" role="tabpanel" aria-labelledby="tab-generate" className="workspace">
            <section className="config-card" aria-label="QR code settings">
              <div className="card-heading">
                <h1>Generate QR Code</h1>
                <button type="button" className="reset-button" onClick={reset}>
                  <RotateCcw size={14} /> Reset
                </button>
              </div>

              <div className="section">
                <h2>Content</h2>
                <div className="type-grid" role="group" aria-label="QR content type">
                  {types.map(({ id, label, icon: Icon }) => (
                    <button type="button" key={id}
                      className={`type-button ${type === id ? 'selected' : ''}`}
                      aria-pressed={type === id} onClick={() => setType(id)}>
                      <Icon size={19} />{label}
                    </button>
                  ))}
                </div>
                <QRInputForm type={type} fields={fields} setFields={setFields} />
                {!payload.data && <p className="validation" role="status">{payload.error}</p>}
              </div>

              <div className="section">
                <h2>Appearance</h2>
                <div className="color-grid">
                  {[
                    { label: 'Foreground', value: foreground, change: setForeground },
                    { label: 'Background', value: background, change: setBackground },
                  ].map(c => (
                    <label className="field" key={c.label}>{c.label}
                      <span className="color-control">
                        <input type="color" aria-label={`${c.label} color`} value={c.value}
                          onChange={e => c.change(e.target.value)} />
                        <span>{c.value.toUpperCase()}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <label className="field">Dot style</label>
                <div className="style-grid" role="group" aria-label="Dot style">
                  {(['square', 'rounded', 'dots', 'classy'] as const).map(style => (
                    <button type="button" key={style}
                      className={`style-button ${dots === style ? 'selected' : ''}`}
                      aria-pressed={dots === style} onClick={() => setDots(style)}>
                      <span className={`dot-sample ${style}`}>
                        {Array.from({ length: 9 }, (_, i) => <i key={i} />)}
                      </span>
                      <span>{style[0].toUpperCase() + style.slice(1)}</span>
                    </button>
                  ))}
                </div>
                <div className="control-grid">
                  <label className="field" htmlFor="corner">Corner squares
                    <select id="corner" value={corner}
                      onChange={e => setCorner(e.target.value as CornerSquareType)}>
                      <option value="extra-rounded">Rounded</option>
                      <option value="square">Square</option>
                      <option value="dot">Circle</option>
                    </select>
                  </label>
                  <label className="field" htmlFor="corner-dot">Corner dots
                    <select id="corner-dot" value={cornerDot}
                      onChange={e => setCornerDot(e.target.value as CornerDotType)}>
                      <option value="dot">Circle</option>
                      <option value="square">Square</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="section">
                <h2>Logo &amp; Error Correction</h2>
                <LogoUploader key={resetKey} logo={logo} onChange={upload} />
                <label className="field correction" htmlFor="correction">Error correction
                  <select id="correction" value={level}
                    onChange={e => setLevel(e.target.value as ErrorCorrectionLevel)}>
                    <option value="L">Low (L) · 7%</option>
                    <option value="M">Medium (M) · 15%</option>
                    <option value="Q">Quartile (Q) · 25%</option>
                    <option value="H">High (H) · 30%</option>
                  </select>
                </label>
              </div>
            </section>
            <QRPreview key={resetKey} data={payload.data} error={payload.error}
              options={options} type={type} size={size} setSize={setSize} />
          </div>
        ) : (
          <section id="panel-scan" role="tabpanel" aria-labelledby="tab-scan" className="scan-panel">
            <Suspense fallback={<div className="scanner-card">Loading scanner…</div>}><QRScanner /></Suspense>
          </section>
        )}
      </main>
    </>
  );
}
