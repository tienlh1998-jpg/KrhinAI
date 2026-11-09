const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();const errors=[],warnings=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type()))warnings.push(m.text().slice(0,350));});
 // Test-only access to the existing closure; production files are not changed.
 await page.route('**/video-app.js',async route=>{
   const response=await route.fetch();let body=await response.text();
   body=body.replace('setupSmartBoxDrawing();','window.__test={runtime:T_,queue:fn,state:_e,inspect:inspectTask,delayImages(){const original=processImageFile;processImageFile=async(...args)=>{await new Promise(r=>setTimeout(r,400));return original(...args);};}};setupSmartBoxDrawing();');
   await route.fulfill({response,body});
 });
 await page.goto(process.env.KRHIN_TEST_URL||'http://127.0.0.1:3000');
 const inference=await page.evaluate(async()=>{
   const r=await __test.runtime({});const n=r.inputShape.reduce((a,b)=>a*b,1);
   const result=await r.execute(new Float32Array(n));
   return {shape:result.outputShape,length:result.output.length,finite:result.output.every(Number.isFinite),runtime:r.id};
 });
 assert.deepEqual(inference.shape,[1,3,200,200]);assert(inference.finite);console.log('ONNX inference passed:',inference);
 const video=await page.evaluate(async()=>{
   const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');
   const audio=new AudioContext();await audio.resume();const dest=audio.createMediaStreamDestination();const osc=audio.createOscillator();osc.connect(dest);osc.start();
   const stream=canvas.captureStream(12);for(const t of dest.stream.getAudioTracks())stream.addTrack(t);
   const mime=['video/mp4;codecs=avc1.42001f,mp4a.40.2','video/mp4;codecs=avc1','video/mp4'].find(m=>MediaRecorder.isTypeSupported(m));if(!mime)throw Error('MP4 fixture recording unsupported');
   const recorder=new MediaRecorder(stream,{mimeType:mime});const chunks=[];recorder.ondataavailable=e=>chunks.push(e.data);
   const done=new Promise(resolve=>recorder.onstop=resolve);recorder.start();
   for(let i=0;i<14;i++){ctx.fillStyle='#7393aa';ctx.fillRect(0,0,640,360);ctx.fillStyle='white';ctx.fillText('Veo',598,340);await new Promise(r=>setTimeout(r,84));}
   recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());osc.stop();await audio.close();
   const bytes=new Uint8Array(await new Blob(chunks,{type:'video/mp4'}).arrayBuffer());return btoa(String.fromCharCode(...bytes));
 });
 await page.locator('#fileInput').setInputFiles({name:'video-audio.mp4',mimeType:'video/mp4',buffer:Buffer.from(video,'base64')});
 await page.locator('#startAllBtn').click();
 await page.waitForFunction(()=>['completed','failed'].includes([...__test.queue.tasks.values()][0]?.status),{},{timeout:120000});
 const result=await page.evaluate(()=>{const t=[...__test.queue.tasks.values()][0];return{status:t.status,error:t.error,size:t.resultBlob?.size,meta:t.resultMeta&&{audioCopied:t.resultMeta.audioCopied,audioCodec:t.resultMeta.audioCodec,frames:t.resultMeta.processedFrames,denoise:t.resultMeta.aiDenoiseFrames}};});
 console.log('MP4 export:',result);assert.equal(result.status,'completed');assert(result.size>0);assert(result.meta.frames>0);assert.equal(result.meta.audioCopied,true);
 const downloadPromise=page.waitForEvent('download');await page.locator('.download-item-btn').click();const download=await downloadPromise;await download.saveAs('build/video-clean.mp4');
 // FSA is mocked at its permission boundary to test the real UI and saver.
 await page.evaluate(()=>{window.__saved=[];window.showDirectoryPicker=async()=>({name:'Test Output',getFileHandle:async(name,opts)=>{if(!opts?.create&&!window.__saved.includes(name))throw new DOMException('missing','NotFoundError');return{createWritable:async()=>({write:async b=>{if(!b.size)throw Error('empty');window.__saved.push(name);},close:async()=>{},abort:async()=>{}})};}});});
 await page.locator('#selectOutDirBtn').click();assert.equal(await page.locator('#autoDownloadCheck').isChecked(),true);
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');x.fillStyle='#7393aa';x.fillRect(0,0,256,256);return c.toDataURL().split(',')[1];});
 await page.locator('#fileInput').setInputFiles([{name:'same.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')},{name:'same.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')}]);
 await page.locator('#startAllBtn').click();await page.waitForFunction(()=>window.__saved.length===2,{},{timeout:120000});
 assert.deepEqual(await page.evaluate(()=>__saved),['[clean]_same.png','[clean]_same (1).png']);console.log('Folder saving and collision prevention passed');
 await page.locator('#fileInput').setInputFiles([{name:'race-a.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')},{name:'race-b.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')}]);
 await page.evaluate(async()=>{__test.delayImages();await __test.inspect([...__test.queue.tasks.values()].find(t=>t.name==='race-a.png'));});
 await page.locator('#processBtn').click();await page.evaluate(async()=>{await __test.inspect([...__test.queue.tasks.values()].find(t=>t.name==='race-b.png'));});
 await page.waitForFunction(()=>!__test.state.running);
 assert.equal(await page.evaluate(()=>[...__test.queue.tasks.values()].find(t=>t.name==='race-b.png').resultBlob),null);
 assert.equal(await page.locator('#downloadBtn').getAttribute('href'),null);console.log('Switching file during processing does not attach stale output');
 console.log('Errors:',errors,'Warnings:',warnings);assert.equal(errors.length,0);
 fs.writeFileSync('build/integration-result.json',JSON.stringify({inference,result,errors,warnings},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
