import { test, expect } from '@playwright/test';
import { registerUser, loginUser, authHeaders } from '@support/apiClient';
import { testEmail } from '@support/ids';

test.describe('R1 Authentication', () => {
  test('register returns a usable token, and /auth/me reflects the new account', async ({ request }) => {
    const user = await registerUser(request, { label: 'register' });

    const me = await request.get('/auth/me', { headers: authHeaders(user.token) });
    expect(me.status()).toBe(200);
    expect((await me.json()).email).toBe(user.email);
  });

  test('registering the same email twice is rejected with a clear conflict error', async ({ request }) => {
    const user = await registerUser(request, { label: 'dup' });

    const second = await request.post('/auth/register', {
      data: { email: user.email, password: user.password, name: 'Someone Else' },
    });
    expect(second.status()).toBe(409);
    expect((await second.json()).message).toMatch(/already exists/i);
  });

  test('login is case-insensitive on the email', async ({ request }) => {
    const user = await registerUser(request, { label: 'case' });

    const token = await loginUser(request, user.email.toUpperCase(), user.password);
    expect(token).toBeTruthy();
  });

  // New finding (extends L12): a trailing/leading space on the email is rejected by
  // @IsEmail validation before the service ever gets a chance to trim it - unlike
  // CreateShareDto, LoginDto/RegisterDto have no @Transform(trim) step. Written against
  // the EXPECTED behavior and marked as a known failure so the suite documents the bug
  // but stays green; this flips to a visible failure once it's fixed.
  test('login should trim a leading/trailing space on the email instead of rejecting it', async ({ request }) => {
    test.fail();
    const user = await registerUser(request, { label: 'ws' });

    const res = await request.post('/auth/login', {
      data: { email: `  ${user.email}  `, password: user.password },
    });
    expect(res.status()).toBe(200);
  });

  test('wrong password and unknown email return the same generic error (no account enumeration)', async ({ request }) => {
    const user = await registerUser(request, { label: 'enum' });

    const wrongPassword = await request.post('/auth/login', {
      data: { email: user.email, password: 'definitely-wrong' },
    });
    const unknownEmail = await request.post('/auth/login', {
      data: { email: testEmail('nobody'), password: 'whatever12' },
    });

    expect(wrongPassword.status()).toBe(401);
    expect(unknownEmail.status()).toBe(401);
    expect((await wrongPassword.json()).message).toBe((await unknownEmail.json()).message);
  });

  test('/auth/me rejects a missing or malformed token', async ({ request }) => {
    const noToken = await request.get('/auth/me');
    expect(noToken.status()).toBe(401);

    const badToken = await request.get('/auth/me', {
      headers: authHeaders('not-a-real-jwt'),
    });
    expect(badToken.status()).toBe(401);
  });

  test('registration rejects a password under 8 characters, and a password over 72 characters', async ({ request }) => {
    const tooShort = await request.post('/auth/register', {
      data: { email: testEmail('short'), password: 'abc123', name: 'QA' },
    });
    expect(tooShort.status()).toBe(400);

    const tooLong = await request.post('/auth/register', {
      data: { email: testEmail('long'), password: 'a'.repeat(73), name: 'QA' },
    });
    expect(tooLong.status()).toBe(400);
  });
});
