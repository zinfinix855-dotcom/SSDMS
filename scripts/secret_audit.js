const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const suspicious = [];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // find long hex/base64-like tokens
    const re = /[A-Za-z0-9_\-]{32,}/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const token = m[0];
      // skip common words
      if (/password|localhost|node_modules|http|https|MYSQL|REDIS/i.test(token)) continue;
      suspicious.push({ file: filePath.replace(repoRoot + path.sep, ''), token: token.slice(0, 64) });
    }
  } catch (e) {
    // ignore binary files
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(f => {
    const p = path.join(dir, f);
    try {
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        if (['.git', 'node_modules', 'dist'].includes(f)) return;
        walk(p);
      } else if (stat.isFile()) {
        scanFile(p);
      }
    } catch (e) {}
  });
}

walk(repoRoot);

if (suspicious.length === 0) {
  console.log('No obvious long tokens found in repository files (quick scan).');
  process.exit(0);
}

console.log('Potential secret candidates (filename: snippet):');
suspicious.forEach(s => console.log(`${s.file}: ${s.token}`));
console.log('\nIf you find secrets, rotate them immediately and remove them from git history using BFG or git filter-repo.');
process.exit(0);
