# Krhin AI — Watermark Remover Studio (Portable Edition)

Phần mềm xử lý và xoá hình mờ (Watermark) ảnh Gemini AI & video Veo AI — hoạt động **100% Cục bộ (Offline)**, sử dụng mô hình học sâu **FDnCNN** chạy trên nền tảng **ONNX Runtime Web (WebAssembly / WebGPU)**.

---

## 📌 1. Tổng quan Kiến trúc (Architecture Overview)

Dự án được thiết kế theo mô hình **Zero-Dependency Portable Application**:
* **Không phụ thuộc Internet:** 100% tác vụ xử lý diễn ra trên RAM/GPU của máy người dùng, không gửi dữ liệu ra ngoài.
* **Không cần cài đặt:** Nhúng sẵn bản Node.js runtime cho Windows (`runtime/node.exe`), người dùng chỉ cần giải nén là chạy được ngay qua file `.exe` hoặc `.bat`.
* **Không cần `npm install`:** Mã nguồn không sử dụng thư viện bên ngoài (`node_modules`) cho backend runner; toàn bộ máy chủ backend chỉ dùng Node.js native API (`http`, `fs`, `path`, `os`, `child_process`).

```
[Krhin-AI.exe / Chay-App.bat]
            │
            ▼
 [runtime/node.exe (Win64)] ──► [bin/local-runner.mjs] (HTTP Server @ 127.0.0.1:3000)
                                          │ (Phục vụ COOP/COEP headers cho SharedArrayBuffer)
                                          ▼
                      [Trình duyệt Chrome / Edge]
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
[dist/video-preview.html]                         [dist/workers/watermark-worker.js]
  - UI Studio (src/studio.js)                       - ONNX Runtime WASM (dist/onnxruntime/)
  - Batch Queue (src/batch-queue.js)                - Model FDnCNN (dist/models/allenk-fdncnn/)
  - Video Engine (vendor/video-engine.js)           - WebCodecs (VideoDecoder / VideoEncoder)
```

---

## 📂 2. Cấu trúc Thư mục Chi tiết (Directory Structure)

```
KrhinAI/
├── README.md                      # Tài liệu kiến trúc và hướng dẫn phát triển (File này)
├── Huong-Dan-Su-Dung.html         # Tài liệu hướng dẫn sử dụng giao diện trực quan cho người dùng cuối
├── Krhin-AI.exe                   # File chạy chính 1-click trên Windows (Biên dịch từ src/launcher.c)
├── Chay-App.bat                   # Script khởi chạy dự phòng qua Command Prompt
├── Tao-Shortcut.bat               # Script VBScript/CMD tạo biểu tượng Shortcut ngoài Desktop
├── app.ico                        # Icon chính của ứng dụng
├── package.json                   # Cấu hình scripts (build, test, start)
│
├── bin/
│   └── local-runner.mjs           # HTTP Server nội bộ: cấp phát cổng, phục vụ static file,
│                                  # gán header COOP/COEP và bảo vệ API hệ thống
│
├── src/                           # MÃ NGUỒN CỐT LÕI (CHỈNH SỬA TẠI ĐÂY)
│   ├── studio.js                  # Logic UI: so sánh Before/After, kéo thả, điều khiển thông số
│   ├── batch-queue.js             # Bộ quản lý hàng đợi xử lý hàng loạt (Queue, concurrency, retry)
│   ├── launcher.c                 # Mã nguồn C của launcher Windows (quản lý Windows Job Object, UTF-8)
│   └── launcher.rc                # File resource Windows gắn icon app.ico và metadata cho launcher.exe
│
├── vendor/                        # THƯ VIỆN BỔ TRỢ ĐÃ ĐƯỢC TỐI ƯU
│   ├── video-engine.js            # Engine trích xuất frame video bằng WebCodecs & Canvas, multiplex âm thanh
│   ├── zip-helper.js              # Tạo file .zip phía client để tải về toàn bộ ảnh/video đã xử lý
│   └── licenses.js                # Thông tin giấy phép mã nguồn mở đính kèm
│
├── scripts/                       # SCRIPT BIÊN DỊCH VÀ ĐÓNG GÓI
│   ├── build.mjs                  # Script Node.js gộp src/ và vendor/ thành dist/video-app.js
│   └── build-windows.sh           # Script biên dịch MinGW GCC từ src/launcher.c -> Krhin-AI.exe
│
├── dist/                          # BẢN ĐÓNG GÓI CHẠY TRÊN TRÌNH DUYỆT (PRODUCTION BUNDLE)
│   ├── video-preview.html         # Trang chính: Studio xoá watermark ảnh & video
│   ├── video-app.js               # Bundle được tạo tự động từ `npm run build` (KHÔNG sửa trực tiếp)
│   ├── dev-preview.html / .css    # Trang preview chế độ đơn giản (chỉ ảnh)
│   ├── index.html                 # Trang chuyển hướng mặc định
│   ├── models/                    # Mô hình AI đã convert sang ONNX:
│   │   └── allenk-fdncnn/         # Các checkpoint FP32 của FDnCNN (104, 200, 86x74)
│   ├── onnxruntime/               # Runtime WASM: ort-wasm-simd-threaded (.wasm, .mjs, .jsep)
│   ├── workers/                   # Web Worker xử lý tác vụ ngầm tránh đơ giao diện
│   ├── extension/                 # Bản Chrome Extension (Manifest v3)
│   └── userscript/                # Bản Tampermonkey Userscript nhúng trực tiếp vào web
│
├── runtime/
│   └── node.exe                   # Bản Node.js v20+ 64-bit portable cho Windows (chạy không cần cài Node)
│
├── tests/                         # BỘ TEST TỰ ĐỘNG
│   ├── core.test.mjs              # Test logic: Queue, concurrency, server, headers, bảo mật đường dẫn
│   ├── browser-smoke.cjs          # Test giao diện E2E bằng Playwright
│   └── browser-integration.cjs    # Test tích hợp quy trình xử lý ảnh/video thực tế
│
├── backups/                       # Bản lưu trữ lịch sử
└── build/                         # Thư mục chứa artifact biên dịch tạm thời
```

