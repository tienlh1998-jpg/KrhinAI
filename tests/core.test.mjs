import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import http from 'node:http';
import { createAppServer, startServer } from '../bin/local-runner.mjs';
const context = vm.createContext({ AbortController, URL, console, Date, Math });
vm.runInContext(readFileSync(new URL('../src/batch-queue.js', import.meta.url), 'utf8') + ';globalThis.Queue=Ol', context);
const Queue = context.Queue;
const tick = () => new Promise(resolve => setImmediate(resolve));

test('batch accepts images and videos, rejects unrelated files', () => {
  const q = new Queue();
  q.addFiles([{name:'a.png',type:'image/png'},{name:'b.mp4',type:'video/mp4'},{name:'readme.txt',type:'text/plain'}]);
  assert.equal(q.tasks.size, 2);
});
test('clearAll suppresses late completion and waits for active slots', async () => {
  let resolve; let completed = 0;
  const q = new Queue({concurrency:1,processor:()=>new Promise(r=>resolve=r),onTaskComplete:()=>completed++});
  q.addTask({name:'a.mp4'});q.start();q.clearAll();
  assert.equal(q.runningCount,1);
  resolve({blob:new Blob(['result'])});await tick();
  assert.equal(completed,0); assert.equal(q.tasks.size,0);assert.equal(q.runningCount,0);
});
test('cancel does not exceed concurrency and later tasks can finish', async () => {
  const resolvers=[];let calls=0;
  const q = new Queue({concurrency:1,processor:()=>{calls++;return new Promise(r=>resolvers.push(r));}});
  const first=q.addTask({name:'first.mp4'});q.addTask({name:'next.mp4'});q.start();q.cancelTask(first.id);
  assert.equal(calls,1);resolvers[0]({blob:new Blob(['a'])});await tick();assert.equal(calls,2);
  resolvers[1]({blob:new Blob(['b'])});await tick();assert.equal(q.getStats().completed,1);assert.equal(q.runningCount,0);assert.equal(q.isRunning,false);
});
test('server serves isolated WASM and denies cross-origin OS actions', async t => {
  let opened=0;const server=createAppServer({open:async()=>{opened++;}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const page=await fetch(origin);assert.equal(page.status,200);assert.match(await page.text(),/video-app.js/);
  assert.equal(page.headers.get('cross-origin-embedder-policy'),'require-corp');
  const wasm=await fetch(origin+'/onnxruntime/ort-wasm-simd-threaded.wasm',{method:'HEAD'});
  assert.equal(wasm.status,200);assert.equal(wasm.headers.get('content-type'),'application/wasm');
  for (const path of ['/api/open-folder?path=anything','/api/open-downloads','/api/heartbeat']) assert.equal((await fetch(origin+path)).status,405);
  assert.equal((await fetch(origin+'/api/open-downloads',{method:'POST',headers:{Origin:'https://other.invalid','X-Krhin-Request':'1'}})).status,403);
  assert.equal((await fetch(origin+'/api/heartbeat',{method:'POST',headers:{Origin:'https://other.invalid','X-Krhin-Request':'1'}})).status,403);
  assert.equal((await fetch(origin+'/api/heartbeat',{method:'POST',headers:{Origin:origin,'X-Krhin-Request':'1'}})).status,200);
  assert.equal(opened,0);
  assert.equal((await fetch(origin+'/api/open-downloads',{method:'POST',headers:{Origin:origin,'X-Krhin-Request':'1'}})).status,200);
  assert.equal(opened,1);
  assert.equal(await new Promise((resolve,reject)=>{http.get(origin+'/api/health',{headers:{Host:'attacker.invalid'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject);}),403);
  for (const path of ['/..%2fbin/local-runner.mjs','/%00','/%5c..%5cbin/local-runner.mjs']) assert.notEqual((await fetch(origin+path)).status,200);
});
test('occupied port falls back and invalid ports are rejected', async t=>{
  const first=await startServer({port:0,autoOpen:false});t.after(()=>first.close());
  const second=await startServer({port:first.address().port,autoOpen:false});t.after(()=>second.close());
  assert.notEqual(first.address().port,second.address().port);
  await assert.rejects(startServer({port:NaN,autoOpen:false}));
});
test('batch queue forwards export options and handles custom branding & format output', async () => {
  let receivedOptions = null;
  const q = new Queue({
    concurrency: 1,
    processor: async (file, opts) => {
      receivedOptions = opts;
      return { blob: new Blob(['fake_image_data'], { type: opts.imageFormat || 'image/webp' }), format: 'webp' };
    }
  });
  const customOpts = {
    scaleFactor: 1.5,
    imageFormat: 'image/webp',
    quality: 0.9,
    stampConfig: { enabled: true, type: 'text', text: '@KrhinAI', position: 'bottom-right', opacity: 0.85 }
  };
  const tasks = q.addFiles([{ name: 'test.jpg', type: 'image/jpeg', size: 50000 }], customOpts);
  assert.equal(tasks.length, 1);
  q.start();
  await tick();
  assert.equal(receivedOptions.scaleFactor, 1.5);
  assert.equal(receivedOptions.imageFormat, 'image/webp');
  assert.equal(receivedOptions.quality, 0.9);
  assert.equal(receivedOptions.stampConfig.enabled, true);
  assert.equal(receivedOptions.stampConfig.text, '@KrhinAI');
  assert.equal(q.getStats().completed, 1);
});
