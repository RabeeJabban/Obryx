// One-time copy for this app. Authentication users are imported separately.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const SOURCE = 'sawa-82a09';
const TARGET = 'orbyx-8d73c';
const LIMIT = 10000;
const database = '(default)';
const prefix = project => `projects/${project}/databases/${database}/documents/`;

function rewriteReferences(value) {
  if (Array.isArray(value)) return value.map(rewriteReferences);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    key === 'referenceValue' && typeof item === 'string' && item.startsWith(prefix(SOURCE))
      ? prefix(TARGET) + item.slice(prefix(SOURCE).length) : rewriteReferences(item)]));
}

function validateSnapshot(snapshot) {
  if (snapshot.version !== 1 || snapshot.source !== SOURCE || snapshot.target !== TARGET ||
      snapshot.database !== database || !Array.isArray(snapshot.documents) ||
      snapshot.documents.length > LIMIT) throw new Error('Sicherung passt nicht zu diesen Projekten oder überschreitet 10.000 Dokumente.');
  const seen = new Set();
  for (const doc of snapshot.documents) {
    const segments = typeof doc.path === 'string' ? doc.path.split('/') : [];
    if (!segments.length || segments.length % 2 || segments.some(x => !x || x === '.' || x === '..') ||
        seen.has(doc.path) || !doc.fields || typeof doc.fields !== 'object' || Array.isArray(doc.fields)) {
      throw new Error('Ungültiger oder doppelter Dokumentpfad in der Sicherung.');
    }
    seen.add(doc.path);
  }
  return snapshot;
}

function makeClient(project, request) {
  if (![SOURCE, TARGET].includes(project)) throw new Error('Unbekanntes Projekt.');
  const resource = relative => prefix(project).slice(0, -1) + (relative ? '/' + relative : '');
  const url = relative => 'https://firestore.googleapis.com/v1/' + resource(relative).split('/').map(encodeURIComponent).join('/');
  async function scan(visit, parent = '') {
    let collectionPage;
    do {
      const result = await request(url(parent) + ':listCollectionIds', {
        method: 'POST', body: { pageSize: 200, ...(collectionPage ? { pageToken: collectionPage } : {}) }
      });
      for (const collection of result.collectionIds || []) {
        const relative = parent ? parent + '/' + collection : collection;
        let documentPage;
        do {
          const query = new URLSearchParams({ pageSize: '200', showMissing: 'true', ...(documentPage ? { pageToken: documentPage } : {}) });
          const page = await request(url(relative) + '?' + query, { method: 'GET' });
          for (const doc of page.documents || []) {
            if (!doc.name?.startsWith(prefix(project))) throw new Error('Unerwarteter Dokumentname vom Server.');
            const relativePath = doc.name.slice(prefix(project).length);
            // Missing parent documents may still have subcollections.
            if (doc.createTime) await visit({ path: relativePath, fields: doc.fields || {} });
            await scan(visit, relativePath);
          }
          documentPage = page.nextPageToken;
        } while (documentPage);
      }
      collectionPage = result.nextPageToken;
    } while (collectionPage);
  }
  return {
    project, scan,
    create: async doc => {
      if (project !== TARGET) throw new Error('Das Quellprojekt darf nicht beschrieben werden.');
      const segments = doc.path.split('/'), id = segments.pop();
      const created = await request(url(segments.join('/')) + '?' + new URLSearchParams({ documentId: id }), {
        method: 'POST', body: { fields: doc.fields }
      });
      if (!isDeepStrictEqual(created.fields || {}, doc.fields)) throw new Error('Geschriebene Felder stimmen nicht mit der Sicherung überein.');
    }
  };
}

async function exportSnapshot(client) {
  if (client.project !== SOURCE) throw new Error('Export muss aus dem alten Projekt erfolgen.');
  const documents = [];
  await client.scan(doc => {
    if (documents.length >= LIMIT) throw new Error('Mehr als 10.000 Dokumente: zuerst Datenumfang und Kontingente planen.');
    documents.push(doc);
  });
  return validateSnapshot({ version: 1, source: SOURCE, target: TARGET, database,
    createdAt: new Date().toISOString(), documents });
}

