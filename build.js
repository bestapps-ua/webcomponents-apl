const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');
const SKIP = new Set(['node_modules', 'tests', 'vendor', 'webcomponents', '.git', '.claude', '.idea', 'dist', 'examples']);
const SKIP_FILES = new Set(['build.js', 'push.sh', 'package.json', 'package-lock.json', 'index.html', '.gitignore', '.gitmodules']);

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (entry.isDirectory() && SKIP.has(entry.name)) continue;
        if (!entry.isDirectory() && SKIP_FILES.has(entry.name)) continue;
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

fs.rmSync(DIST, { recursive: true, force: true });
copyDir(__dirname, DIST);

console.log('Build complete -> dist/');
