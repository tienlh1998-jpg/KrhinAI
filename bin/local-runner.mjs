#!/usr/bin/env node
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, realpathSync } from 'node:fs';
import { extname, join, relative, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import os from 'node:os';
import {
  detectUpscaleTools, installUpscaleTools, getInstallState,
  createUploadJob, markUploadComplete, startUpscaleJob,
  getJobStatus, getJobOutput, cancelUpscaleJob, cleanupUpscaleJobs, hasActiveUpscaleJob
} from './video-upscaler.mjs';
const rootDir = realpathSync(fileURLToPath(new URL('../dist', import.meta.url)));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.wasm': 'application/wasm', '.onnx': 'application/octet-stream',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon' };
function launch(command, args, options = {}) {
  return new Promise((ok, reject) => {
    const child = spawn(command, args, { stdio: 'ignore', windowsHide: false, ...options });
    child.once('error', reject);
    child.once('spawn', () => { child.unref(); ok(); });
  });
}
export function findChromiumBrowser() {
  if (process.platform === 'win32') {
    const candidates = [
      join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
      join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
      join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
      join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
      join(process.env['LOCALAPPDATA'] || '', 'Google\\Chrome\\Application\\chrome.exe'),
      join(process.env['LOCALAPPDATA'] || '', 'Microsoft\\Edge\\Application\\msedge.exe')
    ];
    for (const p of candidates) {
      if (p && existsSync(p)) return p;
    }
  }
  return null;
}
export async function openTarget(target) {
  const browser = findChromiumBrowser();
  if (browser) {
    return launch(browser, [
      `--app=${target}`,
      '--window-size=1440,900'
    ]);
  }
  if (process.platform === 'win32') {
    if (target.startsWith('http://127.0.0.1:')) return launch('rundll32.exe', ['url.dll,FileProtocolHandler', target]);
    return launch('explorer.exe', [target]);
  }
  return launch(process.platform === 'darwin' ? 'open' : 'xdg-open', [target]);
}
let lastHeartbeat = Date.now();
let hasClientConnected = false;
let watchdogInterval = null;
function recordHeartbeat() {
  lastHeartbeat = Date.now();
  if (!hasClientConnected) {
    hasClientConnected = true;
    if (!watchdogInterval && process.env.KRHIN_NO_SHUTDOWN !== '1') {
      watchdogInterval = setInterval(() => {
        if (hasActiveUpscaleJob()) {
          lastHeartbeat = Date.now();
          return;
        }
        if (hasClientConnected && Date.now() - lastHeartbeat > 30000) {
          clearInterval(watchdogInterval);
          process.exit(0);
        }
      }, 3000);
      watchdogInterval.unref?.();
    }
  }
}
function readJsonBody(req) {
  return new Promise((ok, fail) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 1024 * 1024) { req.destroy(); fail(new Error('Body too large')); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { ok(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { fail(new Error('Invalid JSON')); }
    });
    req.on('error', fail);
  });
}

