import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.env.npm_execpath;
assert(npm, 'Run this check with npm run test:package');
const temporary = mkdtempSync(join(tmpdir(), 'bpi-ts-consumer-'));
function run(args, cwd = temporary) {
  const result = spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

try {
  const packedOutput = JSON.parse(run([npm, 'pack', '--ignore-scripts', '--json'], root));
  const [packed] = Array.isArray(packedOutput) ? packedOutput : Object.values(packedOutput);
  assert(packed.files.some(file => file.path === 'dist/index.d.cts'));
  assert(packed.files.some(file => file.path === 'dist/index.d.ts'));
  assert(packed.files.every(file => !/^(src|tests|scripts|node_modules)\//.test(file.path)));
  const archive = join(temporary, packed.filename);
  copyFileSync(join(root, packed.filename), archive);
  writeFileSync(join(temporary, 'package.json'), JSON.stringify({ private:true, type:'module' }));
  run([npm, 'install', archive, '--ignore-scripts', '--no-audit', '--no-fund']);
  const domains = JSON.parse(readFileSync(join(root, 'scripts/upstream/domains.json'), 'utf8'));
  const subpaths = ['client', 'ids', ...domains.map(domain => domain.name)];
  writeFileSync(join(temporary, 'smoke.mjs'), `
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const esm = await import('bpi-ts');
const commonjs = require('bpi-ts');
for (const path of ${JSON.stringify(subpaths)}) {
  assert(Object.keys(await import('bpi-ts/' + path)).length > 0, path);
  assert(Object.keys(require('bpi-ts/' + path)).length > 0, path);
}
for (const load of [specifier => import(specifier), specifier => require(specifier)]) {
  const root = await load('bpi-ts');
  const core = await load('bpi-ts/client');
  const video = await load('bpi-ts/video');
  assert.equal(root.APIError, core.APIError, 'error identity must survive subpath imports');
  assert.equal(root.VideoClient, video.VideoClient);
  const client = new root.Client({fetch:async() => new Response('{"code":0,"data":{"aid":170001,"bvid":"BV1xx411c7mD","title":"Packed SDK"}}')});
  assert.equal((await client.video.view({bvid:'BV1xx411c7mD'})).title, 'Packed SDK');
  const failing = new root.Client({fetch:async() => new Response('{"code":-101,"message":"Login required"}')});
  await assert.rejects(failing.video.view({aid:1}), error => error instanceof core.APIError && core.requiresLogin(error));
  const standalone = new video.VideoClient(new core.CoreClient({fetch:async() => new Response('{"code":-101}') }));
  await assert.rejects(standalone.view({aid:1}), error => error instanceof root.APIError);
  assert.equal(root.parseJSON('9007199254740993'), 9007199254740993n);
}
assert.equal(esm.createClient().hasLoginCookies(), false);
assert.equal(commonjs.createClient().hasLoginCookies(), false);
console.log('Packed ESM, CommonJS, all 29 subpaths, and shared class identities pass.');
`);
  process.stdout.write(run(['smoke.mjs']));
  const typeSource = `
import { Client, type video, type CallOptions } from 'bpi-ts';
import { CoreClient, APIError } from 'bpi-ts/client';
import { VideoClient, type View } from 'bpi-ts/video';
import { parseMID } from 'bpi-ts/ids';
const params: video.ViewParams = { aid: 9007199254740993n };
const options: CallOptions = { signal: AbortSignal.timeout(1000) };
const result: Promise<View> = new Client().video.view(params, options);
const narrow: Promise<View> = new VideoClient(new CoreClient()).view({bvid:'BV1xx411c7mD'});
const member: number | bigint = parseMID('9007199254740993');
const error: Error = new APIError(-101, 'Login required');
// @ts-expect-error Exactly one video identifier is required.
new Client().video.view({aid:1,bvid:'BV1xx411c7mD'});
// @ts-expect-error A video identifier is required.
new Client().video.view({});
void [result, narrow, member, error];
`;
  writeFileSync(join(temporary, 'consumer.mts'), typeSource);
  writeFileSync(join(temporary, 'consumer.cts'), typeSource);
  writeFileSync(join(temporary, 'tsconfig.json'), JSON.stringify({
    compilerOptions:{ target:'ES2022', module:'NodeNext', moduleResolution:'NodeNext', strict:true,
      noEmit:true, types:['node'], typeRoots:[join(root,'node_modules','@types')] },
    include:['consumer.mts','consumer.cts'],
  }));
  run([join(root, 'node_modules', 'typescript', 'bin', 'tsc'), '--project', 'tsconfig.json']);
  console.log('Packed TypeScript declarations pass for ESM and CommonJS consumers.');
  console.log(`Tarball: ${packed.files.length} files, ${packed.size} bytes compressed.`);
} finally {
  // Only remove the exact temporary consumer directory created by this script.
  assert(temporary.startsWith(resolve(tmpdir()) + sep + 'bpi-ts-consumer-'));
  rmSync(temporary, { recursive:true, force:true });
}
