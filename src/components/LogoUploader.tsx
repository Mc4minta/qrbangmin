import { ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { t, type Language } from '../i18n';
export default function LogoUploader({ logo, onChange, language }: { logo: string; onChange: (logo: string) => void; language: Language }) {
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  async function upload(file?: File) {
    if (!file) return;
    const id = ++request.current;
    setError('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { setError('Choose a PNG, JPEG, or WebP image under 2 MB.'); return; }
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d'); if (!context) { bitmap.close(); throw new Error(); }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      if (id === request.current) onChange(canvas.toDataURL('image/png'));
    } catch { if (id === request.current) setError('This image could not be read. Please try another file.'); }
  }
  return <div><div className="upload-box">{logo ? <><img src={logo} alt="Uploaded logo"/><div><strong>{t(language, 'addLogo')}</strong><p>PNG, JPG or WebP · 2 MB</p></div><button className="icon-button" aria-label={t(language, 'removeLogo')} onClick={() => { request.current++; onChange(''); if (input.current) input.current.value = ''; }}><X size={18}/></button></> : <><ImagePlus size={26}/><div><strong>{t(language, 'addLogo')}</strong><p>PNG, JPG or WebP · 2 MB</p></div></>}<button className="small-button" onClick={() => input.current?.click()}>{logo ? t(language, 'replace') : t(language, 'upload')}</button><input ref={input} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" aria-label={t(language, 'upload')} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }}/></div>{error && <p role="alert" className="error">{error}</p>}</div>;
}
