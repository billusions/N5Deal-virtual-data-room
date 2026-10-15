import { test, expect } from '@playwright/test';
import { registerUser, getDefaultDataRoomId, createFolder, uploadFile, authHeaders } from '@support/apiClient';
import { testName } from '@support/ids';
import { makeValidPdf } from '@support/pdf';

test.describe('R4/R6 Folder name conflicts (Priority 3: data integrity)', () => {
  test('duplicate folder names are blocked, including a same-name-different-case sibling', async ({ request }) => {
    const owner = await registerUser(request, { label: 'folder-conflict' });
    const dataRoomId = await getDefaultDataRoomId(request, owner.token);
    const name = testName('dup');
    await createFolder(request, owner.token, { dataRoomId, name });

    const sameCase = await request.post('/folders', {
      headers: authHeaders(owner.token),
      data: { dataRoomId, name },
    });
    expect(sameCase.status()).toBe(409);

    const differentCase = await request.post('/folders', {
      headers: authHeaders(owner.token),
      data: { dataRoomId, name: name.toUpperCase() },
    });
    expect(differentCase.status()).toBe(409);
  });

  test('renaming a folder to an existing sibling name is blocked with a clear message', async ({ request }) => {
    const owner = await registerUser(request, { label: 'folder-rename-conflict' });
    const dataRoomId = await getDefaultDataRoomId(request, owner.token);
    const existingName = testName('existing');
    await createFolder(request, owner.token, { dataRoomId, name: existingName });
    const toRename = await createFolder(request, owner.token, { dataRoomId, name: testName('to-rename') });

    const res = await request.patch(`/folders/${toRename.id}`, {
      headers: authHeaders(owner.token),
      data: { name: existingName },
    });
    expect(res.status()).toBe(409);
    expect((await res.json()).message).toContain(existingName);
  });
});

test.describe('R7 Delete folder with nested content (Priority 3: data integrity)', () => {
  test('delete-preview reports accurate counts, and delete removes the whole subtree', async ({ request }) => {
    const owner = await registerUser(request, { label: 'delete-folder' });
    const dataRoomId = await getDefaultDataRoomId(request, owner.token);

    const parent = await createFolder(request, owner.token, { dataRoomId, name: testName('parent') });
    const child = await createFolder(request, owner.token, {
      dataRoomId,
      name: testName('child'),
      parentId: parent.id,
    });
    const file = await uploadFile(request, owner.token, {
      dataRoomId,
      folderId: child.id,
      name: testName('nested') + '.pdf',
      bytes: makeValidPdf(),
    });

    const preview = await request.get(`/folders/${parent.id}/delete-preview`, {
      headers: authHeaders(owner.token),
    });
    expect(preview.status()).toBe(200);
    const previewBody = await preview.json();
    expect(previewBody.folderCount).toBe(1);
    expect(previewBody.fileCount).toBe(1);

    const del = await request.delete(`/folders/${parent.id}`, { headers: authHeaders(owner.token) });
    expect(del.status()).toBe(204);

    const childAfter = await request.get(`/folders/${child.id}/contents`, { headers: authHeaders(owner.token) });
    expect(childAfter.status()).toBe(404);
    const fileAfter = await request.get(`/files/${file.id}`, { headers: authHeaders(owner.token) });
    expect(fileAfter.status()).toBe(404);
  });
});

test.describe('R8/R10/R11/E1 File name conflicts (Priority 4: upload)', () => {
  test('uploading a file with a name that already exists in the folder auto-resolves instead of failing', async ({ request }) => {
    const owner = await registerUser(request, { label: 'file-conflict' });
    const dataRoomId = await getDefaultDataRoomId(request, owner.token);
    const sharedName = testName('report') + '.pdf';

    const first = await uploadFile(request, owner.token, { dataRoomId, name: sharedName, bytes: makeValidPdf() });
    const second = await uploadFile(request, owner.token, { dataRoomId, name: sharedName, bytes: makeValidPdf() });

    expect(first.name).toBe(sharedName);
    expect(second.name).not.toBe(sharedName);
    expect(second.name).toContain(sharedName.replace('.pdf', ''));
  });

  test('renaming a file to an existing sibling name auto-resolves with a conflict-safe name', async ({ request }) => {
    const owner = await registerUser(request, { label: 'file-rename-conflict' });
    const dataRoomId = await getDefaultDataRoomId(request, owner.token);
    const existingName = testName('taken') + '.pdf';
    await uploadFile(request, owner.token, { dataRoomId, name: existingName, bytes: makeValidPdf() });
    const toRename = await uploadFile(request, owner.token, {
      dataRoomId,
      name: testName('rename-me') + '.pdf',
      bytes: makeValidPdf(),
    });

    const res = await request.patch(`/files/${toRename.id}`, {
      headers: authHeaders(owner.token),
      data: { name: existingName },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).not.toBe(existingName);
  });

  test('moving a file into a folder with a same-named file auto-resolves the conflict', async ({ request }) => {
    const owner = await registerUser(request, { label: 'file-move-conflict' });
    const dataRoomId = await getDefaultDataRoomId(request, owner.token);
    const targetFolder = await createFolder(request, owner.token, { dataRoomId, name: testName('target') });
    const conflictName = testName('conflict') + '.pdf';

    await uploadFile(request, owner.token, {
      dataRoomId,
      folderId: targetFolder.id,
      name: conflictName,
      bytes: makeValidPdf(),
    });
    const toMove = await uploadFile(request, owner.token, { dataRoomId, name: conflictName, bytes: makeValidPdf() });

    const res = await request.patch(`/files/${toMove.id}/move`, {
      headers: authHeaders(owner.token),
      data: { targetFolderId: targetFolder.id },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.folderId).toBe(targetFolder.id);
    expect(body.name).not.toBe(conflictName);
  });

  test('uploading a non-PDF mime type is rejected by the API, not just the UI', async ({ request }) => {
    const owner = await registerUser(request, { label: 'mime-check' });
    const dataRoomId = await getDefaultDataRoomId(request, owner.token);

    const res = await request.post('/files/upload-intent', {
      headers: authHeaders(owner.token),
      data: { dataRoomId, name: testName('image') + '.jpg', size: 1024, mimeType: 'image/jpeg' },
    });
    expect(res.status()).toBe(400);
  });

  test('uploading a file over the 50MB limit is rejected with a clear message', async ({ request }) => {
    const owner = await registerUser(request, { label: 'size-check' });
    const dataRoomId = await getDefaultDataRoomId(request, owner.token);

    const res = await request.post('/files/upload-intent', {
      headers: authHeaders(owner.token),
      data: {
        dataRoomId,
        name: testName('huge') + '.pdf',
        size: 51 * 1024 * 1024,
        mimeType: 'application/pdf',
      },
    });
    expect(res.status()).toBe(400);
    const message = (await res.json()).message;
    expect([message].flat().join(' ')).toMatch(/50 ?MB/i);
  });
});
