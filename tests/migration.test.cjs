const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SOURCE, TARGET, LIMIT, prefix, rewriteReferences, validateSnapshot, makeClient,
  exportSnapshot, inspectTarget, importSnapshot } = require('../tools/migrate-firestore.cjs');
const { checkAccounts } = require('../tools/check-auth-migration.cjs');
const data = [
  { path: 'users/old-uid', fields: { name: { stringValue: 'Person' }, aktiv: { booleanValue: false } } },
  { path: 'eintraege/termin', fields: { ownerId: { stringValue: 'old-uid' },
    datum: { timestampValue: '2026-10-02T12:00:00Z' }, number: { integerValue: '9007199254740993' },
    user: { referenceValue: prefix(SOURCE) + 'users/old-uid' } } }
];
const snapshot = () => ({ version: 1, source: SOURCE, target: TARGET, database: '(default)', documents: structuredClone(data) });
function target(initial = [], failAfter = Infinity) {
  const docs = new Map(initial.map(doc => [doc.path, structuredClone(doc)]));
  let writes = 0;
  return { project: TARGET, docs, writes: () => writes,
    scan: async visit => { for (const doc of docs.values()) await visit(structuredClone(doc)); },
    create: async doc => { if (writes >= failAfter) throw new Error('offline');
      assert(!docs.has(doc.path)); writes++; docs.set(doc.path, structuredClone(doc)); }
  };
}
test('migration preserves UIDs, private rights, integer precision and timestamps', async () => {
  const dest = target();
  assert.deepEqual(await importSnapshot(snapshot(), dest), { copied: 2, alreadyPresent: 0, total: 2 });
  assert.equal(dest.docs.get('users/old-uid').fields.aktiv.booleanValue, false);
  const fields = dest.docs.get('eintraege/termin').fields;
  assert.equal(fields.ownerId.stringValue, 'old-uid');
  assert.equal(fields.number.integerValue, '9007199254740993');
  assert.equal(fields.datum.timestampValue, '2026-10-02T12:00:00Z');
  assert.equal(fields.user.referenceValue, prefix(TARGET) + 'users/old-uid');
  assert.equal(data[1].fields.user.referenceValue, prefix(SOURCE) + 'users/old-uid');
});
test('unexpected target data aborts before any writes', async () => {
  const dest = target([{ path: 'users/new-uid', fields: {} }]);
  await assert.rejects(importSnapshot(snapshot(), dest), /abweichende/);
  assert.equal(dest.writes(), 0);
});
test('changed existing documents are never overwritten', async () => {
  const dest = target([{ path: 'users/old-uid', fields: { aktiv: { booleanValue: true } } }]);
  await assert.rejects(importSnapshot(snapshot(), dest), /abweichende/);
  assert.equal(dest.writes(), 0);
});
test('interrupted copies resume and successful repeats write nothing', async () => {
  const dest = target([], 1);
  await assert.rejects(importSnapshot(snapshot(), dest), /offline/);
  assert.equal(dest.docs.size, 1);
  const resumed = target([...dest.docs.values()]);
  assert.deepEqual(await importSnapshot(snapshot(), resumed), { copied: 1, alreadyPresent: 1, total: 2 });
  assert.deepEqual(await importSnapshot(snapshot(), resumed), { copied: 0, alreadyPresent: 2, total: 2 });
});
test('read-only verification reports missing documents without writing', async () => {
  const dest = target([data[0]]);
  assert.equal((await inspectTarget(snapshot(), dest)).size, 1);
  await assert.rejects(inspectTarget(snapshot(), dest, true), /vollständig/);
  assert.equal(dest.writes(), 0);
});
test('only typed document references from the source project are rewritten', () => {
  const value = { mapValue: { fields: { list: { arrayValue: { values: [
    { referenceValue: prefix(SOURCE) + 'users/old-uid' },
    { stringValue: prefix(SOURCE) + 'users/old-uid' },
    { referenceValue: 'projects/other/databases/(default)/documents/users/id' }
  ] } } } } };
  const values = rewriteReferences(value).mapValue.fields.list.arrayValue.values;
  assert.equal(values[0].referenceValue, prefix(TARGET) + 'users/old-uid');
  assert.equal(values[1].stringValue, prefix(SOURCE) + 'users/old-uid');
  assert.equal(values[2].referenceValue, 'projects/other/databases/(default)/documents/users/id');
});
test('wrong projects, invalid paths and duplicate document IDs are rejected', () => {
  for (const mutate of [s => s.source = TARGET, s => s.target = SOURCE,
    s => s.documents[0].path = 'users', s => s.documents[0].path = '../id',
    s => s.documents.push(s.documents[0])]) {
    const s = snapshot(); mutate(s); assert.throws(() => validateSnapshot(s));
  }
});
test('export limit aborts instead of returning a truncated backup', async () => {
  const source = { project: SOURCE, scan: async visit => {
    for (let i = 0; i <= LIMIT; i++) await visit({ path: 'items/' + i, fields: {} });
  } };
  await assert.rejects(exportSnapshot(source), /10.000/);
});
test('scanner follows missing parents, pages and empty documents', async () => {
  const calls = [];
  const client = makeClient(SOURCE, async (url, opts) => {
    calls.push({ url, ...opts });
    const decoded = decodeURIComponent(url), base = 'https://firestore.googleapis.com/v1/' + prefix(SOURCE).slice(0, -1);
    if (decoded === base + ':listCollectionIds') return opts.body.pageToken ? { collectionIds: ['empty'] } : { collectionIds: ['parent'], nextPageToken: 'page2' };
    if (decoded.includes('/parent?')) return { documents: [{ name: prefix(SOURCE) + 'parent/missing' }] };
    if (decoded === base + '/parent/missing:listCollectionIds') return { collectionIds: ['child'] };
    if (decoded.includes('/parent/missing/child?')) return { documents: [{ name: prefix(SOURCE) + 'parent/missing/child/id', createTime: 'now', fields: data[0].fields }] };
    if (decoded.includes('/empty?')) return { documents: [{ name: prefix(SOURCE) + 'empty/id', createTime: 'now' }] };
    if (decoded.endsWith(':listCollectionIds')) return {};
    throw new Error(decoded);
  });
  const result = await exportSnapshot(client);
  assert.deepEqual(result.documents.map(d => d.path), ['parent/missing/child/id', 'empty/id']);
  assert.deepEqual(result.documents[1].fields, {});
  assert(calls.some(call => call.body?.pageToken === 'page2'));
  assert(calls.filter(call => call.method === 'POST').every(call => call.url.endsWith(':listCollectionIds')));
  await assert.rejects(client.create(data[0]), /Quellprojekt/);
});

