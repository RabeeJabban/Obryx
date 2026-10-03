const fs = require('node:fs');
const { isDeepStrictEqual } = require('node:util');

function accounts(data) {
  if (!Array.isArray(data.users)) throw new Error('Ungültiger Benutzerexport.');
  const result = new Map();
  for (const user of data.users) {
    if (!user.localId || result.has(user.localId)) throw new Error('Benutzer-ID fehlt oder ist doppelt.');
    if (user.passwordHash || user.salt) throw new Error('Passwortkonten gefunden. Zuerst die passende Passwort-Hash-Konfiguration für den Import vorbereiten.');
    result.set(user.localId, { email: (user.email || '').toLowerCase(),
      disabled: user.disabled === true || user.disabled === 'true',
      emailVerified: user.emailVerified === true || user.emailVerified === 'true',
      providers: (user.providerUserInfo || []).map(provider => `${provider.providerId}:${provider.rawId}`).sort() });
  }
  return result;
}

function checkAccounts(sourceData, targetData, complete = false) {
  const source = accounts(sourceData), target = accounts(targetData);
  for (const [uid, data] of target) {
    if (!source.has(uid) || !isDeepStrictEqual(source.get(uid), data)) {
      throw new Error('Das neue Projekt enthält abweichende Benutzerkonten. Import gestoppt; bestehende Konten bleiben erhalten.');
    }
  }
  if (complete && source.size !== target.size) throw new Error('Es fehlen Benutzerkonten im neuen Projekt.');
  return { sourceUsers: source.size, matchingTargetUsers: target.size, missingUsers: source.size - target.size };
}

if (require.main === module) {
  try {
    const [mode, sourceFile, targetFile] = process.argv.slice(2);
    if (!['check', 'verify'].includes(mode) || !sourceFile || !targetFile) {
      throw new Error('Aufruf: node tools/check-auth-migration.cjs check|verify ALTER_EXPORT.json NEUER_EXPORT.json');
    }
    console.log(JSON.stringify(checkAccounts(JSON.parse(fs.readFileSync(sourceFile, 'utf8')),
      JSON.parse(fs.readFileSync(targetFile, 'utf8')), mode === 'verify')));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { checkAccounts };
