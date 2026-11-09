// Kept inside the engine's closure by scripts/build.mjs.
var Ol = class BatchQueueManager {
    constructor(options = {}) {
        this.concurrency = Math.max(1, Math.min(8, Math.floor(options.concurrency || 2)));
        this.tasks = new Map();
        this.runningCount = 0;
        this.isRunning = false;
        this.processor = options.processor;
        for (const name of ['onTaskAdd', 'onTaskUpdate', 'onTaskProgress', 'onTaskComplete', 'onTaskError', 'onQueueDrain', 'onStatsChange']) {
            this[name] = options[name] || (() => {});
        }
    }
    setConcurrency(value) { this.concurrency = Math.max(1, Math.min(8, Math.floor(Number(value) || 2))); this._scheduleNext(); }
    setProcessor(fn) { this.processor = fn; }
    addTask(file, options = {}) {
        const task = { id: `task_${Date.now()}_${Math.random().toString(36).slice(2)}`, file, name: file.name,
            size: file.size || 0, type: file.type, status: 'pending', progress: 0, options: { ...options },
            resultBlob: null, resultUrl: null, error: null };
        this.tasks.set(task.id, task);
        this.onTaskAdd(task); this._notifyStats(); this._scheduleNext();
        return task;
    }
    addFiles(files, options = {}) {
        return Array.from(files).filter(f => f && (/^(image|video)\//.test(f.type || '') || /\.(png|jpe?g|webp|mp4|webm|mov|m4v|mkv)$/i.test(f.name)))
            .map(file => this.addTask(file, options));
    }
    start() { this.isRunning = true; this._scheduleNext(); this._notifyStats(); }
    pause() { this.isRunning = false; this._notifyStats(); }
    cancelTask(id) {
        const task = this.tasks.get(id);
        if (!task || !['pending', 'processing'].includes(task.status)) return;
        task.status = 'canceled'; task.abortController?.abort();
        // A slot is released only when the processor has actually stopped.
        this.onTaskUpdate(task); this._notifyStats(); this._scheduleNext();
    }
    retryTask(id) {
        const task = this.tasks.get(id);
        if (!task || task._active || !['failed', 'canceled'].includes(task.status)) return;
        if (task.resultUrl) URL.revokeObjectURL(task.resultUrl);
        Object.assign(task, { status: 'pending', progress: 0, error: null, resultBlob: null, resultUrl: null });
        this.onTaskUpdate(task); this._notifyStats(); this._scheduleNext();
    }
    removeTask(id) {
        const task = this.tasks.get(id); if (!task) return;
        this.cancelTask(id);
        if (task.resultUrl) URL.revokeObjectURL(task.resultUrl);
        this.tasks.delete(id); this.onTaskUpdate({ id, _removed: true }); this._notifyStats();
    }
    clearCompleted() {
        for (const [id, task] of this.tasks) if (['completed', 'canceled'].includes(task.status)) this.removeTask(id);
    }
    clearAll() {
        this.pause();
        for (const id of [...this.tasks.keys()]) this.removeTask(id);
        this._notifyStats();
    }
    getStats() {
        const stats = { total: this.tasks.size, pending: 0, processing: 0, completed: 0, failed: 0, canceled: 0,
            isRunning: this.isRunning, concurrency: this.concurrency, overallProgress: 0 };
        for (const task of this.tasks.values()) {
            stats[task.status]++;
            stats.overallProgress += task.status === 'completed' ? 1 : task.status === 'processing' ? task.progress : 0;
        }
        stats.overallProgress /= stats.total || 1;
        return stats;
    }
    _notifyStats() { this.onStatsChange(this.getStats()); }
    _scheduleNext() {
        if (!this.isRunning || !this.processor) return;
        while (this.runningCount < this.concurrency) {
            const task = [...this.tasks.values()].find(t => t.status === 'pending');
            if (!task) {
                if (!this.runningCount) { this.isRunning = false; this.onQueueDrain(); this._notifyStats(); }
                break;
            }
            this._runTask(task);
        }
    }
    async _runTask(task) {
        this.runningCount++; task._active = true; task.status = 'processing';
        task.abortController = new AbortController(); task.startedAt = Date.now();
        this.onTaskUpdate(task); this._notifyStats();
        const current = () => this.tasks.get(task.id) === task && !task.abortController.signal.aborted;
        try {
            const result = await this.processor(task.file, { ...task.options, abortSignal: task.abortController.signal,
                onProgress: data => {
                    task.abortController.signal.throwIfAborted();
                    if (!current()) return;
                    task.progress = Math.max(0, Math.min(1, data.progress || 0));
                    task.processedFrames = data.processedFrames || 0;
                    task.speedFps = Math.round(task.processedFrames / Math.max(.001, (Date.now() - task.startedAt) / 1000));
                    this.onTaskProgress(task, data); this.onTaskUpdate(task); this._notifyStats();
                }
            });
            if (!current()) return;
            Object.assign(task, { status: 'completed', progress: 1, resultBlob: result.blob, resultMeta: result,
                resultUrl: result.blob ? URL.createObjectURL(result.blob) : null });
            try { await this.onTaskComplete(task, result); }
            catch (error) { console.warn('Không tự lưu được kết quả; vẫn có thể tải thủ công:', error); }
        } catch (error) {
            if (!current()) return;
            task.status = 'failed'; task.error = error.message || String(error); this.onTaskError(task, error);
        } finally {
            task._active = false; this.runningCount--;
            if (this.tasks.get(task.id) === task) this.onTaskUpdate(task);
            this._notifyStats(); this._scheduleNext();
        }
    }
};
