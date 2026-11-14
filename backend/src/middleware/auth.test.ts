import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAuthMiddleware, issueDownloadTicket, TICKET_TTL_MS } from './auth';

// Minimal fake database: one valid session token for one admin user
const db: any = {
  getSessionByToken: (t: string) => (t === 'session-token' ? { userId: 'u1' } : undefined),
  getAdminUserById: (id: string) => (id === 'u1' ? { id: 'u1', username: 'admin', isAdmin: true } : undefined),
  getPlexUserById: () => undefined,
};

const run = async (middleware: any, req: { headers?: any; query?: any }) => {
  let status = 200;
  let passed = false;
  const res: any = { status: (s: number) => ((status = s), res), json: () => res };
  await middleware({ headers: {}, query: {}, ...req }, res, () => (passed = true));
  return passed ? 'next' : status;
};

test('the session token is never accepted in the URL', async () => {
  assert.equal(await run(createAuthMiddleware(db), { query: { token: 'session-token' } }), 401);
  assert.equal(await run(createAuthMiddleware(db, { allowTicket: true }), { query: { token: 'session-token' } }), 401);
});

test('tickets only work on routes that allow them', async () => {
  const ticket = issueDownloadTicket('session-token');
  assert.equal(await run(createAuthMiddleware(db), { query: { ticket } }), 401);
  assert.equal(await run(createAuthMiddleware(db, { allowTicket: true }), { query: { ticket } }), 'next');
});

test('unknown and expired tickets are refused', async () => {
  const download = createAuthMiddleware(db, { allowTicket: true });
  assert.equal(await run(download, { query: { ticket: 'made-up' } }), 401);
  const old = issueDownloadTicket('session-token', Date.now() - TICKET_TTL_MS - 1);
  assert.equal(await run(download, { query: { ticket: old } }), 401);
});

test('the Authorization header still works everywhere', async () => {
  assert.equal(await run(createAuthMiddleware(db), { headers: { authorization: 'Bearer session-token' } }), 'next');
});
