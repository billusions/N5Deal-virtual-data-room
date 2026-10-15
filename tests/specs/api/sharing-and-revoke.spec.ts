import { test, expect } from '@playwright/test';
import {
  registerUser,
  getDefaultDataRoomId,
  createFolder,
  uploadFile,
  createShare,
  revokeShare,
  getReceivedShares,
  authHeaders,
} from '@support/apiClient';
import { testName } from '@support/ids';
import { makeValidPdf } from '@support/pdf';

/** Priority 2 in the test plan: read-only sharing and revoke must be enforced server-side, not just hidden in the UI. */
test.describe('R13-R16 Sharing, public links and revoke (Critical)', () => {
  test('sharing a folder grants the recipient read access that inherits to new nested content', async ({ request }) => {
    const owner = await registerUser(request, { label: 'share-owner' });
    const viewer = await registerUser(request, { label: 'share-viewer' });
    const dataRoomId = await getDefaultDataRoomId(request, owner.token);

    const folder = await createFolder(request, owner.token, { dataRoomId, name: testName('shared-folder') });
    const share = await createShare(request, owner.token, {
      resourceType: 'FOLDER',
      resourceId: folder.id,
      mode: 'USER',
      granteeEmail: viewer.email,
    });
    expect(share.mode).toBe('USER');

    const received = await getReceivedShares(request, viewer.token);
    expect(received.some((r: any) => r.resourceId === folder.id)).toBe(true);

    const viewerContents = await request.get(`/folders/${folder.id}/contents`, {
      headers: authHeaders(viewer.token),
    });
    expect(viewerContents.status()).toBe(200);

    // Inheritance: a file added to the folder *after* sharing is visible to the viewer without re-sharing.
    const file = await uploadFile(request, owner.token, {
      dataRoomId,
      folderId: folder.id,
      name: testName('nested-file') + '.pdf',
      bytes: makeValidPdf(),
    });
    const viewerFile = await request.get(`/files/${file.id}`, { headers: authHeaders(viewer.token) });
    expect(viewerFile.status()).toBe(200);

    const viewerFileWrite = await request.patch(`/files/${file.id}`, {
      headers: authHeaders(viewer.token),
      data: { name: 'renamed-by-viewer.pdf' },
    });
    expect(viewerFileWrite.status()).toBe(404);
  });

  test('a user not granted access cannot open a USER-mode shared resource', async ({ request }) => {
    const owner = await registerUser(request, { label: 'share-owner2' });
    const viewer = await registerUser(request, { label: 'share-viewer2' });
    const outsider = await registerUser(request, { label: 'share-outsider' });
    const dataRoomId = await getDefaultDataRoomId(request, owner.token);
    const folder = await createFolder(request, owner.token, { dataRoomId, name: testName('private-folder') });

    await createShare(request, owner.token, {
      resourceType: 'FOLDER',
      resourceId: folder.id,
      mode: 'USER',
      granteeEmail: viewer.email,
    });

    const outsiderRes = await request.get(`/folders/${folder.id}/contents`, { headers: authHeaders(outsider.token) });
    expect(outsiderRes.status()).toBe(404);
  });

  test('revoking a share immediately removes the recipient\'s access', async ({ request }) => {
    const owner = await registerUser(request, { label: 'revoke-owner' });
    const viewer = await registerUser(request, { label: 'revoke-viewer' });
    const dataRoomId = await getDefaultDataRoomId(request, owner.token);
    const folder = await createFolder(request, owner.token, { dataRoomId, name: testName('revoke-folder') });

    const share = await createShare(request, owner.token, {
      resourceType: 'FOLDER',
      resourceId: folder.id,
      mode: 'USER',
      granteeEmail: viewer.email,
    });

    const beforeRevoke = await request.get(`/folders/${folder.id}/contents`, { headers: authHeaders(viewer.token) });
    expect(beforeRevoke.status()).toBe(200);

    await revokeShare(request, owner.token, share.id);

    const afterRevoke = await request.get(`/folders/${folder.id}/contents`, { headers: authHeaders(viewer.token) });
    expect(afterRevoke.status()).toBe(404);
  });

  test('a public link exposes only its own subtree and stops working once revoked', async ({ request }) => {
    const owner = await registerUser(request, { label: 'public-owner' });
    const dataRoomId = await getDefaultDataRoomId(request, owner.token);
    const sharedFolder = await createFolder(request, owner.token, { dataRoomId, name: testName('public-folder') });
    const siblingFolder = await createFolder(request, owner.token, { dataRoomId, name: testName('sibling-folder') });

    const share = await createShare(request, owner.token, {
      resourceType: 'FOLDER',
      resourceId: sharedFolder.id,
      mode: 'PUBLIC_LINK',
    });
    expect(share.token).toBeTruthy();

    const okResolve = await request.get(`/public/${share.token}`);
    expect(okResolve.status()).toBe(200);

    // A FOLDER-mode share's own contents are fetched via /folders/:id/contents, using its
    // own id - /contents (root) only ever resolves for a DATAROOM-mode share.
    const okContents = await request.get(`/public/${share.token}/folders/${sharedFolder.id}/contents`);
    expect(okContents.status()).toBe(200);

    // Id-substitution attempt: the same valid token must not reach a sibling folder outside its own subtree.
    const outOfScope = await request.get(`/public/${share.token}/folders/${siblingFolder.id}/contents`);
    expect(outOfScope.status()).toBe(404);

    await revokeShare(request, owner.token, share.id);

    const afterRevoke = await request.get(`/public/${share.token}`);
    expect(afterRevoke.status()).toBe(410);
    expect((await afterRevoke.json()).message).toMatch(/revoked/i);
  });

  test('revoking one user\'s share does not affect another user\'s separate share on the same item', async ({ request }) => {
    const owner = await registerUser(request, { label: 'multi-owner' });
    const viewerA = await registerUser(request, { label: 'multi-viewer-a' });
    const viewerB = await registerUser(request, { label: 'multi-viewer-b' });
    const dataRoomId = await getDefaultDataRoomId(request, owner.token);
    const folder = await createFolder(request, owner.token, { dataRoomId, name: testName('multi-share-folder') });

    const shareA = await createShare(request, owner.token, {
      resourceType: 'FOLDER',
      resourceId: folder.id,
      mode: 'USER',
      granteeEmail: viewerA.email,
    });
    await createShare(request, owner.token, {
      resourceType: 'FOLDER',
      resourceId: folder.id,
      mode: 'USER',
      granteeEmail: viewerB.email,
    });

    await revokeShare(request, owner.token, shareA.id);

    const viewerAAfter = await request.get(`/folders/${folder.id}/contents`, { headers: authHeaders(viewerA.token) });
    const viewerBAfter = await request.get(`/folders/${folder.id}/contents`, { headers: authHeaders(viewerB.token) });
    expect(viewerAAfter.status()).toBe(404);
    expect(viewerBAfter.status()).toBe(200);
  });

  // Finding L1: sharing an item with your own email is currently accepted instead of blocked.
  // Written against the EXPECTED behavior and marked as a known failure so the suite documents
  // the bug but stays green; this flips to a visible failure the moment it's fixed, which is the signal to update it.
  test('sharing an item with your own email should be rejected, not create a self-share', async ({ request }) => {
    test.fail();
    const owner = await registerUser(request, { label: 'self-share' });
    const dataRoomId = await getDefaultDataRoomId(request, owner.token);
    const folder = await createFolder(request, owner.token, { dataRoomId, name: testName('self-share-folder') });

    const res = await request.post('/shares', {
      headers: authHeaders(owner.token),
      data: { resourceType: 'FOLDER', resourceId: folder.id, mode: 'USER', granteeEmail: owner.email },
    });
    expect(res.status()).toBe(400);
  });
});
