/**
 * File Upload Service — Academix Frontend
 * ─────────────────────────────────────────
 * Centralized service for all file upload operations.
 * Supports both presigned direct-to-R2 uploads and backend-mediated uploads.
 *
 * SECURITY: Never stores or transmits R2 credentials.
 * Uses backend-issued presigned URLs for direct uploads.
 */
import api from '@/lib/api';

// ── Configuration ────────────────────────────────────────────────────
const FILE_LIMITS = {
  image: { maxSize: 5 * 1024 * 1024, accept: '.jpg,.jpeg,.png,.webp' },
  document: { maxSize: 25 * 1024 * 1024, accept: '.pdf,.docx,.xlsx' },
  pdf: { maxSize: 25 * 1024 * 1024, accept: '.pdf' },
};

// ── Presigned Upload Flow (for larger files) ─────────────────────────

/**
 * Upload a file using the presigned URL flow:
 * 1. Initiate upload → get presigned PUT URL
 * 2. Upload file directly to R2
 * 3. Finalize upload → verify and mark ready
 *
 * @param {File} file - The File object to upload
 * @param {object} opts
 * @param {string} opts.category - File category (e.g. 'documents', 'assignments')
 * @param {string} [opts.entityType] - Entity type (e.g. 'Student', 'Assignment')
 * @param {string} [opts.entityId] - Entity ID
 * @param {function} [opts.onProgress] - Progress callback (0-100)
 * @returns {Promise<object>} The finalized StoredFile record
 */
export async function uploadFile(file, { category = 'general', entityType, entityId, onProgress } = {}) {
  // Step 1: Initiate upload
  const initRes = await api.post('/files/initiate', {
    filename: file.name,
    contentType: file.type,
    size: file.size,
    category,
    entityType,
    entityId,
  });

  const { fileId, uploadUrl, contentType } = initRes.data.data;

  // Step 2: Upload directly to R2 via presigned URL
  await uploadToPresignedUrl(uploadUrl, file, contentType, onProgress);

  // Step 3: Finalize upload
  const finalRes = await api.post(`/files/${fileId}/finalize`);
  return finalRes.data.data;
}

/**
 * Upload file bytes to a presigned PUT URL with progress tracking.
 */
async function uploadToPresignedUrl(url, file, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', contentType);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed — network error'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.timeout = 5 * 60 * 1000; // 5 minutes

    xhr.send(file);
  });
}

// ── Backend-Mediated Upload (for small files like avatars) ───────────

/**
 * Upload a small file directly through the backend.
 * The file is sent as multipart form data and the backend uploads to R2.
 *
 * @param {File} file - The File object
 * @param {object} opts
 * @param {string} opts.category
 * @param {string} [opts.entityType]
 * @param {string} [opts.entityId]
 * @param {function} [opts.onProgress]
 * @returns {Promise<object>} The StoredFile record
 */
export async function uploadFileDirect(file, { category = 'general', entityType, entityId, onProgress } = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  if (entityType) formData.append('entityType', entityType);
  if (entityId) formData.append('entityId', entityId);

  const res = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });

  return res.data.data;
}

// ── Download & Preview ───────────────────────────────────────────────

/**
 * Get a short-lived download URL for a file.
 * @param {string} fileId - StoredFile ID
 * @param {boolean} [preview=false] - Whether to request inline preview
 * @returns {Promise<object>} { url, filename, contentType, sizeBytes, expiresIn }
 */
export async function getFileDownloadUrl(fileId, preview = false) {
  const res = await api.get(`/files/${fileId}/download-url`, {
    params: preview ? { preview: 'true' } : {},
  });
  return res.data.data;
}

/**
 * Resolve multiple file IDs to download URLs in a single request.
 * @param {string[]} fileIds - Array of StoredFile IDs
 * @returns {Promise<object>} Map of fileId → { url, filename, contentType }
 */
export async function resolveFileUrls(fileIds) {
  if (!fileIds || fileIds.length === 0) return {};
  const res = await api.post('/files/resolve-urls', { fileIds });
  return res.data.data;
}

// ── Delete ───────────────────────────────────────────────────────────

/**
 * Delete a file.
 * @param {string} fileId - StoredFile ID
 */
export async function deleteFile(fileId) {
  const res = await api.delete(`/files/${fileId}`);
  return res.data;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Determine the appropriate upload method based on file size.
 * Small files (< 5MB) use backend-mediated upload.
 * Larger files use presigned direct upload.
 */
export async function smartUpload(file, opts = {}) {
  const threshold = 5 * 1024 * 1024; // 5MB
  if (file.size <= threshold) {
    return uploadFileDirect(file, opts);
  }
  return uploadFile(file, opts);
}

/**
 * Extract a StoredFile ID from an r2: reference string.
 * Returns null if the value is not an r2: reference.
 */
export function parseR2Ref(value) {
  if (typeof value === 'string' && value.startsWith('r2:')) {
    return value.slice(3);
  }
  return null;
}

/**
 * Check if a value is a resolvable file reference (r2: or URL).
 */
export function isFileReference(value) {
  if (!value || typeof value !== 'string') return false;
  return value.startsWith('r2:') || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:');
}

/**
 * Get the file limits for a category.
 */
export function getFileLimits(category = 'document') {
  return FILE_LIMITS[category] || FILE_LIMITS.document;
}

export default {
  uploadFile,
  uploadFileDirect,
  smartUpload,
  getFileDownloadUrl,
  resolveFileUrls,
  deleteFile,
  parseR2Ref,
  isFileReference,
  getFileLimits,
};
