var we=t=>document.getElementById(t),HG=Object.freeze({mjs:"./onnxruntime/ort-wasm-simd-threaded.js",wasm:"./onnxruntime/ort-wasm-simd-threaded.wasm"}),UG=Object.freeze({mjs:"./onnxruntime/ort-wasm-simd-threaded.asyncify.mjs",wasm:"./onnxruntime/ort-wasm-simd-threaded.asyncify.wasm"}),ad=new Map;function LG(t){if(!t||t===0)return"0 B";let e=1024,r=["B","KB","MB","GB"],n=Math.floor(Math.log(t)/Math.log(e));return parseFloat((t/Math.pow(e,n)).toFixed(1))+" "+r[n]}function lc(t){if(!Number.isFinite(t)||t<=0)return"0:00";let e=Math.floor(t/60),r=Math.floor(t%60);return`${e}:${r.toString().padStart(2,"0")}`}var _e={file:null,originalUrl:null,processedUrl:null,metadata:null,detection:null,running:!1,jobId:0,syncingPlayback:!1,currentTaskId:null},U={tabBatchBtn:we("tabBatchBtn"),tabSingleBtn:we("tabSingleBtn"),batchView:we("batchView"),singleView:we("singleView"),queueCountBadge:we("queueCountBadge"),statTotal:we("statTotal"),statProcessing:we("statProcessing"),statCompleted:we("statCompleted"),statOverallProgress:we("statOverallProgress"),startAllBtn:we("startAllBtn"),pauseAllBtn:we("pauseAllBtn"),downloadAllZipBtn:we("downloadAllZipBtn"),clearCompletedBtn:we("clearCompletedBtn"),clearAllBtn:we("clearAllBtn"),queueList:we("queueList"),queueEmpty:we("queueEmpty"),concurrencySelect:we("concurrencySelect"),concurrencyLabel:we("concurrencyLabel"),batchDenoiseBackend:we("batchDenoiseBackend"),batchBitrate:we("batchBitrate"),selectOutDirBtn:we("selectOutDirBtn"),openFolderBtn:we("openFolderBtn"),clearOutDirBtn:we("clearOutDirBtn"),selectedOutDirLabel:we("selectedOutDirLabel"),autoDownloadCheck:we("autoDownloadCheck"),batchAdaptiveAlphaCheck:we("batchAdaptiveAlphaCheck"),batchAllowLowConfidenceCheck:we("batchAllowLowConfidenceCheck"),batchScaleSelect:we("batchScaleSelect"),batchImageFormat:we("batchImageFormat"),batchQualityBadge:we("batchQualityBadge"),batchQualityRange:we("batchQualityRange"),batchQualityVal:we("batchQualityVal"),qualitySliderGroup:we("qualitySliderGroup"),stampEnableCheck:we("stampEnableCheck"),stampSettingsContainer:we("stampSettingsContainer"),stampTypeSelect:we("stampTypeSelect"),stampTextGroup:we("stampTextGroup"),stampTextInput:we("stampTextInput"),stampImageGroup:we("stampImageGroup"),stampLogoInput:we("stampLogoInput"),stampLogoPreview:we("stampLogoPreview"),stampPositionSelect:we("stampPositionSelect"),stampSizeSelect:we("stampSizeSelect"),stampOpacityRange:we("stampOpacityRange"),stampOpacityVal:we("stampOpacityVal"),dropzone:we("dropzone"),fileInput:we("fileInput"),comparePlayer:we("comparePlayer"),afterBadge:we("afterBadge"),playPauseBtn:we("playPauseBtn"),scrubber:we("scrubber"),timeLabel:we("timeLabel"),originalVideo:we("originalVideo"),processedVideo:we("processedVideo"),originalImg:we("originalImg"),processedImg:we("processedImg"),selectionCanvas:we("selectionCanvas"),toggleBoxBtn:we("toggleBoxBtn"),boxStatusText:we("boxStatusText"),originalPane:we("originalPane"),singleFileSelect:we("singleFileSelect"),singleFileCount:we("singleFileCount"),prevFileBtn:we("prevFileBtn"),nextFileBtn:we("nextFileBtn"),singleFilePills:we("singleFilePills"),originalEmpty:we("originalEmpty"),processedEmpty:we("processedEmpty"),metadata:we("metadata"),detection:we("detection"),progressBar:we("progressBar"),progressText:we("progressText"),status:we("status"),alphaGain:we("alphaGain"),alphaGainValue:we("alphaGainValue"),adaptiveAlpha:we("adaptiveAlpha"),highQualityCleanup:we("highQualityCleanup"),denoiseBackend:we("denoiseBackend"),edgeDenoiseStrength:we("edgeDenoiseStrength"),edgeDenoiseStrengthValue:we("edgeDenoiseStrengthValue"),residualCleanup:we("residualCleanup"),residualCleanupValue:we("residualCleanupValue"),videoBitrateMbps:we("videoBitrateMbps"),sampleCount:we("sampleCount"),allowLowConfidence:we("allowLowConfidence"),autoPresetSummary:we("autoPresetSummary"),processBtn:we("processBtn"),detectBtn:we("detectBtn"),downloadBtn:we("downloadBtn"),resetBtn:we("resetBtn"),relocatedReviewPresetBtn:we("relocatedReviewPresetBtn"),modeSplitBtn:we("modeSplitBtn"),modeSideBtn:we("modeSideBtn"),modeHoldBtn:we("modeHoldBtn"),splitDivider:we("splitDivider"),processedPane:we("processedPane"),compareModeHint:we("compareModeHint"),toastContainer:we("toastContainer"),hotkeysModal:we("hotkeysModal"),openHotkeysBtn:we("openHotkeysBtn"),closeHotkeysBtn:we("closeHotkeysBtn")};function wr(t,e="info"){U.status&&(U.status.textContent=t||"",U.status.dataset.tone=e)}async function T_({ backend = 'wasm', detection = null } = {}) {
    const profile = Il(detection?.position);
    const key = `${backend}:${profile.id}`;
    if (!ad.has(key)) {
        ad.set(key, (async () => {
            const ort = await Promise.resolve().then(() => (__(), x_));
            const response = await fetch(profile.modelUrl);
            if (!response.ok) throw new Error('Không tải được model: ' + profile.modelUrl);
            const runtime = await cP({ ort, modelBytes: await response.arrayBuffer(),
                executionProvider: backend, inputShape: profile.inputShape, outputShape: profile.outputShape,
                wasmPaths: { mjs: new URL('./onnxruntime/ort-wasm-simd-threaded.mjs', location.href).href,
                    wasm: new URL('./onnxruntime/ort-wasm-simd-threaded.wasm', location.href).href } });
            // A cached ONNX session is shared by parallel files; serialize session.run.
            const execute = runtime.execute.bind(runtime);
            let chain = Promise.resolve();
            runtime.execute = input => { const run = chain.then(() => execute(input)); chain = run.catch(() => {}); return run; };
            return runtime;
        })().catch(error => { ad.delete(key); throw error; }));
    }
    return ad.get(key);
}
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function checkAbort(signal) { signal?.throwIfAborted(); }

// --- CUSTOM BRANDING & EXPORT ENGINE ---
var _stampLogoImageElement = null;

function applyResolutionScale(canvas, scaleFactor) {
    if (!scaleFactor || scaleFactor <= 1) return canvas;
    let targetW = Math.round(canvas.width * scaleFactor);
    let targetH = Math.round(canvas.height * scaleFactor);
    let scaled = document.createElement('canvas');
    scaled.width = targetW;
    scaled.height = targetH;
    let sCtx = scaled.getContext('2d');
    sCtx.imageSmoothingEnabled = true;
    sCtx.imageSmoothingQuality = 'high';
    sCtx.drawImage(canvas, 0, 0, targetW, targetH);
    return scaled;
}

function applyCustomStamper(ctx, width, height, stampConfig) {
    if (!stampConfig || !stampConfig.enabled) return;
    let margin = Math.max(16, Math.round(Math.min(width, height) * 0.035));
    let pos = stampConfig.position || 'bottom-right';
    let opacity = Number.isFinite(stampConfig.opacity) ? stampConfig.opacity : 0.85;

    ctx.save();
    ctx.globalAlpha = Math.max(0.05, Math.min(1.0, opacity));

    if (stampConfig.type === 'image' && stampConfig.logoImage) {
        let img = stampConfig.logoImage;
        let scaleRate = stampConfig.size === 'small' ? 0.09 : stampConfig.size === 'large' ? 0.22 : 0.14;
        let logoW = Math.round(width * scaleRate);
        let natW = img.naturalWidth || img.width || 1;
        let natH = img.naturalHeight || img.height || 1;
        let logoH = Math.round((logoW / natW) * natH);
        let x = margin, y = margin;
        if (pos === 'bottom-right') { x = width - margin - logoW; y = height - margin - logoH; }
        else if (pos === 'bottom-left') { x = margin; y = height - margin - logoH; }
        else if (pos === 'top-right') { x = width - margin - logoW; y = margin; }
        else if (pos === 'top-left') { x = margin; y = margin; }
        else if (pos === 'center') { x = Math.round((width - logoW) / 2); y = Math.round((height - logoH) / 2); }

        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 8;
        ctx.drawImage(img, x, y, logoW, logoH);
    } else {
        let text = (stampConfig.text || '@KrhinAI').trim();
        if (!text) { ctx.restore(); return; }
        let fontScale = stampConfig.size === 'small' ? 0.022 : stampConfig.size === 'large' ? 0.045 : 0.032;
        let fontSize = Math.max(14, Math.round(width * fontScale));
        ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textBaseline = 'middle';
        let metrics = ctx.measureText(text);
        let textW = Math.round(metrics.width);
        let textH = fontSize;

        let x = margin, y = margin + Math.round(textH / 2);
        if (pos === 'bottom-right') { x = width - margin - textW; y = height - margin - Math.round(textH / 2); }
        else if (pos === 'bottom-left') { x = margin; y = height - margin - Math.round(textH / 2); }
        else if (pos === 'top-right') { x = width - margin - textW; y = margin + Math.round(textH / 2); }
        else if (pos === 'top-left') { x = margin; y = margin + Math.round(textH / 2); }
        else if (pos === 'center') { x = Math.round((width - textW) / 2); y = Math.round(height / 2); }

        ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.14));
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.strokeText(text, x, y);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = Math.max(4, Math.round(fontSize * 0.25));
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x, y);
    }
    ctx.restore();
}

function getCurrentProcessingOptions() {
    let scaleFactor = parseFloat(U.batchScaleSelect?.value) || 1;
    let imageFormat = U.batchImageFormat?.value || 'image/webp';
    let quality = parseFloat(U.batchQualityRange?.value) || 0.92;
    let stampEnabled = !!U.stampEnableCheck?.checked;
    let stampType = U.stampTypeSelect?.value || 'text';
    let stampText = U.stampTextInput?.value?.trim() || '@KrhinAI';
    let stampPosition = U.stampPositionSelect?.value || 'bottom-right';
    let stampSize = U.stampSizeSelect?.value || 'medium';
    let stampOpacity = parseFloat(U.stampOpacityRange?.value) || 0.85;

    return {
        scaleFactor,
        imageFormat,
        quality,
        stampConfig: {
            enabled: stampEnabled,
            type: stampType,
            text: stampText,
            logoImage: _stampLogoImageElement,
            position: stampPosition,
            size: stampSize,
            opacity: stampOpacity
        }
    };
}

