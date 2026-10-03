const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const env = { ...process.env, FIREBASE_CLI_DISABLE_TELEMETRY: '1',
  XDG_CONFIG_HOME: path.join(root, '.test-runtime/config'),
  FIREBASE_EMULATORS_PATH: path.join(root, '.test-runtime/emulators') };
const javaRoot = path.join(root, '.test-runtime/java');
const java = fs.existsSync(javaRoot) ? fs.readdirSync(javaRoot).find(n => fs.existsSync(path.join(javaRoot, n, 'bin/java.exe'))) : '';
env.PATH = [path.dirname(process.execPath), ...(java ? [path.join(javaRoot, java, 'bin')] : []), env.PATH].join(path.delimiter);
const child = spawn(process.execPath, [require.resolve('firebase-tools/lib/bin/firebase.js'),
  'emulators:exec', '--only', 'firestore', '--project', 'demo-orbyx', '--config', 'firebase.json', 'node tests/rules.cjs'],
  { cwd: root, env, stdio: 'inherit', windowsHide: true });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code === null ? 1 : code; });
