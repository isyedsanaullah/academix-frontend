'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Icon from '@/components/Icon';
import Button from '@/components/ui/Button';
import { uploadFileDirect, getFileDownloadUrl, parseR2Ref } from '@/services/fileUpload.service';

const MAX_MB_DEFAULT = 5;
const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

export default function ImageUploadField({
  label,
  helperText,
  url,
  setUrl,
  previewShape = 'square',
  onUpload = null,
  accept = 'image/*',
  maxSizeMb = MAX_MB_DEFAULT,
}) {
  const inputRef = useRef(null);

  const [pendingFile, setPendingFile] = useState(null);
  const [localPreview, setLocalPreview] = useState('');
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [urlError, setUrlError] = useState('');
  const [resolvedUrl, setResolvedUrl] = useState('');

  useEffect(() => {
    let active = true;
    if (url && typeof url === 'string' && url.startsWith('r2:')) {
      const fileId = parseR2Ref(url);
      if (fileId) {
        getFileDownloadUrl(fileId, true)
          .then((res) => {
            if (active && res?.url) setResolvedUrl(res.url);
          })
          .catch(() => {
            if (active) setResolvedUrl('');
          });
      }
    } else {
      setResolvedUrl('');
    }
    return () => {
      active = false;
    };
  }, [url]);

  const displayUrl = resolvedUrl || url;

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Unsupported format. Please use JPEG, PNG, WebP, GIF, or AVIF.`;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      return `File is too large. Maximum allowed size is ${maxSizeMb} MB.`;
    }
    return null;
  };

  const acceptFile = useCallback(
    (file) => {
      if (!file) return;
      const err = validateFile(file);
      if (err) {
        setFileError(err);
        return;
      }

      setFileError('');
      setPendingFile(file);
      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(URL.createObjectURL(file));
    },
    [localPreview]
  );

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) acceptFile(file);
  };

  const browse = () => inputRef.current?.click();

  const removeFile = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setPendingFile(null);
    setLocalPreview('');
    setFileError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    setFileError('');
    try {
      let uploadedUrl;
      if (onUpload) {
        uploadedUrl = await onUpload(pendingFile);
      } else {
        const res = await uploadFileDirect(pendingFile, { category: 'images' });
        uploadedUrl = res?.r2Ref || (res?.id ? `r2:${res.id}` : '');
      }
      if (uploadedUrl) {
        setUrl(uploadedUrl);
      }
      removeFile();
    } catch (err) {
      setFileError(
        `Upload failed: ${err?.response?.data?.message || err?.message || 'Unknown error'}`
      );
    } finally {
      setUploading(false);
    }
  };

  const onUrlImageError = () => {
    if (displayUrl)
      setUrlError('Could not load image from this URL. Check the link is publicly accessible.');
  };
  const onUrlImageLoad = () => setUrlError('');

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sub-title-2 font-medium text-t-primary">{label}</label>
        {helperText && <p className="text-caption text-t-tertiary mt-0.5">{helperText}</p>}
      </div>

      {/* Option 1: Paste URL */}
      <div className="p-4 rounded-3xl bg-b-surface1 border border-s-subtle space-y-3">
        <p className="text-caption font-bold text-t-tertiary uppercase tracking-widest flex items-center gap-1.5">
          <Icon name="link" size={14} className="fill-current" /> Option 1 — Paste Image URL
        </p>

        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setUrlError('');
          }}
          placeholder="https://example.com/image.jpg"
          className="input-field"
        />

        {url && (
          <div className="space-y-2">
            {previewShape === 'wide' ? (
              <div className="relative w-full aspect-[3/1] rounded-2xl overflow-hidden bg-b-surface2 border border-s-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={onUrlImageError}
                  onLoad={onUrlImageLoad}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-b-surface2 border border-s-subtle shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayUrl}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                    onError={onUrlImageError}
                    onLoad={onUrlImageLoad}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-caption text-t-secondary truncate">{url}</p>
                </div>
              </div>
            )}

            {urlError ? (
              <p className="text-caption text-[var(--danger)] flex items-center gap-1">
                <Icon name="alert" size={14} className="fill-current" /> {urlError}
              </p>
            ) : (
              <p className="text-caption text-[var(--brand-green-text)] flex items-center gap-1">
                <Icon name="check-circle" size={14} className="fill-current" /> Image loaded
                successfully
              </p>
            )}
          </div>
        )}
      </div>

      {/* Option 2: Upload Image */}
      <div className="p-4 rounded-3xl bg-b-surface1 border border-s-subtle space-y-3">
        <p className="text-caption font-bold text-t-tertiary uppercase tracking-widest flex items-center gap-1.5">
          <Icon name="upload" size={14} className="fill-current" /> Option 2 — Upload Image
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) acceptFile(f);
          }}
        />

        {!pendingFile && !localPreview && (
          <div
            onClick={browse}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative flex flex-col items-center justify-center gap-3 cursor-pointer select-none rounded-2xl border-2 border-dashed transition-all duration-200 py-8 px-4 ${
              isDragging
                ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-soft)]'
                : 'border-s-stroke2 hover:border-s-highlight hover:bg-b-surface2'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-b-surface2 text-t-tertiary">
              <Icon name="image" size={22} className="fill-current" />
            </div>
            <div className="text-center">
              <p className="text-sub-title-2 text-t-primary">
                {isDragging ? 'Drop image here' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-caption text-t-tertiary mt-1">
                JPEG, PNG, WebP, GIF · Max {maxSizeMb} MB
              </p>
            </div>
          </div>
        )}

        {localPreview && (
          <div className="space-y-3">
            {previewShape === 'wide' ? (
              <div className="relative w-full aspect-[3/1] rounded-2xl overflow-hidden bg-b-surface2 border border-s-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={localPreview} alt="Upload preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-b-surface2 border border-s-subtle shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={localPreview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sub-title-2 text-t-primary truncate">{pendingFile?.name}</p>
                  <p className="text-caption text-t-tertiary mt-0.5">
                    {(pendingFile?.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                isPrimary
                size="sm"
                icon="upload"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : 'Upload to Cloud'}
              </Button>
              <Button type="button" isStroke size="sm" icon="refresh" onClick={browse}>
                Replace
              </Button>
              <Button
                type="button"
                isDanger
                size="sm"
                icon="trash"
                onClick={removeFile}
                aria-label="Remove file"
              />
            </div>
          </div>
        )}

        {fileError && (
          <p className="text-caption text-[var(--danger)] flex items-center gap-1.5">
            <Icon name="alert" size={14} className="fill-current" /> {fileError}
          </p>
        )}
      </div>
    </div>
  );
}