async function processImageFile(file, options = {}) {
    checkAbort(options.abortSignal);
    let onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};
    onProgress({ phase: 'detect', progress: 0.1 });
    let imgBitmap;
    if (typeof createImageBitmap === 'function') {
        imgBitmap = await createImageBitmap(file);
    } else {
        imgBitmap = await new Promise((resolve, reject) => {
            let img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
    let width = imgBitmap.width, height = imgBitmap.height;
    let canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    let ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imgBitmap, 0, 0);
    imgBitmap.close?.();
    checkAbort(options.abortSignal);
    onProgress({ phase: 'detect', progress: 0.3 });
    let fdncnnRuntime = options.allenkFdncnnRuntime;
    if (!fdncnnRuntime && options.denoiseBackend !== 'none') {
        try { fdncnnRuntime = await T_({ backend: 'wasm' }); } catch(err) { console.warn('FDnCNN fallback:', err); }
    }
    let candidates = [];
    if (width > 1024 && height > 1024) {
        candidates.push({ id: 'gemini-img-96', size: 96, width: 96, height: 96, x: width - 64 - 96, y: height - 64 - 96, marginRight: 64, marginBottom: 64, sourcePriority: 1 });
        candidates.push({ id: 'gemini-img-48', size: 48, width: 48, height: 48, x: width - 32 - 48, y: height - 32 - 48, marginRight: 32, marginBottom: 32, sourcePriority: 2 });
    } else {
        candidates.push({ id: 'gemini-img-48', size: 48, width: 48, height: 48, x: width - 32 - 48, y: height - 32 - 48, marginRight: 32, marginBottom: 32, sourcePriority: 1 });
        candidates.push({ id: 'gemini-img-96', size: 96, width: 96, height: 96, x: width - 64 - 96, y: height - 64 - 96, marginRight: 64, marginBottom: 64, sourcePriority: 2 });
    }
    let stdCandidates = Mo(width, height);
    for (let c of stdCandidates) {
        if (!candidates.some(ex => Math.abs(ex.x - c.x) < 10 && Math.abs(ex.y - c.y) < 10 && ex.size === c.size)) {
            candidates.push(c);
        }
    }
    let currentImageData = ctx.getImageData(0, 0, width, height);
    let minConf = options.allowLowConfidence ? 0.12 : 0.18;
    let detResult;
    if (options.customBox && options.customBox.position) {
        detResult = { detection: options.customBox };
    } else {
        try {
            detResult = await hB({ frames: [{ timestamp: 0, imageData: currentImageData }], width, height, candidates, minConfidence: minConf });
        } catch(e) {
            console.warn('Image detection fallback:', e);
        }
    }
    let det = detResult?.detection || detResult;
    let foundDetection = null;
    if (det && det.position) {
        let bestConf = det.confidence ?? det.summary?.best?.meanConfidence ?? det.meanConfidence ?? 0;
        if (det.watermarkKind === 'custom-region' || det.isCustomBox) {
            foundDetection = det;
            inpaintCustomRegion(ctx, det.position);
        } else if (bestConf >= (options.allowLowConfidence ? 0.10 : 0.15)) {
            foundDetection = det;
            await F2(ctx, det, new Map(), {
                seedAlphaGain: det?.alphaSeed?.seedGain ?? 1.0,
                adaptiveAlpha: true,
                residualCleanupStrength: 1.5,
                highQualityCleanup: true,
                denoiseBackend: fdncnnRuntime ? 'allenk-fdncnn-browser-spike' : 'none',
                edgeDenoiseStrength: 0.25,
                textureRepair: true,
                textureRepairStrength: 1.0,
                allenkFdncnnRuntime: fdncnnRuntime,
                allenkFdncnnSigma: 0.25,
                highConfidenceThreshold: 0.18,
                lowConfidenceThreshold: 0.10
            });
        }
    }
    checkAbort(options.abortSignal);
    onProgress({ phase: 'export', progress: 0.8 });

    // 1. Resolution Scaling (Upscale)
    let scale = Number(options.scaleFactor) || 1;
    if (scale > 1) {
        canvas = applyResolutionScale(canvas, scale);
        ctx = canvas.getContext('2d', { willReadFrequently: true });
        width = canvas.width;
        height = canvas.height;
    }

    // 2. Custom Branding / Watermark Stamper
    if (options.stampConfig?.enabled) {
        applyCustomStamper(ctx, width, height, options.stampConfig);
    }

    checkAbort(options.abortSignal);
    onProgress({ phase: 'export', progress: 0.95 });

    // 3. Smart Format & Quality Export
    let mimeType = options.imageFormat || 'image/webp';
    let quality = typeof options.quality === 'number' ? options.quality : 0.92;
    let blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
    if (!blob && mimeType !== 'image/png') {
        blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        mimeType = 'image/png';
    }
    if (!blob) throw new Error('Không xuất được ảnh.');
    let ext = mimeType === 'image/webp' ? 'webp' : mimeType === 'image/jpeg' ? 'jpg' : 'png';

    checkAbort(options.abortSignal);
    onProgress({ phase: 'export', progress: 1.0 });
    return {
        blob,
        format: ext,
        mimeType,
        originalSize: file.size || 0,
        outputSize: blob.size || 0,
        metadata: { width, height, duration: 0, frameCountEstimate: 1, codec: `Image (${ext.toUpperCase()})` },
        detection: foundDetection
    };
}

// --- SMART BOX / CUSTOM REGION INPAINTING ENGINE ---
var _customBox = null; // { x, y, width, height }
var _isDrawingBox = false;
var _boxStart = null;
var _isBoxModeActive = false;

function setupSmartBoxDrawing() {
    if (!U.selectionCanvas || !U.toggleBoxBtn) return;
    let canvas = U.selectionCanvas;
    let ctx = canvas.getContext('2d');

    function redrawSelection() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (_customBox) {
            ctx.strokeStyle = '#00f2fe';
            ctx.lineWidth = 3;
            ctx.fillStyle = 'rgba(0, 242, 254, 0.25)';
            ctx.shadowColor = 'rgba(0, 242, 254, 0.8)';
            ctx.shadowBlur = 10;
            ctx.strokeRect(_customBox.canvasX, _customBox.canvasY, _customBox.canvasW, _customBox.canvasH);
            ctx.fillRect(_customBox.canvasX, _customBox.canvasY, _customBox.canvasW, _customBox.canvasH);
            ctx.shadowBlur = 0;

            // Label tag
            ctx.fillStyle = '#00f2fe';
            ctx.fillRect(_customBox.canvasX, Math.max(0, _customBox.canvasY - 24), 110, 24);
            ctx.fillStyle = '#060913';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('🎯 VÙNG LOGO AI', _customBox.canvasX + 6, Math.max(16, _customBox.canvasY - 8));
        }
    }

    function syncCanvasDimensions() {
        let rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        redrawSelection();
    }

    window.addEventListener('resize', syncCanvasDimensions);

    U.toggleBoxBtn.addEventListener('click', () => {
        if (!_e.file) {
            wr('Vui lòng chọn 1 ảnh hoặc video trước khi vẽ vùng chọn.', 'warn');
            return;
        }
        _isBoxModeActive = !_isBoxModeActive;
        if (_isBoxModeActive) {
            canvas.style.display = 'block';
            syncCanvasDimensions();
            U.toggleBoxBtn.innerHTML = '✕ Huỷ Chọn Vùng';
            U.toggleBoxBtn.classList.add('btn-danger');
            if (U.boxStatusText) U.boxStatusText.innerHTML = '<span style="color: #38bdf8;">Kéo chuột vẽ khung quanh logo cần xoá...</span>';
            wr('Hãy nhấp và kéo chuột trên khung xem trước để khoanh vùng logo.', 'info');
        } else {
            _customBox = null;
            canvas.style.display = 'none';
            U.toggleBoxBtn.innerHTML = '✏️ Vẽ Khung Chọn';
            U.toggleBoxBtn.classList.remove('btn-danger');
            if (U.boxStatusText) U.boxStatusText.innerHTML = 'Tự động nhận diện (Gemini / Veo)';
            _e.customDetection = null;
            redrawSelection();
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        let rect = canvas.getBoundingClientRect();
        _isDrawingBox = true;
        _boxStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        _customBox = null;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!_isDrawingBox || !_boxStart) return;
        let rect = canvas.getBoundingClientRect();
        let curX = e.clientX - rect.left;
        let curY = e.clientY - rect.top;
        let x = Math.min(_boxStart.x, curX);
        let y = Math.min(_boxStart.y, curY);
        let w = Math.max(10, Math.abs(curX - _boxStart.x));
        let h = Math.max(10, Math.abs(curY - _boxStart.y));

        _customBox = { canvasX: x, canvasY: y, canvasW: w, canvasH: h };
        redrawSelection();
    });

    canvas.addEventListener('mouseup', (e) => {
        if (!_isDrawingBox || !_boxStart || !_customBox) {
            _isDrawingBox = false;
            return;
        }
        _isDrawingBox = false;

        // Map canvas coordinates to original image/video coordinates
        if (_e.metadata && _e.metadata.width && _e.metadata.height) {
            let origW = _e.metadata.width;
            let origH = _e.metadata.height;
            let elemW = canvas.width;
            let elemH = canvas.height;

            // Letterbox/Pillarbox calculation for contain mode
            let scale = Math.min(elemW / origW, elemH / origH);
            let renderedW = origW * scale;
            let renderedH = origH * scale;
            let offsetX = (elemW - renderedW) / 2;
            let offsetY = (elemH - renderedH) / 2;

            let realX = Math.round(Math.max(0, (_customBox.canvasX - offsetX) / scale));
            let realY = Math.round(Math.max(0, (_customBox.canvasY - offsetY) / scale));
            let realW = Math.round(Math.min(origW - realX, _customBox.canvasW / scale));
            let realH = Math.round(Math.min(origH - realY, _customBox.canvasH / scale));

            if (realW >= 8 && realH >= 8 && realX < origW && realY < origH) {
                _customBox.realX = realX;
                _customBox.realY = realY;
                _customBox.realW = realW;
                _customBox.realH = realH;

                let customDet = {
                    isCustomBox: true,
                    isConfident: true,
                    confidence: 1.0,
                    watermarkKind: 'custom-region',
                    position: { x: realX, y: realY, width: realW, height: realH },
                    candidate: { id: 'custom-box', x: realX, y: realY, width: realW, height: realH, size: Math.max(realW, realH), label: 'Vùng chọn Logo thủ công' }
                };
                _e.customDetection = customDet;
                _e.detection = { metadata: _e.metadata, detection: customDet };
                S_(customDet);

                if (U.boxStatusText) {
                    U.boxStatusText.innerHTML = `<span style="color: #34d399;">Đã chọn vùng: ${realW}x${realH} tại (${realX}, ${realY})</span>`;
                }
                wr(`Đã khoanh vùng logo: ${realW}x${realH} px tại toạ độ (${realX}, ${realY}). Sẵn sàng xoá AI!`, 'success');
            }
        }
    });
}

