import React, { useState } from 'react';
import {
  AgentTask,
  ActivityAuditEntry,
  VetoUserPreferences,
  SupportedLanguage,
  VetoVoiceName,
} from '../types/veto';
import {
  CheckCircle2,
  AlertTriangle,
  OctagonAlert,
  Play,
  Pause,
  XCircle,
  ShieldCheck,
  Search,
  Volume2,
  Trash2,
  Plus,
  Laptop,
  Sliders,
} from 'lucide-react';
import { VETO_VOICE_LINES } from '../services/voiceEngine';

interface TasksExecutionViewProps {
  tasks: AgentTask[];
  onApproveStep: (taskId: string, stepId: string, approved: boolean) => void;
  onTaskControl: (taskId: string, action: 'pause' | 'resume' | 'cancel' | 'emergency_stop') => void;
}

export const TasksExecutionView: React.FC<TasksExecutionViewProps> = ({
  tasks,
  onApproveStep,
  onTaskControl,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTasks =
    statusFilter === 'all'
      ? tasks
      : tasks.filter((t) => t.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Autonomous Task Execution & Approval Center
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Structured execution cycle: Understand → Plan → Validate → Execute → Observe → Verify → Report.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#0D131F] border border-slate-800 rounded-lg">
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'awaiting_approval', label: 'Awaiting Approval' },
              { id: 'completed', label: 'Verified Complete' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onTaskControl('all', 'emergency_stop')}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <OctagonAlert className="w-3.5 h-3.5" />
            <span>Emergency Stop All</span>
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-[#0D131F] border border-slate-800 rounded-xl p-5 space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-slate-800/80">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono tabular-nums">{task.id}</span>
                  <span aria-hidden="true">·</span>
                  <span>Language: {task.detectedLanguage}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      task.status === 'completed'
                        ? 'text-emerald-400 font-semibold'
                        : task.status === 'awaiting_approval'
                        ? 'text-amber-400 font-semibold'
                        : task.status === 'cancelled'
                        ? 'text-rose-400 font-semibold'
                        : 'text-sky-400 font-semibold'
                    }
                  >
                    Status: {task.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">“{task.userInstruction}”</h3>
                <p className="text-xs text-slate-300">{task.intentSummary}</p>
              </div>

              {/* Task Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {task.status === 'paused' ? (
                  <button
                    type="button"
                    onClick={() => onTaskControl(task.id, 'resume')}
                    className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </button>
                ) : (
                  task.status === 'awaiting_approval' && (
                    <button
                      type="button"
                      onClick={() => onTaskControl(task.id, 'pause')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </button>
                  )
                )}
                {task.status !== 'completed' && task.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => onTaskControl(task.id, 'cancel')}
                    className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Task</span>
                  </button>
                )}
              </div>
            </div>

            {/* Security Flag if Prompt Injection was quarantined */}
            {task.securityFlag?.detected && (
              <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-700/50 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-rose-300">
                    Security Shield Intervention — Untrusted Content Neutralized
                  </p>
                  <p className="text-slate-300">
                    {task.securityFlag.reason} (Source: <span className="font-mono">{task.securityFlag.source}</span>)
                  </p>
                </div>
              </div>
            )}

            {/* Sequential Steps */}
            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg bg-[#080C14]">
              {task.steps.map((step) => (
                <div key={step.id} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-amber-400 tabular-nums">
                        0{step.index}.
                      </span>
                      <span className="font-semibold text-white text-sm">{step.title}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="font-mono text-sky-400">{step.toolName}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-400">{step.targetApp}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={
                          step.riskLevel === 'high'
                            ? 'text-rose-400 font-medium'
                            : step.riskLevel === 'moderate'
                            ? 'text-amber-400 font-medium'
                            : 'text-slate-400'
                        }
                      >
                        Risk: {step.riskLevel.toUpperCase()}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span
                        className={
                          step.status === 'completed'
                            ? 'text-emerald-400 font-semibold'
                            : step.status === 'awaiting_approval'
                            ? 'text-amber-400 font-semibold'
                            : 'text-slate-400 font-semibold'
                        }
                      >
                        {step.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">{step.description}</p>

                  {step.verificationEvidence && (
                    <p className="text-xs font-mono text-emerald-400/90 pt-0.5">
                      Verified Evidence: {step.verificationEvidence}
                    </p>
                  )}

                  {/* High-Risk Approval Gate Box */}
                  {step.status === 'awaiting_approval' && step.approvalPayload && (
                    <div className="mt-3 p-4 rounded-lg bg-[#0D131F] border border-amber-500/50 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                            Explicit User Authorization Required (High-Risk Action)
                          </p>
                          <p className="text-sm font-semibold text-white mt-0.5">
                            {step.approvalPayload.summary}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onApproveStep(task.id, step.id, false)}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Deny & Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => onApproveStep(task.id, step.id, true)}
                            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Execute Now</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                        {Object.entries(step.approvalPayload.details).map(([k, v]) => (
                          <div key={k} className="space-y-0.5">
                            <span className="text-slate-400">{k.replace('_', ' ')}:</span>
                            <p className="text-slate-200 font-mono text-[11px] break-words">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {task.finalReport && (
              <div className="pt-2 text-xs text-slate-300 flex items-center justify-between gap-4">
                <span>
                  <strong className="text-white">Verification Report:</strong> {task.finalReport}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface ActivityAuditViewProps {
  activityLog: ActivityAuditEntry[];
}

export const ActivityAuditView: React.FC<ActivityAuditViewProps> = ({ activityLog }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const filtered = activityLog.filter((item) => {
    const matchesRisk = riskFilter === 'all' || item.riskLevel === riskFilter;
    const matchesSearch =
      !searchQuery ||
      item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.application.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.evidence.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Activity Center & Security Audit Ledger
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Immutable record of every action attempted, file modified, draft staged, and untrusted prompt blocked.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="pl-8 pr-3 py-1.5 bg-[#0D131F] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#0D131F] border border-slate-800 rounded-lg">
            {['all', 'low', 'moderate', 'high'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setRiskFilter(lvl)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  riskFilter === lvl
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl === 'all' ? 'All Risk Tiers' : `${lvl.toUpperCase()}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0D131F] border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Application / Bridge</th>
              <th className="py-3 px-4">Action Performed</th>
              <th className="py-3 px-4">Risk Tier</th>
              <th className="py-3 px-4">Verification Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-xs">
            {filtered.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-900/50 transition-colors">
                <td className="py-3 px-4 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                  {entry.timestamp}
                </td>
                <td className="py-3 px-4 font-medium text-sky-400 whitespace-nowrap">
                  {entry.application}
                </td>
                <td className="py-3 px-4 font-medium text-white">{entry.action}</td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span
                    className={
                      entry.status === 'blocked_security'
                        ? 'text-rose-400 font-semibold'
                        : entry.riskLevel === 'high'
                        ? 'text-amber-400 font-semibold'
                        : 'text-emerald-400 font-medium'
                    }
                  >
                    {entry.riskLevel.toUpperCase()} · {entry.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-300">{entry.evidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface MemoryAndSettingsViewProps {
  prefs: VetoUserPreferences;
  onUpdatePrefs: (updated: Partial<VetoUserPreferences>) => void;
  onPlayVoiceSample: (quote: string) => void;
  onExecuteWorkflow: (command: string) => void;
}

export const MemoryAndSettingsView: React.FC<MemoryAndSettingsViewProps> = ({
  prefs,
  onUpdatePrefs,
  onPlayVoiceSample,
  onExecuteWorkflow,
}) => {
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowCommand, setNewWorkflowCommand] = useState('');
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryValue, setNewMemoryValue] = useState('');

  const handleAddWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName.trim() || !newWorkflowCommand.trim()) return;
    const added = {
      id: `wf-${Date.now()}`,
      name: newWorkflowName.trim(),
      command: newWorkflowCommand.trim(),
      language: prefs.preferredLanguage === 'auto' ? 'Multilingual' : prefs.preferredLanguage,
    };
    onUpdatePrefs({
      savedWorkflows: [added, ...prefs.savedWorkflows],
    });
    setNewWorkflowName('');
    setNewWorkflowCommand('');
  };

  const handleAddMemoryFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryKey.trim() || !newMemoryValue.trim()) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fact = {
      id: `mem-${Date.now()}`,
      key: newMemoryKey.trim(),
      value: newMemoryValue.trim(),
      learnedAt: `Today, ${nowStr}`,
    };
    onUpdatePrefs({
      memoryFacts: [fact, ...prefs.memoryFacts],
    });
    setNewMemoryKey('');
    setNewMemoryValue('');
  };

  const handleDeleteMemory = (id: string) => {
    onUpdatePrefs({
      memoryFacts: prefs.memoryFacts.filter((m) => m.id !== id),
    });
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Multilingual, Voice Persona & Wake-Word Settings */}
      <div className="bg-[#0D131F] border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Voice Intelligence, Wake-Word ("Veto") & Multilingual Engine</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure Agent Veto’s Gemini 3.8 TTS voice persona, preferred response language (English, Hindi, Hinglish), and microphone privacy controls.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Language Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Response & Reasoning Language
            </label>
            <select
              value={prefs.preferredLanguage}
              onChange={(e) => onUpdatePrefs({ preferredLanguage: e.target.value as SupportedLanguage })}
              className="w-full px-3 py-2 bg-[#080C14] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="auto">Auto-Detect (Match Spoken/Typed Language)</option>
              <option value="en">English (Tactical Crisp)</option>
              <option value="hinglish">Hinglish (Conversational Romanized Hindi + English)</option>
              <option value="hi">Hindi (हिन्दी देवनागरी)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              Seamlessly switches between English, Hindi, and Hinglish mid-conversation.
            </p>
          </div>

          {/* Voice Persona Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Gemini 3.8 TTS Voice Persona
            </label>
            <select
              value={prefs.voiceName}
              onChange={(e) => onUpdatePrefs({ voiceName: e.target.value as VetoVoiceName })}
              className="w-full px-3 py-2 bg-[#080C14] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Fenrir">Fenrir (Deep Tactical Operative — Default Veto)</option>
              <option value="Charon">Charon (Commanding Baritone)</option>
              <option value="Puck">Puck (Energetic & Agile)</option>
              <option value="Kore">Kore (Clear Executive)</option>
              <option value="Zephyr">Zephyr (Calm & Balanced)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              Powered by server-side <span className="font-mono">gemini-3.8-flash-lite-tts</span>.
            </p>
          </div>

          {/* Speaking Speed & Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Speaking Speed ({prefs.speakingRate.toFixed(2)}x)
              </label>
              <input
                type="range"
                min={0.8}
                max={1.3}
                step={0.05}
                value={prefs.speakingRate}
                onChange={(e) => onUpdatePrefs({ speakingRate: parseFloat(e.target.value) })}
                className="w-28 accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">Auto-Speak Veto Replies</span>
              <input
                type="checkbox"
                checked={prefs.autoReadResponses}
                onChange={(e) => onUpdatePrefs({ autoReadResponses: e.target.checked })}
                className="accent-amber-400 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Reduced Interface Motion</span>
              <input
                type="checkbox"
                checked={prefs.reducedMotion}
                onChange={(e) => onUpdatePrefs({ reducedMotion: e.target.checked })}
                className="accent-amber-400 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-amber-300">
                Permission-First Mode (Ask Before Any Task)
              </span>
              <input
                type="checkbox"
                checked={prefs.strictPermissionFirst}
                onChange={(e) => onUpdatePrefs({ strictPermissionFirst: e.target.checked })}
                className="accent-amber-400 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Veto Character Voice Line Soundboard */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          <p className="text-xs font-semibold text-amber-400">
            Agent Veto Signature Voice Lines (Click to Synthesize & Play)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {VETO_VOICE_LINES.map((line) => (
              <button
                key={line.id}
                type="button"
                onClick={() => onPlayVoiceSample(line.quote)}
                className="p-3 rounded-lg bg-[#080C14] hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left space-y-1 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{line.context}</span>
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-xs font-semibold text-white">{line.label}</p>
                <p className="text-[11px] text-slate-400 line-clamp-2">“{line.quote}”</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Saved Workflows & Personalization Memory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0D131F] border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Saved One-Click Workflows</h3>
          <form onSubmit={handleAddWorkflow} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              placeholder="Workflow title (e.g. Morning Standup)"
              className="px-3 py-2 bg-[#080C14] border border-slate-800 rounded-lg text-xs text-white sm:w-44 focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              value={newWorkflowCommand}
              onChange={(e) => setNewWorkflowCommand(e.target.value)}
              placeholder="Natural language instruction for Veto..."
              className="flex-1 px-3 py-2 bg-[#080C14] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </form>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg bg-[#080C14]">
            {prefs.savedWorkflows.map((wf) => (
              <div key={wf.id} className="p-3.5 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-white">{wf.name}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-sky-400">{wf.language}</span>
                  </div>
                  <p className="text-xs text-slate-400">“{wf.command}”</p>
                </div>
                <button
                  type="button"
                  onClick={() => onExecuteWorkflow(wf.command)}
                  className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Run Workflow
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* User-Approved Memory Store */}
        <div className="bg-[#0D131F] border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Personalization Memory Vault</h3>
              <p className="text-xs text-slate-400">
                Explicitly stored preferences used to contextualize drafts and schedules.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdatePrefs({ memoryFacts: [] })}
              className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Memory</span>
            </button>
          </div>

          <form onSubmit={handleAddMemoryFact} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newMemoryKey}
              onChange={(e) => setNewMemoryKey(e.target.value)}
              placeholder="Rule / Key (e.g. Meeting Window)"
              className="px-3 py-2 bg-[#080C14] border border-slate-800 rounded-lg text-xs text-white sm:w-40 focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              value={newMemoryValue}
              onChange={(e) => setNewMemoryValue(e.target.value)}
              placeholder="Preference value for Agent Veto..."
              className="flex-1 px-3 py-2 bg-[#080C14] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg bg-[#080C14]">
            {prefs.memoryFacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Memory vault cleared. Agent Veto retains zero personal facts.
              </div>
            ) : (
              prefs.memoryFacts.map((fact) => (
                <div key={fact.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 text-xs">
                    <span className="font-semibold text-amber-400">{fact.key}:</span>{' '}
                    <span className="text-slate-200">{fact.value}</span>
                    <p className="text-[11px] font-mono text-slate-500">Recorded: {fact.learnedAt}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteMemory(fact.id)}
                    className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                    title="Delete memory item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Windows 11 & macOS Sequoia Platform Compatibility Matrix */}
      <div className="bg-[#0D131F] border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-sky-400" />
              <span>Cross-Platform OS Adapter Matrix (Windows 11 & macOS Sequoia)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Shared Rust/TypeScript core with platform-specific security, credential, and accessibility adapters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Active Target Profile:</span>
            <select
              value={prefs.targetOS}
              onChange={(e) => onUpdatePrefs({ targetOS: e.target.value as any })}
              className="px-3 py-1.5 bg-[#080C14] border border-slate-700 rounded-lg text-xs text-white font-medium"
            >
              <option value="macOS Sequoia 15.4">macOS Sequoia 15.4 (Apple Silicon / Universal)</option>
              <option value="Windows 11 Pro 24H2">Windows 11 Pro 24H2 (x64 / ARM64)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg bg-[#080C14]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                <th className="py-2.5 px-4">Subsystem</th>
                <th className="py-2.5 px-4">Windows 11 Adapter</th>
                <th className="py-2.5 px-4">macOS Sequoia Adapter</th>
                <th className="py-2.5 px-4">Permission & Security Boundary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              <tr>
                <td className="py-2.5 px-4 font-semibold text-white">Credential Vault</td>
                <td className="py-2.5 px-4 font-mono text-slate-300">Windows Credential Locker (DPAPI)</td>
                <td className="py-2.5 px-4 font-mono text-slate-300">macOS Keychain Services + Secure Enclave</td>
                <td className="py-2.5 px-4 text-emerald-400">Zero plaintext tokens on disk</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-white">UI & Window Control</td>
                <td className="py-2.5 px-4 font-mono text-slate-300">UI Automation (UIA) + Win32 API</td>
                <td className="py-2.5 px-4 font-mono text-slate-300">AXUIElement Accessibility API</td>
                <td className="py-2.5 px-4 text-emerald-400">Explicit OS Accessibility toggle required</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-white">Wake-Word ("Veto") Audio</td>
                <td className="py-2.5 px-4 font-mono text-slate-300">WASAPI Low-Latency Loop</td>
                <td className="py-2.5 px-4 font-mono text-slate-300">CoreAudio VoiceProcessingIO</td>
                <td className="py-2.5 px-4 text-emerald-400">Local wake detection + hardware mute lock</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-white">Software Installation</td>
                <td className="py-2.5 px-4 font-mono text-slate-300">WinGet / Authenticode + SmartScreen</td>
                <td className="py-2.5 px-4 font-mono text-slate-300">Notarized DMG/PKG + Gatekeeper Check</td>
                <td className="py-2.5 px-4 text-amber-400">Always prompts UAC / Touch ID elevation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
