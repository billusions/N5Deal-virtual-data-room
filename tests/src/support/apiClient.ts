import { APIRequestContext, APIResponse } from '@playwright/test';
import { testEmail, TEST_USER_PASSWORD } from './ids';

export interface TestUser {
  email: string;
  password: string;
  token: string;
}

export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function assertOk(res: APIResponse, action: string): Promise<void> {
  if (!res.ok()) {
    const body = await res.text().catch(() => '<no body>');
    throw new Error(`${action} failed: ${res.status()} ${body}`);
  }
}

/** Registers a brand-new, uniquely-named user. Registration also auto-creates their one data room. */
export async function registerUser(
  request: APIRequestContext,
  opts?: { label?: string; password?: string },
): Promise<TestUser> {
  const email = testEmail(opts?.label ?? 'user');
  const password = opts?.password ?? TEST_USER_PASSWORD;
  const res = await request.post('/auth/register', {
    data: { email, password, name: 'QA Test User' },
  });
  await assertOk(res, 'register');
  const body = await res.json();
  return { email, password, token: body.accessToken };
}

export async function loginUser(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post('/auth/login', { data: { email, password } });
  await assertOk(res, 'login');
  const body = await res.json();
  return body.accessToken;
}

/** The id of the user's default data room (auto-created on registration). */
export async function getDefaultDataRoomId(
  request: APIRequestContext,
  token: string,
): Promise<string> {
  const res = await request.get('/data-rooms', { headers: authHeaders(token) });
  await assertOk(res, 'list data rooms');
  const body = await res.json();
  return body.items[0].id;
}

export async function createFolder(
  request: APIRequestContext,
  token: string,
  opts: { dataRoomId: string; name: string; parentId?: string },
): Promise<{ id: string; name: string }> {
  const res = await request.post('/folders', {
    headers: authHeaders(token),
    data: opts,
  });
  await assertOk(res, 'create folder');
  return res.json();
}

export interface UploadedFile {
  id: string;
  name: string;
}

/** Full upload happy path: upload-intent -> PUT bytes to the signed storage URL -> complete. */
export async function uploadFile(
  request: APIRequestContext,
  token: string,
  opts: {
    dataRoomId: string;
    folderId?: string;
    name: string;
    bytes: Buffer;
    mimeType?: string;
  },
): Promise<UploadedFile> {
  const mimeType = opts.mimeType ?? 'application/pdf';
  const intentRes = await request.post('/files/upload-intent', {
    headers: authHeaders(token),
    data: {
      dataRoomId: opts.dataRoomId,
      folderId: opts.folderId,
      name: opts.name,
      size: opts.bytes.byteLength,
      mimeType,
    },
  });
  await assertOk(intentRes, 'create upload intent');
  const intent = await intentRes.json();

  const putRes = await request.put(intent.uploadUrl, {
    headers: { 'Content-Type': mimeType },
    data: opts.bytes,
  });
  await assertOk(putRes, 'PUT file bytes to storage');

  const completeRes = await request.post(`/files/${intent.fileId}/complete`, {
    headers: authHeaders(token),
  });
  await assertOk(completeRes, 'complete upload');
  return completeRes.json();
}

export type ShareResourceType = 'DATAROOM' | 'FOLDER' | 'FILE';
export type ShareMode = 'USER' | 'PUBLIC_LINK';

export interface Share {
  id: string;
  resourceType: ShareResourceType;
  resourceId: string;
  mode: ShareMode;
  granteeEmail: string | null;
  token: string | null;
}

export async function createShare(
  request: APIRequestContext,
  token: string,
  opts: { resourceType: ShareResourceType; resourceId: string; mode: ShareMode; granteeEmail?: string },
): Promise<Share> {
  const res = await request.post('/shares', { headers: authHeaders(token), data: opts });
  await assertOk(res, 'create share');
  return res.json();
}

export async function revokeShare(request: APIRequestContext, token: string, shareId: string): Promise<void> {
  const res = await request.delete(`/shares/${shareId}`, { headers: authHeaders(token) });
  await assertOk(res, 'revoke share');
}

export async function getReceivedShares(request: APIRequestContext, token: string): Promise<any[]> {
  const res = await request.get('/shares/received', { headers: authHeaders(token) });
  await assertOk(res, 'get received shares');
  return (await res.json()).items;
}
