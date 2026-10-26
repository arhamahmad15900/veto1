import React, { useState, useEffect } from 'react';
import {
  WorkspaceSnapshot,
  AgentTask,
  WorkspaceFile,
} from '../types/veto';
import {
  Mail,
  MessageSquare,
  Camera,
  FolderOpen,
  Download,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  Send,
  Sparkles,
  HardDrive,
  Lock,
  FileText,
  Edit3,
  Check,
  X,
  Laptop,
  Play,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export type ConnectedAppTab =
  | 'pc_programs'
  | 'email'
  | 'whatsapp'
  | 'instagram'
  | 'filesystem'
  | 'software'
  | 'bridges';

interface ConnectedAppsViewProps {
  snapshot: WorkspaceSnapshot;
  initialTab?: ConnectedAppTab;
  localBridgeOnline: boolean;
  onExecuteCommand: (instruction: string) => void;
  onApproveStep: (taskId: string, stepId: string, approved: boolean) => void;
  onResetDownloads: () => void;
  onUpdateDraft: (targetType: 'email' | 'whatsapp' | 'instagram', targetId: string, newText: string) => void;
  onUpdateInstalledProgram: (payload: {
    action: 'toggle_policy' | 'add';
    programId?: string;
    permissionPolicy?: 'always_ask' | 'blocked';
    program?: {
      name: string;
      category: string;
      windowsCommand: string;
      macCommand: string;
      protocolUri?: string;
      description?: string;
    };
  }) => void;
  isBusy: boolean;
}

export const ConnectedAppsView: React.FC<ConnectedAppsViewProps> = ({
  snapshot,
  initialTab = 'pc_programs',
  localBridgeOnline,
  onExecuteCommand,
  onApproveStep,
  onResetDownloads,
  onUpdateDraft,
  onUpdateInstalledProgram,
  isBusy,
}) => {
  const [activeTab, setActiveTab] = useState<ConnectedAppTab>(initialTab);
  const [fileFilter, setFileFilter] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);

  // Custom PC program registration form
  const [newProgName, setNewProgName] = useState('');
  const [newProgWinCmd, setNewProgWinCmd] = useState('');
  const [newProgMacCmd, setNewProgMacCmd] = useState('');
  const [newProgCategory, setNewProgCategory] = useState('System Utility');

  // Draft editing state
  const [editingDraftKey, setEditingDraftKey] = useState<string | null>(null);
  const [editingDraftText, setEditingDraftText] = useState<string>('');

  const { isInstallable, isInstalled, install } = usePWAInstall();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const findPendingApprovalForType = (actionType: string): { task: AgentTask; stepId: string } | null => {
    for (const task of snapshot.tasks) {
      if (task.status === 'awaiting_approval') {
        for (const step of task.steps) {
          if (step.status === 'awaiting_approval' && step.approvalPayload?.actionType === actionType) {
            return { task, stepId: step.id };
          }
        }
      }
    }
    return null;
  };

  const pendingEmailApproval = findPendingApprovalForType('send_emails');
  const pendingWaApproval = findPendingApprovalForType('send_whatsapp');
  const pendingIgApproval = findPendingApprovalForType('publish_instagram');
  const pendingPkgApproval = findPendingApprovalForType('install_software');

  const filteredFiles =
    fileFilter === 'all'
      ? snapshot.files
      : snapshot.files.filter((f) => f.category.toLowerCase() === fileFilter.toLowerCase());

  const startEditing = (key: string, currentText: string) => {
    setEditingDraftKey(key);
    setEditingDraftText(currentText);
  };

  const saveEdit = (targetType: 'email' | 'whatsapp' | 'instagram', targetId: string) => {
    onUpdateDraft(targetType, targetId, editingDraftText);
    setEditingDraftKey(null);
  };

  const handleAddCustomProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgName.trim()) return;
    onUpdateInstalledProgram({
      action: 'add',
      program: {
        name: newProgName.trim(),
        category: newProgCategory,
        windowsCommand: newProgWinCmd.trim() || `${newProgName.trim().toLowerCase().replace(/\s+/g, '')}.exe`,
        macCommand: newProgMacCmd.trim() || `open -a "${newProgName.trim()}"`,
        description: `User-registered host PC application (${newProgCategory}). Always prompts for permission before running.`,
      },
    });
    setNewProgName('');
    setNewProgWinCmd('');
    setNewProgMacCmd('');
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Header & Interactive Segmented Switcher (Horizontally scrollable on Android mobile with 48px touch targets) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/90 min-w-0">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Android Apps, Host PC Programs & Permission Bridges
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Install Agent Veto on your Android phone or PC, manage installed apps, and enforce strict permission-first execution.
          </p>
        </div>

        {/* Interactive Filter Tabs (48px min height for mobile touch ergonomics) */}
        <div className="flex items-center gap-1.5 p-1.5 veto-panel rounded-2xl overflow-x-auto momentum-scroll min-w-0">
          {[
            { id: 'pc_programs', label: 'Android & PC Apps', icon: Laptop },
            { id: 'email', label: 'Gmail / Inbox', icon: Mail },
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
            { id: 'instagram', label: 'Instagram', icon: Camera },
            { id: 'filesystem', label: 'Files & Downloads', icon: FolderOpen },
            { id: 'software', label: 'App Store / Packages', icon: Download },
            { id: 'bridges', label: 'Security', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ConnectedAppTab)}
                className={`min-h-[44px] px-3.5 py-2 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer gpu-transition ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 0: INSTALLED ANDROID & PC PROGRAMS + 1-TAP INSTALLER */}
      {activeTab === 'pc_programs' && (
        <div className="space-y-6 min-w-0">
          {/* Easy 1-Tap Android & PC Installation Card */}
          <div className="veto-panel rounded-2xl p-4 sm:p-5 border-amber-500/40 space-y-4 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider">
                  <Laptop className="w-4 h-4 shrink-0" />
                  <span>Android Mobile (WebAPK / Intent Bridge) · Windows · macOS</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Install Agent Veto & Connect Installed Android / PC Apps
                </h3>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  Install Agent Veto directly onto your Android Home Screen or Desktop. It connects to WhatsApp, Google Maps, Phone Dialer, Google Messages (SMS), YouTube, Gmail, Spotify, Files, and VS Code—always asking for your permission before launching any app.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 shrink-0">
                {isInstallable && !isInstalled && (
                  <button
                    type="button"
                    onClick={install}
                    className="min-h-[48px] px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer gpu-transition"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Install on Android / Home Screen</span>
                  </button>
                )}

                <a
                  href="/api/pc-agent/install-windows.bat"
                  download="Install-Agent-Veto-PC.bat"
                  className="min-h-[48px] px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer gpu-transition"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Windows Companion (.bat)</span>
                </a>

                <a
                  href="/api/pc-agent/install-mac-linux.sh"
                  download="install-agent-veto-pc.sh"
                  className="min-h-[48px] px-3.5 py-2.5 veto-recessed hover:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer gpu-transition"
                >
                  <Download className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>macOS / Linux (.sh)</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="veto-recessed rounded-xl p-3.5 space-y-1">
                <p className="font-semibold text-white">1. Android Home Screen Install</p>
                <p className="text-slate-400">
                  On Android Chrome, tap <strong>Install App</strong> or open the browser menu (⋮) → <strong>Add to Home Screen</strong> for full-screen standalone mode.
                </p>
              </div>
              <div className="veto-recessed rounded-xl p-3.5 space-y-1">
                <p className="font-semibold text-white">2. Strict Permission-First Gate</p>
                <p className="text-slate-400">
                  Agent Veto <strong>never</strong> opens an Android app or executes a task silently. Every command pauses and asks you to tap <strong>“Allow & Open App”</strong> first.
                </p>
              </div>
              <div className="veto-recessed rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-white">3. Android Intent & PC Bridge</p>
                  <span
                    className={`font-mono text-[11px] font-semibold ${
                      localBridgeOnline ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {localBridgeOnline ? 'PC BRIDGE + INTENTS ACTIVE' : 'ANDROID INTENTS ACTIVE'}
                  </span>
                </div>
                <p className="text-slate-400">
                  Direct Android URI intents (<span className="font-mono text-sky-300">whatsapp://</span>, <span className="font-mono text-sky-300">tel:</span>, <span className="font-mono text-sky-300">sms:</span>, <span className="font-mono text-sky-300">mailto:</span>, Maps, YouTube) work out-of-the-box on Android.
                </p>
              </div>
            </div>
          </div>

          {/* Register Any Custom Android App or PC Program */}
          <div className="veto-panel rounded-2xl p-4 space-y-3 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Register Another Installed Android App or PC Program
                </h4>
                <p className="text-xs text-slate-400">
                  Add any app on your Android phone or computer so Agent Veto can launch it after your permission.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                Permission-First Enforced
              </span>
            </div>

            <form onSubmit={handleAddCustomProgram} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              <input
                type="text"
                value={newProgName}
                onChange={(e) => setNewProgName(e.target.value)}
                placeholder="App Name (e.g. Telegram, Slack)"
                className="min-h-[48px] px-3.5 py-2 veto-recessed rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <select
                value={newProgCategory}
                onChange={(e) => setNewProgCategory(e.target.value)}
                className="min-h-[48px] px-3.5 py-2 veto-recessed rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Android App">Android App</option>
                <option value="Communication">Communication</option>
                <option value="Media & Design">Media & Design</option>
                <option value="System Utility">System Utility</option>
                <option value="Office & Docs">Office & Docs</option>
                <option value="Browser">Browser</option>
                <option value="IDE & Code">IDE & Code</option>
              </select>
              <input
                type="text"
                value={newProgWinCmd}
                onChange={(e) => setNewProgWinCmd(e.target.value)}
                placeholder="Android URI / Win Cmd (e.g. tg://)"
                className="min-h-[48px] px-3.5 py-2 veto-recessed rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                value={newProgMacCmd}
                onChange={(e) => setNewProgMacCmd(e.target.value)}
                placeholder='Package / Mac Cmd (e.g. org.telegram.messenger)'
                className="min-h-[48px] px-3.5 py-2 veto-recessed rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="min-h-[48px] px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer gpu-transition"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Register App</span>
              </button>
            </form>
          </div>

          {/* Grid of Installed Android & Host PC Programs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
            {snapshot.installedPrograms.map((prog) => {
              const isBlocked = prog.permissionPolicy === 'blocked';
              return (
                <div
                  key={prog.id}
                  className="veto-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 min-w-0"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-sky-400 font-medium">{prog.category}</span>
                      <span
                        className={`font-mono text-[11px] font-semibold ${
                          isBlocked ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {isBlocked ? 'BLOCKED' : 'ASK PERMISSION FIRST'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white">{prog.name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{prog.description}</p>

                    <div className="pt-1 space-y-1 text-[11px] font-mono text-slate-400 min-w-0">
                      {prog.androidPackage && (
                        <p className="truncate text-emerald-400">
                          Android: {prog.androidPackage}
                        </p>
                      )}
                      <p className="truncate">URI / Cmd: {prog.androidIntentUri || prog.windowsCommand}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateInstalledProgram({
                          action: 'toggle_policy',
                          programId: prog.id,
                          permissionPolicy: isBlocked ? 'always_ask' : 'blocked',
                        })
                      }
                      className="min-h-[48px] px-3 py-2 veto-recessed hover:bg-slate-800 rounded-xl text-xs font-medium text-slate-300 flex items-center justify-center cursor-pointer gpu-transition"
                    >
                      {isBlocked ? 'Unblock App' : 'Block Access'}
                    </button>

                    <button
                      type="button"
                      disabled={isBusy || isBlocked}
                      onClick={() =>
                        onExecuteCommand(`Veto, open ${prog.name} and prepare it for my workflow.`)
                      }
                      className="min-h-[48px] px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer gpu-transition"
                    >
                      <Play className="w-3.5 h-3.5 shrink-0" />
                      <span>Ask & Open</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: EMAIL INBOX & REPLY DRAFTS */}
      {activeTab === 'email' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 veto-panel rounded-xl p-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                Outlook / Native Mail Client & OAuth Bridge
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                <span>Permission-First Mode</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{snapshot.emails.length} messages indexed</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400">Prompt-Injection Content Isolation Active</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {pendingEmailApproval && (
                <button
                  type="button"
                  onClick={() => onApproveStep(pendingEmailApproval.task.id, pendingEmailApproval.stepId, true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Allow & Dispatch Staged Replies</span>
                </button>
              )}
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  onExecuteCommand(
                    'Veto, read my important emails received today, summarize them, and prepare reply drafts.'
                  )
                }
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Stage Email Triage (Asks Permission)</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-800/80 veto-panel rounded-xl overflow-hidden">
            {snapshot.emails.map((email) => {
              const editKey = `email-${email.id}`;
              const isEditingThis = editingDraftKey === editKey;
              return (
                <div key={email.id} className="p-5 hover:bg-slate-900/40 transition-colors space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">{email.sender}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{email.senderEmail}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          email.priority === 'urgent'
                            ? 'text-amber-400 font-semibold'
                            : email.priority === 'high'
                            ? 'text-sky-400 font-medium'
                            : 'text-slate-400'
                        }
                      >
                        Priority: {email.priority.toUpperCase()}
                      </span>
                      {email.containsUntrustedWarning && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Quarantined Prompt-Injection Attempt
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-400">{email.receivedAt}</span>
                  </div>

                  <h4 className="text-sm font-semibold text-white">{email.subject}</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{email.body}</p>

                  {email.draftReply && (
                    <div className="mt-3 pt-3 border-t border-slate-800/90 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                        <span
                          className={
                            email.draftReply.status === 'sent'
                              ? 'font-semibold text-emerald-400'
                              : 'font-semibold text-sky-400'
                          }
                        >
                          {email.draftReply.status === 'sent'
                            ? 'Verified Reply Dispatched After User Permission'
                            : 'Staged Reply Draft (Waiting for Your Permission Before Sending)'}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono tabular-nums">{email.draftReply.updatedAt}</span>
                          {email.draftReply.status === 'draft_ready' && !isEditingThis && (
                            <button
                              type="button"
                              onClick={() => startEditing(editKey, email.draftReply!.body)}
                              className="text-slate-300 hover:text-amber-400 flex items-center gap-1 text-xs cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit Draft</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditingThis ? (
                        <div className="space-y-2">
                          <textarea
                            rows={4}
                            value={editingDraftText}
                            onChange={(e) => setEditingDraftText(e.target.value)}
                            className="w-full p-3 rounded-lg veto-recessed text-xs text-white font-sans focus:outline-none focus:border-amber-500"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingDraftKey(null)}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              <span>Cancel</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEdit('email', email.id)}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Save Draft</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap veto-recessed p-3.5 rounded-lg">
                          {email.draftReply.body}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: WHATSAPP DESKTOP BRIDGE */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 veto-panel rounded-xl p-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                WhatsApp Desktop Multilingual Bridge (English · Hindi · Hinglish)
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                <span>Installed App: WhatsApp.exe / WhatsApp.app</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{snapshot.whatsappThreads.length} active threads</span>
                <span aria-hidden="true">·</span>
                <span>Always asks permission before opening WhatsApp or sending</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {pendingWaApproval && (
                <button
                  type="button"
                  onClick={() => onApproveStep(pendingWaApproval.task.id, pendingWaApproval.stepId, true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Allow & Send in WhatsApp Desktop</span>
                </button>
              )}
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  onExecuteCommand(
                    'Veto, mere WhatsApp messages check karo aur batao ki koi important message aaya hai kya.'
                  )
                }
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Check WhatsApp in Hinglish</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-800 veto-panel rounded-xl overflow-hidden">
            {snapshot.whatsappThreads.map((thread) => {
              const editKey = `wa-${thread.id}`;
              const isEditingThis = editingDraftKey === editKey;
              return (
                <div key={thread.id} className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="text-sm font-semibold text-white">{thread.contactName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{thread.roleOrGroup}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-sky-400">Language: {thread.language}</span>
                      <span aria-hidden="true">·</span>
                      <span className={thread.urgency === 'urgent' ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                        {thread.urgency === 'urgent' ? 'URGENT' : 'Normal'}
                      </span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-400">
                      Unread: {thread.unreadCount} · {thread.lastTimestamp}
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {thread.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg border text-sm ${
                          msg.isOutgoing
                            ? 'bg-sky-950/30 border-sky-800/60 text-sky-100'
                            : 'veto-recessed text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span className="font-medium text-slate-300">{msg.sender}</span>
                          <span className="font-mono tabular-nums">{msg.timestamp}</span>
                        </div>
                        <p>{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  {thread.pendingReplyDraft && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-amber-400">
                          Staged Multilingual Reply Draft (Waiting for Your Permission):
                        </p>
                        {!isEditingThis && (
                          <button
                            type="button"
                            onClick={() => startEditing(editKey, thread.pendingReplyDraft!)}
                            className="text-xs text-slate-300 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Reply</span>
                          </button>
                        )}
                      </div>

                      {isEditingThis ? (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={editingDraftText}
                            onChange={(e) => setEditingDraftText(e.target.value)}
                            className="w-full p-2.5 rounded-lg veto-recessed text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingDraftKey(null)}
                              className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEdit('whatsapp', thread.id)}
                              className="px-3 py-1 bg-amber-500 text-slate-950 font-semibold rounded text-xs cursor-pointer"
                            >
                              Save Reply
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-200 veto-recessed p-3 rounded-lg border-amber-500/30">
                          {thread.pendingReplyDraft}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: INSTAGRAM CREATOR STUDIO */}
      {activeTab === 'instagram' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 veto-panel rounded-xl p-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                Instagram Creator Studio & Guided Publishing Workflow
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                <span>Source: /veto_workspace/Projects/Instagram_Campaign</span>
                <span aria-hidden="true">·</span>
                <span>Status: {snapshot.instagramDraft.status.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  onExecuteCommand(
                    'Veto, open Instagram, prepare a post using the three images in my project folder, and write a suitable caption.'
                  )
                }
                className="px-3.5 py-2 veto-recessed hover:bg-slate-800 text-slate-200 font-medium text-xs rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                Prepare Post from Folder
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onExecuteCommand('Make the Instagram caption shorter.')}
                className="px-3.5 py-2 veto-recessed hover:bg-slate-800 text-slate-200 font-medium text-xs rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                Make Caption Shorter
              </button>
              {pendingIgApproval && (
                <button
                  type="button"
                  onClick={() => onApproveStep(pendingIgApproval.task.id, pendingIgApproval.stepId, true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Allow & Publish Post</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch veto-panel rounded-xl p-5">
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {snapshot.instagramDraft.images.map((img, idx) => (
                <div
                  key={img.filename}
                  className="veto-recessed rounded-lg p-4 flex flex-col justify-between min-h-[210px]"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono tabular-nums">SLIDE 0{idx + 1}</span>
                    <span className="font-mono">{img.aspectRatio}</span>
                  </div>
                  <div className="my-3 py-4 border-y border-slate-800/80 flex flex-col items-center justify-center text-center">
                    <svg className="w-12 h-12 mb-2.5" viewBox="0 0 48 48" fill="none">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke={img.colorHex}
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        opacity="0.6"
                      />
                      <polygon
                        points="24,8 38,24 24,40 10,24"
                        stroke={img.colorHex}
                        strokeWidth="1.75"
                        fill={`${img.colorHex}22`}
                      />
                      <circle cx="24" cy="24" r="4" fill={img.colorHex} />
                    </svg>
                    <p className="text-xs font-semibold text-white">{img.captionTag}</p>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 truncate" title={img.filename}>
                    {img.filename}
                  </p>
                </div>
              ))}
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between veto-recessed rounded-lg p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-amber-400">STAGED CAPTION PREVIEW</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums">{snapshot.instagramDraft.caption.length} chars</span>
                    {editingDraftKey !== 'ig-caption' && (
                      <button
                        type="button"
                        onClick={() => startEditing('ig-caption', snapshot.instagramDraft.caption)}
                        className="text-slate-300 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>

                {editingDraftKey === 'ig-caption' ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={editingDraftText}
                      onChange={(e) => setEditingDraftText(e.target.value)}
                      className="w-full p-2.5 rounded bg-[#0C121E] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingDraftKey(null)}
                        className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit('instagram', snapshot.instagramDraft.id)}
                        className="px-3 py-1 bg-amber-500 text-slate-950 font-semibold rounded text-xs cursor-pointer"
                      >
                        Update Caption
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-100 leading-relaxed">{snapshot.instagramDraft.caption}</p>
                )}

                <p className="text-xs text-sky-400 font-mono pt-1">
                  {snapshot.instagramDraft.hashtags.join('  ')}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {snapshot.instagramDraft.status === 'published'
                    ? `Published at ${snapshot.instagramDraft.publishedAt}`
                    : `Scheduled slot: ${snapshot.instagramDraft.scheduledFor}`}
                </span>
                <span
                  className={
                    snapshot.instagramDraft.status === 'published'
                      ? 'font-semibold text-emerald-400'
                      : 'font-semibold text-amber-400'
                  }
                >
                  {snapshot.instagramDraft.status === 'published' ? 'LIVE ON FEED' : 'WAITING FOR PERMISSION'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REAL OS FILE SYSTEM & DOWNLOADS ORGANIZER */}
      {activeTab === 'filesystem' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 veto-panel rounded-xl p-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                File Explorer / Finder Bridge (/veto_workspace/Downloads & Reports)
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span className="tabular-nums">{snapshot.files.length} files on disk</span>
                <span aria-hidden="true">·</span>
                <span>Asks for your permission before moving or organizing any file</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onResetDownloads}
                className="px-3.5 py-2 veto-recessed hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Unorganized Downloads</span>
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onExecuteCommand('Veto, organize my Downloads folder into appropriate categories.')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Stage Downloads Organization (Asks Permission)</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'Unorganized', 'Documents', 'Media', 'Installers', 'Archives', 'Code & Specs'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFileFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  fileFilter === cat
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'veto-panel text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Files' : cat}
              </button>
            ))}
          </div>

          {selectedFile && (
            <div className="veto-panel rounded-xl p-4 border-sky-500/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold text-white">{selectedFile.name}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="font-mono text-slate-400">{selectedFile.path}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="font-mono text-emerald-400">SHA-256: {selectedFile.sha256Preview}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
              <pre className="p-3.5 rounded-lg veto-recessed text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedFile.previewSnippet || 'Binary or empty file verified on disk.'}
              </pre>
            </div>
          )}

          <div className="veto-panel rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Directory Path</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Size</th>
                  <th className="py-3 px-4 text-right">SHA-256 Prefix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFile?.path === file.path;
                  return (
                    <tr
                      key={file.path}
                      onClick={() => setSelectedFile(isSelected ? null : file)}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? 'bg-sky-950/30' : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-medium text-white whitespace-nowrap flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{file.name}</span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-400">{file.path}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={
                            file.category === 'Unorganized'
                              ? 'text-amber-400 font-medium'
                              : 'text-emerald-400 font-medium'
                          }
                        >
                          {file.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                        {(file.sizeBytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">
                        {file.sha256Preview}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: VERIFIED SOFTWARE INSTALLER */}
      {activeTab === 'software' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 veto-panel rounded-xl p-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                Verified Official Software Repository & Native OS Installer
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Every package is fetched exclusively from its official vendor domain, validated against SHA-256 checksums, and requires your explicit permission before launching.
              </p>
            </div>
            {pendingPkgApproval && (
              <button
                type="button"
                onClick={() => onApproveStep(pendingPkgApproval.task.id, pendingPkgApproval.stepId, true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Allow & Launch Official Installer</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snapshot.softwareCatalog.map((pkg) => (
              <div
                key={pkg.id}
                className="veto-panel rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{pkg.category}</span>
                    <span className="font-mono tabular-nums">{pkg.sizeMB} MB</span>
                  </div>
                  <h4 className="text-base font-bold text-white">
                    {pkg.name} <span className="text-xs font-mono text-amber-400 font-normal">v{pkg.version}</span>
                  </h4>
                  <p className="text-xs text-slate-300">{pkg.publisher}</p>
                  <div className="text-[11px] font-mono text-slate-400 space-y-1 pt-1">
                    <p className="truncate">Official Source: {pkg.officialUrl}</p>
                    <p className="truncate">SHA-256: {pkg.sha256}</p>
                    <p>Platforms: {pkg.supportedOS.join(' · ')}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-300">
                    Status:{' '}
                    <strong
                      className={
                        pkg.status === 'installed'
                          ? 'text-emerald-400'
                          : pkg.status === 'awaiting_admin_approval'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }
                    >
                      {pkg.status.replace(/_/g, ' ').toUpperCase()}
                    </strong>
                  </span>

                  <button
                    type="button"
                    disabled={isBusy || pkg.status === 'installed'}
                    onClick={() =>
                      onExecuteCommand(
                        `Veto, find ${pkg.name} from its official source, verify its checksum, and help me install it.`
                      )
                    }
                    className="px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 border border-amber-500/40 text-amber-300 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    {pkg.status === 'installed' ? 'Installed & Verified' : 'Ask Permission & Stage Install'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: BRIDGE PERMISSIONS & PLATFORM LIMITATIONS */}
      {activeTab === 'bridges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {snapshot.integrations.map((intg) => (
            <div key={intg.id} className="veto-panel rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{intg.category}</span>
                <span className="text-emerald-400 font-semibold uppercase">{intg.status.replace('_', ' ')}</span>
              </div>
              <h4 className="text-base font-bold text-white">{intg.name}</h4>
              <p className="text-xs text-sky-400 font-mono">{intg.authMethod}</p>
              <div className="space-y-1 pt-1">
                <p className="text-xs font-semibold text-slate-300">Supported Verified Operations:</p>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  {intg.supportedOperations.map((op) => (
                    <li key={op}>{op}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                <p>
                  <strong className="text-slate-200">Boundary & Limitation:</strong> {intg.platformLimitations}
                </p>
                <p className="font-mono text-[11px] text-slate-400">
                  Windows 11: {intg.windowsSupport} · macOS Sequoia: {intg.macosSupport}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