const user = { localId: 'old-uid', email: 'person@example.com', emailVerified: true,
  disabled: false, providerUserInfo: [{ providerId: 'google.com', rawId: 'google-id' }] };
test('authentication verification requires the original UID and Google provider identity', () => {
  const source = { users: [user] };
  assert.equal(checkAccounts(source, { users: [] }).missingUsers, 1);
  assert.equal(checkAccounts(source, source, true).missingUsers, 0);
  assert.throws(() => checkAccounts(source, { users: [{ ...user, localId: 'new-uid' }] }), /abweichende/);
  assert.throws(() => checkAccounts(source, { users: [{ ...user, providerUserInfo: [{ providerId: 'google.com', rawId: 'different' }] }] }), /abweichende/);
  assert.throws(() => checkAccounts(source, { users: [] }, true), /fehlen/);
});
test('authentication preserves disabled and verified status', () => {
  const source = { users: [{ ...user, disabled: true }] };
  assert.throws(() => checkAccounts(source, { users: [user] }), /abweichende/);
  assert.throws(() => checkAccounts({ users: [user] }, { users: [{ ...user, emailVerified: false }] }), /abweichende/);
});
test('password accounts and duplicate UIDs stop the OAuth-only import path', () => {
  assert.throws(() => checkAccounts({ users: [{ ...user, passwordHash: 'hash' }] }, { users: [] }), /Passwort/);
  assert.throws(() => checkAccounts({ users: [user, user] }, { users: [] }), /doppelt/);
});
