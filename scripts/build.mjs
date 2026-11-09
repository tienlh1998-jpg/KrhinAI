import { readFile, writeFile } from 'node:fs/promises';
const parts = ['vendor/video-engine.js', 'src/batch-queue.js', 'vendor/zip-helper.js', 'src/studio.js'];
const content = await Promise.all(parts.map(path => readFile(new URL('../' + path, import.meta.url), 'utf8')));
const licenses = await readFile(new URL('../vendor/licenses.js', import.meta.url), 'utf8');
await writeFile(new URL('../dist/video-app.js', import.meta.url), content.join('\n') + '\n})();\n' + licenses);
console.log('Built dist/video-app.js');
