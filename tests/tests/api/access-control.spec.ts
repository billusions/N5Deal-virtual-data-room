import { test, expect } from '@playwright/test';
import { registerUser, getDefaultDataRoomId, createFolder, uploadFile, authHeaders } from '@support/apiClient';
import { testName } from '@support/ids';
import { makeValidPdf } from '@support/pdf';

/**
 * Priority 1 in the test plan: a data leak between users is worse than any
 * functional defect in a due-diligence product. These checks exist to catch
 * exactly that, both via the UI's own calls and via direct API/ID access.
 */
test.describe('R2 Owner-only visibility (Critical)', () => {
  let ownerDataRoomId: string;
  let ownerFolderId: string;
  let ownerFileId: string;
  const secretFolderName = testName('secret-folder');
  let strangerToken: string;

  test.beforeAll(async ({ request }) => {
    const owner = await registerUser(request, { label: 'owner' });
    ownerDataRoomId = await getDefaultDataRoomId(request, owner.token);
    const folder = await createFolder(request, owner.token, {
      dataRoomId: ownerDataRoomId,
      name: secretFolderName,
    });
    ownerFolderId = folder.id;
    const file = await uploadFile(request, owner.token, {
      dataRoomId: ownerDataRoomId,
      folderId: ownerFolderId,
      name: testName('secret-file') + '.pdf',
      bytes: makeValidPdf(),
    });
    ownerFileId = file.id;

    const stranger = await registerUser(request, { label: 'stranger' });
    strangerToken = stranger.token;
  });

  test('a stranger cannot open another user\'s data room by id', async ({ request }) => {
    const res = await request.get(`/data-rooms/${ownerDataRoomId}`, {
      headers: authHeaders(strangerToken),
    });
    expect(res.status()).toBe(404);
  });

  test('a stranger cannot open another user\'s folder by id, and the response does not leak its name', async ({ request }) => {
    const res = await request.get(`/folders/${ownerFolderId}/contents`, {
      headers: authHeaders(strangerToken),
    });
    expect(res.status()).toBe(404);
    const body = await res.text();
    expect(body).not.toContain(secretFolderName);
  });

  test('a stranger cannot open another user\'s file by id', async ({ request }) => {
    const res = await request.get(`/files/${ownerFileId}`, {
      headers: authHeaders(strangerToken),
    });
    expect(res.status()).toBe(404);
  });

  test('a stranger cannot get a download or view URL for another user\'s file', async ({ request }) => {
    const viewRes = await request.get(`/files/${ownerFileId}/view-url`, {
      headers: authHeaders(strangerToken),
    });
    const downloadRes = await request.get(`/files/${ownerFileId}/download-url`, {
      headers: authHeaders(strangerToken),
    });
    expect(viewRes.status()).toBe(404);
    expect(downloadRes.status()).toBe(404);
  });

  test('every protected endpoint rejects requests with no token', async ({ request }) => {
    const res = await request.get(`/data-rooms/${ownerDataRoomId}`);
    expect(res.status()).toBe(401);
  });

  test('every protected endpoint rejects a malformed/garbage token', async ({ request }) => {
    const res = await request.get(`/data-rooms/${ownerDataRoomId}`, {
      headers: authHeaders('garbage.not.a.jwt'),
    });
    expect(res.status()).toBe(401);
  });

  test('a stranger cannot delete or rename another user\'s folder', async ({ request }) => {
    const renameRes = await request.patch(`/folders/${ownerFolderId}`, {
      headers: authHeaders(strangerToken),
      data: { name: 'hijacked' },
    });
    const deleteRes = await request.delete(`/folders/${ownerFolderId}`, {
      headers: authHeaders(strangerToken),
    });
    expect(renameRes.status()).toBe(404);
    expect(deleteRes.status()).toBe(404);
  });
});