// AI Custom Region Inpainter (Fast Contextual Texture & Patch Diffusion + Bilateral Blend)

// High-Performance Coons Transfinite Patch Inpainting Engine for Custom Box Watermarks
function inpaintCustomRegion(ctx, region) {
    if (!region || !region.width || !region.height || !ctx) return;
    let x = Math.round(region.x);
    let y = Math.round(region.y);
    let width = Math.round(region.width);
    let height = Math.round(region.height);

    let W = ctx.canvas.width;
    let H = ctx.canvas.height;
    if (x < 0 || y < 0 || x >= W || y >= H || width <= 0 || height <= 0) return;

    if (x + width > W) width = W - x;
    if (y + height > H) height = H - y;

    let padX = Math.max(4, Math.round(width * 0.12));
    let padY = Math.max(4, Math.round(height * 0.12));
    let x0 = Math.max(0, x - padX);
    let y0 = Math.max(0, y - padY);
    let x1 = Math.min(W, x + width + padX);
    let y1 = Math.min(H, y + height + padY);

    let rw = x1 - x0;
    let rh = y1 - y0;
    if (rw <= 0 || rh <= 0) return;

    let imgData = ctx.getImageData(x0, y0, rw, rh);
    let d = imgData.data;

    let rx0 = x - x0;
    let ry0 = y - y0;
    let rx1 = rx0 + width;
    let ry1 = ry0 + height;

    let topBorderY = Math.max(0, ry0 - 1);
    let btmBorderY = Math.min(rh - 1, ry1);
    let leftBorderX = Math.max(0, rx0 - 1);
    let rightBorderX = Math.min(rw - 1, rx1);

    let cTL = (topBorderY * rw + leftBorderX) * 4;
    let cTR = (topBorderY * rw + rightBorderX) * 4;
    let cBL = (btmBorderY * rw + leftBorderX) * 4;
    let cBR = (btmBorderY * rw + rightBorderX) * 4;

    for (let py = ry0; py < ry1; py++) {
        let vWeight = (py - topBorderY) / Math.max(1, (btmBorderY - topBorderY));
        let vWeightSmooth = vWeight * vWeight * (3 - 2 * vWeight); // Smoothstep curve
        let topRowIdx = (topBorderY * rw) * 4;
        let btmRowIdx = (btmBorderY * rw) * 4;
        let curRowIdx = (py * rw) * 4;

        for (let px = rx0; px < rx1; px++) {
            let hWeight = (px - leftBorderX) / Math.max(1, (rightBorderX - leftBorderX));
            let hWeightSmooth = hWeight * hWeight * (3 - 2 * hWeight); // Smoothstep curve

            let idx = curRowIdx + px * 4;
            let topIdx = topRowIdx + px * 4;
            let btmIdx = btmRowIdx + px * 4;
            let leftIdx = curRowIdx + leftBorderX * 4;
            let rightIdx = curRowIdx + rightBorderX * 4;

            for (let c = 0; c < 3; c++) {
                let c_top = d[topIdx + c];
                let c_btm = d[btmIdx + c];
                let c_left = d[leftIdx + c];
                let c_right = d[rightIdx + c];

                let vInterp = c_top * (1 - vWeightSmooth) + c_btm * vWeightSmooth;
                let hInterp = c_left * (1 - hWeightSmooth) + c_right * hWeightSmooth;
                let cornerInterp = d[cTL + c] * (1 - hWeightSmooth) * (1 - vWeightSmooth) +
                                   d[cTR + c] * hWeightSmooth * (1 - vWeightSmooth) +
                                   d[cBL + c] * (1 - hWeightSmooth) * vWeightSmooth +
                                   d[cBR + c] * hWeightSmooth * vWeightSmooth;

                let val = vInterp + hInterp - cornerInterp;
                d[idx + c] = val < 0 ? 0 : val > 255 ? 255 : Math.round(val);
            }
        }
    }

    ctx.putImageData(imgData, x0, y0);
}

var fn = new Ol({
    concurrency: 2,
    processor: async (t, e) => {
        checkAbort(e.abortSignal);
        let currentOpts = getCurrentProcessingOptions();
        let mergedOpts = { ...currentOpts, ...e };
        let r = mergedOpts.denoiseBackend || "allenk-fdncnn-browser-spike", n = null;
        if (r === "allenk-fdncnn-browser-spike") {
            try { n = await T_({ backend: "wasm" }); } catch(a) { console.warn("FDnCNN runtime initialization fallback:", a); }
        }
        let isImg = t.type?.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(t.name);
        if (isImg) {
            return await processImageFile(t, {
                abortSignal: e.abortSignal,
                allenkFdncnnRuntime: n,
                denoiseBackend: r,
                allowLowConfidence: !!mergedOpts.allowLowConfidence,
                scaleFactor: mergedOpts.scaleFactor,
                imageFormat: mergedOpts.imageFormat,
                quality: mergedOpts.quality,
                stampConfig: mergedOpts.stampConfig,
                onProgress: a => { e.onProgress && e.onProgress(a); }
            });
        }
        let i = (Number(mergedOpts.bitrateMbps) || 12) * 1e6;
        return await eh(t, {
            abortSignal: e.abortSignal,
            denoiseBackend: r,
            allenkFdncnnRuntime: n,
            videoBitrate: i,
            adaptiveAlpha: !!mergedOpts.adaptiveAlpha,
            allowLowConfidence: !!mergedOpts.allowLowConfidence,
            onFrameRendered: (frameCtx, fw, fh) => {
                if (mergedOpts.stampConfig?.enabled) {
                    applyCustomStamper(frameCtx, fw, fh, mergedOpts.stampConfig);
                }
            },
            onProgress: a => { e.onProgress && e.onProgress(a); }
        });
    },
    onTaskAdd: t => { Em(t); sd(); updateSingleFileSwitcher(); },
    onTaskUpdate: t => { Em(t); updateSingleFileSwitcher(); },
    onTaskComplete: async (t, e) => {
        updateSingleFileSwitcher();
        Em(t);
        let isImg = t.file.type?.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(t.name);
        let ext = isImg ? (t.resultMeta?.format || (t.resultBlob?.type === 'image/webp' ? 'webp' : t.resultBlob?.type === 'image/jpeg' ? 'jpg' : 'png')) : "mp4";
        U.autoDownloadCheck && U.autoDownloadCheck.checked && t.resultBlob && await jG(t.resultBlob, `[clean]_${t.name.replace(/\.[^.]+$/, "")}.${ext}`);
    },
    onStatsChange: t => { VG(t); }
});
function xm(t, e) {
    let r = URL.createObjectURL(t), n = document.createElement("a");
    n.href = r, n.download = e, document.body.appendChild(n), n.click(), document.body.removeChild(n), setTimeout(() => URL.revokeObjectURL(r), 60000);
}
var _m_dirHandle = null;
var saveChain = Promise.resolve();
async function jG(blob, name) {
    const directory = _m_dirHandle;
    const save = async () => {
        if (directory) {
            try {
                // Serial allocation prevents two concurrent jobs overwriting the same name.
                let candidate = name, suffix = 1;
                while (true) {
                    try { await directory.getFileHandle(candidate); }
                    catch (error) { if (error.name === 'NotFoundError') break; throw error; }
                    candidate = name.replace(/(\.[^.]+)$/, ` (${suffix++})$1`);
                }
                const file = await directory.getFileHandle(candidate, { create: true });
                const stream = await file.createWritable();
                try { await stream.write(blob); await stream.close(); }
                catch (error) { await stream.abort().catch(() => {}); throw error; }
                return;
            } catch (error) { wr('Không ghi được thư mục đã chọn; chuyển sang tải bằng trình duyệt.', 'warn'); }
        }
        xm(blob, name);
    };
    saveChain = saveChain.then(save, save);
    return saveChain;
}
U.selectOutDirBtn?.addEventListener('click', async () => {
    if (!window.showDirectoryPicker) { wr('Chọn thư mục cần Chrome hoặc Edge. Bạn vẫn có thể tải file bằng trình duyệt.', 'warn'); return; }
    try {
        _m_dirHandle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'krhin-output' });
        U.selectedOutDirLabel.textContent = 'Lưu vào: ' + _m_dirHandle.name;
        U.selectedOutDirLabel.style.display = 'block';
        U.clearOutDirBtn.style.display = 'block';
        U.autoDownloadCheck.checked = true;
    } catch (error) { if (error.name !== 'AbortError') wr('Không chọn được thư mục: ' + error.message, 'warn'); }
});
U.clearOutDirBtn?.addEventListener('click', () => {
    _m_dirHandle = null;
    U.selectedOutDirLabel.style.display = 'none';
    U.clearOutDirBtn.style.display = 'none';
});
U.openFolderBtn?.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/open-downloads', { method: 'POST', headers: { 'X-Krhin-Request': '1' } });
        if (!response.ok) throw new Error('Không mở được Downloads');
        wr('Đã mở Downloads. Nếu chọn thư mục lưu riêng, hãy mở thư mục đó trong trình quản lý file.', 'info');
    } catch (error) { wr(error.message, 'warn'); }
});
function sd() {
    let t = fn.tasks.size === 0;
    if (U.queueEmpty) U.queueEmpty.style.display = t ? "flex" : "none";
}
function Em(t) {
    if (t._removed) {
        let e = document.getElementById(`task-${t.id}`);
        e && e.remove(), sd();
        return;
    }
    let e = document.getElementById(`task-${t.id}`);
    if (!e) {
        e = document.createElement("div");
        e.id = `task-${t.id}`;
        e.className = "queue-item";
        e.innerHTML = `
            <div class="queue-item-icon">${(t.file.type?.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(t.name)) ? "🖼️" : "🎬"}</div>
            <div class="queue-item-info">
                <div class="queue-item-title" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</div>
                <div class="queue-item-meta">${LG(t.size)} • <span class="queue-item-status">${t.status}</span></div>
                <div class="queue-item-progress"><div class="queue-item-progress-fill" style="width: 0%;"></div></div>
            </div>
            <div class="queue-item-actions">
                <button class="btn btn-sm btn-icon inspect-btn" title="Xem Before/After" disabled>🔍</button>
                <button class="btn btn-sm btn-icon download-item-btn" title="Tải về" disabled>💾</button>
                <button class="btn btn-sm btn-icon remove-item-btn" title="Xoá">✕</button>
            </div>
        `;
        e.querySelector(".inspect-btn")?.addEventListener("click", () => KG(t));
        e.querySelector(".download-item-btn")?.addEventListener("click", () => {
            let isImg = t.file.type?.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(t.name);
            let ext = isImg ? (t.resultMeta?.format || (t.resultBlob?.type === 'image/webp' ? 'webp' : t.resultBlob?.type === 'image/jpeg' ? 'jpg' : 'png')) : "mp4";
            t.resultBlob && xm(t.resultBlob, `[clean]_${t.name.replace(/\.[^.]+$/, "")}.${ext}`);
        });
        e.querySelector(".remove-item-btn")?.addEventListener("click", (evt) => {
            evt.stopPropagation();
            fn.removeTask(t.id);
            let el = document.getElementById(`task-${t.id}`);
            el && el.remove();
            sd();
        });
        U.queueList.appendChild(e);
    }
    let r = e.querySelector(".queue-item-status"), n = e.querySelector(".queue-item-progress-fill"), i = e.querySelector(".inspect-btn"), s = e.querySelector(".download-item-btn"), m = e.querySelector(".queue-item-meta");
    let pct = Math.round((t.progress || 0) * 100);
    n && (n.style.width = `${pct}%`);
    switch (t.status) {
        case "pending": r && (r.textContent = "Chờ xử lý...", r.className = "queue-item-status text-dim"); break;
        case "processing": r && (r.textContent = `Đang xử lý ${pct}%${t.speedFps ? ` (${t.speedFps} fps)` : ""}`, r.className = "queue-item-status text-primary"); break;
        case "completed": {
            if (m && t.resultBlob) {
                let outSize = t.resultBlob.size;
                let diff = outSize - t.size;
                let redPct = t.size > 0 ? Math.round((diff / t.size) * 100) : 0;
                let badge = redPct < 0 ? `<span style="color: #34d399; font-weight: 700;">(${redPct}%)</span>` : (redPct > 0 ? `<span style="color: #38bdf8;">(+${redPct}%)</span>` : '');
                m.innerHTML = `${LG(t.size)} → ${LG(outSize)} ${badge} • <span class="queue-item-status text-accent">Hoàn thành</span>`;
            } else if (r) {
                r.textContent = "Hoàn thành";
                r.className = "queue-item-status text-accent";
            }
            break;
        }
        case "failed": r && (r.textContent = `Lỗi: ${t.error || "Không rõ"}`, r.className = "queue-item-status text-danger"); break;
        case "canceled": r && (r.textContent = "Đã huỷ", r.className = "queue-item-status text-dim"); break;
    }
    i && (i.disabled = t.status !== "completed" || !t.resultBlob);
    s && (s.disabled = t.status !== "completed" || !t.resultBlob);
}

