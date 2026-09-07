const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : (entry.isFile() && entry.name.endsWith('.js') ? [full] : []);
  });
}
const files = [...walk(path.resolve('src')), ...walk(path.resolve('scripts'))];
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}
if (failed) process.exit(1);
console.log(`Syntax OK: ${files.length} JavaScript files`);
