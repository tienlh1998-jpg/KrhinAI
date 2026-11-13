import { createWriteStream, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { readdir, rm } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import os from 'node:os';

const UPSCALER_DIR = resolve(fileURLToPath(new URL('../runtime/upscaler', import.meta.url)));
const JOBS_ROOT = join(os.tmpdir(), 'krhin-upscale-jobs');
const REALESRGAN_URL = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-windows.zip';
const FFMPEG_URL = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip';

const jobs = new Map();
let installState = { running: false, stage: 'idle', progress: 0, message: '', error: null };

function findFileRecursive(dir, filename, maxDepth = 3, depth = 0) {
  if (!existsSync(dir) || depth > maxDepth) return null;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return null; }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === filename.toLowerCase()) return full;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const found = findFileRecursive(join(dir, entry.name), filename, maxDepth, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function findInPath(cmd) {
  return new Promise((resolvePath) => {
    const tool = process.platform === 'win32' ? 'where.exe' : 'which';
    execFile(tool, [cmd], { windowsHide: true }, (err, stdout) => {
      if (err || !stdout) return resolvePath(null);
      const first = stdout.split(/\r?\n/).map(s => s.trim()).find(Boolean);
      resolvePath(first && existsSync(first) ? first : null);
    });
  });
}

function listAvailableModels(realesrganPath) {
  if (!realesrganPath) return [];
  const modelsDir = join(dirname(realesrganPath), 'models');
  if (!existsSync(modelsDir)) return [];
  try {
    const files = readdirSync(modelsDir);
    const params = new Set(files.filter(f => f.endsWith('.param')).map(f => f.replace(/\.param$/, '')));
    const models = [];
    if (params.has('realesr-animevideov3-x2') || params.has('realesr-animevideov3-x4')) {
      models.push({ id: 'realesr-animevideov3', label: 'Real-ESRGAN AnimeVideo v3 (Nhanh, mượt cho Video AI)', scales: [2, 3, 4] });
    }
    if (params.has('realesrgan-x4plus')) {
      models.push({ id: 'realesrgan-x4plus', label: 'Real-ESRGAN x4+ (Siêu nét, cảnh thật / 3D)', scales: [4] });
    }
    if (params.has('realesrgan-x4plus-anime')) {
      models.push({ id: 'realesrgan-x4plus-anime', label: 'Real-ESRGAN x4+ Anime (Hoạt hình / Illustration)', scales: [4] });
    }
    return models;
  } catch {
    return [];
  }
}

export async function detectUpscaleTools() {
  const exeSuffix = process.platform === 'win32' ? '.exe' : '';
  const realesrganName = `realesrgan-ncnn-vulkan${exeSuffix}`;
  const ffmpegName = `ffmpeg${exeSuffix}`;
  const ffprobeName = `ffprobe${exeSuffix}`;

  const realesrganPath = findFileRecursive(UPSCALER_DIR, realesrganName) || await findInPath(realesrganName);
  const ffmpegPath = findFileRecursive(UPSCALER_DIR, ffmpegName) || await findInPath(ffmpegName);
  const ffprobePath = findFileRecursive(UPSCALER_DIR, ffprobeName) || await findInPath(ffprobeName);
  const models = listAvailableModels(realesrganPath);

  return {
    ready: Boolean(realesrganPath && ffmpegPath),
    realesrganPath,
    ffmpegPath,
    ffprobePath,
    models,
    installDir: UPSCALER_DIR,
    installState: { ...installState }
  };
}

function runProcess(cmd, args, opts = {}) {
  return new Promise((resolveProc, rejectProc) => {
    const child = spawn(cmd, args, { windowsHide: true, ...opts });
    let stderr = '';
    let stdout = '';
    child.stdout?.on('data', d => { stdout += d.toString(); });
    child.stderr?.on('data', d => { stderr += d.toString(); if (stderr.length > 16000) stderr = stderr.slice(-16000); });
    if (opts.onChild) opts.onChild(child);
    child.on('error', rejectProc);
    child.on('close', (code) => {
      if (code === 0) resolveProc({ stdout, stderr });
      else rejectProc(new Error(`${basename(cmd)} exited with code ${code}: ${stderr.slice(-500)}`));
    });
  });
}

export async function installUpscaleTools() {
  if (installState.running) return { ...installState };
  if (process.platform !== 'win32') {
    throw new Error('Tự động cài đặt hiện chỉ hỗ trợ Windows.');
  }

  installState = { running: true, stage: 'checking', progress: 0.05, message: 'Đang kiểm tra công cụ hiện có...', error: null };

  (async () => {
    try {
      mkdirSync(UPSCALER_DIR, { recursive: true });
      const current = await detectUpscaleTools();

      if (!current.realesrganPath) {
        installState = { running: true, stage: 'downloading-realesrgan', progress: 0.15, message: 'Đang tải Real-ESRGAN ncnn-vulkan (~45MB)...', error: null };
        const zipPath = join(os.tmpdir(), `krhin-realesrgan-${Date.now()}.zip`);
        const psScript = `$ProgressPreference='SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '${REALESRGAN_URL}' -OutFile '${zipPath}'; Expand-Archive -Path '${zipPath}' -DestinationPath '${UPSCALER_DIR}' -Force; Remove-Item '${zipPath}' -Force`;
        await runProcess('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript]);
      }

      if (!current.ffmpegPath) {
        installState = { running: true, stage: 'downloading-ffmpeg', progress: 0.55, message: 'Đang tải FFmpeg portable (~85MB)...', error: null };
        const ffZip = join(os.tmpdir(), `krhin-ffmpeg-${Date.now()}.zip`);
        const ffTmp = join(os.tmpdir(), `krhin-ffmpeg-ext-${Date.now()}`);
        const psScript = `$ProgressPreference='SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '${FFMPEG_URL}' -OutFile '${ffZip}'; Expand-Archive -Path '${ffZip}' -DestinationPath '${ffTmp}' -Force; Get-ChildItem -Path '${ffTmp}' -Recurse -Include ffmpeg.exe,ffprobe.exe | Copy-Item -Destination '${UPSCALER_DIR}' -Force; Remove-Item '${ffZip}','${ffTmp}' -Recurse -Force`;
        await runProcess('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript]);
      }

      const verified = await detectUpscaleTools();
      if (!verified.ready) throw new Error('Cài đặt hoàn tất nhưng không tìm thấy file thực thi.');
      installState = { running: false, stage: 'done', progress: 1, message: 'Đã cài đặt Real-ESRGAN & FFmpeg thành công!', error: null };
    } catch (err) {
      installState = { running: false, stage: 'error', progress: 0, message: err.message || 'Lỗi cài đặt', error: err.message };
    }
  })();

  return { ...installState };
}

export function getInstallState() {
  return { ...installState };
}

export function createUploadJob(filename = 'input.mp4') {
  mkdirSync(JOBS_ROOT, { recursive: true });
  const jobId = randomUUID();
  const jobDir = join(JOBS_ROOT, jobId);
  mkdirSync(jobDir, { recursive: true });
  const safeExt = extname(filename).replace(/[^a-zA-Z0-9.]/g, '') || '.mp4';
  const inputPath = join(jobDir, `input${safeExt}`);
  const job = {
    id: jobId,
    filename: basename(filename),
    jobDir,
    inputPath,
    outputPath: join(jobDir, 'upscaled.mp4'),
    status: 'uploading',
    phase: 'upload',
    progress: 0,
    message: 'Đang nhận video...',
    createdAt: Date.now(),
    child: null,
    cancelled: false
  };
  jobs.set(jobId, job);
  return { job, writeStream: createWriteStream(inputPath) };
}

export function markUploadComplete(jobId) {
  const job = jobs.get(jobId);
  if (!job) return null;
  job.status = 'uploaded';
  job.phase = 'ready';
  job.message = 'Đã tải video lên bộ xử lý local.';
  return job;
}

function parseFps(rateStr) {
  if (!rateStr || typeof rateStr !== 'string') return 30;
  const [n, d] = rateStr.split('/').map(Number);
  if (Number.isFinite(n) && Number.isFinite(d) && d > 0) return Math.round((n / d) * 1000) / 1000;
  const v = Number(rateStr);
  return Number.isFinite(v) && v > 0 ? v : 30;
}

async function probeVideo(ffprobePath, ffmpegPath, inputPath) {
  if (ffprobePath) {
    const { stdout } = await runProcess(ffprobePath, [
      '-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate,nb_frames,duration',
      '-show_entries', 'format=duration', '-of', 'json', inputPath
    ]);
    const info = JSON.parse(stdout || '{}');
    const vStream = (info.streams || []).find(s => s.codec_type === 'video') || {};
    const aStream = (info.streams || []).find(s => s.codec_type === 'audio');
    const duration = Number(vStream.duration || info.format?.duration || 0);
    const fps = parseFps(vStream.r_frame_rate);
    const nbFrames = Number(vStream.nb_frames) || Math.max(1, Math.round(duration * fps));
    return { width: vStream.width || 1280, height: vStream.height || 720, fps, nbFrames, duration, hasAudio: Boolean(aStream) };
  }
  return { width: 1280, height: 720, fps: 30, nbFrames: 0, duration: 0, hasAudio: true };
}

export async function startUpscaleJob(jobId, options = {}) {
  const job = jobs.get(jobId);
  if (!job) throw new Error('Không tìm thấy job upscale.');
  if (job.status === 'processing') return getJobStatus(jobId);

  const tools = await detectUpscaleTools();
  if (!tools.ready) throw new Error('Chưa cài đặt Real-ESRGAN hoặc FFmpeg.');

  const model = String(options.model || 'realesr-animevideov3');
  const targetPreset = String(options.targetPreset || '1080p'); // '1080p' | '1440p' | '2160p' | '2x' | '4x'
  const crf = Math.max(10, Math.min(28, Number(options.crf) || 16));

  job.status = 'processing';
  job.phase = 'probe';
  job.progress = 0.02;
  job.cancelled = false;
  job.startedAt = Date.now();
  job.message = 'Đang phân tích thông số video...';

  (async () => {
    const framesDir = join(job.jobDir, 'frames_in');
    const outFramesDir = join(job.jobDir, 'frames_out');
    let pollTimer = null;

    try {
      mkdirSync(framesDir, { recursive: true });
      mkdirSync(outFramesDir, { recursive: true });

      const meta = await probeVideo(tools.ffprobePath, tools.ffmpegPath, job.inputPath);
      job.inputMeta = meta;

      // Determine Real-ESRGAN native scale & final target height
      let targetHeight = meta.height * 2;
      if (targetPreset === '1080p') targetHeight = Math.max(1080, meta.height);
      else if (targetPreset === '1440p') targetHeight = Math.max(1440, meta.height);
      else if (targetPreset === '2160p') targetHeight = Math.max(2160, meta.height);
      else if (targetPreset === '4x') targetHeight = meta.height * 4;
      else targetHeight = meta.height * 2;

      const neededRatio = targetHeight / Math.max(1, meta.height);
      let engineScale = neededRatio > 2.2 ? 4 : 2;
      // realesrgan-x4plus models only support -s 4 natively
      if (model.includes('x4plus')) engineScale = 4;

      if (job.cancelled) throw new Error('Đã hủy tác vụ.');

      // Phase 2: Extract frames
      job.phase = 'extract';
      job.progress = 0.08;
      job.message = `Đang tách khung hình (${meta.width}x${meta.height} @ ${meta.fps}fps)...`;

      await runProcess(tools.ffmpegPath, [
        '-y', '-i', job.inputPath, '-qscale:v', '1', '-qmin', '1', '-fps_mode', 'passthrough',
        join(framesDir, 'frame_%08d.png')
      ], { onChild: c => { job.child = c; } });

      if (job.cancelled) throw new Error('Đã hủy tác vụ.');

      const inputFiles = (await readdir(framesDir)).filter(f => f.endsWith('.png'));
      const totalFrames = inputFiles.length;
      if (totalFrames === 0) throw new Error('Không tách được khung hình nào từ video.');

      // Phase 3: Real-ESRGAN GPU Upscale
      job.phase = 'upscale';
      job.progress = 0.15;
      job.totalFrames = totalFrames;
      job.processedFrames = 0;
      job.message = `AI Real-ESRGAN (${model} x${engineScale}) đang xử lý 0/${totalFrames} frame...`;

      pollTimer = setInterval(async () => {
        try {
          const doneCount = (await readdir(outFramesDir)).filter(f => f.endsWith('.png')).length;
          job.processedFrames = doneCount;
          const frac = Math.min(1, doneCount / totalFrames);
          job.progress = 0.15 + frac * 0.72;
          job.message = `AI Real-ESRGAN (${model} x${engineScale}) đang xử lý ${doneCount}/${totalFrames} frame (${Math.round(frac * 100)}%)`;
        } catch {}
      }, 500);

      const modelsDir = join(dirname(tools.realesrganPath), 'models');
      await runProcess(tools.realesrganPath, [
        '-i', framesDir,
        '-o', outFramesDir,
        '-n', model,
        '-s', String(engineScale),
        '-m', modelsDir,
        '-f', 'png'
      ], {
        cwd: dirname(tools.realesrganPath),
        onChild: c => { job.child = c; }
      });

      clearInterval(pollTimer);
      pollTimer = null;
      if (job.cancelled) throw new Error('Đã hủy tác vụ.');

      // Phase 4: Encode back to MP4 with original audio
      job.phase = 'encode';
      job.progress = 0.90;
      const evenTargetH = Math.round(targetHeight / 2) * 2;
      const rawUpscaledH = meta.height * engineScale;
      const vfFilter = (targetPreset !== '2x' && targetPreset !== '4x' && rawUpscaledH !== evenTargetH)
        ? `scale=-2:${evenTargetH}:flags=lanczos`
        : 'scale=trunc(iw/2)*2:trunc(ih/2)*2';

      job.message = `Đang ghép video ${evenTargetH}p + giữ nguyên âm thanh gốc...`;

      const encodeArgs = [
        '-y',
        '-framerate', String(meta.fps),
        '-i', join(outFramesDir, 'frame_%08d.png')
      ];
      if (meta.hasAudio) {
        encodeArgs.push('-i', job.inputPath, '-map', '0:v:0', '-map', '1:a:0?', '-c:a', 'copy');
      }
      encodeArgs.push(
        '-vf', vfFilter,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', String(crf),
        '-preset', 'medium',
        '-movflags', '+faststart',
        job.outputPath
      );

      await runProcess(tools.ffmpegPath, encodeArgs, { onChild: c => { job.child = c; } });

      const outStat = statSync(job.outputPath);
      const outMeta = await probeVideo(tools.ffprobePath, tools.ffmpegPath, job.outputPath);

      job.status = 'done';
      job.phase = 'done';
      job.progress = 1;
      job.outputSize = outStat.size;
      job.outputMeta = outMeta;
      job.elapsedMs = Date.now() - job.startedAt;
      job.message = `Hoàn tất! ${outMeta.width}x${outMeta.height} (${(outStat.size / 1048576).toFixed(1)} MB)`;
    } catch (err) {
      if (pollTimer) clearInterval(pollTimer);
      job.status = job.cancelled ? 'cancelled' : 'error';
      job.phase = job.status;
      job.error = err.message || 'Lỗi xử lý upscale';
      job.message = job.error;
    } finally {
      job.child = null;
      await rm(framesDir, { recursive: true, force: true }).catch(() => {});
      await rm(outFramesDir, { recursive: true, force: true }).catch(() => {});
    }
  })();

  return getJobStatus(jobId);
}

export function getJobStatus(jobId) {
  const job = jobs.get(jobId);
  if (!job) return null;
  const { child, ...safe } = job;
  return safe;
}

export function getJobOutput(jobId) {
  const job = jobs.get(jobId);
  if (!job || job.status !== 'done' || !existsSync(job.outputPath)) return null;
  return { path: job.outputPath, filename: `upscaled_${job.filename.replace(/\.[^.]+$/, '')}.mp4` };
}

export function cancelUpscaleJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return false;
  job.cancelled = true;
  if (job.child) {
    try { job.child.kill('SIGTERM'); } catch {}
  }
  return true;
}

export function cleanupUpscaleJobs() {
  for (const job of jobs.values()) {
    if (job.child) { try { job.child.kill('SIGTERM'); } catch {} }
    try { rmSync(job.jobDir, { recursive: true, force: true }); } catch {}
  }
  jobs.clear();
}
