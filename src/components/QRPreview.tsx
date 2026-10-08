import QRCodeStyling, { type Options, type FileExtension } from 'qr-code-styling';
import { Download, QrCode, Check, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { QRType } from '../lib/qrPayload';
import { t, type Language } from '../i18n';
interface Props { data?: string; error?: string; options: Options; type: QRType; size: number; setSize: (size: number) => void; language: Language }
export default function QRPreview({ data, error, options, type, size, setSize, language }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const qr = useRef<QRCodeStyling | null>(null);
  const revision = useRef(0);
  const [ready, setReady] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [exportError, setExportError] = useState('');
  const [format, setFormat] = useState<FileExtension>('png');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const current = ++revision.current;
    setReady(false); setGenerationError(''); setExportError('');
    if (!data) { mount.current?.replaceChildren(); return; }
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const config = { ...options, width: size, height: size, margin: Math.round(size * 0.047), data };
          if (!qr.current) qr.current = new QRCodeStyling(config); else qr.current.update(config);
          // Wait for logo embedding and SVG rendering before exposing a downloadable design.
          const blob = await qr.current.getRawData('svg');
          if (!blob) throw new Error();
          if (current === revision.current && mount.current) { mount.current.replaceChildren(); qr.current.append(mount.current); setReady(true); }
        } catch { if (current === revision.current) setGenerationError('This design could not be generated. Shorten the content or reduce error correction.'); }
      })();
    }, 160);
    return () => { window.clearTimeout(timer); revision.current++; };
  }, [data, options, size]);
  async function download() {
    if (!qr.current || !ready) return;
    setBusy(true); setExportError('');
    try { await qr.current.download({ name: `local-qr-${type}-${size}px`, extension: format }); }
    catch { setExportError('Download failed. Try SVG or another image size.'); }
    finally { setBusy(false); }
  }
  const message = generationError || error;
  return <aside className="preview-card" aria-label={t(language, 'preview')}><div className="preview-heading"><span className="eyebrow">{t(language, 'preview')}</span><span className={`status ${ready ? 'valid' : ''}`}><span/>{ready ? t(language, 'ready') : data && !generationError ? t(language, 'generating') : t(language, 'waiting')}</span></div><div className="preview-stage"><div ref={mount} className={`qr-image ${ready ? '' : 'hidden'}`} role="img" aria-label="Generated QR code"/>{!ready && <div className="placeholder"><QrCode size={56} strokeWidth={1}/><strong>{data && !generationError ? `${t(language, 'generating')}…` : t(language, 'waiting')}</strong><p>{message}</p></div>}</div><div className="download-controls"><label className="field" htmlFor="size">{t(language, 'imageSize')}<select id="size" value={size} onChange={e => setSize(Number(e.target.value))}>{[256, 512, 1024, 2048].map(n => <option key={n} value={n}>{n} × {n} px</option>)}</select></label><label className="field" htmlFor="format">{t(language, 'fileFormat')}<select id="format" value={format} onChange={e => setFormat(e.target.value as FileExtension)}><option value="png">PNG</option><option value="svg">SVG</option><option value="jpeg">JPEG</option></select></label></div><button className="download-button" disabled={!ready || busy} onClick={() => void download()}><Download size={19}/>{busy ? '…' : t(language, 'download')}</button>{exportError && <p className="error" role="alert">{exportError}</p>}{generationError && <p className="error" role="alert">{generationError}</p>}<div className="privacy-note"><ShieldCheck size={18}/><span>{t(language, 'generatedLocally')}</span></div></aside>;
}