// --- SINGLE INSPECTOR FILE SWITCHER ---
async function inspectTask(task) {
    if (!task) return;
    _e.currentTaskId = task.id;
    _m("single");
    await v_(task.file);
    if (_e.file !== task.file || _e.currentTaskId !== task.id) return;
    if (task.resultBlob) {
        _e.processedUrl && URL.revokeObjectURL(_e.processedUrl);
        _e.processedUrl = URL.createObjectURL(task.resultBlob);
        let isImg = task.file.type?.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(task.name);
        if (isImg) {
            U.processedImg && (U.processedImg.src = _e.processedUrl, U.processedImg.style.display = "block");
            U.processedVideo && (U.processedVideo.style.display = "none");
        } else {
            U.processedVideo && (U.processedVideo.src = _e.processedUrl, U.processedVideo.style.display = "block");
            U.processedImg && (U.processedImg.style.display = "none");
        }
        U.processedEmpty && (U.processedEmpty.hidden = true);
        U.afterBadge && (U.afterBadge.hidden = false);
        U.downloadBtn && U.downloadBtn.removeAttribute("aria-disabled");
        U.downloadBtn && (U.downloadBtn.href = _e.processedUrl);
        let ext = isImg ? (task.resultMeta?.format || (task.resultBlob?.type === 'image/webp' ? 'webp' : task.resultBlob?.type === 'image/jpeg' ? 'jpg' : 'png')) : "mp4";
        U.downloadBtn && (U.downloadBtn.download = `[clean]_${task.name.replace(/\.[^.]+$/, "")}.${ext}`);
        wr("Đang xem kết quả của: " + task.name, "success");
    } else {
        if (U.processedImg) { U.processedImg.src = ""; U.processedImg.style.display = "none"; }
        if (U.processedVideo) { U.processedVideo.src = ""; U.processedVideo.style.display = "none"; }
        if (U.processedEmpty) {
            U.processedEmpty.hidden = false;
            U.processedEmpty.innerHTML = `<div><strong>${escapeHtml(task.name)}</strong> (Chưa xoá watermark)<br><span style="font-size:0.8rem; opacity:0.8;">Bấm <b>⚡ Xử lý Ngay (AI Clean)</b> để xoá watermark cho file này</span></div>`;
        }
        if (U.afterBadge) U.afterBadge.hidden = true;
        if (U.downloadBtn) {
            U.downloadBtn.setAttribute("aria-disabled", "true");
            U.downloadBtn.removeAttribute("href");
        }
    }
    if (typeof updateSplitPos === 'function') updateSplitPos(_splitPos);
    updateSingleFileSwitcher();
}

function updateSingleFileSwitcher() {
    if (!U.singleFileSelect || !U.singleFilePills) return;
    let tasks = Array.from(fn.tasks.values());
    if (U.singleFileCount) U.singleFileCount.textContent = String(tasks.length);

    // 1. Populate Dropdown
    U.singleFileSelect.innerHTML = "";
    if (tasks.length === 0) {
        let opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "-- Chưa có file trong hàng đợi --";
        U.singleFileSelect.appendChild(opt);
        U.prevFileBtn && (U.prevFileBtn.disabled = true);
        U.nextFileBtn && (U.nextFileBtn.disabled = true);
    } else {
        for (let t of tasks) {
            let opt = document.createElement("option");
            opt.value = t.id;
            let icon = (t.file.type?.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(t.name)) ? "🖼️" : "🎬";
            let statusText = t.status === "completed" ? "✓ Đã xong" : t.status === "processing" ? "⚡ Đang xử lý" : "⏳ Chờ";
            opt.textContent = `${icon} ${t.name} (${statusText})`;
            if (t.id === _e.currentTaskId) opt.selected = true;
            U.singleFileSelect.appendChild(opt);
        }
        let currentIndex = tasks.findIndex(t => t.id === _e.currentTaskId);
        if (currentIndex === -1 && tasks.length > 0) {
            currentIndex = 0;

        }
        U.prevFileBtn && (U.prevFileBtn.disabled = currentIndex <= 0);
        U.nextFileBtn && (U.nextFileBtn.disabled = currentIndex >= tasks.length - 1 || currentIndex === -1);
    }

    // 2. Populate Pills Ribbon
    U.singleFilePills.innerHTML = "";
    if (tasks.length === 0) {
        U.singleFilePills.innerHTML = '<span style="font-size: 0.78rem; color: var(--text-dim); padding: 4px 0;">Chưa có file trong hàng đợi. Kéo thả file vào đây hoặc thêm ở tab Hàng loạt để so sánh.</span>';
    } else {
        for (let t of tasks) {
            let pill = document.createElement("div");
            let isActive = t.id === _e.currentTaskId;
            pill.className = `file-pill${isActive ? " active" : ""}`;
            pill.dataset.taskId = t.id;
            let icon = (t.file.type?.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(t.name)) ? "🖼️" : "🎬";
            let dotClass = t.status === "completed" ? "done" : t.status === "processing" ? "active" : t.status === "failed" ? "error" : "pending";
            pill.innerHTML = `
                <span class="file-pill-icon">${icon}</span>
                <span class="file-pill-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</span>
                <span class="status-dot ${dotClass}" title="${t.status}"></span>
            `;
            pill.addEventListener("click", () => inspectTask(t));
            U.singleFilePills.appendChild(pill);
            if (isActive) {
                pill.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
            }
        }
    }
}

function KG(t) {
    inspectTask(t);
}
function VG(t) {
    U.statTotal && (U.statTotal.textContent = String(t.total));
    U.statProcessing && (U.statProcessing.textContent = String(t.processing));
    U.statCompleted && (U.statCompleted.textContent = String(t.completed));
    let pct = Math.round((t.overallProgress || 0) * 100);
    U.statOverallProgress && (U.statOverallProgress.textContent = `${pct}%`);
    U.queueCountBadge && (U.queueCountBadge.textContent = String(t.total));
    U.startAllBtn && (U.startAllBtn.disabled = t.isRunning || t.pending === 0);
    U.pauseAllBtn && (U.pauseAllBtn.disabled = !t.isRunning);
    U.downloadAllZipBtn && (U.downloadAllZipBtn.disabled = t.completed === 0);
}
U.tabBatchBtn?.addEventListener("click", () => _m("batch"));
U.tabSingleBtn?.addEventListener("click", () => {
    _m("single");
    updateSingleFileSwitcher();
    if (!_e.file && fn.tasks.size > 0) {
        inspectTask(fn.tasks.values().next().value);
    }
});
U.prevFileBtn?.addEventListener("click", () => {
    let tasks = Array.from(fn.tasks.values());
    let currentIndex = tasks.findIndex(t => t.id === _e.currentTaskId);
    if (currentIndex > 0) {
        inspectTask(tasks[currentIndex - 1]);
    }
});

U.nextFileBtn?.addEventListener("click", () => {
    let tasks = Array.from(fn.tasks.values());
    let currentIndex = tasks.findIndex(t => t.id === _e.currentTaskId);
    if (currentIndex >= 0 && currentIndex < tasks.length - 1) {
        inspectTask(tasks[currentIndex + 1]);
    }
});

U.singleFileSelect?.addEventListener("change", (e) => {
    let task = fn.tasks.get(e.target.value);
    if (task) inspectTask(task);
});

// Drag and drop onto Compare Player in Single View
let singleDropTarget = U.comparePlayer || U.singleView;
if (singleDropTarget) {
    ['dragenter', 'dragover'].forEach(name => {
        singleDropTarget.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            singleDropTarget.style.outline = '2px dashed #00f2fe';
        });
    });
    ['dragleave', 'drop'].forEach(name => {
        singleDropTarget.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            singleDropTarget.style.outline = 'none';
        });
    });
    singleDropTarget.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        singleDropTarget.style.outline = 'none';
        let files = Array.from(e.dataTransfer?.files || []);
        if (files.length > 0) {
            Tm(files);
            setTimeout(() => {
                let allTasks = Array.from(fn.tasks.values());
                let matched = allTasks.find(t => t.file === files[0]) || allTasks[allTasks.length - 1];
                if (matched) inspectTask(matched);
            }, 80);
        }
    });
}

