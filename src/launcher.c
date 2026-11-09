#ifndef UNICODE
#define UNICODE
#endif
#define _UNICODE
#include <windows.h>
#include <stdio.h>
#include <wchar.h>
static HANDLE job;
static BOOL WINAPI stop(DWORD event) {
    if (event == CTRL_C_EVENT || event == CTRL_BREAK_EVENT || event == CTRL_CLOSE_EVENT || event == CTRL_SHUTDOWN_EVENT) {
        if (job) TerminateJobObject(job, 0);
        ExitProcess(0);
    }
    return FALSE;
}
static int fail(const wchar_t *message) {
    fwprintf(stderr, L"Krhin AI: %ls (Windows error %lu)\n", message, GetLastError());
    if (!GetEnvironmentVariableW(L"KRHIN_NO_DIALOG", NULL, 0)) MessageBoxW(NULL, message, L"Krhin AI - Khong khoi dong duoc", MB_OK | MB_ICONERROR);
    return 1;
}
int wmain(int argc, wchar_t **argv) {
    wchar_t base[32768], node[32768], runner[32768], command[32768];
    SetConsoleOutputCP(CP_UTF8); SetConsoleTitleW(L"Krhin AI - Dong cua so nay de dung ung dung");
    DWORD length = GetModuleFileNameW(NULL, base, 32768);
    if (!length || length >= 32768) return fail(L"Duong dan ung dung qua dai.");
    wchar_t *slash = wcsrchr(base, L'\\');
    if (!slash) return fail(L"Khong xac dinh duoc thu muc ung dung.");
    *slash = 0;
    if (wcslen(base) > 15000) return fail(L"Hay giai nen vao mot duong dan ngan hon.");
    swprintf(node, 32768, L"%ls\\runtime\\node.exe", base);
    swprintf(runner, 32768, L"%ls\\bin\\local-runner.mjs", base);
    const wchar_t *required[] = {node, runner};
    for (int i = 0; i < 2; i++) {
        DWORD attr = GetFileAttributesW(required[i]);
        if (attr == INVALID_FILE_ATTRIBUTES || (attr & FILE_ATTRIBUTE_DIRECTORY))
            return fail(L"Thieu runtime\\node.exe hoac bin\\local-runner.mjs. Hay giai nen TOAN BO file ZIP, khong chi copy file EXE.");
    }
    BOOL noOpen = FALSE;
    for (int i = 1; i < argc; i++) if (!wcscmp(argv[i], L"--no-open")) noOpen = TRUE;
    swprintf(command, 32768, L"\"%ls\" \"%ls\"%ls", node, runner, noOpen ? L" --no-open" : L"");
    STARTUPINFOW startup = {0}; startup.cb = sizeof(startup);
    PROCESS_INFORMATION process = {0};
    job = CreateJobObjectW(NULL, NULL);
    JOBOBJECT_EXTENDED_LIMIT_INFORMATION limit = {0};
    limit.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
    if (!job || !SetInformationJobObject(job, JobObjectExtendedLimitInformation, &limit, sizeof(limit))) return fail(L"Khong tao duoc phien ung dung.");
    if (!CreateProcessW(node, command, NULL, NULL, FALSE, CREATE_SUSPENDED, NULL, base, &startup, &process)) {
        CloseHandle(job); return fail(L"Khong chay duoc Node. Ban nay can Windows 10/11 64-bit.");
    }
    if (!AssignProcessToJobObject(job, process.hProcess)) {
        TerminateProcess(process.hProcess, 1); CloseHandle(process.hThread); CloseHandle(process.hProcess); CloseHandle(job);
        return fail(L"Khong quan ly duoc tien trinh. Hay dong cac phien cu va thu lai.");
    }
    SetConsoleCtrlHandler(stop, TRUE);
    ResumeThread(process.hThread); CloseHandle(process.hThread);
    WaitForSingleObject(process.hProcess, INFINITE);
    DWORD code = 1; GetExitCodeProcess(process.hProcess, &code);
    CloseHandle(process.hProcess); CloseHandle(job); job = NULL;
    if (code) return fail(L"Ung dung da dung vi loi. Chay Chay-App.bat de xem thong bao chi tiet.");
    return 0;
}
