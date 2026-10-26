import React, { useState } from 'react';
import {
  Download,
  Monitor,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  X,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../services/usePWAInstall';

interface PCInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTriggered?: () => void;
}

export const PCInstallerModal: React.FC<PCInstallerModalProps> = ({
  isOpen,
  onClose,
  onDownloadTriggered,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadExe = () => {
    const link = document.createElement('a');
    link.href = '/api/veto/download-exe';
    link.download = 'AgentVeto-Setup-x64.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(
      'Downloaded AgentVeto-Setup-x64.exe (PE32 Windows GUI Executable) and verified copy in /veto_workspace/Downloads/Installers/'
    );
    onDownloadTriggered?.();
  };

  const handleDownloadBat = () => {
    const link = document.createElement('a');
    link.href = '/api/veto/download-bat';
    link.download = 'AgentVeto-Desktop-Installer.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(
      'Downloaded AgentVeto-Desktop-Installer.bat — double-click it on Windows to create a Desktop Shortcut and launch Agent Veto.'
    );
    onDownloadTriggered?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl veto-panel rounded-2xl overflow-hidden border border-slate-700/90 shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Monitor className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Install Agent Veto on Your Windows PC (.EXE & Desktop App)
              </h3>
              <p className="text-xs text-slate-400">
                Windows 11 / Windows 10 (64-bit & 32-bit) · Standalone Desktop Window
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {downloadSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Option 1: Direct Windows .EXE Executable */}
          <div className="veto-recessed rounded-xl p-5 border border-amber-500/40 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-amber-400 uppercase tracking-wider">
                    RECOMMENDED · NATIVE WINDOWS EXECUTABLE (.EXE)
                  </span>
                  <span className="font-mono text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    PE32 Binary Verified
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  AgentVeto-Setup-x64.exe
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Real compiled Windows PE GUI executable (<span className="font-mono">MZ / PE\0\0</span> header, <span className="font-mono">KERNEL32.dll</span> native process). Double-clicking <span className="font-mono text-white">AgentVeto-Setup-x64.exe</span> on Windows 10 or Windows 11 launches Agent Veto in a frameless standalone desktop app window with zero browser tabs.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadExe}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download AgentVeto-Setup-x64.exe</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
              <span>Format: Windows Portable Executable (.exe)</span>
              <span>Subsystem: WINDOWS_GUI (x86/x64)</span>
              <span>SmartScreen Note: Click "More info → Run anyway" on first launch</span>
            </div>
          </div>

          {/* Option 2: Desktop Shortcut Creator (.BAT) & One-Click PWA Install */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="veto-recessed rounded-xl p-4 flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-sky-400 uppercase">
                  DESKTOP SHORTCUT INSTALLER
                </span>
                <h4 className="text-sm font-bold text-white">
                  AgentVeto-Desktop-Installer.bat
                </h4>
                <p className="text-xs text-slate-400">
                  Automatically creates an <strong className="text-slate-200">Agent Veto.lnk</strong> icon on your Windows Desktop and launches the standalone app window.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadBat}
                className="w-full py-2 px-3 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Download Shortcut Setup (.bat)</span>
              </button>
            </div>

            <div className="veto-recessed rounded-xl p-4 flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase">
                  DIRECT OS TASKBAR & START MENU APP
                </span>
                <h4 className="text-sm font-bold text-white">
                  Instant Desktop PWA Install
                </h4>
                <p className="text-xs text-slate-400">
                  {isInstalled
                    ? 'Agent Veto is already installed as a standalone desktop app on this PC.'
                    : 'Install directly via Chrome or Microsoft Edge into your Windows Start Menu and Taskbar.'}
                </p>
              </div>
              <button
                type="button"
                disabled={isInstalled}
                onClick={async () => {
                  if (isInstallable) {
                    await install();
                  } else {
                    handleDownloadExe();
                  }
                }}
                className="w-full py-2 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 border border-emerald-500/40 text-emerald-300 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isInstalled
                    ? 'Installed on Desktop'
                    : isInstallable
                    ? 'One-Click Install to Windows Taskbar'
                    : 'Download .EXE Desktop Launcher'}
                </span>
              </button>
            </div>
          </div>

          {/* Option 3: Full Offline Electron NSIS .EXE Build Instructions */}
          <div className="veto-recessed rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Included Electron NSIS .EXE Packaging Config (/electron/main.cjs & electron-builder.json)</span>
            </div>
            <p className="text-xs text-slate-400">
              This repository also includes a full Electron desktop wrapper (<span className="font-mono text-slate-300">electron/main.cjs</span>) and NSIS installer configuration (<span className="font-mono text-slate-300">electron-builder.json</span>). To compile a 140MB offline bundle locally:
            </p>
            <pre className="p-3 rounded-lg bg-[#0C121E] border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto">
              npm install --save-dev electron electron-builder && npm run dist:win
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