async function inspectTarget(snapshot, target, complete = false) {
  validateSnapshot(snapshot);
  if (target.project !== TARGET) throw new Error('Import darf nur ins neue Projekt erfolgen.');
  const expected = new Map(snapshot.documents.map(doc => [doc.path, rewriteReferences(doc.fields)]));
  const existing = new Set();
  await target.scan(doc => {
    if (!expected.has(doc.path) || !isDeepStrictEqual(doc.fields, expected.get(doc.path))) {
      throw new Error('Das neue Projekt enthält abweichende Daten. Keine vorhandenen Daten werden überschrieben.');
    }
    existing.add(doc.path);
  });
  if (complete && existing.size !== expected.size) throw new Error('Die Kopie ist noch nicht vollständig.');
  return existing;
}

async function importSnapshot(snapshot, target, progress = () => {}) {
  const existing = await inspectTarget(snapshot, target);
  let written = 0;
  for (const doc of snapshot.documents) {
    if (existing.has(doc.path)) continue;
    // createDocument fails on concurrent creation instead of overwriting it.
    await target.create({ path: doc.path, fields: rewriteReferences(doc.fields) });
    written++;
    if (written % 100 === 0) progress(written);
  }
  await inspectTarget(snapshot, target, true);
  return { copied: written, alreadyPresent: existing.size, total: snapshot.documents.length };
}

function cloudRequest() {
  let token, refreshed = 0;
  return async (url, options) => {
    if (!token || Date.now() - refreshed > 30 * 60 * 1000) {
      try {
        token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
      } catch { throw new Error('Google-Anmeldung fehlt. Dieses Werkzeug ist für die angemeldete Google Cloud Shell vorgesehen.'); }
      refreshed = Date.now();
    }
    const response = await fetch(url, { method: options.method,
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}), signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Firestore HTTP ${response.status}. Prüfe Projektzugriff, Datenbank und Kontingente. Die Kopie kann nach Behebung fortgesetzt werden.`);
    return response.json();
  };
}

async function main() {
  const [command, filename] = process.argv.slice(2);
  if (!['export', 'check', 'import', 'verify'].includes(command) || !filename) {
    throw new Error('Aufruf: node tools/migrate-firestore.cjs export|check|import|verify PFAD_ZUR_SICHERUNG.json');
  }
  const file = path.resolve(filename), projectRoot = path.resolve(__dirname, '..');
  const relative = path.relative(projectRoot, file);
  if (!relative || (!relative.startsWith('..' + path.sep) && !path.isAbsolute(relative))) {
    throw new Error('Speichere die privaten Sicherungen außerhalb des GitHub-Projektordners.');
  }
  const request = cloudRequest();
  if (command === 'export') {
    if (fs.existsSync(file)) throw new Error('Die Sicherung existiert bereits. Verwende für eine neue Sicherung einen neuen Dateinamen.');
    const snapshot = await exportSnapshot(makeClient(SOURCE, request));
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    fs.writeFileSync(file, JSON.stringify(snapshot), { flag: 'wx', mode: 0o600 });
    console.log(`${snapshot.documents.length} Dokumente aus ${SOURCE} gesichert. Quellprojekt unverändert.`);
    return;
  }
  const snapshot = validateSnapshot(JSON.parse(fs.readFileSync(file, 'utf8')));
  const target = makeClient(TARGET, request);
  if (command === 'import') {
    const result = await importSnapshot(snapshot, target, n => console.log(`${n} Dokumente neu kopiert.`));
    console.log(JSON.stringify(result));
  } else {
    const existing = await inspectTarget(snapshot, target, command === 'verify');
    console.log(`${existing.size} von ${snapshot.documents.length} Dokumenten stimmen überein. ${command === 'verify' ? 'Kopie vollständig.' : 'Prüfung ohne Schreibvorgänge abgeschlossen.'}`);
  }
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { SOURCE, TARGET, LIMIT, prefix, rewriteReferences, validateSnapshot, makeClient, exportSnapshot, inspectTarget, importSnapshot };
