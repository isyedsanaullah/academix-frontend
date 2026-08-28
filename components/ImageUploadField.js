'use client';

/**
 * ImageUploadField
 * ─────────────────────────────────────────────────────────────────────
 * Provides two simultaneous options for providing an image:
 *   1. Paste URL  — live preview that updates as the user types
 *   2. Upload     — drag-and-drop / click-to-browse with local preview
 *
 * Architecture is designed for zero-UI-change Cloudflare R2 integration:
 *   - `pendingFile` holds the selected File object in state.
 *   - The parent passes an `onUpload(file) => Promise<string>` prop.
 *   - When R2 is ready, implement `onUpload`, call `setUrl(uploadedUrl)`.
 *   - Until then, pass onUpload={null} — the upload button just shows a placeholder.
 *
 * Props:
 *   label         string       — field label (e.g. "College Logo")
 *   helperText    string       — optional helper text below the label
 *   url           string       — current URL value (controlled)
 *   setUrl        fn(string)   — URL state setter
 *   previewShape  "square" | "wide"  — square for logo, wide for cover photo
 *   onUpload      fn(File) => Promise<string> | null  — R2 uploader (optional)
 *   accept        string       — MIME types (default "image/*")
 *   maxSizeMb     number       — max file size in MB (default 5)
 * ─────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useCallback } from 'react';
import {
  HiOutlinePhotograph, HiOutlineLink, HiOutlineUpload, HiOutlineTrash,
  HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlineRefresh
} from 'react-icons/hi';

const MAX_MB_DEFAULT = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export default function ImageUploadField({
  label,
  helperText,
  url,
  setUrl,
  previewShape = 'square',
  onUpload     = null,
  accept       = 'image/*',
  maxSizeMb    = MAX_MB_DEFAULT,
}) {
  const inputRef = useRef(null);

  // Upload-tab state
  const [pendingFile,   setPendingFile]   = useState(null);  // File object
  const [localPreview,  setLocalPreview]  = useState('');    // object URL for preview
  const [fileError,     setFileError]     = useState('');
  const [uploading,     setUploading]     = useState(false);
  const [isDragging,    setIsDragging]    = useState(false);

  // URL-tab live preview state
  const [urlError,      setUrlError]      = useState('');

  // ── File validation ──────────────────────────────────────────────
  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Unsupported format. Please use JPEG, PNG, WebP, GIF, or AVIF.`;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      return `File is too large. Maximum allowed size is ${maxSizeMb} MB.`;
    }
    return null;
  };

  const acceptFile = useCallback((file) => {
    if (!file) return;
    const err = validateFile(file);
    if (err) { setFileError(err); return; }

    setFileError('');
    setPendingFile(file);
    // Revoke previous object URL to avoid memory leak
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
  }, [localPreview]);

  // ── Drag & Drop handlers ─────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) acceptFile(file);
  };

  // ── Trigger file input ───────────────────────────────────────────
  const browse = () => inputRef.current?.click();

  // ── Remove selected file ─────────────────────────────────────────
  const removeFile = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setPendingFile(null);
    setLocalPreview('');
    setFileError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Upload to R2 (called when onUpload prop is provided) ─────────
  const handleUpload = async () => {
    if (!pendingFile || !onUpload) return;
    setUploading(true);
    try {
      const uploadedUrl = await onUpload(pendingFile);
      setUrl(uploadedUrl);
      removeFile();
    } catch (err) {
      setFileError(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // ── URL preview: handle image load error ─────────────────────────
  const onUrlImageError = () => {
    if (url) setUrlError('Could not load image from this URL. Check the link is publicly accessible.');
  };
  const onUrlImageLoad  = () => setUrlError('');

  // ── Preview dimensions ───────────────────────────────────────────
  const previewClass = previewShape === 'wide'
    ? 'w-full aspect-[3/1] rounded-xl'
    : 'w-28 h-28 rounded-xl flex-shrink-0';

  return (
    <div className="space-y-3">
      {/* Label */}
      <div>
        <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</label>
        {helperText && <p className="text-[11px] text-white/30 mt-0.5">{helperText}</p>}
      </div>

      {/* ── Section 1: Paste URL ─────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-[#0a0f17] border border-white/[0.06] space-y-3">
        <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest flex items-center gap-1.5">
          <HiOutlineLink size={12} /> Option 1 — Paste Image URL
        </p>

        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setUrlError(''); }}
          placeholder="https://example.com/image.jpg"
          className="input-field text-sm"
        />

        {/* Live URL preview */}
        {url && (
          <div className="space-y-2">
            {previewShape === 'wide' ? (
              <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.05]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url} alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={onUrlImageError} onLoad={onUrlImageLoad}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.05] flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url} alt="Logo preview"
                    className="w-full h-full object-cover"
                    onError={onUrlImageError} onLoad={onUrlImageLoad}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white/40 truncate">{url}</p>
                </div>
              </div>
            )}

            {urlError ? (
              <p className="text-[11px] text-red-400 flex items-center gap-1">
                <HiOutlineExclamationCircle size={12} /> {urlError}
              </p>
            ) : (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <HiOutlineCheckCircle size={12} /> Image loaded successfully
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Section 2: Upload Image ───────────────────────────────── */}
      <div className="p-4 rounded-xl bg-[#0a0f17] border border-white/[0.06] space-y-3">
        <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest flex items-center gap-1.5">
          <HiOutlineUpload size={12} /> Option 2 — Upload Image
        </p>

        {/* Hidden native file input */}
        <input
          ref={inputRef} type="file" accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) acceptFile(f);
          }}
        />

        {/* Drop zone — shown when no file is selected */}
        {!pendingFile && !localPreview && (
          <div
            onClick={browse}
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            className={`
              relative flex flex-col items-center justify-center gap-3 cursor-pointer select-none
              rounded-xl border-2 border-dashed transition-all duration-200 py-8 px-4
              ${isDragging
                ? 'border-indigo-500/60 bg-indigo-500/8'
                : 'border-white/[0.08] hover:border-indigo-500/40 hover:bg-white/[0.02]'}
            `}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isDragging ? 'bg-indigo-500/20' : 'bg-white/[0.04]'}`}>
              <HiOutlinePhotograph size={22} className={isDragging ? 'text-indigo-400' : 'text-white/30'} />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-white/50">
                {isDragging ? 'Drop image here' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-[10px] text-white/25 mt-1">
                JPEG, PNG, WebP, GIF · Max {maxSizeMb} MB
              </p>
            </div>
          </div>
        )}

        {/* File Preview — shown after file selection */}
        {localPreview && (
          <div className="space-y-3">
            {previewShape === 'wide' ? (
              <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.05]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={localPreview} alt="Upload preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.05] flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={localPreview} alt="Upload preview" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white/70 truncate">{pendingFile?.name}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{(pendingFile?.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}

            {/* Action row */}
            <div className="flex items-center gap-2">
              {onUpload ? (
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-primary py-1.5 px-3 text-xs"
                >
                  {uploading
                    ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
                    : <><HiOutlineUpload size={13} /> Upload to Cloud</>}
                </button>
              ) : (
                <div className="flex-1 px-3 py-1.5 rounded-lg bg-amber-500/8 border border-amber-500/15 text-[10px] text-amber-400/80">
                  ☁️ Cloud upload will be available after Cloudflare R2 setup
                </div>
              )}
              <button
                type="button" onClick={browse}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                <HiOutlineRefresh size={13} /> Replace
              </button>
              <button
                type="button" onClick={removeFile}
                className="btn-danger py-1.5 px-2.5 text-xs"
              >
                <HiOutlineTrash size={13} />
              </button>
            </div>
          </div>
        )}

        {/* File error */}
        {fileError && (
          <p className="text-[11px] text-red-400 flex items-center gap-1.5">
            <HiOutlineExclamationCircle size={12} /> {fileError}
          </p>
        )}
      </div>
    </div>
  );
}
