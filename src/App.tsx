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
import { hasSafeContrast, validateQRPayload } from './lib/qrReliability';
import { t, translateValidationError, type Language, type TranslationKey } from './i18n';
import QRInputForm from './components/QRInputForm';
import LogoUploader from './components/LogoUploader';
import QRPreview from './components/QRPreview';
const QRScanner = lazy(() => import('./components/QRScanner'));

const types = [
  { id: 'url', label: 'website', icon: Link }, { id: 'text', label: 'text', icon: AlignLeft }, { id: 'wifi', label: 'wifi', icon: Wifi }, { id: 'email', label: 'email', icon: Mail }, { id: 'phone', label: 'phone', icon: Phone }, { id: 'sms', label: 'sms', icon: MessageSquare },
] as const;

type Tab = 'generate' | 'scan';
type Theme = 'light' | 'dark';

export default function App() {
  const [tab, setTab] = useState<Tab>('generate');
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('local-qr-theme');
    return saved === 'dark' || saved === 'light' ? saved : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('local-qr-language') === 'th' ? 'th' : 'en');
  const [type, setType] = useState<QRType>('url');
  const [fields, setFields] = useState({ ...emptyFields, url: 'example.com' });
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');
  const [dots, setDots] = useState<DotType>('square');
  const [corner, setCorner] = useState<CornerSquareType>('square');
  const [cornerDot, setCornerDot] = useState<CornerDotType>('square');
  const [logo, setLogo] = useState('');
  const [size, setSize] = useState(1024);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('local-qr-theme', theme);
  }, [theme]);
  useEffect(() => { document.documentElement.lang = language; localStorage.setItem('local-qr-language', language); }, [language]);

  function selectTab(next: Tab) { setTab(next); }
  function onTabsKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    selectTab(event.key === 'ArrowLeft' || event.key === 'Home' ? 'generate' : 'scan');
    document.getElementById(`tab-${event.key === 'ArrowLeft' || event.key === 'Home' ? 'generate' : 'scan'}`)?.focus();
  }

  const payload = buildPayload(type, fields);
  const validation = useMemo(() => payload.data ? validateQRPayload(payload.data, Boolean(logo)) : undefined, [payload.data, logo]);
  const level: ErrorCorrectionLevel = validation?.valid ? validation.value.level : 'M';
  const safeContrast = hasSafeContrast(foreground, background);
  const generationError = payload.error || (validation && !validation.valid ? validation.error : undefined);
  const localizedGenerationError = translateValidationError(language, generationError);
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
    setFields({ ...emptyFields, url: 'example.com' });
    setForeground('#000000');
    setBackground('#ffffff');
    setDots('square');
    setCorner('square');
    setCornerDot('square');
    setLogo('');
    setSize(1024);
    setResetKey(n => n + 1);
  }

  function upload(value: string) {
    setLogo(value);
  }

  function useSafeSettings() {
    setForeground('#171717'); setBackground('#ffffff'); setDots('square'); setCorner('square'); setCornerDot('square');
  }

  return (
    <>
      <header className="site-header">
        <a href="#main" className="brand" aria-label="Local QR home">
          <span className="brand-icon"><QrCode size={22} /></span>
          local<span className="brand-qr">qr</span><span className="brand-dot">.</span>
        </a>
        <div className="header-actions">
          <div className="language-toggle" aria-label={t(language, 'language')}>
            <button type="button" aria-pressed={language === 'en'} className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
            <button type="button" aria-pressed={language === 'th'} className={language === 'th' ? 'active' : ''} onClick={() => setLanguage('th')}>TH</button>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(current => current === 'light' ? 'dark' : 'light')}
            aria-label={t(language, 'theme')}
            title={t(language, 'theme')}
          >
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        </div>
      </header>

      <main id="main">
        <div className="mode-tabs" role="tablist" aria-label="QR tools" onKeyDown={onTabsKeyDown}>
          <button id="tab-generate" role="tab" type="button" className={`mode-tab ${tab === 'generate' ? 'selected' : ''}`}
            aria-selected={tab === 'generate'} aria-controls="panel-generate" tabIndex={tab === 'generate' ? 0 : -1} onClick={() => selectTab('generate')}>
            <QrCode size={18} /> {t(language, 'generate')}
          </button>
          <button id="tab-scan" role="tab" type="button" className={`mode-tab ${tab === 'scan' ? 'selected' : ''}`}
            aria-selected={tab === 'scan'} aria-controls="panel-scan" tabIndex={tab === 'scan' ? 0 : -1} onClick={() => selectTab('scan')}>
            <ScanLine size={18} /> {t(language, 'scan')}
          </button>
        </div>

        {tab === 'generate' ? (
          <div id="panel-generate" role="tabpanel" aria-labelledby="tab-generate" className="workspace">
            <section className="config-card" aria-label="QR code settings">
              <div className="card-heading">
                <h1>{t(language, 'generateTitle')}</h1>
                <button type="button" className="reset-button" onClick={reset}>
                  <RotateCcw size={14} /> {t(language, 'reset')}
                </button>
              </div>

              <div className="section">
                <h2>{t(language, 'content')}</h2>
                <div className="type-grid" role="group" aria-label="QR content type">
                  {types.map(({ id, label, icon: Icon }) => (
                    <button type="button" key={id}
                      className={`type-button ${type === id ? 'selected' : ''}`}
                      aria-pressed={type === id} onClick={() => setType(id)}>
                      <Icon size={19} />{t(language, label as TranslationKey)}
                    </button>
                  ))}
                </div>
                <QRInputForm type={type} fields={fields} setFields={setFields} language={language} />
                {localizedGenerationError && <p className="validation" role="status">{localizedGenerationError}</p>}
              </div>

              <div className="section">
                <h2>{t(language, 'appearance')}</h2>
                <div className="color-grid">
                  {[
                    { label: t(language, 'foreground'), value: foreground, change: setForeground },
                    { label: t(language, 'background'), value: background, change: setBackground },
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
                <label className="field">{t(language, 'dotStyle')}</label>
                <div className="style-grid" role="group" aria-label="Dot style">
                  {(['square', 'rounded', 'dots', 'classy'] as const).map(style => (
                    <button type="button" key={style}
                      className={`style-button ${dots === style ? 'selected' : ''}`}
                      aria-pressed={dots === style} onClick={() => setDots(style)}>
                      <span className={`dot-sample ${style}`}>
                        {Array.from({ length: 9 }, (_, i) => <i key={i} />)}
                      </span>
                      <span>{style === 'square' ? t(language, 'square') : style === 'rounded' ? t(language, 'rounded') : style}</span>
                    </button>
                  ))}
                </div>
                <div className="control-grid">
                  <label className="field" htmlFor="corner">{t(language, 'cornerSquares')}
                    <select id="corner" value={corner}
                      onChange={e => setCorner(e.target.value as CornerSquareType)}>
                      <option value="extra-rounded">{t(language, 'rounded')}</option><option value="square">{t(language, 'square')}</option><option value="dot">{t(language, 'circle')}</option>
                    </select>
                  </label>
                  <label className="field" htmlFor="corner-dot">{t(language, 'cornerDots')}
                    <select id="corner-dot" value={cornerDot}
                      onChange={e => setCornerDot(e.target.value as CornerDotType)}>
                      <option value="dot">{t(language, 'circle')}</option><option value="square">{t(language, 'square')}</option>
                    </select>
                  </label>
                </div>
                {!safeContrast && <div className="reliability-warning" role="status">{t(language, 'colorWarning')} <button type="button" onClick={useSafeSettings}>{t(language, 'safeSettings')}</button></div>}
              </div>

              <div className="section">
                <h2>{t(language, 'logoReliability')}</h2>
                <LogoUploader key={resetKey} logo={logo} onChange={upload} language={language} />
                <p className="validation">{t(language, 'automaticCorrection')}: <strong>{validation?.valid ? `${level} · ${validation.value.modules} modules` : t(language, 'waitingValid')}</strong></p>
                {logo && <p className="hint">{t(language, 'logoLimit')}</p>}
              </div>
            </section>
            <QRPreview key={resetKey} data={generationError ? undefined : payload.data} error={localizedGenerationError} language={language}
              options={options} type={type} size={size} setSize={setSize} />
          </div>
        ) : (
          <section id="panel-scan" role="tabpanel" aria-labelledby="tab-scan" className="scan-panel">
            <Suspense fallback={<div className="scanner-card">Loading scanner…</div>}><QRScanner language={language} /></Suspense>
          </section>
        )}
      </main>
    </>
  );
}
