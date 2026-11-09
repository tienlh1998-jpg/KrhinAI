using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;

class KrhinLauncher {
    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    static extern IntPtr CreateJobObject(IntPtr lpJobAttributes, string lpName);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool SetInformationJobObject(IntPtr hJob, int JobObjectInfoClass, IntPtr lpJobObjectInfo, uint cbJobObjectInfoLength);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool AssignProcessToJobObject(IntPtr hJob, IntPtr hProcess);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool CloseHandle(IntPtr hObject);

    [StructLayout(LayoutKind.Sequential)]
    struct IO_COUNTERS {
        public ulong ReadOperationCount;
        public ulong WriteOperationCount;
        public ulong OtherOperationCount;
        public ulong ReadTransferCount;
        public ulong WriteTransferCount;
        public ulong OtherTransferCount;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct JOBOBJECT_BASIC_LIMIT_INFORMATION {
        public long PerProcessUserTimeLimit;
        public long PerJobUserTimeLimit;
        public uint LimitFlags;
        public UIntPtr MinimumWorkingSetSize;
        public UIntPtr MaximumWorkingSetSize;
        public uint ActiveProcessLimit;
        public UIntPtr Affinity;
        public uint PriorityClass;
        public uint SchedulingClass;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct JOBOBJECT_EXTENDED_LIMIT_INFORMATION {
        public JOBOBJECT_BASIC_LIMIT_INFORMATION BasicLimitInformation;
        public IO_COUNTERS IoInfo;
        public UIntPtr ProcessMemoryLimit;
        public UIntPtr JobMemoryLimit;
        public UIntPtr PeakProcessMemoryLimit;
        public UIntPtr PeakJobMemoryLimit;
    }

    const int JobObjectExtendedLimitInformation = 9;
    const uint JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x00002000;

    [STAThread]
    static int Main(string[] args) {
        string appDir = AppDomain.CurrentDomain.BaseDirectory;
        string nodePath = Path.Combine(appDir, @"runtime\node.exe");
        string runnerPath = Path.Combine(appDir, @"bin\local-runner.mjs");

        if (!File.Exists(nodePath) || !File.Exists(runnerPath)) {
            MessageBox.Show(
                "Thiếu runtime\\node.exe hoặc bin\\local-runner.mjs.\n\nHãy giải nén TOÀN BỘ file ZIP trước khi chạy phần mềm.",
                "Krhin AI - Lỗi khởi động",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
            return 1;
        }

        IntPtr job = CreateJobObject(IntPtr.Zero, null);
        if (job != IntPtr.Zero) {
            JOBOBJECT_EXTENDED_LIMIT_INFORMATION info = new JOBOBJECT_EXTENDED_LIMIT_INFORMATION();
            info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
            int length = Marshal.SizeOf(typeof(JOBOBJECT_EXTENDED_LIMIT_INFORMATION));
            IntPtr extendedInfoPtr = Marshal.AllocHGlobal(length);
            try {
                Marshal.StructureToPtr(info, extendedInfoPtr, false);
                SetInformationJobObject(job, JobObjectExtendedLimitInformation, extendedInfoPtr, (uint)length);
            } finally {
                Marshal.FreeHGlobal(extendedInfoPtr);
            }
        }

        string argStr = "\"" + runnerPath + "\"";
        foreach (string a in args) {
            argStr += " \"" + a + "\"";
        }

        ProcessStartInfo psi = new ProcessStartInfo();
        psi.FileName = nodePath;
        psi.Arguments = argStr;
        psi.WorkingDirectory = appDir;
        psi.CreateNoWindow = true;
        psi.UseShellExecute = false;
        psi.WindowStyle = ProcessWindowStyle.Hidden;

        try {
            Process proc = Process.Start(psi);
            if (proc != null) {
                if (job != IntPtr.Zero) {
                    try { AssignProcessToJobObject(job, proc.Handle); } catch { }
                }
                proc.WaitForExit();
                return proc.ExitCode;
            }
        } catch (Exception ex) {
            MessageBox.Show(
                "Không thể khởi động tiến trình Node.js:\n" + ex.Message,
                "Krhin AI - Lỗi",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
            return 1;
        } finally {
            if (job != IntPtr.Zero) CloseHandle(job);
        }

        return 0;
    }
}
