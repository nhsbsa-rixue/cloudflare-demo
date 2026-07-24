const DEFAULT_ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'pdf']);
const DEFAULT_ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'application/pdf']);
const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface UploadSuccessResponse {
  upload: {
    key: string;
    filename: string;
    contentType: string;
    size: number;
    uploadedAt: string;
  };
}

export interface R2UploadResult {
  key: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export interface R2UploadServiceOptions {
  allowedExtensions?: ReadonlySet<string>;
  allowedMimeTypes?: ReadonlySet<string>;
  allowedUploadTypes?: readonly string[];
  maxFileSizeBytes?: number;
}

export interface R2UploadInput {
  file: File;
  caseId: string;
  uploadedAt?: string;
}

export class R2UploadError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'R2UploadError';
  }
}

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot < 0 || lastDot === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDot + 1).toLowerCase();
}

function createObjectKey({
  caseId,
  extension = 'pdf',
  uploadedAt
}: {
  caseId: string;
  extension?: string;
  uploadedAt: string;
}): string {
  const now = new Date(uploadedAt);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `uploads/${year}/${month}/${day}/${caseId}.${extension}`;
}

export class R2UploadService {
  constructor(
    private readonly bucket: R2Bucket,
    private readonly options: R2UploadServiceOptions = {}
  ) {}

  async upload({ file, caseId, uploadedAt = new Date().toISOString() }: R2UploadInput): Promise<R2UploadResult> {
    const filename = file.name.trim();
    if (!filename) {
      throw new R2UploadError('file name is required', 400);
    }

    const extension = getExtension(filename);
    const normalizedMimeType = file.type.toLowerCase();
    const allowedExtensions = this.options.allowedExtensions ?? DEFAULT_ALLOWED_EXTENSIONS;
    const allowedMimeTypes = this.options.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;
    const extensionAllowed = allowedExtensions.has(extension);
    const mimeAllowed = normalizedMimeType ? allowedMimeTypes.has(normalizedMimeType) : false;

    if (!extensionAllowed || !mimeAllowed) {
      throw new R2UploadError('unsupported file type; only png, jpg, jpeg, pdf are allowed', 400);
    }

    const maxFileSizeBytes = this.options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;
    if (file.size > maxFileSizeBytes) {
      throw new R2UploadError('file too large; max size is 10 MB', 413);
    }

    const contentType = normalizedMimeType || 'application/octet-stream';
    const key = createObjectKey({ caseId, extension, uploadedAt });

    try {
      await this.bucket.put(key, file.stream(), {
        httpMetadata: {
          contentType
        },
        customMetadata: {
          originalFilename: filename,
          uploadedAt
        }
      });
    } catch {
      throw new R2UploadError('failed to store uploaded file', 503);
    }

    return {
      key,
      filename,
      contentType,
      size: file.size,
      uploadedAt
    };
  }
}
