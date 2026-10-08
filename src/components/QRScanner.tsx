import { Camera, Copy, ExternalLink, ImageUp, RefreshCw, ScanLine, Square, Video } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useEffect, useId, useRef, useState } from 'react';
import { classifyScan } from '../lib/scanResult';
import { t, type Language } from '../i18n';

const imageTypes = ['image/png', 'image/jpeg', 'image/webp'];

export default function QRScanner({ language }: { language: Language }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const readerId = `qr-reader-${id}`;
  const reader = useRef<Html5Qrcode | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const imageUrl = useRef('');
  const request = useRef(0);
  const handled = useRef(false);
  const manuallyStopped = useRef(false);
  const [method, setMethod] = useState<'image' | 'camera'>('image');
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [cameraId, setCameraId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    reader.current = new Html5Qrcode(readerId, { verbose: false, formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] });
    return () => { request.current++; if (imageUrl.current) URL.revokeObjectURL(imageUrl.current); void releaseCamera(); };
    // The reader belongs to this component instance for its entire lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (method !== 'camera') { void releaseCamera(); return; }
    manuallyStopped.current = false;
    void startCamera();
    // Starting only on a method transition prevents a manual Stop from restarting the stream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  useEffect(() => {
    if (method !== 'image') return;
    const handleWindowPaste = (event: ClipboardEvent) => {
      const item = [...event.clipboardData?.items ?? []].find(entry => imageTypes.includes(entry.type));
      if (!item) return;
      event.preventDefault();
      void decode(item.getAsFile() ?? undefined);
    };
    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
    // decode is intentionally read from the active component instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  async function releaseCamera() {
    const scanner = reader.current;
    if (!scanner) return;
    try { if (scanner.isScanning) await scanner.stop(); }
    catch { /* Camera may already have been released by the browser. */ }
    try { scanner.clear(); } catch { /* Nothing rendered yet. */ }
    setScanning(false);
  }

  async function stopCamera(manual = false) {
    request.current++;
    manuallyStopped.current = manual;
    await releaseCamera();
  }

  function complete(value: string, operation: number) {
    if (operation !== request.current || handled.current) return;
    handled.current = true;
    setResult(value);
    setError('');
    setCopied(false);
    void releaseCamera();
  }

  async function changeMethod(next: 'image' | 'camera') {
    if (next === method) return;
    await stopCamera(false);
    if (next === 'image') clearImagePreview();
    setMethod(next); setError(''); setBusy(false);
  }

  async function loadCameras(operation: number) {
    try {
      const available = await Html5Qrcode.getCameras();
      if (operation !== request.current) return [];
      setCameras(available);
      if (!available.length) throw new Error('No camera was found on this device.');
      const rear = available.find(camera => /back|rear|environment/i.test(camera.label));
      setCameraId(current => current || rear?.id || available[0].id);
      return available;
    } catch (reason) {
      setError(reason instanceof Error && reason.message ? reason.message : 'No camera was found on this device.');
      return [];
    }
  }

  async function startCamera(preferredId?: string) {
    if (!navigator.mediaDevices?.getUserMedia) { setError('Camera scanning is not supported in this browser. Upload an image instead.'); return; }
    const scanner = reader.current;
    if (!scanner) return;
    const operation = ++request.current;
    handled.current = false; setError(''); setResult(''); setCopied(false); setBusy(true);
    try {
      await releaseCamera();
      const available = cameras.length ? cameras : await loadCameras(operation);
      if (!available.length || operation !== request.current) return;
      const target = preferredId || cameraId || available.find(camera => /back|rear|environment/i.test(camera.label))?.id || available[0].id;
      await scanner.start(target, { fps: 10, qrbox: { width: 230, height: 230 } }, value => complete(value, operation), () => undefined);
      if (operation !== request.current) { await releaseCamera(); return; }
      setScanning(true);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '';
      setError(message || 'Camera access was denied or could not be started. Check camera permission and try again.');
      await releaseCamera();
    } finally { setBusy(false); }
  }

  async function decode(file?: File) {
    if (!file) return;
    if (!imageTypes.includes(file.type)) { setError('Choose a PNG, JPEG, or WebP image.'); return; }
    const scanner = reader.current;
    if (!scanner) return;
    const operation = ++request.current;
    if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
    imageUrl.current = URL.createObjectURL(file);
    setImagePreview(imageUrl.current);
    await releaseCamera(); handled.current = false; setError(''); setResult(''); setCopied(false); setBusy(true);
    try { complete(await scanner.scanFile(file, true), operation); }
    catch { setError('No QR code was found in this image. Try a sharper, uncropped image.'); }
    finally { setBusy(false); }
  }

  function clearImagePreview() {
    if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
    imageUrl.current = '';
    setImagePreview('');
  }

  async function pasteImage() {
    if (!navigator.clipboard?.read) { setError('Pasting images is not supported in this browser. Use Browse files instead.'); return; }
    setBusy(true); setError('');
    try {
      const items = await navigator.clipboard.read();
      const item = items.find(entry => entry.types.some(type => imageTypes.includes(type)));
      const type = item?.types.find(value => imageTypes.includes(value));
      if (!item || !type) throw new Error();
      await decode(new File([await item.getType(type)], 'pasted-qr-image', { type }));
    } catch { setError('No PNG, JPEG, or WebP image was found in the clipboard.'); }
    finally { setBusy(false); }
  }

  const scan = result ? classifyScan(result) : null;
  return <div className="scanner-card">
    <div className="scanner-heading"><div><h1>{t(language, 'scanTitle')}</h1><p>{t(language, 'scanSubtitle')}</p></div></div>
    <div className="scanner-tabs" role="tablist" aria-label="Scanning method">
      <button id="scan-image-tab" role="tab" aria-selected={method === 'image'} aria-controls="scan-image-panel" className={method === 'image' ? 'active' : ''} onClick={() => void changeMethod('image')}><ImageUp size={17}/> {t(language, 'scanImage')}</button>
      <button id="scan-camera-tab" role="tab" aria-selected={method === 'camera'} aria-controls="scan-camera-panel" className={method === 'camera' ? 'active' : ''} onClick={() => void changeMethod('camera')}><Camera size={17}/> {t(language, 'camera')}</button>
    </div>
    <div className="scanner-workspace">
      <section className="scanner-input" aria-labelledby={method === 'image' ? 'scan-image-tab' : 'scan-camera-tab'}>
        <div id={method === 'image' ? 'scan-image-panel' : 'scan-camera-panel'} role="tabpanel">
          <div tabIndex={method === 'image' ? 0 : undefined} className={`${method === 'image' ? 'image-drop-zone' : 'camera-view'} ${dragging ? 'dragging' : ''} ${scanning ? 'is-scanning' : ''}`} aria-label={method === 'image' ? t(language, 'scanImage') : t(language, 'cameraPreview')} onClick={method === 'image' ? () => input.current?.click() : undefined} onDragOver={method === 'image' ? event => { event.preventDefault(); setDragging(true); } : undefined} onDragLeave={method === 'image' ? () => setDragging(false) : undefined} onDrop={method === 'image' ? event => { event.preventDefault(); setDragging(false); void decode(event.dataTransfer.files[0]); } : undefined}>
            <div id={readerId} className="scanner-reader" />
            {method === 'image' && imagePreview && <img className="selected-image-preview" src={imagePreview} alt="Selected QR image preview" />}
            {method === 'image' && !imagePreview && <div className="drop-content"><ImageUp size={36}/><strong>{t(language, 'dragBrowse')}</strong><span>{t(language, 'pngJpgWebp')}</span></div>}
            {method === 'camera' && !scanning && <div className="camera-empty"><Video size={34}/><span>{busy ? `${t(language, 'scanning')}…` : t(language, 'cameraPreview')}</span></div>}
            {method === 'camera' && scanning && <span className="scan-frame" aria-hidden="true"/>}
          </div>
          {method === 'image' ? <div className="input-actions"><button className="primary-button" disabled={busy} onClick={() => input.current?.click()}><ImageUp size={17}/> {t(language, 'browseFiles')}</button><button className="secondary-button" disabled={busy} onClick={() => void pasteImage()}>{t(language, 'pasteImage')}</button></div> : <>
            {cameras.length > 1 && <label className="field camera-select" htmlFor="camera-device">{t(language, 'cameraLabel')}<select id="camera-device" value={cameraId} disabled={busy} onChange={event => { setCameraId(event.target.value); void startCamera(event.target.value); }}>{cameras.map(camera => <option key={camera.id} value={camera.id}>{camera.label || t(language, 'camera')}</option>)}</select></label>}
            <div className="input-actions"><button className="primary-button" disabled={busy || scanning} onClick={() => { manuallyStopped.current = false; void startCamera(); }}><ScanLine size={17}/>{busy ? `${t(language, 'scanning')}…` : t(language, 'startCamera')}</button><button className="secondary-button" disabled={!scanning && !busy} onClick={() => void stopCamera(true)}><Square size={16}/> {t(language, 'stopCamera')}</button></div>
          </>}
        </div>
        <input ref={input} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { void decode(event.target.files?.[0]); event.target.value = ''; }}/>
      </section>
      <section className="scanner-result" aria-live="polite"><div className="result-heading"><h2>{t(language, 'scannedResult')}</h2><span className={`result-status ${error ? 'error-status' : result ? 'success-status' : scanning || busy ? 'scanning-status' : ''}`}><i/>{error ? t(language, 'noQr') : result ? t(language, 'success') : scanning || busy ? t(language, 'scanning') : method === 'image' ? t(language, 'waitingImage') : t(language, 'waitingCamera')}</span></div><pre className={!result ? 'empty-result' : ''}>{result || t(language, 'resultPlaceholder')}</pre>{error && <p className="error" role="alert">{error}</p>}<div className="result-actions"><button className="primary-button" disabled={!result} onClick={() => void navigator.clipboard.writeText(result).then(() => setCopied(true)).catch(() => setError('Copy failed. Select the text and copy it manually.'))}><Copy size={17}/>{copied ? t(language, 'copied') : t(language, 'copyResult')}</button>{scan?.url ? <a className="secondary-button" href={scan.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={17}/> {t(language, 'openLink')}</a> : <button className="secondary-button" disabled>{t(language, 'openLink')}</button>}<button className="secondary-button" disabled={!result && !error} onClick={() => { setResult(''); setError(''); setCopied(false); handled.current = false; }}><RefreshCw size={16}/> {t(language, 'scanAgain')}</button></div></section>
    </div>
  </div>;
}
