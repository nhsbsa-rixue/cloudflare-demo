import { describe, expect, it, vi } from 'vitest';
import worker from './index';
import type { Env } from './types';

function createEnv() {
  const put = vi.fn().mockResolvedValue(undefined);

  const env: Env = {
    UPLOADS_BUCKET: {
      put
    } as unknown as R2Bucket
  };

  return { env, put };
}

describe('upload API', () => {
  it('stores a valid file in R2 and returns metadata', async () => {
    const { env, put } = createEnv();

    const formData = new FormData();
    const file = new File([new Uint8Array([1, 2, 3])], 'test-image.png', { type: 'image/png' });
    formData.append('file', file);

    const request = new Request('https://worker.internal/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await worker.fetch(request, env, {} as ExecutionContext);

    expect(response.status).toBe(200);
    expect(put).toHaveBeenCalledTimes(1);

    const firstCall = put.mock.calls.at(0);
    expect(firstCall).toBeDefined();
    if (!firstCall) {
      throw new Error('expected first R2 put call to exist');
    }

    const [key, streamBody, options] = firstCall;
    expect(typeof key).toBe('string');
    expect(key).toContain('uploads/');
    expect(key).toContain('.png');
    expect(key).toContain('cnc-');
    expect(streamBody).toBeDefined();
    expect(options).toMatchObject({
      httpMetadata: { contentType: 'image/png' },
      customMetadata: { originalFilename: 'test-image.png' }
    });

    const payload = (await response.json()) as {
      upload: { filename: string; size: number; contentType: string; key: string };
    };

    expect(payload.upload.filename).toBe('test-image.png');
    expect(payload.upload.size).toBe(3);
    expect(payload.upload.contentType).toBe('image/png');
    expect(payload.upload.key).toContain('uploads/');
  });

  it('returns 400 when file is missing', async () => {
    const { env } = createEnv();

    const formData = new FormData();
    const request = new Request('https://worker.internal/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await worker.fetch(request, env, {} as ExecutionContext);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'file is required'
    });
  });

  it('returns 400 for unsupported file type', async () => {
    const { env } = createEnv();

    const formData = new FormData();
    const file = new File([new Uint8Array([1])], 'malware.exe', {
      type: 'application/x-msdownload'
    });
    formData.append('file', file);

    const request = new Request('https://worker.internal/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await worker.fetch(request, env, {} as ExecutionContext);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('unsupported file type')
    });
  });

  it('returns 413 when file exceeds max size', async () => {
    const { env } = createEnv();

    const formData = new FormData();
    const tooLarge = new Uint8Array(10 * 1024 * 1024 + 1);
    const file = new File([tooLarge], 'oversized.pdf', { type: 'application/pdf' });
    formData.append('file', file);

    const request = new Request('https://worker.internal/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await worker.fetch(request, env, {} as ExecutionContext);

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('file too large')
    });
  });

  it('returns 405 for non-POST upload requests', async () => {
    const { env } = createEnv();

    const request = new Request('https://worker.internal/api/upload', {
      method: 'GET'
    });

    const response = await worker.fetch(request, env, {} as ExecutionContext);

    expect(response.status).toBe(405);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Method Not Allowed'
    });
  });

  it('returns 400 for unsupported upload type query', async () => {
    const { env } = createEnv();

    const formData = new FormData();
    const file = new File([new Uint8Array([1, 2, 3])], 'test-image.png', { type: 'image/png' });
    formData.append('file', file);

    const request = new Request('https://worker.internal/api/upload?type=laser', {
      method: 'POST',
      body: formData
    });

    const response = await worker.fetch(request, env, {} as ExecutionContext);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('unsupported upload type')
    });
  });

  it('accepts supported upload type query', async () => {
    const { env, put } = createEnv();

    const formData = new FormData();
    const file = new File([new Uint8Array([1, 2, 3])], 'test-image.png', { type: 'image/png' });
    formData.append('file', file);

    const request = new Request('https://worker.internal/api/upload?type=cnc', {
      method: 'POST',
      body: formData
    });

    const response = await worker.fetch(request, env, {} as ExecutionContext);

    expect(response.status).toBe(200);
    expect(put).toHaveBeenCalledTimes(1);
    const firstCall = put.mock.calls.at(0);
    expect(firstCall).toBeDefined();
    if (!firstCall) {
      throw new Error('expected first R2 put call to exist');
    }

    const [key] = firstCall;
    expect(typeof key).toBe('string');
    expect(key).toContain('/cnc-');
  });
});
