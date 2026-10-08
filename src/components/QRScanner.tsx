import { Copy, ExternalLink, ImageUp, RefreshCw, ScanLine, Square, Video } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useEffect, useId, useRef, useState } from 'react';
import { classifyScan } from '../lib/scanResult';

const imageTypes = ['image/png', 'image/jpeg', 'image/webp'];

export default function QRScanner() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const readerId = `qr-reader-${id}`;
  const reader = useRef<Html5Qrcode | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const handled = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    reader.current = new Html5Qrcode(readerId, { verbose: false, formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] });
    return () => { void stop(); };
    // The reader belongs to this component instance for its entire lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function stop() {
    const scanner = reader.current;
    if (!scanner) return;
    try { if (scanner.isScanning) await scanner.stop(); }
    catch { /* Camera may already have been released by the browser. */ }
    try { scanner.clear(); } catch { /* Nothing rendered yet. */ }
    setScanning(false);
  }

  function complete(value: string) {
    if (handled.current) return;
    handled.current = true;
    setResult(value);
    setError('');
    void stop();
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) { setError('Camera scanning is not supported in this browser. Upload an image instead.'); return; }
    const scanner = reader.current;
    if (!scanner) return;
    handled.current = false; setError(''); setResult(''); setCopied(false); setBusy(true);
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) throw new Error('No camera was found on this device.');
      await scanner.start({ facingMode: { ideal: 'environment' } }, { fps: 10, qrbox: { width: 230, height: 230 } }, complete, () => undefined);
      setScanning(true);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '';
      setError(message || 'Camera access was denied or could not be started. Check camera permission and try again.');
      await stop();
    } finally { setBusy(false); }
  }

  async function decode(file?: File) {
    if (!file) return;
    if (!imageTypes.includes(file.type)) { setError('Choose a PNG, JPEG, or WebP image.'); return; }
    const scanner = reader.current;
    if (!scanner) return;
    await stop(); handled.current = false; setError(''); setResult(''); setCopied(false); setBusy(true);
    try { complete(await scanner.scanFile(file, true)); }
    catch { setError('No QR code was found in this image. Try a sharper, uncropped image.'); }
    finally { setBusy(false); }
  }

  const scan = result ? classifyScan(result) : null;
  return <div className="scanner-card">
    <div className="scanner-heading"><div><h1>Scan QR Code</h1><p>Camera and images stay on this device.</p></div>{result && <button className="small-button" onClick={() => { setResult(''); setError(''); setCopied(false); handled.current = false; }}> <RefreshCw size={15}/> Scan again</button>}</div>
    {!result && <>
      <div id={readerId} className={`camera-view ${scanning ? 'is-scanning' : ''}`} aria-label="Camera preview">
        {!scanning && <div className="camera-empty"><Video size={34}/><span>Camera preview</span></div>}
        {scanning && <span className="scan-frame" aria-hidden="true"/>}
      </div>
      <div className="scanner-actions">
        <button className="primary-button" disabled={busy || scanning} onClick={() => void start()}><ScanLine size={18}/>{busy ? 'Starting…' : 'Start camera'}</button>
        <button className="secondary-button" disabled={!scanning} onClick={() => void stop()}><Square size={16}/> Stop</button>
      </div>
      <div className={`drop-zone ${dragging ? 'dragging' : ''}`} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void decode(event.dataTransfer.files[0]); }}>
        <ImageUp size={22}/><div><strong>Upload QR image</strong><span>PNG, JPEG, or WebP</span></div>
        <button className="small-button" disabled={busy} onClick={() => input.current?.click()}>Choose file</button>
        <input ref={input} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { void decode(event.target.files?.[0]); event.target.value = ''; }}/>
      </div>
    </>}
    {error && <p className="error" role="alert">{error}</p>}
    {scan && <div className="scan-result"><span className="result-type">{scan.label}</span><pre>{result}</pre><div className="scanner-actions"><button className="primary-button" onClick={() => void navigator.clipboard.writeText(result).then(() => setCopied(true)).catch(() => setError('Copy failed. Select the text and copy it manually.'))}><Copy size={17}/>{copied ? 'Copied' : 'Copy'}</button>{scan.url && <a className="secondary-button" href={scan.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={17}/> Open link</a>}</div></div>}
  </div>;
}