function _m(t) {
    const tabUpscaleBtn = we("tabUpscaleBtn");
    const upscaleView = we("upscaleView");
    const tabLogsBtn = we("tabLogsBtn");
    const logsView = we("logsView");
    U.tabBatchBtn?.classList.toggle("active", t === "batch");
    U.tabSingleBtn?.classList.toggle("active", t === "single");
    tabUpscaleBtn?.classList.toggle("active", t === "upscale");
    tabLogsBtn?.classList.toggle("active", t === "logs");
    U.batchView?.classList.toggle("active", t === "batch");
    U.singleView?.classList.toggle("active", t === "single");
    upscaleView?.classList.toggle("active", t === "upscale");
    logsView?.classList.toggle("active", t === "logs");
}
U.concurrencySelect?.addEventListener("change", e => {
    let val = Number(e.target.value) || 2;
    fn.setConcurrency(val);
    U.concurrencyLabel && (U.concurrencyLabel.textContent = `${val} luồng`);
});
U.startAllBtn?.addEventListener("click", () => { fn.start(); wr("Đã bắt đầu xử lý hàng loạt...", "info"); });
U.pauseAllBtn?.addEventListener("click", () => { fn.pause(); wr("Đã dừng nhận tác vụ mới; các file đang chạy sẽ xử lý xong.", "info"); });
U.clearCompletedBtn?.addEventListener("click", () => {
    fn.clearCompleted();
    if (U.queueList) {
        let items = U.queueList.querySelectorAll(".queue-item");
        items.forEach(el => {
            let status = el.querySelector(".queue-item-status");
            if (status && (status.textContent === "Hoàn thành" || status.textContent === "Đã huỷ")) el.remove();
        });
    }
    sd();
    updateSingleFileSwitcher(); wr("Đã dọn dẹp các file hoàn thành.", "info");
});
U.clearAllBtn?.addEventListener("click", () => {
    _e.singleAbort?.abort();
    fn.clearAll();
    if (U.queueList) {
        let items = U.queueList.querySelectorAll(".queue-item");
        items.forEach(el => el.remove());
    }
    sd();
    updateSingleFileSwitcher(); wr("Đã xoá toàn bộ hàng đợi.", "info");
});
U.downloadAllZipBtn?.addEventListener("click", async () => {
    let completedTasks = Array.from(fn.tasks.values()).filter(t => t.status === "completed" && t.resultBlob);
    if (completedTasks.length === 0) return;
    wr("Đang đóng gói file ZIP...", "info");
    try {
        let zipEntries = completedTasks.map(t => {
            let isImg = t.file.type?.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(t.name);
            let ext = isImg ? (t.resultMeta?.format || (t.resultBlob?.type === 'image/webp' ? 'webp' : t.resultBlob?.type === 'image/jpeg' ? 'jpg' : 'png')) : "mp4";
            return { name: `[clean]_${t.name.replace(/\.[^.]+$/, "")}.${ext}`, data: t.resultBlob };
        });
        let zipBlob = await uP(zipEntries);
        xm(zipBlob, `Krhin_AI_Batch_${Date.now()}.zip`);
        wr("Đã tải file ZIP thành công!", "success");
    } catch (e) {
        console.error("ZIP export failed:", e);
        wr(`Lỗi tạo ZIP: ${e.message}`, "error");
    }
});
U.dropzone?.addEventListener("click", () => U.fileInput.click());
U.dropzone?.addEventListener("keydown", t => { (t.key === "Enter" || t.key === " ") && (t.preventDefault(), U.fileInput.click()); });
U.dropzone?.addEventListener("dragover", t => { t.preventDefault(), U.dropzone.dataset.dragging = "true"; });
U.dropzone?.addEventListener("dragleave", () => { U.dropzone.dataset.dragging = "false"; });
U.dropzone?.addEventListener("drop", t => {
    t.preventDefault();
    U.dropzone.dataset.dragging = "false";
    let files = Array.from(t.dataTransfer?.files || []);
    Tm(files);
});
U.fileInput?.addEventListener("change", t => {
    let files = Array.from(t.target.files || []);
    Tm(files);
    U.fileInput.value = "";
});
async function Tm(t) {
    if (!t || t.length === 0) return;
    let currentOpts = getCurrentProcessingOptions();
    let r = {
        denoiseBackend: U.batchDenoiseBackend?.value || "allenk-fdncnn-browser-spike",
        bitrateMbps: Number(U.batchBitrate?.value) || 12,
        adaptiveAlpha: !!U.batchAdaptiveAlphaCheck?.checked,
        allowLowConfidence: !!U.batchAllowLowConfidenceCheck?.checked,
        scaleFactor: currentOpts.scaleFactor,
        imageFormat: currentOpts.imageFormat,
        quality: currentOpts.quality,
        stampConfig: currentOpts.stampConfig
    };
    fn.addFiles(t, r);
    sd();
    t.length === 1 && v_(t[0]);
}
function k_(t) {
    if (!U.metadata) return;
    if (!t) {
        U.metadata.innerHTML = '<div style="padding: 16px 20px; color: var(--text-dim);">Chưa có video hoặc ảnh</div>';
        return;
    }
    let isStandard = Yf({ width: t.width, height: t.height });
    U.metadata.innerHTML = `
        <dl>
            <div><dt>Độ phân giải</dt><dd>${t.width} × ${t.height} ${isStandard ? '<span style="color: var(--accent);">(Gemini Chuẩn)</span>' : ''}</dd></div>
            <div><dt>Thời lượng</dt><dd>${t.duration > 0 ? `${lc(t.duration)} (${t.duration?.toFixed(2)}s)` : 'Ảnh tĩnh'}</dd></div>
            <div><dt>Tốc độ khung</dt><dd>${t.duration > 0 ? `${t.frameRate?.toFixed(2)} fps` : 'N/A'}</dd></div>
            <div><dt>Ước tính frames</dt><dd>${t.frameCountEstimate || 1}</dd></div>
            <div><dt>Định dạng / Codec</dt><dd>${t.codec || "AVC"}</dd></div>
        </dl>
    `;
}
function S_(t) {
    if (!U.detection) return;
    let d = t?.detection || t;
    if (!d || !d.position) {
        U.detection.innerHTML = '<div style="padding: 16px 20px; color: var(--text-dim);">Chưa kiểm tra toạ độ hoặc không tìm thấy</div>';
        return;
    }
    let e = d.position, c = d.confidence ?? d.summary?.best?.meanConfidence ?? d.summary?.best?.meanNcc ?? (d.meanConfidence || 0), k = d.candidate?.label || d.candidate?.id || (d.watermarkKind === "veo-text" ? "Veo Text Watermark" : "Gemini Diamond Watermark");
    U.detection.innerHTML = `
        <dl>
            <div><dt>Vị trí X, Y</dt><dd>${e.x}, ${e.y}</dd></div>
            <div><dt>Kích thước</dt><dd>${e.width} × ${e.height} px</dd></div>
            <div><dt>Độ tin cậy</dt><dd style="color: var(--primary); font-weight: bold;">${(c * 100).toFixed(1)}%</dd></div>
            <div><dt>Loại Watermark</dt><dd>${k}</dd></div>
        </dl>
    `;
}
async function v_(t) {
    _e.singleAbort?.abort();
    const viewId = ++_e.jobId;
    _e.currentTaskId = [...fn.tasks.values()].find(task => task.file === t)?.id || null;
    _e.customDetection = null; _customBox = null;
    U.selectionCanvas?.getContext('2d').clearRect(0, 0, U.selectionCanvas.width, U.selectionCanvas.height);
    _e.file = t;
    _e.originalUrl && URL.revokeObjectURL(_e.originalUrl);
    _e.processedUrl && URL.revokeObjectURL(_e.processedUrl);
    _e.originalUrl = URL.createObjectURL(t);
    _e.processedUrl = null;
    _e.metadata = null;
    _e.detection = null;
    let isImg = t.type?.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(t.name);
    if (isImg) {
        U.originalVideo.style.display = "none";
        U.processedVideo.style.display = "none";
        U.originalImg && (U.originalImg.src = _e.originalUrl, U.originalImg.style.display = "block");
        U.processedImg && (U.processedImg.src = "", U.processedImg.style.display = "none");
    } else {
        U.originalImg && (U.originalImg.style.display = "none");
        U.processedImg && (U.processedImg.style.display = "none");
        U.originalVideo.style.display = "block";
        U.processedVideo.style.display = "block";
        U.originalVideo.src = _e.originalUrl;
        U.processedVideo.src = "";
    }
    U.originalEmpty.hidden = true;
    U.processedEmpty.hidden = false;
    U.afterBadge.hidden = true;
    U.downloadBtn.setAttribute("aria-disabled", "true");
    U.downloadBtn.removeAttribute("href");
    U.progressBar && (U.progressBar.style.width = "0%");
    U.progressText && (U.progressText.textContent = t.name);
    wr(isImg ? "Đang kiểm tra file ảnh..." : "Đang kiểm tra metadata video...", "info");
    try {
        let meta;
        if (isImg) {
            let img = new Image();
            img.src = _e.originalUrl;
            await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
            meta = { width: img.naturalWidth, height: img.naturalHeight, duration: 0, frameRate: 1, frameCountEstimate: 1, codec: "Image (" + (t.type?.split("/")[1]?.toUpperCase() || "PNG") + ")" };
        } else {
            meta = await VB(t);
        }
        if (_e.jobId !== viewId) return;
        _e.metadata = meta;
        k_(meta);
        wr("Đã tải " + (isImg ? "ảnh" : "video") + ". Sẵn sàng xử lý AI!", "success");
        U.playPauseBtn.disabled = isImg;
        U.scrubber.disabled = isImg;
    } catch (e) {
        if (_e.jobId !== viewId) return;
        console.error("Failed to inspect:", e);
        wr(`Lỗi đọc file: ${e.message}`, "error");
    }
}
function ZG() {
    U.originalVideo.play().catch(() => {});
    _e.processedUrl && U.processedVideo.play().catch(() => {});
    U.playPauseBtn.dataset.playing = "true";
}
function JG() {
    U.originalVideo.pause();
    _e.processedUrl && U.processedVideo.pause();
    U.playPauseBtn.dataset.playing = "false";
}
U.playPauseBtn?.addEventListener("click", () => { U.originalVideo.paused ? ZG() : JG(); });
U.originalVideo?.addEventListener("timeupdate", () => {
    if (_e.syncingPlayback) return;
    let t = _e.metadata?.duration || U.originalVideo.duration || 1, e = U.originalVideo.currentTime;
    U.scrubber && (U.scrubber.value = String(e / t * 1e3));
    U.timeLabel && (U.timeLabel.textContent = `${lc(e)} / ${lc(t)}`);
    _e.processedUrl && Math.abs(U.processedVideo.currentTime - e) > .1 && (U.processedVideo.currentTime = e);
});
U.scrubber?.addEventListener("input", t => {
    let e = _e.metadata?.duration || U.originalVideo.duration || 1, r = Number(t.target.value) / 1e3 * e;
    _e.syncingPlayback = true;
    U.originalVideo.currentTime = r;
    _e.processedUrl && (U.processedVideo.currentTime = r);
    U.timeLabel && (U.timeLabel.textContent = `${lc(r)} / ${lc(e)}`);
    _e.syncingPlayback = false;
});
U.detectBtn?.addEventListener("click", async () => {
    if (!_e.file) {
        wr("Vui lòng chọn file trước.", "warn");
        return;
    }
    const viewId = _e.jobId;
    wr("Đang quét toạ độ watermark AI...", "info");
    try {
        let isImg = _e.file.type?.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(_e.file.name);
        let lowConf = U.allowLowConfidence ? !!U.allowLowConfidence.checked : true;
        let d;
        if (isImg) {
            let img = new Image();
            img.src = _e.originalUrl;
            await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
            let canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            let ctx = canvas.getContext("2d", { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
            let currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let width = canvas.width, height = canvas.height;
            let candidates = [];
            if (width > 1024 && height > 1024) {
                candidates.push({ id: 'gemini-img-96', size: 96, width: 96, height: 96, x: width - 64 - 96, y: height - 64 - 96, marginRight: 64, marginBottom: 64, sourcePriority: 1 });
                candidates.push({ id: 'gemini-img-48', size: 48, width: 48, height: 48, x: width - 32 - 48, y: height - 32 - 48, marginRight: 32, marginBottom: 32, sourcePriority: 2 });
            } else {
                candidates.push({ id: 'gemini-img-48', size: 48, width: 48, height: 48, x: width - 32 - 48, y: height - 32 - 48, marginRight: 32, marginBottom: 32, sourcePriority: 1 });
                candidates.push({ id: 'gemini-img-96', size: 96, width: 96, height: 96, x: width - 64 - 96, y: height - 64 - 96, marginRight: 64, marginBottom: 64, sourcePriority: 2 });
            }
            let stdCandidates = Mo(width, height);
            for (let cand of stdCandidates) {
                if (!candidates.some(ex => Math.abs(ex.x - cand.x) < 10 && Math.abs(ex.y - cand.y) < 10 && ex.size === cand.size)) {
                    candidates.push(cand);
                }
            }
            let detResult = await hB({
                frames: [{ timestamp: 0, imageData: currentImageData }],
                width,
                height,
                candidates,
                minConfidence: lowConf ? 0.12 : 0.18
            });
            d = detResult?.detection || detResult;
            if (_e.jobId !== viewId) return;
            _e.detection = d;
        } else {
            let t = await Jf(_e.file, { sampleCount: 12, minConfidence: lowConf ? 0.05 : 0.18 });
            if (_e.jobId !== viewId) return;
            _e.detection = t;
            d = t.detection || t;
        }
        S_(d);
        let c = d?.confidence ?? d?.summary?.best?.meanConfidence ?? d?.summary?.best?.meanNcc ?? (d?.meanConfidence || 0);
        d?.position ? wr(`Đã tìm thấy watermark: ${(c * 100).toFixed(1)}% tin cậy.`, "success") : wr("Không phát hiện watermark rõ ràng trên file này.", "warn");
    } catch (t) {
        if (_e.jobId !== viewId) return;
        console.error("Detection failed:", t);
        wr(`Lỗi phát hiện: ${t.message}`, "error");
    }
});
U.processBtn?.addEventListener("click", async () => {
    if (!_e.file) {
        wr("Vui lòng chọn file trước.", "warn");
        return;
    }
    const sourceFile = _e.file;
    const sourceTaskId = _e.currentTaskId;
    if (fn.tasks.get(sourceTaskId)?.status === 'processing') { wr('File này đang được xử lý trong hàng đợi.', 'warn'); return; }
    const viewId = _e.jobId;
    const abort = new AbortController();
    const detection = _e.customDetection ? { metadata: _e.metadata, detection: _e.customDetection } : (_e.detection || undefined);
    const customBox = _e.customDetection;
    if (!_e.running) {
        _e.singleAbort = abort;
        _e.running = true;
        U.processBtn.disabled = true;
        wr("Bắt đầu xử lý xoá watermark AI...", "info");
        try {
            let t = null;
            try {
                t = await T_({ backend: "wasm" });
            } catch (r) {
                console.warn("FDnCNN runtime initialization fallback:", r);
            }
            let isImg = sourceFile.type?.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(sourceFile.name);
            let lowConf = U.allowLowConfidence ? !!U.allowLowConfidence.checked : true;
            let currentOpts = getCurrentProcessingOptions();
            let result;
            if (isImg) {
                result = await processImageFile(sourceFile, {
                    abortSignal: abort.signal,
                    allenkFdncnnRuntime: t,
                    denoiseBackend: "allenk-fdncnn-browser-spike",
                    allowLowConfidence: lowConf,
                    customBox: customBox || null,
                    scaleFactor: currentOpts.scaleFactor,
                    imageFormat: currentOpts.imageFormat,
                    quality: currentOpts.quality,
                    stampConfig: currentOpts.stampConfig,
                    onProgress: r => {
                        checkAbort(abort.signal);
                        if (_e.jobId !== viewId) return;
                        let n = Math.round((r.progress || 0) * 100);
                        U.progressBar && (U.progressBar.style.width = `${n}%`);
                        U.progressText && (U.progressText.textContent = `${n}% (AI Denoising)`);
                    }
                });
            } else {
                result = await eh(sourceFile, {
                    abortSignal: abort.signal,
                    allenkFdncnnRuntime: t,
                    denoiseBackend: "allenk-fdncnn-browser-spike",
                    videoBitrate: 12e6,
                    detection,
                    allowLowConfidence: lowConf,
                    onFrameRendered: (frameCtx, fw, fh) => {
                        if (currentOpts.stampConfig?.enabled) {
                            applyCustomStamper(frameCtx, fw, fh, currentOpts.stampConfig);
                        }
                    },
                    onProgress: r => {
                        checkAbort(abort.signal);
                        if (_e.jobId !== viewId) return;
                        let n = Math.round((r.progress || 0) * 100);
                        U.progressBar && (U.progressBar.style.width = `${n}%`);
                        U.progressText && (U.progressText.textContent = `${n}% (${r.processedFrames || 0} frames)`);
                    }
                });
            }
            checkAbort(abort.signal);
            if (_e.jobId !== viewId) return;
            _e.processedUrl && URL.revokeObjectURL(_e.processedUrl);
            _e.processedUrl = URL.createObjectURL(result.blob);
            if (isImg) {
                U.processedImg && (U.processedImg.src = _e.processedUrl, U.processedImg.style.display = "block");
                U.processedVideo.style.display = "none";
            } else {
                U.processedVideo.src = _e.processedUrl;
                U.processedVideo.style.display = "block";
                U.processedImg && (U.processedImg.style.display = "none");
            }
            U.processedEmpty.hidden = true;
            U.afterBadge.hidden = false;
            if (typeof updateSplitPos === 'function') updateSplitPos(_splitPos);
            showToast('✓ Đã xử lý & xoá watermark thành công!', 'success');
            U.downloadBtn.removeAttribute("aria-disabled");
            U.downloadBtn.href = _e.processedUrl;
            let ext = isImg ? (result.format || (result.blob?.type === 'image/webp' ? 'webp' : result.blob?.type === 'image/jpeg' ? 'jpg' : 'png')) : "mp4";
            U.downloadBtn.download = `[clean]_${sourceFile.name.replace(/\.[^.]+$/, "")}.${ext}`;
            let origSz = sourceFile.size;
            let outSz = result.blob?.size || 0;
            let sizeDiff = origSz > 0 && outSz > 0 ? ` (${LG(origSz)} → ${LG(outSz)}, ${outSz < origSz ? '-' + Math.round((1 - outSz/origSz)*100) + '%' : '+' + Math.round((outSz/origSz - 1)*100) + '%'})` : '';
            wr((result.detection ? "Đã xử lý." : "Không phát hiện watermark đủ rõ;") + ` Đã tối ưu & xuất file thành công${sizeDiff}!`, "success");
            if (sourceTaskId) {
                let currentTask = fn.tasks.get(sourceTaskId);
                if (currentTask) {
                    currentTask.resultBlob = result.blob;
                    currentTask.resultMeta = result;
                    currentTask.status = "completed";
                    currentTask.progress = 1.0;
                    Em(currentTask);
                    fn._notifyStats();
                    updateSingleFileSwitcher();
                }
            }
        } catch (t) {
            if (abort.signal.aborted || _e.jobId !== viewId) return;
            console.error("Export failed:", t);
            wr(`Lỗi xuất file: ${t.message}`, "error");
        } finally {
            _e.running = false;
            U.processBtn.disabled = false;
        }
    }
});
U.resetBtn?.addEventListener("click", () => {
    _e.singleAbort?.abort(); ++_e.jobId;
    _e.currentTaskId = null; _e.customDetection = null; _customBox = null;
    U.downloadBtn.removeAttribute('href'); U.downloadBtn.setAttribute('aria-disabled', 'true');
    _e.file = null;
    _e.originalUrl && URL.revokeObjectURL(_e.originalUrl);
    _e.processedUrl && URL.revokeObjectURL(_e.processedUrl);
    _e.originalUrl = null;
    _e.processedUrl = null;
    _e.metadata = null;
    _e.detection = null;
    U.originalVideo.src = "";
    U.processedVideo.src = "";
    U.originalImg && (U.originalImg.src = "", U.originalImg.style.display = "none");
    U.processedImg && (U.processedImg.src = "", U.processedImg.style.display = "none");
    U.originalEmpty.hidden = false;
    U.processedEmpty.hidden = false;
    U.afterBadge.hidden = true;
    k_(null);
    S_(null);
    U.progressBar && (U.progressBar.style.width = "0%");
    U.progressText && (U.progressText.textContent = "Chưa chọn file");
    wr("Đã làm mới", "info");
});
function setupCustomBrandingAndExportControls() {
    if (U.stampEnableCheck) {
        U.stampEnableCheck.addEventListener('change', () => {
            if (U.stampSettingsContainer) {
                U.stampSettingsContainer.style.display = U.stampEnableCheck.checked ? 'flex' : 'none';
            }
        });
    }
    if (U.stampTypeSelect) {
        U.stampTypeSelect.addEventListener('change', () => {
            let isImg = U.stampTypeSelect.value === 'image';
            if (U.stampTextGroup) U.stampTextGroup.style.display = isImg ? 'none' : 'block';
            if (U.stampImageGroup) U.stampImageGroup.style.display = isImg ? 'block' : 'none';
        });
    }
    if (U.stampLogoInput) {
        U.stampLogoInput.addEventListener('change', e => {
            let file = e.target.files?.[0];
            if (file) {
                let img = new Image();
                let url = URL.createObjectURL(file);
                img.onload = () => {
                    _stampLogoImageElement = img;
                    if (U.stampLogoPreview) {
                        U.stampLogoPreview.style.display = 'block';
                        U.stampLogoPreview.textContent = `✓ Đã tải logo: ${file.name}`;
                    }
                };
                img.src = url;
            } else {
                _stampLogoImageElement = null;
                if (U.stampLogoPreview) U.stampLogoPreview.style.display = 'none';
            }
        });
    }
    if (U.stampOpacityRange && U.stampOpacityVal) {
        U.stampOpacityRange.addEventListener('input', () => {
            U.stampOpacityVal.textContent = Math.round(parseFloat(U.stampOpacityRange.value) * 100) + '%';
        });
    }
    if (U.batchQualityRange && U.batchQualityVal) {
        U.batchQualityRange.addEventListener('input', () => {
            let q = Math.round(parseFloat(U.batchQualityRange.value) * 100);
            U.batchQualityVal.textContent = q + '%';
            if (U.batchQualityBadge) U.batchQualityBadge.textContent = q + '%';
        });
    }
    if (U.batchImageFormat) {
        U.batchImageFormat.addEventListener('change', () => {
            let isPng = U.batchImageFormat.value === 'image/png';
            if (U.qualitySliderGroup) {
                U.qualitySliderGroup.style.opacity = isPng ? '0.35' : '1';
                U.qualitySliderGroup.style.pointerEvents = isPng ? 'none' : 'auto';
            }
            if (U.batchQualityRange) {
                U.batchQualityRange.disabled = isPng;
            }
        });
    }
}
setupSmartBoxDrawing();
setupCustomBrandingAndExportControls();

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(text, type = 'info') {
    let container = U.toastContainer || document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        U.toastContainer = container;
    }
    let toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = type === 'success' ? '✓' : type === 'warn' ? '⚠' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${escapeHtml(text)}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// --- INTERACTIVE SPLIT-SLIDER & COMPARE MODES ---
var _compareMode = 'split';
var _splitPos = 50;
var _isDraggingSplit = false;

function setCompareMode(mode) {
    _compareMode = mode;
    if (!U.comparePlayer) return;
    U.comparePlayer.classList.remove('mode-split', 'mode-side', 'mode-hold');
    U.comparePlayer.classList.add(`mode-${mode}`);

    U.modeSplitBtn?.classList.toggle('active', mode === 'split');
    U.modeSideBtn?.classList.toggle('active', mode === 'side');
    U.modeHoldBtn?.classList.toggle('active', mode === 'hold');

    if (U.compareModeHint) {
        if (mode === 'split') U.compareModeHint.textContent = 'Kéo thanh chia đôi để so sánh trực quan Trước / Sau';
        else if (mode === 'side') U.compareModeHint.textContent = 'Hiển thị song song hai bên';
        else if (mode === 'hold') U.compareModeHint.textContent = 'Nhấp giữ chuột vào khung hình để xem ảnh gốc';
    }

    if (mode === 'split') {
        updateSplitPos(_splitPos);
    } else {
        if (U.processedPane) {
            U.processedPane.style.clipPath = '';
            U.processedPane.style.opacity = '1';
        }
        if (U.splitDivider) U.splitDivider.style.display = 'none';
    }
}

function updateSplitPos(pct) {
    _splitPos = Math.max(0, Math.min(100, pct));
    if (U.comparePlayer) {
        U.comparePlayer.style.setProperty('--split-pos', `${_splitPos}%`);
    }
    if (U.splitDivider) {
        U.splitDivider.style.display = _compareMode === 'split' ? 'block' : 'none';
        U.splitDivider.style.left = `${_splitPos}%`;
    }
    if (U.processedPane && _compareMode === 'split') {
        U.processedPane.style.clipPath = `polygon(${_splitPos}% 0, 100% 0, 100% 100%, ${_splitPos}% 100%)`;
        U.processedPane.style.opacity = '1';
    }
}

function setupSplitCompareSlider() {
    if (!U.comparePlayer) return;

    U.modeSplitBtn?.addEventListener('click', () => setCompareMode('split'));
    U.modeSideBtn?.addEventListener('click', () => setCompareMode('side'));
    U.modeHoldBtn?.addEventListener('click', () => setCompareMode('hold'));

    setCompareMode('split');

    function handleMove(clientX) {
        if (_compareMode !== 'split') return;
        let rect = U.comparePlayer.getBoundingClientRect();
        if (rect.width <= 0) return;
        let pct = ((clientX - rect.left) / rect.width) * 100;
        updateSplitPos(pct);
    }

    U.comparePlayer.addEventListener('mousedown', (e) => {
        if (_isDrawingBox) return;
        if (_compareMode === 'split') {
            _isDraggingSplit = true;
            handleMove(e.clientX);
        } else if (_compareMode === 'hold') {
            if (U.processedPane) U.processedPane.style.opacity = '0';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (_isDraggingSplit && _compareMode === 'split') {
            handleMove(e.clientX);
        }
    });

    window.addEventListener('mouseup', () => {
        _isDraggingSplit = false;
        if (_compareMode === 'hold' && U.processedPane) {
            U.processedPane.style.opacity = '1';
        }
    });

    U.comparePlayer.addEventListener('touchstart', (e) => {
        if (_isDrawingBox) return;
        if (e.touches && e.touches[0]) {
            if (_compareMode === 'split') {
                _isDraggingSplit = true;
                handleMove(e.touches[0].clientX);
            } else if (_compareMode === 'hold') {
                if (U.processedPane) U.processedPane.style.opacity = '0';
            }
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (_isDraggingSplit && _compareMode === 'split' && e.touches && e.touches[0]) {
            handleMove(e.touches[0].clientX);
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        _isDraggingSplit = false;
        if (_compareMode === 'hold' && U.processedPane) {
            U.processedPane.style.opacity = '1';
        }
    });
}

// --- CLIPBOARD PASTE SUPPORT ---
function setupClipboardPaste() {
    window.addEventListener('paste', async (e) => {
        let items = Array.from(e.clipboardData?.items || []);
        let imageFiles = [];
        for (let item of items) {
            if (item.type.startsWith('image/')) {
                let f = item.getAsFile();
                if (f) {
                    let ext = item.type === 'image/jpeg' ? 'jpg' : item.type === 'image/webp' ? 'webp' : 'png';
                    let renamed = new File([f], `clipboard_${Date.now()}.${ext}`, { type: item.type });
                    imageFiles.push(renamed);
                }
            }
        }
        if (imageFiles.length > 0) {
            e.preventDefault();
            await Tm(imageFiles);
            showToast(`📋 Đã dán ${imageFiles.length} ảnh từ Clipboard!`, 'success');
            let allTasks = Array.from(fn.tasks.values());
            let matched = allTasks.find(t => t.file === imageFiles[0]) || allTasks[allTasks.length - 1];
            if (matched) {
                _m('single');
                inspectTask(matched);
            }
        }
    });
}

// --- PRO KEYBOARD SHORTCUTS & MODAL ---
function setupHotkeysAndModal() {
    U.openHotkeysBtn?.addEventListener('click', () => {
        if (U.hotkeysModal) U.hotkeysModal.style.display = 'flex';
    });
    U.closeHotkeysBtn?.addEventListener('click', () => {
        if (U.hotkeysModal) U.hotkeysModal.style.display = 'none';
    });
    U.hotkeysModal?.addEventListener('click', (e) => {
        if (e.target === U.hotkeysModal) U.hotkeysModal.style.display = 'none';
    });

    window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

        // Space: Play/Pause video
        if (e.code === 'Space') {
            e.preventDefault();
            if (U.playPauseBtn && !U.playPauseBtn.disabled) {
                U.playPauseBtn.click();
            }
        }
        // '[' : Previous file in queue
        if (e.key === '[' || (e.altKey && e.key === 'ArrowLeft')) {
            e.preventDefault();
            U.prevFileBtn && !U.prevFileBtn.disabled && U.prevFileBtn.click();
        }
        // ']' : Next file in queue
        if (e.key === ']' || (e.altKey && e.key === 'ArrowRight')) {
            e.preventDefault();
            U.nextFileBtn && !U.nextFileBtn.disabled && U.nextFileBtn.click();
        }
        // 'D' or Ctrl+S: Download inspected file result
        if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.altKey) {
            if (U.downloadBtn && !U.downloadBtn.getAttribute('aria-disabled')) {
                e.preventDefault();
                U.downloadBtn.click();
                showToast('⬇ Đang tải file đã khử watermark...', 'info');
            }
        }
        // 'B': Toggle Smart Box drawing
        if (e.key === 'b' || e.key === 'B') {
            e.preventDefault();
            U.toggleBoxBtn && U.toggleBoxBtn.click();
        }
        // '1': Switch to Batch Tab
        if (e.key === '1') {
            _m('batch');
        }
        // '2': Switch to Single Inspector Tab
        if (e.key === '2') {
            _m('single');
            updateSingleFileSwitcher();
        }
        // 'H' hold: Hold view
        if (e.key === 'h' || e.key === 'H') {
            if (_compareMode === 'hold' && U.processedPane) {
                U.processedPane.style.opacity = '0';
            }
        }
        // Escape: Close modal or exit box drawing
        if (e.key === 'Escape') {
            if (U.hotkeysModal && U.hotkeysModal.style.display === 'flex') {
                U.hotkeysModal.style.display = 'none';
            } else if (_isBoxModeActive) {
                U.toggleBoxBtn && U.toggleBoxBtn.click();
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'h' || e.key === 'H') {
            if (_compareMode === 'hold' && U.processedPane) {
                U.processedPane.style.opacity = '1';
            }
        }
    });
}

setupSplitCompareSlider();
setupClipboardPaste();
setupHotkeysAndModal();
function setupAppLifecycle() {
    function ping() {
        fetch('/api/heartbeat', {
            method: 'POST',
            headers: { 'x-krhin-request': '1' }
        }).catch(() => {});
    }
    ping();
    setInterval(ping, 2500);
    const onExit = () => {
        try {
            fetch('/api/shutdown', {
                method: 'POST',
                headers: { 'x-krhin-request': '1' },
                keepalive: true
            }).catch(() => {});
        } catch (_) {}
    };
    window.addEventListener('pagehide', onExit);
    window.addEventListener('beforeunload', onExit);
}
function setupVideoUpscaler() {
    const tabBtn = we("tabUpscaleBtn");
    const badge = we("upscaleEngineBadge");
    const installBtn = we("upscaleInstallBtn");
    const dropzone = we("upscaleDropzone");
    const fileInput = we("upscaleFileInput");
    const fileNameEl = we("upscaleFileName");
    const fileMetaEl = we("upscaleFileMeta");
    const useStudioBtn = we("upscaleUseStudioBtn");
    const sendToUpscaleBtn = we("sendToUpscaleBtn");
    const targetSelect = we("upscaleTargetSelect");
    const modelSelect = we("upscaleModelSelect");
    const crfSelect = we("upscaleCrfSelect");
    const progressBar = we("upscaleProgressBar");
    const statusText = we("upscaleStatusText");
    const startBtn = we("upscaleStartBtn");
    const cancelBtn = we("upscaleCancelBtn");
    const downloadBtn = we("upscaleDownloadBtn");
    const origVideo = we("upscaleOriginalVideo");
    const resVideo = we("upscaleResultVideo");
    const playPauseBtn = we("upscalePlayPauseBtn");
    const tabLogsBtn = we("tabLogsBtn");
    const openLogsBtn = we("upscaleOpenLogsBtn");
    const liveLogsEl = we("upscaleLiveLogs");
    const logsTerminal = we("logsTerminal");
    const copyLogsBtn = we("copyLogsBtn");
    const clearLogsBtn = we("clearLogsBtn");
    if (!tabBtn || !startBtn) return;

    const appLogs = [];
    let lastServerLogCount = 0;

    function renderLogs() {
        const text = appLogs.length ? appLogs.join('\n') : '[Hệ thống] Chưa có log...';
        if (logsTerminal) {
            const nearBottom = logsTerminal.scrollHeight - logsTerminal.scrollTop - logsTerminal.clientHeight < 60;
            logsTerminal.textContent = text;
            if (nearBottom) logsTerminal.scrollTop = logsTerminal.scrollHeight;
        }
        if (liveLogsEl) {
            const recent = appLogs.slice(-40).join('\n') || 'Chưa có log xử lý...';
            liveLogsEl.textContent = recent;
            liveLogsEl.scrollTop = liveLogsEl.scrollHeight;
        }
    }

    function pushLog(msg) {
        const ts = new Date().toLocaleTimeString('vi-VN', { hour12: false });
        appLogs.push(`[${ts}] ${msg}`);
        if (appLogs.length > 300) appLogs.shift();
        renderLogs();
    }

    tabLogsBtn?.addEventListener("click", () => {
        _m("logs");
        renderLogs();
    });
    openLogsBtn?.addEventListener("click", () => {
        _m("logs");
        renderLogs();
    });
    copyLogsBtn?.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(appLogs.join('\n'));
            showToast?.('Đã sao chép toàn bộ Logs!', 'success');
        } catch {
            showToast?.('Không sao chép được clipboard.', 'warning');
        }
    });
    clearLogsBtn?.addEventListener("click", () => {
        appLogs.length = 0;
        lastServerLogCount = 0;
        renderLogs();
    });

    let selectedFile = null;
    let origUrl = null;
    let activeJobId = null;
    let pollTimer = null;

    function setUpscaleStatus(msg, tone = "info", pct = null) {
        if (statusText) {
            statusText.textContent = msg;
            statusText.dataset.tone = tone;
        }
        if (progressBar && pct !== null) {
            progressBar.style.width = `${Math.max(0, Math.min(100, Math.round(pct * 100)))}%`;
        }
    }

    async function refreshTools() {
        try {
            const res = await fetch('/api/upscale/tools');
            if (!res.ok) throw new Error('Không kết nối được local server');
            const data = await res.json();
            if (data.ready) {
                if (badge) {
                    badge.textContent = '✅ Real-ESRGAN GPU + FFmpeg Sẵn sàng';
                    badge.style.color = '#10b981';
                }
                if (installBtn) installBtn.hidden = true;
            } else {
                const missing = [];
                if (!data.realesrganPath) missing.push('Real-ESRGAN');
                if (!data.ffmpegPath) missing.push('FFmpeg');
                if (badge) {
                    badge.textContent = `⚠ Thiếu: ${missing.join(' + ')}`;
                    badge.style.color = '#f59e0b';
                }
                if (installBtn) installBtn.hidden = false;
            }
            return data;
        } catch {
            if (badge) badge.textContent = '⚠ Cần chạy qua Krhin-AI.exe';
            return null;
        }
    }

    installBtn?.addEventListener("click", async () => {
        installBtn.disabled = true;
        setUpscaleStatus('Đang bắt đầu tải và cài đặt công cụ...', 'info', 0.05);
        try {
            await fetch('/api/upscale/install', {
                method: 'POST',
                headers: { 'x-krhin-request': '1' }
            });
            const timer = setInterval(async () => {
                try {
                    const st = await (await fetch('/api/upscale/install-status')).json();
                    setUpscaleStatus(st.message || 'Đang cài đặt...', st.error ? 'error' : 'info', st.progress || 0.2);
                    if (!st.running) {
                        clearInterval(timer);
                        installBtn.disabled = false;
                        await refreshTools();
                        if (!st.error) showToast?.('Cài đặt Real-ESRGAN & FFmpeg thành công!', 'success');
                    }
                } catch {
                    clearInterval(timer);
                    installBtn.disabled = false;
                }
            }, 900);
        } catch (err) {
            installBtn.disabled = false;
            setUpscaleStatus('Lỗi cài đặt: ' + err.message, 'error', 0);
        }
    });

    function loadVideoFile(fileOrBlob, displayName) {
        if (!fileOrBlob) return;
        selectedFile = fileOrBlob instanceof File ? fileOrBlob : new File([fileOrBlob], displayName || 'studio_cleaned.mp4', { type: fileOrBlob.type || 'video/mp4' });
        if (origUrl) URL.revokeObjectURL(origUrl);
        origUrl = URL.createObjectURL(selectedFile);
        if (origVideo) { origVideo.src = origUrl; origVideo.load(); }
        if (resVideo) { resVideo.removeAttribute('src'); resVideo.load(); }
        if (fileNameEl) fileNameEl.textContent = selectedFile.name;
        if (fileMetaEl) fileMetaEl.textContent = `Dung lượng: ${LG(selectedFile.size)}`;
        if (downloadBtn) {
            downloadBtn.setAttribute('aria-disabled', 'true');
            downloadBtn.removeAttribute('href');
        }
        setUpscaleStatus('Sẵn sàng nâng cấp video. Chọn độ phân giải và nhấn Bắt đầu.', 'info', 0);
    }

    async function loadFromStudio() {
        if (_e.processedUrl && _e.file && _e.file.type.startsWith('video/')) {
            try {
                const blob = await (await fetch(_e.processedUrl)).blob();
                loadVideoFile(blob, `cleaned_${_e.file.name}`);
                showToast?.('Đã nạp video kết quả từ Studio!', 'success');
                return;
            } catch {}
        }
        if (_e.file && _e.file.type.startsWith('video/')) {
            loadVideoFile(_e.file, _e.file.name);
            showToast?.('Đã nạp video gốc từ Studio!', 'info');
            return;
        }
        showToast?.('Chưa có video nào trong Studio. Hãy chọn hoặc kéo thả file video.', 'warning');
    }

    tabBtn.addEventListener("click", () => {
        _m("upscale");
        refreshTools();
    });
    useStudioBtn?.addEventListener("click", loadFromStudio);
    sendToUpscaleBtn?.addEventListener("click", async () => {
        _m("upscale");
        await refreshTools();
        await loadFromStudio();
    });

    dropzone?.addEventListener("click", () => fileInput?.click());
    dropzone?.addEventListener("dragover", e => { e.preventDefault(); dropzone.style.borderColor = '#00f2fe'; });
    dropzone?.addEventListener("dragleave", () => { dropzone.style.borderColor = 'rgba(0,242,254,0.35)'; });
    dropzone?.addEventListener("drop", e => {
        e.preventDefault();
        dropzone.style.borderColor = 'rgba(0,242,254,0.35)';
        const f = e.dataTransfer?.files?.[0];
        if (f && f.type.startsWith('video/')) loadVideoFile(f, f.name);
    });
    fileInput?.addEventListener("change", e => {
        const f = e.target.files?.[0];
        if (f) loadVideoFile(f, f.name);
    });

    playPauseBtn?.addEventListener("click", () => {
        if (!origVideo?.src) return;
        if (origVideo.paused) {
            if (resVideo?.src) resVideo.currentTime = origVideo.currentTime;
            origVideo.play().catch(() => {});
            if (resVideo?.src) resVideo.play().catch(() => {});
        } else {
            origVideo.pause();
            resVideo?.pause();
        }
    });

    cancelBtn?.addEventListener("click", async () => {
        if (!activeJobId) return;
        await fetch('/api/upscale/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-krhin-request': '1' },
            body: JSON.stringify({ jobId: activeJobId })
        }).catch(() => {});
    });

    startBtn.addEventListener("click", async () => {
        if (!selectedFile) {
            showToast?.('Vui lòng chọn video cần nâng cấp trước!', 'warning');
            return;
        }
        const tools = await refreshTools();
        if (!tools?.ready) {
            showToast?.('Vui lòng bấm "Tải & Cài đặt Engine tự động" ở góc trên trước!', 'warning');
            return;
        }

        startBtn.disabled = true;
        if (cancelBtn) cancelBtn.hidden = false;
        lastServerLogCount = 0;
        pushLog(`Bắt đầu upload video: ${selectedFile.name} (${LG(selectedFile.size)})`);
        setUpscaleStatus('Đang gửi video tới bộ xử lý GPU local...', 'info', 0.03);

        try {
            const upRes = await fetch('/api/upscale/upload', {
                method: 'POST',
                headers: {
                    'x-krhin-request': '1',
                    'x-filename': encodeURIComponent(selectedFile.name)
                },
                body: selectedFile
            });
            const upData = await upRes.json();
            if (!upRes.ok || !upData.jobId) throw new Error(upData.error || 'Upload thất bại');
            activeJobId = upData.jobId;
            pushLog(`Đã upload xong. Khởi chạy job ${activeJobId}...`);

            const startRes = await fetch('/api/upscale/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-krhin-request': '1' },
                body: JSON.stringify({
                    jobId: activeJobId,
                    model: modelSelect?.value || 'realesr-animevideov3',
                    targetPreset: targetSelect?.value || '1080p',
                    crf: Number(crfSelect?.value) || 16
                })
            });
            const startData = await startRes.json();
            if (!startRes.ok) throw new Error(startData.error || 'Không thể khởi chạy upscale');

            if (pollTimer) clearInterval(pollTimer);
            let pollFailCount = 0;
            pollTimer = setInterval(async () => {
                try {
                    const res = await fetch(`/api/upscale/status?jobId=${encodeURIComponent(activeJobId)}`);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const st = await res.json();
                    pollFailCount = 0;
                    if (Array.isArray(st.logs) && st.logs.length > 0) {
                        if (st.logs.length > lastServerLogCount) {
                            for (let i = lastServerLogCount; i < st.logs.length; i++) {
                                appLogs.push(st.logs[i]);
                            }
                            lastServerLogCount = st.logs.length;
                        } else if (st.logs.length === lastServerLogCount && st.logs.length > 0) {
                            // Update last line if server replaced frame=/progress line
                            appLogs[appLogs.length - 1] = st.logs[st.logs.length - 1];
                        }
                        if (appLogs.length > 300) appLogs.splice(0, appLogs.length - 300);
                        renderLogs();
                    }
                    setUpscaleStatus(st.message || 'Đang xử lý...', st.status === 'error' ? 'error' : (st.status === 'done' ? 'success' : 'info'), st.progress || 0);
                    if (st.status === 'done') {
                        clearInterval(pollTimer);
                        startBtn.disabled = false;
                        if (cancelBtn) cancelBtn.hidden = true;
                        const resultUrl = `/api/upscale/result?jobId=${encodeURIComponent(activeJobId)}`;
                        if (resVideo) { resVideo.src = resultUrl; resVideo.load(); }
                        if (downloadBtn) {
                            downloadBtn.href = `${resultUrl}&download=1`;
                            downloadBtn.download = `upscaled_${selectedFile.name.replace(/\.[^.]+$/, '')}.mp4`;
                            downloadBtn.setAttribute('aria-disabled', 'false');
                        }
                        showToast?.('Nâng cấp độ phân giải video thành công!', 'success');
                    } else if (st.status === 'error' || st.status === 'cancelled') {
                        clearInterval(pollTimer);
                        startBtn.disabled = false;
                        if (cancelBtn) cancelBtn.hidden = true;
                    }
                } catch (pollErr) {
                    pollFailCount++;
                    if (pollFailCount >= 4) {
                        clearInterval(pollTimer);
                        startBtn.disabled = false;
                        if (cancelBtn) cancelBtn.hidden = true;
                        const errMsg = `Mất kết nối tới server cục bộ (${pollErr.message || 'server đã dừng'}). Hãy mở lại Krhin-AI.exe.`;
                        pushLog(`❌ ${errMsg}`);
                        setUpscaleStatus(errMsg, 'error', 0);
                        refreshTools();
                    }
                }
            }, 600);
        } catch (err) {
            startBtn.disabled = false;
            if (cancelBtn) cancelBtn.hidden = true;
            setUpscaleStatus('Lỗi: ' + err.message, 'error', 0);
        }
    });

    refreshTools();
}
setupVideoUpscaler();
setupAppLifecycle();
JB("video").then(t=>{t?.file&&Tm([t.file])}).catch(t=>console.warn("video handoff error:",t));