export function createAppServer({ open = openTarget } = {}) {
  return createServer(async (req, res) => {
    const port = req.socket.localPort;
    const origin = `http://127.0.0.1:${port}`;
    function send(code, body, type = 'text/plain; charset=utf-8') {
      res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin' });
      res.end(body);
    }
    if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(req.headers.host)) return send(403, 'Forbidden host');
    let url;
    try { url = new URL(req.url, origin); } catch { return send(400, 'Bad request'); }
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/health' && req.method === 'GET') {
        return send(200, JSON.stringify({ app: 'Krhin AI', version: '1.1.0', platform: process.platform, node: process.version }), 'application/json');
      }
      if (url.pathname === '/api/upscale/tools' && req.method === 'GET') {
        return send(200, JSON.stringify(await detectUpscaleTools()), 'application/json');
      }
      if (url.pathname === '/api/upscale/install-status' && req.method === 'GET') {
        return send(200, JSON.stringify(getInstallState()), 'application/json');
      }
      if (url.pathname === '/api/upscale/status' && req.method === 'GET') {
        const job = getJobStatus(url.searchParams.get('jobId'));
        return job ? send(200, JSON.stringify(job), 'application/json') : send(404, '{"error":"Job not found"}', 'application/json');
      }
      if (url.pathname === '/api/upscale/result' && (req.method === 'GET' || req.method === 'HEAD')) {
        const out = getJobOutput(url.searchParams.get('jobId'));
        if (!out) return send(404, 'Not found');
        const stat = statSync(out.path);
        const headers = {
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-store',
          'Cross-Origin-Resource-Policy': 'same-origin'
        };
        if (url.searchParams.get('download') === '1') {
          headers['Content-Disposition'] = `attachment; filename="${out.filename}"`;
        }
        const range = req.headers.range;
        if (range) {
          const match = /bytes=(\d+)-(\d*)/.exec(range);
          if (match) {
            const start = Number(match[1]);
            const end = match[2] ? Math.min(stat.size - 1, Number(match[2])) : stat.size - 1;
            if (start <= end && start < stat.size) {
              res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
              if (req.method === 'HEAD') return res.end();
              return createReadStream(out.path, { start, end }).pipe(res);
            }
          }
        }
        res.writeHead(200, { ...headers, 'Content-Length': stat.size });
        if (req.method === 'HEAD') return res.end();
        return createReadStream(out.path).pipe(res);
      }
      if (req.method !== 'POST') return send(405, 'Use POST');
      if (req.headers.origin !== `http://${req.headers.host}` || req.headers['x-krhin-request'] !== '1') return send(403, 'Forbidden origin');
      if (url.pathname === '/api/heartbeat') {
        recordHeartbeat();
        return send(200, '{"ok":true}', 'application/json');
      }
      if (url.pathname === '/api/shutdown') {
        cleanupUpscaleJobs();
        send(200, '{"ok":true}', 'application/json');
        setTimeout(() => process.exit(0), 400);
        return;
      }
      if (url.pathname === '/api/open-downloads') {
        const downloads = join(os.homedir(), 'Downloads');
        open(existsSync(downloads) ? downloads : os.homedir())
          .then(() => send(200, '{"ok":true}', 'application/json'))
          .catch(() => send(500, '{"ok":false,"error":"Không mở được thư mục"}', 'application/json'));
        return;
      }
      if (url.pathname === '/api/upscale/install') {
        try {
          const state = await installUpscaleTools();
          return send(200, JSON.stringify(state), 'application/json');
        } catch (err) {
          return send(500, JSON.stringify({ error: err.message }), 'application/json');
        }
      }
      if (url.pathname === '/api/upscale/upload') {
        const rawName = decodeURIComponent(req.headers['x-filename'] || 'video.mp4');
        const { job, writeStream } = createUploadJob(rawName);
        req.pipe(writeStream);
        writeStream.on('finish', () => {
          markUploadComplete(job.id);
          send(200, JSON.stringify({ ok: true, jobId: job.id }), 'application/json');
        });
        writeStream.on('error', err => {
          send(500, JSON.stringify({ ok: false, error: err.message }), 'application/json');
        });
        return;
      }
      if (url.pathname === '/api/upscale/start') {
        try {
          const body = await readJsonBody(req);
          const status = await startUpscaleJob(body.jobId, body);
          return send(200, JSON.stringify(status), 'application/json');
        } catch (err) {
          return send(400, JSON.stringify({ error: err.message }), 'application/json');
        }
      }
      if (url.pathname === '/api/upscale/cancel') {
        try {
          const body = await readJsonBody(req);
          return send(200, JSON.stringify({ ok: cancelUpscaleJob(body.jobId) }), 'application/json');
        } catch (err) {
          return send(400, JSON.stringify({ error: err.message }), 'application/json');
        }
      }
      return send(404, 'Not found');
    }
    if (!['GET', 'HEAD'].includes(req.method)) return send(405, 'Method not allowed');
    try {
      const decoded = decodeURIComponent(url.pathname);
      if (decoded.includes('\0') || decoded.includes('\\')) return send(400, 'Invalid path');
      const candidate = resolve(rootDir, '.' + (decoded === '/' ? '/video-preview.html' : (decoded === '/favicon.ico' ? '/app.ico' : decoded)));
      const within = path => { const r = relative(rootDir, path); return !r.startsWith('..') && !isAbsolute(r); };
      if (!within(candidate)) return send(403, 'Forbidden');
      if (!existsSync(candidate)) return send(404, 'Not found');
      const path = realpathSync(candidate);
      if (!within(path)) return send(403, 'Forbidden');
      const stat = statSync(path);
      if (!stat.isFile()) return send(404, 'Not found');
      res.writeHead(200, {
        'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Content-Length': stat.size,
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Resource-Policy': 'same-origin'
      });
      if (req.method === 'HEAD') return res.end();
      const stream = createReadStream(path);
      stream.on('error', () => res.destroy());
      res.on('close', () => stream.destroy());
      stream.pipe(res);
    } catch { send(400, 'Bad request'); }
  });
}
export async function startServer({ port = 3000, autoOpen = true } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT phải là số nguyên từ 0 đến 65535.');
  for (let attempt = 0; attempt < 20 && port <= 65535; attempt++, port++) {
    const server = createAppServer();
    try {
      await new Promise((ok, fail) => { server.once('error', fail); server.listen(port, '127.0.0.1', ok); });
    } catch (error) { if (error.code === 'EADDRINUSE') continue; throw error; }
    const appUrl = `http://127.0.0.1:${server.address().port}/video-preview.html`;
    console.log(`Krhin AI 1.1.0\n${appUrl}\nXử lý cục bộ. Dùng Chrome/Edge. Đóng cửa sổ này hoặc nhấn Ctrl+C để dừng.`);
    if (autoOpen) await openTarget(appUrl).catch(() => console.log(`Vui lòng mở trình duyệt tại ${appUrl}`));
    return server;
  }
  throw new Error('Không tìm được cổng trống. Hãy đóng phiên Krhin AI cũ rồi thử lại.');
}
const isEntry = process.argv[1] && (
  resolve(process.argv[1]) === fileURLToPath(import.meta.url) ||
  (process.platform === 'win32' && resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase())
);
if (isEntry) {
  startServer({ port: process.env.PORT === undefined ? 3000 : Number(process.env.PORT),
    autoOpen: !process.argv.includes('--no-open') && process.env.KRHIN_NO_OPEN !== '1' })
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
