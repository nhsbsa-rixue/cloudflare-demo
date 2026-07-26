/**
 * Shared frontend types.
 */

/** Metadata for a single uploaded file, as returned by the backend worker. */
export interface UploadResult {
  key: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

/** Response envelope returned by the worker upload endpoint. */
export interface WorkerUploadResponse {
  upload: UploadResult;
}
