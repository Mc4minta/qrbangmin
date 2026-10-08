import { Camera, Copy, ExternalLink, ImageUp, RefreshCw, ScanLine, Square, Video } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useEffect, useId, useRef, useState } from 'react';
import { classifyScan } from '../lib/scanResult';

const imageTypes = ['image/png', 'image/jpeg', 'image/webp'];

export default function QRScanner() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const readerId = `qr-reader-${id}`;
  const reader = useRef<Html5Qrcode | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const handled = useRef(false);
  const [method, setMethod] = useState<'image' | 'camera'>('image');
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [cameraId, setCameraId] = useState('');
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

  async function cancel() {
    request.current++;
    await stop();
  }

  function complete(value: string, operation: number) {
    if (operation !== request.current || handled.current) return;
    handled.current = true;
    setResult(value);
    setError('');
    setCopied(false);
    void stop();
  }

  async function changeMethod(next: 'image' | 'camera') {
    if (next === method) return;
    await cancel();
    setMethod(next); setError(''); setBusy(false);
    if (next === 'camera') void loadCameras();
  }

  async function loadCameras() {
    try {
      const available = await Html5Qrcode.getCameras();
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

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) { setError('Camera scanning is not supported in this browser. Upload an image instead.'); return; }
    const scanner = reader.current;
    if (!scanner) return;
    const operation = ++request.current;
    handled.current = false; setError(''); setResult(''); setCopied(false); setBusy(true);
    try {
      const available = cameras.length ? cameras : await loadCameras();
      if (!available.length || operation !== request.current) return;
      const target = cameraId || available.find(camera => /back|rear|environment/i.test(camera.label))?.id || available[0].id;
      await scanner.start(target || { facingMode: { ideal: 'environment' } }, { fps: 10, qrbox: { width: 230, height: 230 } }, value => complete(value, operation), () => undefined);
      if (operation !== request.current) { await stop(); return; }
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
    const operation = ++request.current;
    await stop(); handled.current = false; setError(''); setResult(''); setCopied(false); setBusy(true);
    try { complete(await scanner.scanFile(file, true), operation); }
    catch { setError('No QR code was found in this image. Try a sharper, uncropped image.'); }
    finally { setBusy(false); }
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

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const item = [...event.clipboardData.items].find(entry => imageTypes.includes(entry.type));
    if (!item) return;
    event.preventDefault();
    void decode(item.getAsFile() ?? undefined);
  }

  const scan = result ? classifyScan(result) : null;
  return <div className="scanner-card">
    <div className="scanner-heading"><div><h1>Scan QR Code</h1><p>Scan from an image or camera.</p></div></div>
    <div className="scanner-tabs" role="tablist" aria-label="Scanning method">
      <button id="scan-image-tab" role="tab" aria-selected={method === 'image'} aria-controls="scan-image-panel" className={method === 'image' ? 'active' : ''} onClick={() => void changeMethod('image')}><ImageUp size={17}/> Scan image</button>
      <button id="scan-camera-tab" role="tab" aria-selected={method === 'camera'} aria-controls="scan-camera-panel" className={method === 'camera' ? 'active' : ''} onClick={() => void changeMethod('camera')}><Camera size={17}/> Camera</button>
    </div>
    <div className="scanner-workspace" onPaste={handlePaste}>
      <section className="scanner-input" aria-labelledby={method === 'image' ? 'scan-image-tab' : 'scan-camera-tab'}>
        {method === 'image' ? <div id="scan-image-panel" role="tabpanel">
          <div id={readerId} tabIndex={0} className={`image-drop-zone ${dragging ? 'dragging' : ''}`} onClick={() => input.current?.click()} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void decode(event.dataTransfer.files[0]); }}>
            <div className="drop-content"><ImageUp size={36}/><strong>Drag &amp; Drop or Browse</strong><span>PNG, JPG, WEBP</span></div>
          </div>
          <div className="input-actions"><button className="primary-button" disabled={busy} onClick={() => input.current?.click()}><ImageUp size={17}/> Browse files</button><button className="secondary-button" disabled={busy} onClick={() => void pasteImage()}>Paste image</button></div>
        </div> : <div id="scan-camera-panel" role="tabpanel">
          <div id={readerId} className={`camera-view ${scanning ? 'is-scanning' : ''}`} aria-label="Camera preview">{!scanning && <div className="camera-empty"><Video size={34}/><span>Camera preview</span></div>}{scanning && <span className="scan-frame" aria-hidden="true"/>}</div>
          {cameras.length > 1 && <label className="field camera-select" htmlFor="camera-device">Camera<select id="camera-device" value={cameraId} disabled={scanning} onChange={event => setCameraId(event.target.value)}>{cameras.map(camera => <option key={camera.id} value={camera.id}>{camera.label || 'Camera'}</option>)}</select></label>}
          <div className="input-actions"><button className="primary-button" disabled={busy || scanning} onClick={() => void start()}><ScanLine size={17}/>{busy ? 'Starting…' : 'Start camera'}</button><button className="secondary-button" disabled={!scanning} onClick={() => void cancel()}><Square size={16}/> Stop camera</button></div>
        </div>}
        <input ref={input} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { void decode(event.target.files?.[0]); event.target.value = ''; }}/>
      </section>
      <section className="scanner-result" aria-live="polite"><div className="result-heading"><h2>Scanned Result</h2><span className={`result-status ${error ? 'error-status' : result ? 'success-status' : scanning || busy ? 'scanning-status' : ''}`}><i/>{error ? 'No QR code found' : result ? 'Success' : scanning || busy ? 'Scanning' : method === 'image' ? 'Waiting for image' : 'Waiting for camera'}</span></div><pre className={!result ? 'empty-result' : ''}>{result || 'Your decoded QR content will appear here.'}</pre>{error && <p className="error" role="alert">{error}</p>}<div className="result-actions"><button className="primary-button" disabled={!result} onClick={() => void navigator.clipboard.writeText(result).then(() => setCopied(true)).catch(() => setError('Copy failed. Select the text and copy it manually.'))}><Copy size={17}/>{copied ? 'Copied' : 'Copy result'}</button>{scan?.url ? <a className="secondary-button" href={scan.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={17}/> Open link</a> : <button className="secondary-button" disabled>Open link</button>}<button className="secondary-button" disabled={!result && !error} onClick={() => { setResult(''); setError(''); setCopied(false); handled.current = false; }}><RefreshCw size={16}/> Scan again</button></div></section>
    </div>
  </div>;
}