---

## 🛠️ 3. Dành cho Developer: Quy trình Phát triển (Workflow)

### 3.1. Chạy trên môi trường Dev
Nếu máy tính mới đã cài sẵn **Node.js (>= 20)**:
```bash
# 1. Chạy máy chủ phát triển
npm start
# Hoặc: node bin/local-runner.mjs

# 2. Chạy bộ kiểm thử (Unit Tests)
npm test
```
*Trình duyệt sẽ tự động mở tại địa chỉ:* `http://127.0.0.1:3000/video-preview.html`

### 3.2. Quy tắc sửa mã nguồn (Quan trọng!)
* **Giao diện & Logic Studio:** Sửa tại [`src/studio.js`](file:///src/studio.js) và [`src/batch-queue.js`](file:///src/batch-queue.js).
* **Động cơ Video & Nén:** Sửa tại [`vendor/video-engine.js`](file:///vendor/video-engine.js).
* **Build lại sau khi sửa:**
  ```bash
  npm run build
  ```
  Lệnh này sẽ chạy [`scripts/build.mjs`](file:///scripts/build.mjs), gộp các file từ `vendor/` và `src/` vào `dist/video-app.js`.
  > ⚠️ **Lưu ý:** Tuyệt đối không sửa code trực tiếp trong file `dist/video-app.js` vì nó sẽ bị ghi đè hoàn toàn khi chạy build.

### 3.3. Biên dịch lại Launcher EXE (`Krhin-AI.exe`)
Nếu bạn sửa đổi [`src/launcher.c`](file:///src/launcher.c), đổi tên ứng dụng hoặc đổi icon [`app.ico`](file:///app.ico), bạn có thể biên dịch lại bằng công cụ MinGW GCC (trên Linux hoặc MSYS2 trên Windows):
```bash
# Biên dịch file resource chứa icon
x86_64-w64-mingw32-windres src/launcher.rc build/launcher.res.o

# Biên dịch mã nguồn C ra Krhin-AI.exe (static linking, municode)
x86_64-w64-mingw32-gcc-posix -std=c11 -O2 -Wall -Wextra -Werror -municode -static src/launcher.c build/launcher.res.o -o Krhin-AI.exe
```

---

## ⚙️ 4. Lưu ý Kỹ thuật Quan trọng (Technical Gotchas)

1. **Yêu cầu bắt buộc về Header COOP / COEP:**
   * Để chạy ONNX Runtime WebAssembly với đa luồng (Multi-threading SIMD) đạt hiệu năng cao nhất, trình duyệt yêu cầu bảo mật nghiêm ngặt (`crossOriginIsolated = true`).
   * Máy chủ [`bin/local-runner.mjs`](file:///bin/local-runner.mjs) luôn gửi 2 headers:
     * `Cross-Origin-Opener-Policy: same-origin`
     * `Cross-Origin-Embedder-Policy: require-corp`
   * Do đó, không thể chạy trực tiếp bằng cách mở file `file:///path/to/video-preview.html` mà bắt buộc phải qua server local.

2. **Cơ chế đóng tiến trình sạch sẽ (Windows Job Objects):**
   * File `Krhin-AI.exe` được lập trình để tạo một `JobObject` với cờ `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`. Khi người dùng tắt cửa sổ ứng dụng, toàn bộ tiến trình con (`node.exe`) chạy ngầm sẽ được Windows dọn dẹp sạch sẽ, không bao giờ bị tình trạng chiếm dụng cổng hoặc chạy ngầm ăn RAM.

3. **Cổng mạng (Ports):**
   * Mặc định ứng dụng chạy ở cổng `3000`. Nếu cổng 3000 bị phần mềm khác chiếm, `local-runner.mjs` sẽ tự động dò và nhảy sang các cổng kế tiếp (3001, 3002...) mà không gây lỗi crash.

4. **Biến môi trường hỗ trợ:**
   * `PORT=XXXX`: Chỉ định cổng khởi chạy tùy ý.
   * `KRHIN_NO_OPEN=1`: Chạy server mà không tự động mở trình duyệt.
   * `KRHIN_NO_DIALOG=1`: Tắt hộp thoại MessageBox báo lỗi trên Windows (hữu ích cho chế độ headless).

---

## 🎯 5. Hướng phát triển tiếp theo (Roadmap Gợi ý)

* [ ] **Custom Watermark Mask:** Thêm công cụ vẽ hoặc chọn vùng bounding box thủ công trên video/ảnh cho các loại watermark không chuẩn vị trí.
* [ ] **Tích hợp WebGPU:** Tận dụng WebGPU backend của ONNX Runtime Web để tăng tốc xử lý video 4K/60fps lên gấp nhiều lần so với WebAssembly CPU.
* [ ] **Xuất định dạng nâng cao:** Hỗ trợ xuất định dạng ProRes hoặc tùy chỉnh bitrate cho video chất lượng studio.

---
*Bản quyền & Phát triển: Krhin AI Team — Sẵn sàng phát triển trên môi trường Windows / Linux / macOS.*
