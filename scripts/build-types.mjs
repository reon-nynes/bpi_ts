import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'),
  '--project', 'tsconfig.build.json'], { cwd:root, stdio:'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);

function commonJSDeclarations(directory) {
  for (const entry of readdirSync(directory, { withFileTypes:true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) commonJSDeclarations(path);
    else if (entry.name.endsWith('.d.ts')) {
      const target = path.replace(/\.d\.ts$/, '.d.cts');
      const source = readFileSync(path, 'utf8')
        .replace(/(['"])(\.{1,2}\/[^'"\r\n]+)\.js\1/g, '$1$2.cjs$1')
        .replace(/sourceMappingURL=(.+)\.d\.ts\.map/g, 'sourceMappingURL=$1.d.cts.map');
      writeFileSync(target, source);
      const map = JSON.parse(readFileSync(path + '.map', 'utf8'));
      map.file = map.file.replace(/\.d\.ts$/, '.d.cts');
      writeFileSync(target + '.map', JSON.stringify(map));
    }
  }
}

commonJSDeclarations(join(root, 'dist'));
console.log('TypeScript declarations emitted for ESM and CommonJS.');
