import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  AgentVoiceState,
  ConversationTurn,
  VetoUserPreferences,
  WorkspaceSnapshot,
} from './types/veto';
import { ConnectedAppsView, ConnectedAppTab } from './components/ConnectedAppsView';
import {
  TasksExecutionView,
  ActivityAuditView,
  MemoryAndSettingsView,
} from './components/TasksAndAuditViews';
import {
  extractCommandAfterWakeWord,
  playTacticalChime,
  speakWithVetoVoice,
  stopSpeakingAudio,
} from './services/voiceEngine';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Lock,
  Terminal,
  ShieldCheck,
  Laptop,
  Download,
  XCircle,
  Smartphone,
  Activity,
  Settings,
} from 'lucide-react';

type ActiveSection = 'assistant' | 'tasks' | 'apps' | 'audit' | 'settings';

const SUGGESTED_DIRECTIVES = [
  {
    label: 'WhatsApp Check (Hinglish)',
    lang: 'ANDROID',
    command: 'Veto, mere WhatsApp messages check karo aur batao ki koi important message aaya hai kya.',
  },
  {
    label: 'Navigate on Google Maps',
    lang: 'ANDROID',
    command: 'Veto, open Google Maps and navigate to Connaught Place New Delhi.',
  },
  {
    label: 'Open Android Phone Dialer',
    lang: 'ANDROID',
    command: 'Veto, open the Android Phone Dialer and prepare a call to +919876543210.',
  },
  {
    label: 'Send SMS via Google Messages',
    lang: 'ANDROID',
    command: 'Veto, open Google Messages SMS and prepare a message that I am on my way.',
  },
  {
    label: 'Search on YouTube App',
    lang: 'ANDROID',
    command: 'Veto, open YouTube and search for autonomous AI agent tutorials.',
  },
  {
    label: 'Triage Gmail & Replies',
    lang: 'EMAIL',
    command: 'Veto, read my important emails received today, summarize them, and draft replies.',
  },
  {
    label: 'Organize Downloads Folder',
    lang: 'FILES',
    command: 'Veto, organize my Downloads folder into appropriate categories.',
  },
];

const ANDROID_QUICK_APPS = [
  {
    id: 'wa',
    name: 'WhatsApp',
    pkg: 'com.whatsapp',
    command: 'Veto, mere WhatsApp messages check karo aur batao ki koi important message aaya hai kya.',
  },
  {
    id: 'maps',
    name: 'Google Maps',
    pkg: 'com.google.android.apps.maps',
    command: 'Veto, open Google Maps and navigate to Connaught Place New Delhi.',
  },
  {
    id: 'dialer',
    name: 'Phone Dialer',
    pkg: 'com.google.android.dialer',
    command: 'Veto, open the Android Phone Dialer and prepare a call to +919876543210.',
  },
  {
    id: 'sms',
    name: 'Messages SMS',
    pkg: 'com.google.android.apps.messaging',
    command: 'Veto, open Google Messages SMS and prepare a message that I am on my way.',
  },
  {
    id: 'yt',
    name: 'YouTube',
    pkg: 'com.google.android.youtube',
    command: 'Veto, open YouTube and search for autonomous AI agent tutorials.',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    pkg: 'com.google.android.gm',
    command: 'Veto, read my important emails received today, summarize them, and draft replies.',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    pkg: 'com.spotify.music',
    command: 'Veto, open Spotify and play focus music.',
  },
  {
    id: 'files',
    name: 'Files / Downloads',
    pkg: 'com.google.android.apps.nbu.files',
    command: 'Veto, organize my Downloads folder into appropriate categories.',
  },
];

const EXECUTION_LIFECYCLE_STEPS = [
  { id: 'understand', label: '1. UNDERSTAND' },
  { id: 'plan', label: '2. PLAN' },
  { id: 'permission', label: '3. ASK PERMISSION' },
  { id: 'execute', label: '4. RUN ON PC' },
  { id: 'verify', label: '5. VERIFY' },
];

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('assistant');
  const [connectedAppTab, setConnectedAppTab] = useState<ConnectedAppTab>('pc_programs');
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [voiceState, setVoiceState] = useState<AgentVoiceState>('idle');
  const [audioAmplitude, setAudioAmplitude] = useState<number>(0);
  const [inputCommand, setInputCommand] = useState<string>('');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [localBridgeOnline, setLocalBridgeOnline] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  const { isInstallable, isInstalled, install } = usePWAInstall();

  const [prefs, setPrefs] = useState<VetoUserPreferences>({
    preferredLanguage: 'auto',
    voiceName: 'Fenrir',
    speakingRate: 1.0,
    wakeWordEnabled: false,
    wakeWordSensitivity: 0.8,
    microphonePrivacyLock: false,
    autoReadResponses: true,
    reducedMotion: false,
    strictPermissionFirst: true,
    targetOS: 'Windows 11 Pro 24H2',
    permissionPolicy: {
      lowRisk: 'always_require_approval',
      moderateRisk: 'always_require_approval',
      highRisk: 'always_require_approval',
    },
    savedWorkflows: [
      {
        id: 'wf-1',
        name: 'Launch VS Code & Open Workspace',
        command: 'Veto, open Visual Studio Code on my computer and load my workspace.',
        language: 'English',
      },
      {
        id: 'wf-2',
        name: 'Hinglish Urgent WhatsApp Triage',
        command: 'Veto, mere WhatsApp messages check karo aur batao ki koi urgent message hai kya.',
        language: 'Hinglish',
      },
      {
        id: 'wf-3',
        name: 'Downloads Folder Cleanup (File Explorer)',
        command: 'Veto, organize my Downloads folder into appropriate categories.',
        language: 'English',
      },
    ],
    memoryFacts: [
      {
        id: 'mem-1',
        key: 'Strict Permission-First Rule',
        value: 'Always ask for explicit user permission before performing any action or launching any program on the host PC.',
        learnedAt: 'Active Policy',
      },
      {
        id: 'mem-2',
        key: 'Preferred Bilingual Style',
        value: 'Respond in natural Hinglish when addressed in Romanized Hindi; keep technical terms in English.',
        learnedAt: 'Active Policy',
      },
    ],
  });

  const [conversation, setConversation] = useState<ConversationTurn[]>([
    {
      id: 'turn-welcome',
      role: 'veto',
      text: 'On y croit! Agent Veto online in Strict Permission-First Mode.\n\nI am connected to the programs installed on your PC (Visual Studio Code, File Explorer / Finder, Notepad / TextEdit, Chrome, WhatsApp Desktop, Outlook / Mail, Calculator, Terminal, Spotify). I will NEVER perform any task or launch any program without asking for your permission first. What are we running today?',
      language: 'English',
      timestamp: '10:30 AM',
      voiceLineQuote: 'Permission first. You hold the final veto on every action.',
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const commandCaptureTimeoutRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const isBusyRef = useRef<boolean>(false);
  const conversationRef = useRef<ConversationTurn[]>(conversation);
  const prefsRef = useRef<VetoUserPreferences>(prefs);

  useEffect(() => {
    isBusyRef.current = isBusy;
  }, [isBusy]);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  // Check if the user has the Local PC Companion Bridge running on http://127.0.0.1:4789
  useEffect(() => {
    let mounted = true;
    const checkBridge = async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1200);
        const res = await fetch('http://127.0.0.1:4789/status', { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok && mounted) {
          setLocalBridgeOnline(true);
        }
      } catch {
        if (mounted) setLocalBridgeOnline(false);
      }
    };
    checkBridge();
    const interval = window.setInterval(checkBridge, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch initial workspace state
  const fetchWorkspace = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace');
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data);
      }
    } catch (err) {
      console.error('Failed to load workspace snapshot:', err);
    }
  }, []);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [conversation]);

  const handleUpdatePrefs = (updated: Partial<VetoUserPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...updated };
      if (next.microphonePrivacyLock) {
        next.wakeWordEnabled = false;
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // ignore
          }
        }
        setVoiceState('idle');
      }
      return next;
    });
  };

  const triggerSpeak = useCallback(async (text: string) => {
    const currentPrefs = prefsRef.current;
    await speakWithVetoVoice(
      text,
      currentPrefs.voiceName,
      currentPrefs.speakingRate,
      () => setVoiceState('speaking'),
      () => {
        setVoiceState((prev) =>
          prev === 'speaking'
            ? prefsRef.current.wakeWordEnabled && !prefsRef.current.microphonePrivacyLock
              ? 'wake_listening'
              : 'idle'
            : prev
        );
      },
      (amp) => setAudioAmplitude(amp)
    );
  }, []);

  // Stable command execution handler (always stages task and asks permission first!)
  const executeCommand = useCallback(
    async (instructionText: string) => {
      const trimmed = instructionText.trim();
      if (!trimmed || isBusyRef.current) return;

      const currentPrefs = prefsRef.current;
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userTurn: ConversationTurn = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmed,
        language: currentPrefs.preferredLanguage === 'auto' ? 'Auto' : currentPrefs.preferredLanguage,
        timestamp: nowStr,
      };

      setConversation((prev) => [...prev, userTurn]);
      setInputCommand('');
      setLiveTranscript('');
      setIsBusy(true);
      isBusyRef.current = true;
      setVoiceState('processing');
      playTacticalChime('confirm');

      try {
        const res = await fetch('/api/veto/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instruction: trimmed,
            preferredLanguage: currentPrefs.preferredLanguage,
            conversationHistory: conversationRef.current.slice(-6),
          }),
        });

        const data = await res.json();
        if (data.snapshot) {
          setSnapshot(data.snapshot);
        }

        const hasPendingApproval = data.task?.status === 'awaiting_approval';
        setVoiceState(hasPendingApproval ? 'awaiting_approval' : 'executing');

        const vetoTurn: ConversationTurn = {
          id: `veto-${Date.now()}`,
          role: 'veto',
          text: data.reply || 'Task plan staged. Waiting for your permission before executing.',
          language: data.detectedLanguage || 'English',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          taskId: data.task?.id,
          voiceLineQuote: data.tacticalQuote,
        };

        setConversation((prev) => [...prev, vetoTurn]);

        if (prefsRef.current.autoReadResponses && data.reply) {
          await triggerSpeak(data.reply);
        } else {
          playTacticalChime(hasPendingApproval ? 'wake' : 'complete');
          setVoiceState(
            hasPendingApproval
              ? 'awaiting_approval'
              : prefsRef.current.wakeWordEnabled && !prefsRef.current.microphonePrivacyLock
              ? 'wake_listening'
              : 'idle'
          );
        }
      } catch (err) {
        console.error('Command execution error:', err);
        setVoiceState('idle');
      } finally {
        setIsBusy(false);
        isBusyRef.current = false;
      }
    },
    [triggerSpeak]
  );

  // Invoke the actual host PC program after user grants explicit permission
  const triggerHostPCProgramAfterApproval = async (clientLaunchAction: any) => {
    if (!clientLaunchAction) return;

    // 1. Try dispatching to the Local PC Companion Bridge (http://127.0.0.1:4789) if running on user's PC
    if (clientLaunchAction.localBridgeCommand) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);
        const bridgeRes = await fetch('http://127.0.0.1:4789/execute-approved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientLaunchAction.localBridgeCommand),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (bridgeRes.ok) {
          setLocalBridgeOnline(true);
          return;
        }
      } catch {
        // Fallback to native OS URI protocol or file download below
      }
    }

    // 2. If it's a Notepad/TextEdit note creation and Local Bridge isn't running, trigger a clean .txt/.md download so the OS opens it in Notepad/TextEdit
    const cmd = clientLaunchAction.localBridgeCommand;
    if (cmd && (cmd.programId === 'prog-notepad' || cmd.action === 'write_and_open_note') && cmd.content) {
      const blob = new Blob([cmd.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cmd.filename || 'Agent_Veto_Note.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // 3. Trigger native OS protocol URI (vscode://, whatsapp://, mailto:, calculator://, spotify:) via anchor click
    if (clientLaunchAction.protocolUri && !clientLaunchAction.protocolUri.startsWith('http')) {
      const a = document.createElement('a');
      a.href = clientLaunchAction.protocolUri;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Approve or Reject Permission-First Step
  const handleApproveStep = async (taskId: string, stepId: string, approved: boolean) => {
    try {
      const res = await fetch('/api/veto/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, stepId, approved }),
      });
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data.snapshot);
        playTacticalChime(approved ? 'complete' : 'alert');

        if (approved && data.clientLaunchAction) {
          await triggerHostPCProgramAfterApproval(data.clientLaunchAction);
        }

        const updatedStep = data.task?.steps?.find((s: any) => s.id === stepId);
        const confirmText = approved
          ? `Permission granted. Executed "${updatedStep?.title || 'Task'}" using ${updatedStep?.targetApp || 'Host PC Program'}.\nVerification: ${updatedStep?.verificationEvidence || 'Completed and verified.'}`
          : `Permission denied for "${updatedStep?.title || 'Task'}". Halted immediately—no programs were launched or modified on your PC.`;

        setConversation((prev) => [
          ...prev,
          {
            id: `veto-app-${Date.now()}`,
            role: 'veto',
            text: confirmText,
            language: 'English',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            taskId,
            voiceLineQuote: approved
              ? 'Permission confirmed. Executed with precision.'
              : 'Your PC, your rules. Action blocked.',
          },
        ]);
        if (prefs.autoReadResponses) {
          await triggerSpeak(confirmText);
        } else {
          setVoiceState(prefs.wakeWordEnabled ? 'wake_listening' : 'idle');
        }
      }
    } catch (err) {
      console.error('Approval error:', err);
    }
  };

  const handleUpdateDraft = async (
    targetType: 'email' | 'whatsapp' | 'instagram',
    targetId: string,
    newText: string
  ) => {
    try {
      const res = await fetch('/api/veto/update-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, newText }),
      });
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data.snapshot);
        playTacticalChime('confirm');
      }
    } catch (err) {
      console.error('Draft update error:', err);
    }
  };

  const handleUpdateInstalledProgram = async (payload: any) => {
    try {
      const res = await fetch('/api/veto/installed-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data.snapshot);
        playTacticalChime('confirm');
      }
    } catch (err) {
      console.error('Installed program update error:', err);
    }
  };

  const handleTaskControl = async (
    taskId: string,
    action: 'pause' | 'resume' | 'cancel' | 'emergency_stop'
  ) => {
    try {
      const res = await fetch('/api/veto/task-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, action }),
      });
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data.snapshot);
        if (action === 'emergency_stop') {
          stopSpeakingAudio();
          playTacticalChime('alert');
          setVoiceState('idle');
        }
      }
    } catch (err) {
      console.error('Task control error:', err);
    }
  };

  const handleResetDownloads = async () => {
    try {
      const res = await fetch('/api/workspace/reset-downloads', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data);
        playTacticalChime('confirm');
      }
    } catch (err) {
      console.error('Reset downloads error:', err);
    }
  };

  // Continuous Local Wake-Word ("Veto") & Voice Recognition Pipeline
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (!prefs.wakeWordEnabled || prefs.microphonePrivacyLock) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      return;
    }

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = prefs.preferredLanguage === 'hi' ? 'hi-IN' : 'en-IN';
    recognitionRef.current = recognition;

    let awaitingPostWakeCommand = false;

    recognition.onstart = () => {
      setVoiceState((prev) => (prev === 'idle' ? 'wake_listening' : prev));
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      const combined = (finalTranscript || interim).trim();
      if (combined) {
        setLiveTranscript(combined);
        setAudioAmplitude(0.45 + Math.random() * 0.4);
      }

      if (finalTranscript) {
        const { wakeDetected, commandRemainder } = extractCommandAfterWakeWord(finalTranscript);

        if (wakeDetected) {
          playTacticalChime('wake');
          if (commandRemainder.length > 3) {
            awaitingPostWakeCommand = false;
            executeCommand(commandRemainder);
          } else {
            awaitingPostWakeCommand = true;
            setVoiceState('command_capturing');
            setLiveTranscript('Wake word "Veto" recognized — speak your command...');
            if (commandCaptureTimeoutRef.current) clearTimeout(commandCaptureTimeoutRef.current);
            commandCaptureTimeoutRef.current = window.setTimeout(() => {
              awaitingPostWakeCommand = false;
              setVoiceState('wake_listening');
            }, 9000);
          }
        } else if (awaitingPostWakeCommand && finalTranscript.trim().length > 2) {
          awaitingPostWakeCommand = false;
          if (commandCaptureTimeoutRef.current) clearTimeout(commandCaptureTimeoutRef.current);
          executeCommand(finalTranscript.trim());
        }
        setTimeout(() => setAudioAmplitude(0), 300);
      }
    };

    recognition.onerror = () => {
      setAudioAmplitude(0);
    };

    recognition.onend = () => {
      if (prefsRef.current.wakeWordEnabled && !prefsRef.current.microphonePrivacyLock) {
        try {
          recognition.start();
        } catch {
          // ignore
        }
      }
    };

    try {
      recognition.start();
    } catch {
      // ignore
    }

    return () => {
      if (commandCaptureTimeoutRef.current) clearTimeout(commandCaptureTimeoutRef.current);
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }, [prefs.wakeWordEnabled, prefs.microphonePrivacyLock, prefs.preferredLanguage, executeCommand]);

  // Manual Push-to-Talk Activation
  const triggerPushToTalk = useCallback(async () => {
    if (prefs.microphonePrivacyLock) return;

    if (voiceState === 'command_capturing') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setVoiceState(prefs.wakeWordEnabled ? 'wake_listening' : 'idle');
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      playTacticalChime('wake');
      setVoiceState('command_capturing');
      setLiveTranscript('Listening... Speak your command in English, Hindi, or Hinglish.');

      const singleRec = new SpeechRec();
      singleRec.continuous = false;
      singleRec.interimResults = true;
      singleRec.lang = prefs.preferredLanguage === 'hi' ? 'hi-IN' : 'en-IN';

      singleRec.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join(' ');
        setLiveTranscript(text);
        setAudioAmplitude(0.55);
        if (event.results[0].isFinal) {
          setAudioAmplitude(0);
          const { wakeDetected, commandRemainder } = extractCommandAfterWakeWord(text);
          const cleanCmd = wakeDetected && commandRemainder ? commandRemainder : text;
          if (cleanCmd.trim()) {
            executeCommand(cleanCmd.trim());
          }
        }
      };

      singleRec.onerror = () => {
        setAudioAmplitude(0);
        setVoiceState(prefs.wakeWordEnabled ? 'wake_listening' : 'idle');
      };

      try {
        singleRec.start();
        return;
      } catch {
        // Fall through to MediaRecorder fallback
      }
    }

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        playTacticalChime('wake');
        setVoiceState('command_capturing');
        setLiveTranscript('Recording voice command (click again to finish)...');

        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        const chunks: BlobPart[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = String(reader.result || '').split(',')[1];
            if (!base64) return;
            setVoiceState('processing');
            setLiveTranscript('Transcribing via Gemini 3.5 Transcribe...');
            try {
              const res = await fetch('/api/veto/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64, mimeType: blob.type || 'audio/webm' }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.transcript) {
                  executeCommand(data.transcript);
                  return;
                }
              }
            } catch {
              // ignore
            }
            setVoiceState('idle');
          };
          reader.readAsDataURL(blob);
        };

        recorder.start();
        setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop();
        }, 4500);
        return;
      } catch {
        // Focus input bar if microphone permission denied
      }
    }

    playTacticalChime('wake');
    const inputEl = document.getElementById('veto-command-input');
    inputEl?.focus();
  }, [prefs.microphonePrivacyLock, prefs.wakeWordEnabled, prefs.preferredLanguage, voiceState, executeCommand]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        triggerPushToTalk();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerPushToTalk]);

  const pendingTasks = snapshot?.tasks.filter((t) => t.status === 'awaiting_approval') || [];
  const pendingApprovalsCount = pendingTasks.length;
  const activePendingTask = pendingTasks[0];
  const activePendingStep = activePendingTask?.steps.find((s) => s.status === 'awaiting_approval');

  return (
    /* MOBILE-FIRST FIX 1: Use min-h-[100dvh] and overflow-x-hidden instead of 100vh to prevent clipping by mobile browser URL bars */
    <div className="min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden text-slate-100 flex flex-col">
      {/* STRICT 3-ZONE TOP BAR CONTRACT + Safe-Area Top Inset for Notches/Dynamic Island */}
      <header className="safe-area-header flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3 border-b border-slate-800/90 bg-[#070A11]/95 backdrop-blur-md sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark (48px min touch height) */}
        <a
          href="#assistant"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('assistant');
          }}
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 min-h-[48px] flex items-center"
        >
          Agent Veto
        </a>

        {/* Zone 2: 5 concise single-line text navigation links (Desktop >= 768px) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400 min-w-0">
          {[
            { id: 'assistant', label: 'Assistant' },
            {
              id: 'tasks',
              label: pendingApprovalsCount > 0 ? `Permissions (${pendingApprovalsCount})` : 'Permissions & Tasks',
            },
            { id: 'apps', label: 'PC Programs & Install' },
            { id: 'audit', label: 'Activity Audit' },
            { id: 'settings', label: 'Memory & Settings' },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveSection(item.id as ActiveSection);
              }}
              className={`transition-colors whitespace-nowrap shrink-0 min-h-[48px] flex items-center ${
                activeSection === item.id
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'hover:text-white'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 primary action (48x48px minimum touch target) */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setShowInstallModal(true)}
            className="min-h-[48px] px-4 py-2.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 gpu-transition whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center"
          >
            {isInstalled ? 'Companion Setup' : 'Install App'}
          </button>
        </div>
      </header>

      {/* ANDROID SLIDE-UP BOTTOM SHEET / INSTALL MODAL (Pattern 3: rounded-t-3xl with grab handle bar) */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto momentum-scroll">
          <div className="veto-panel rounded-t-3xl sm:rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 border-amber-500/40 min-w-0">
            {/* Android Bottom Sheet Drag Handle Affordance */}
            <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto sm:hidden" />

            <div className="flex items-start justify-between gap-4 min-w-0">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                  Android Mobile (WebAPK + Native Intents) & Desktop PC
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                  Install Agent Veto on Android & PC
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="min-h-[48px] min-w-[48px] px-3 text-slate-400 hover:text-white text-xs font-medium cursor-pointer flex items-center justify-center rounded-xl hover:bg-slate-800/60 shrink-0"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              {/* Step 1: Android Home Screen / Standalone App */}
              <div className="veto-recessed rounded-2xl p-4 space-y-2.5 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-white text-sm">
                    1. Install on Android Home Screen (Standalone App)
                  </span>
                  <span className="font-mono text-emerald-400 text-[11px]">WebAPK / PWA Ready</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Install Agent Veto onto your Android Home Screen & App Drawer in full-screen standalone mode. It works directly with your installed Android apps (WhatsApp, Google Maps, Phone Dialer, SMS, YouTube, Gmail, Spotify) and asks permission before every action.
                </p>
                {isInstallable && !isInstalled ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await install();
                      setShowInstallModal(false);
                    }}
                    className="w-full min-h-[48px] py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer gpu-transition"
                  >
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>Tap to Install on Android Now</span>
                  </button>
                ) : (
                  <p className="text-amber-300 font-medium bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 leading-relaxed">
                    <strong>Android Chrome:</strong> Tap the browser menu (<strong>⋮</strong>) in the top right and select <strong>Install App</strong> or <strong>Add to Home Screen</strong>.<br />
                    <strong>Native APK Build:</strong> Run <span className="font-mono text-sky-300">npx cap open android</span> using the included <span className="font-mono text-sky-300">capacitor.config.ts</span>.
                  </p>
                )}
              </div>

              {/* Step 2: Optional Desktop PC Companion */}
              <div className="veto-recessed rounded-2xl p-4 space-y-3 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-white text-sm">
                    2. Connect Windows / macOS Desktop Programs
                  </span>
                  <span className="font-mono text-amber-400 text-[11px]">
                    {localBridgeOnline ? 'Connected (Port 4789)' : '1-Click PC Script'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <a
                    href="/api/pc-agent/install-windows.bat"
                    download="Install-Agent-Veto-PC.bat"
                    className="min-h-[48px] py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 text-center cursor-pointer gpu-transition"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Windows PC Installer (.bat)</span>
                  </a>
                  <a
                    href="/api/pc-agent/install-mac-linux.sh"
                    download="install-agent-veto-pc.sh"
                    className="min-h-[48px] py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-center cursor-pointer gpu-transition"
                  >
                    <Download className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>macOS / Linux Installer (.sh)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN WORKSPACE CONTAINER:
          MOBILE-FIRST FIX 2: Added pb-24 on mobile so the sticky bottom navigation bar never overlaps content,
          and min-w-0 so flex/grid children never overflow horizontally. */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-3.5 sm:px-6 pt-3.5 sm:pt-6 pb-24 md:pb-8 space-y-5 min-w-0">
        {/* ANDROID PERMISSION PROMPT BANNER / SHEET WHENEVER ANY TASK AWAITS USER APPROVAL */}
        {activePendingTask && activePendingStep && (
          <div className="veto-panel rounded-2xl p-4 border-2 border-amber-500/80 bg-amber-950/25 flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="font-bold text-amber-400 uppercase tracking-wider">
                  Android & Device Permission Required
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-amber-300">
                  Target App: {activePendingStep.approvalPayload?.programName || activePendingStep.targetApp}
                </span>
                {activePendingStep.approvalPayload?.osCommandPreview && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-sky-300 break-all">
                      {activePendingStep.approvalPayload.osCommandPreview}
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm font-bold text-white">
                {activePendingStep.approvalPayload?.summary || activePendingStep.title}
              </p>
              <p className="text-xs text-slate-300">
                Agent Veto paused before launching the app on your device. Tap Allow to open and run.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleApproveStep(activePendingTask.id, activePendingStep.id, false)}
                className="min-h-[48px] px-4 py-2.5 bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/50 text-slate-200 hover:text-rose-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer gpu-transition"
              >
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Deny</span>
              </button>
              <button
                type="button"
                onClick={() => handleApproveStep(activePendingTask.id, activePendingStep.id, true)}
                className="min-h-[48px] px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg gpu-transition"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Allow & Open App</span>
              </button>
            </div>
          </div>
        )}

        {activeSection === 'assistant' && (
          <div className="space-y-5 min-w-0">
            {/* ANDROID INSTALLED APPS QUICK-LAUNCH DRAWER STRIP (One-Thumb Tap -> Permission Prompt -> Launch on Android) */}
            <div className="veto-panel rounded-2xl p-3.5 sm:p-4 space-y-2.5 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Installed Android & Device Apps (Tap Any App to Request Permission & Launch)</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-400">
                  Permission-First Intent Bridge
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto momentum-scroll pb-1">
                {ANDROID_QUICK_APPS.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    disabled={isBusy}
                    onClick={() => executeCommand(app.command)}
                    className="min-h-[48px] px-3.5 py-2 veto-recessed hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 rounded-xl flex flex-col items-start justify-center whitespace-nowrap shrink-0 cursor-pointer gpu-transition"
                  >
                    <span className="text-xs font-bold text-white">{app.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{app.pkg}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Top 2-Column Split: Responsive CSS Grid with min-w-0 on both columns to eliminate overlaps */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-w-0">
              {/* Left Column: 2D Agent Veto Identity + Acoustic Equalizer + PC Installer & Wake-Word Deck */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4 min-w-0">
                <div className="veto-panel rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 flex-1 min-w-0">
                  {/* Top Identity Row with Bespoke 2D Vector Crest */}
                  <div className="flex items-start justify-between gap-4 min-w-0">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-amber-400 tracking-wider uppercase">
                          AGENT VETO · PERMISSION-FIRST AGENT
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Works with your programs. Always asks permission first.
                      </h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Installable on any mobile phone or desktop PC. Connects to VS Code, File Explorer, Notepad, Chrome, WhatsApp, Outlook & Calculator—and prompts you before every action.
                      </p>
                    </div>

                    {/* Bespoke 2D SVG Tactical Veto Emblem */}
                    <div className="w-14 h-14 rounded-xl veto-recessed flex items-center justify-center shrink-0">
                      <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none">
                        <circle
                          cx="32"
                          cy="32"
                          r="27"
                          stroke="#F59E0B"
                          strokeWidth="1.5"
                          strokeDasharray="5 3"
                          opacity={voiceState === 'idle' ? '0.45' : '0.9'}
                        />
                        <polygon
                          points="32,8 54,24 46,52 18,52 10,24"
                          stroke="#38BDF8"
                          strokeWidth="1.5"
                          fill="rgba(14, 165, 233, 0.08)"
                        />
                        <path
                          d="M21 22L32 45L43 22"
                          stroke="#F59E0B"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Permission-First Execution Lifecycle Stepper */}
                  <div className="veto-recessed rounded-lg p-3 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">PERMISSION-FIRST EXECUTION CYCLE</span>
                      <span className="font-mono text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        Ask Before Every Task
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 sm:gap-1.5 text-center">
                      {EXECUTION_LIFECYCLE_STEPS.map((st, idx) => {
                        const isHighlighted =
                          (voiceState === 'processing' && idx <= 1) ||
                          ((voiceState === 'awaiting_approval' || pendingApprovalsCount > 0) && idx === 2) ||
                          (voiceState === 'executing' && idx >= 3);
                        return (
                          <div
                            key={st.id}
                            className={`py-1.5 px-1 rounded text-[10px] font-mono font-semibold border truncate ${
                              isHighlighted
                                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                                : 'bg-[#0C121E] border-slate-800/90 text-slate-400'
                            }`}
                          >
                            {st.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2D Acoustic Voice Equalizer & Status Readout
                      MOBILE-FIRST FIX 3: 60 FPS GPU-accelerated transform: scaleY() and opacity instead of layout-thrashing height % */}
                  <div className="veto-recessed rounded-lg p-4 space-y-3 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-200">
                        {voiceState === 'idle' && 'Standby · Ready for Voice or Text Directive'}
                        {voiceState === 'wake_listening' && 'Wake-Word Engine Active ("Veto")'}
                        {voiceState === 'command_capturing' && 'Capturing Spoken Directive...'}
                        {voiceState === 'processing' && 'Staging Plan & Preparing Permission Prompt...'}
                        {voiceState === 'executing' && 'Running Approved Program Action...'}
                        {voiceState === 'speaking' && 'Agent Veto Speaking...'}
                        {voiceState === 'awaiting_approval' && 'Paused — Waiting for Your Permission'}
                      </span>
                      <span className="font-mono tabular-nums text-sky-400">
                        {prefs.voiceName} · {(audioAmplitude * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="h-11 flex items-center justify-between gap-1 px-2.5 bg-[#0C121E] rounded border border-slate-800/80 overflow-hidden">
                      {Array.from({ length: 28 }).map((_, i) => {
                        const scaleRatio =
                          voiceState === 'speaking' || voiceState === 'command_capturing'
                            ? Math.max(0.16, Math.min(0.95, ((Math.sin(i * 0.65) + 1) * 28 + audioAmplitude * 58) / 100))
                            : voiceState === 'processing'
                            ? (35 + Math.sin(i * 0.5) * 18) / 100
                            : 0.18;
                        return (
                          <div
                            key={i}
                            className={`flex-1 h-full rounded-sm gpu-transition origin-center ${
                              voiceState === 'command_capturing'
                                ? 'bg-sky-400'
                                : voiceState === 'awaiting_approval'
                                ? 'bg-amber-400'
                                : 'bg-amber-400/85'
                            }`}
                            style={{
                              transform: `scaleY(${scaleRatio.toFixed(2)})`,
                              opacity: voiceState === 'idle' ? 0.3 : 0.92,
                            }}
                          />
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={triggerPushToTalk}
                        disabled={prefs.microphonePrivacyLock}
                        className="min-h-[48px] px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer gpu-transition"
                      >
                        <Mic className="w-4 h-4 shrink-0" />
                        <span>
                          {voiceState === 'command_capturing' ? 'Stop Listening' : 'Voice Command (Alt+V)'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          triggerSpeak(
                            'On y croit! I am connected to your computer programs and I will always ask your permission before executing any task.'
                          )
                        }
                        className="min-h-[48px] px-3.5 py-2.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 rounded-lg text-xs font-medium text-sky-300 flex items-center justify-center gap-1.5 cursor-pointer gpu-transition"
                      >
                        <Volume2 className="w-4 h-4 shrink-0" />
                        <span>Audition Veto Voice</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick 1-Click PC Installer & Wake-Word Deck (48x48px touch targets) */}
                <div className="veto-panel rounded-xl p-4 space-y-3 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white">
                        1-Click Setup & Wake-Word (“Veto”)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Install on Mobile/PC or enable continuous “Veto” wake-word listening.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={prefs.microphonePrivacyLock}
                        onClick={() =>
                          handleUpdatePrefs({ wakeWordEnabled: !prefs.wakeWordEnabled })
                        }
                        className={`min-h-[48px] px-3.5 py-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer gpu-transition ${
                          prefs.wakeWordEnabled && !prefs.microphonePrivacyLock
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'veto-recessed text-slate-300 hover:text-white disabled:opacity-40'
                        }`}
                      >
                        <Mic className="w-4 h-4 shrink-0" />
                        <span>
                          {prefs.wakeWordEnabled ? 'Wake-Word: ON' : 'Wake-Word: OFF'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdatePrefs({
                            microphonePrivacyLock: !prefs.microphonePrivacyLock,
                          })
                        }
                        className={`min-h-[48px] min-w-[48px] px-3 py-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer gpu-transition ${
                          prefs.microphonePrivacyLock
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : 'veto-recessed text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {prefs.microphonePrivacyLock ? <MicOff className="w-4 h-4 shrink-0" /> : <Lock className="w-4 h-4 shrink-0" />}
                        <span>{prefs.microphonePrivacyLock ? 'Locked' : 'Lock'}</span>
                      </button>
                    </div>
                  </div>

                  {liveTranscript && (
                    <div className="px-3 py-2 rounded-lg veto-recessed border-sky-500/40 text-xs text-sky-300 font-mono">
                      Voice Stream: “{liveTranscript}”
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href="/api/pc-agent/install-windows.bat"
                      download="Install-Agent-Veto-PC.bat"
                      className="min-h-[48px] px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-lg text-xs font-semibold text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer gpu-transition"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>PC Installer (.bat)</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setConnectedAppTab('pc_programs');
                        setActiveSection('apps');
                      }}
                      className="min-h-[48px] px-3 py-2 veto-recessed hover:bg-slate-800 rounded-lg text-xs font-medium text-sky-300 flex items-center justify-center gap-1.5 cursor-pointer gpu-transition"
                    >
                      <Laptop className="w-4 h-4 shrink-0" />
                      <span>View 9 PC Programs</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Conversational Command & Permission-First Stream
                  MOBILE-FIRST FIX 4: Replaced rigid h-[600px] with flexible min-h-[420px] flex-1 min-w-0 and dynamic dvh scroll container */}
              <div className="lg:col-span-7 flex flex-col justify-between veto-panel rounded-xl overflow-hidden min-h-[420px] flex-1 min-w-0">
                {/* Stream Header */}
                <div className="px-4 sm:px-5 py-3 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 min-w-0">
                    <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-semibold text-white">
                      Permission-First Command Stream
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400 font-medium">Ask Before Every Task</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      stopSpeakingAudio();
                      setVoiceState(prefs.wakeWordEnabled ? 'wake_listening' : 'idle');
                    }}
                    className="min-h-[44px] px-3 py-1.5 veto-recessed hover:bg-slate-800 rounded-lg text-xs text-slate-400 hover:text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer gpu-transition"
                  >
                    <VolumeX className="w-3.5 h-3.5 shrink-0" />
                    <span>Silence Audio</span>
                  </button>
                </div>

                {/* Conversation & Inline Task Execution Plan History (Smooth Momentum Scrolling + Dynamic dvh) */}
                <div className="flex-1 overflow-y-auto momentum-scroll p-4 sm:p-5 space-y-4 max-h-[50dvh] lg:max-h-[430px] min-w-0">
                  {conversation.map((turn) => {
                    const linkedTask = turn.taskId
                      ? snapshot?.tasks.find((t) => t.id === turn.taskId)
                      : undefined;

                    return (
                      <div
                        key={turn.id}
                        className={`space-y-2.5 min-w-0 ${
                          turn.role === 'user' ? 'pl-4 sm:pl-8' : 'pr-2 sm:pr-4'
                        }`}
                      >
                        <div
                          className={`p-3.5 sm:p-4 rounded-xl border min-w-0 ${
                            turn.role === 'user'
                              ? 'bg-sky-950/30 border-sky-800/60 text-slate-100'
                              : 'veto-recessed text-slate-100'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 mb-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={
                                  turn.role === 'veto'
                                    ? 'font-bold text-amber-400'
                                    : 'font-semibold text-sky-400'
                                }
                              >
                                {turn.role === 'veto' ? 'AGENT VETO' : 'YOU'}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{turn.language}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{turn.timestamp}</span>
                            </div>

                            {turn.role === 'veto' && (
                              <button
                                type="button"
                                onClick={() => triggerSpeak(turn.text)}
                                className="min-h-[36px] px-2 text-slate-400 hover:text-amber-400 flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <Volume2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Speak</span>
                              </button>
                            )}
                          </div>

                          <p className="text-sm leading-relaxed whitespace-pre-line">{turn.text}</p>

                          {turn.voiceLineQuote && (
                            <p className="text-xs text-slate-400 italic mt-2 pt-2 border-t border-slate-800/70">
                              “{turn.voiceLineQuote}”
                            </p>
                          )}

                          {/* Inline Execution Plan & Permission Prompt if linkedTask exists */}
                          {linkedTask && (
                            <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="font-semibold text-slate-300">
                                  Host PC Execution Plan ({linkedTask.steps.length} Steps)
                                </span>
                                <span
                                  className={
                                    linkedTask.status === 'completed'
                                      ? 'font-mono text-emerald-400 font-semibold'
                                      : linkedTask.status === 'awaiting_approval'
                                      ? 'font-mono text-amber-400 font-semibold'
                                      : 'font-mono text-rose-400'
                                  }
                                >
                                  {linkedTask.status === 'awaiting_approval'
                                    ? 'WAITING FOR YOUR PERMISSION'
                                    : linkedTask.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>

                              {linkedTask.securityFlag?.detected && (
                                <div className="p-2.5 rounded bg-rose-950/40 border border-rose-700/50 flex items-center gap-2 text-xs text-rose-300">
                                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                                  <span>{linkedTask.securityFlag.reason}</span>
                                </div>
                              )}

                              <div className="space-y-1.5 min-w-0">
                                {linkedTask.steps.map((s) => (
                                  <div
                                    key={s.id}
                                    className="px-3 py-2.5 rounded bg-[#0C121E] border border-slate-800/80 text-xs space-y-2 min-w-0"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="font-medium text-slate-200">
                                        0{s.index}. {s.title}
                                      </span>
                                      <span
                                        className={
                                          s.status === 'completed'
                                            ? 'text-emerald-400 font-mono'
                                            : s.status === 'awaiting_approval'
                                            ? 'text-amber-400 font-mono font-semibold'
                                            : 'text-slate-400 font-mono'
                                        }
                                      >
                                        {s.status.replace('_', ' ').toUpperCase()}
                                      </span>
                                    </div>

                                    {s.verificationEvidence && (
                                      <p className="text-[11px] font-mono text-slate-400">
                                        {s.verificationEvidence}
                                      </p>
                                    )}

                                    {s.status === 'awaiting_approval' && s.approvalPayload && (
                                      <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/50 space-y-2.5 min-w-0">
                                        <div className="space-y-1 min-w-0">
                                          <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                                            Permission Prompt · Host PC Program: {s.approvalPayload.programName || s.targetApp}
                                          </p>
                                          <p className="text-xs font-semibold text-white">
                                            {s.approvalPayload.summary}
                                          </p>
                                          {s.approvalPayload.osCommandPreview && (
                                            <p className="text-[11px] font-mono text-sky-300">
                                              Command: {s.approvalPayload.osCommandPreview}
                                            </p>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-2 sm:flex items-center justify-end gap-2 pt-1">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleApproveStep(linkedTask.id, s.id, false)
                                            }
                                            className="min-h-[48px] px-3 py-2 bg-slate-800 hover:bg-rose-950 text-slate-200 rounded-lg text-xs font-medium cursor-pointer flex items-center justify-center gpu-transition"
                                          >
                                            Deny Permission
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleApproveStep(linkedTask.id, s.id, true)
                                            }
                                            className="min-h-[48px] px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer gpu-transition"
                                          >
                                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                                            <span>Allow & Run</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Suggested PC Program Directives Strip + Command Input Form (48x48px touch controls) */}
                <div className="p-3.5 sm:p-4 border-t border-slate-800/90 veto-recessed space-y-3 min-w-0">
                  <div className="flex items-center gap-2 overflow-x-auto momentum-scroll pb-1">
                    {SUGGESTED_DIRECTIVES.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        disabled={isBusy}
                        onClick={() => executeCommand(item.command)}
                        className="min-h-[44px] px-3.5 py-2 bg-[#0C121E] hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-lg text-xs text-slate-300 hover:text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer gpu-transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{item.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">{item.lang}</span>
                      </button>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      executeCommand(inputCommand);
                    }}
                    className="flex items-center gap-2 min-w-0"
                  >
                    <button
                      type="button"
                      onClick={triggerPushToTalk}
                      disabled={prefs.microphonePrivacyLock}
                      className={`min-h-[48px] min-w-[48px] p-2.5 rounded-lg border shrink-0 cursor-pointer flex items-center justify-center gpu-transition ${
                        voiceState === 'command_capturing'
                          ? 'bg-sky-500 text-slate-950 border-sky-400'
                          : 'bg-[#0C121E] text-slate-300 border-slate-700 hover:text-white'
                      }`}
                      title="Push to Talk (Alt+V)"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    <input
                      id="veto-command-input"
                      type="text"
                      value={inputCommand}
                      onChange={(e) => setInputCommand(e.target.value)}
                      placeholder='Tell Veto which program or task to prepare (e.g. "Open VS Code")...'
                      className="flex-1 min-w-0 min-h-[48px] px-3.5 py-2.5 bg-[#0C121E] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />

                    <button
                      type="submit"
                      disabled={isBusy || !inputCommand.trim()}
                      className="min-h-[48px] px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer gpu-transition"
                    >
                      <Send className="w-4 h-4 shrink-0" />
                      <span>{isBusy ? 'Staging...' : 'Ask Veto'}</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Operational Summary Strip Below Hero Split */}
            {snapshot && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setConnectedAppTab('pc_programs');
                    setActiveSection('apps');
                  }}
                  className="veto-panel hover:border-amber-500/40 rounded-xl p-4 text-left space-y-1 cursor-pointer gpu-transition min-w-0"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Installed Host PC Programs</span>
                    <span className="font-mono tabular-nums text-amber-400">
                      {snapshot.installedPrograms.length} Ready
                    </span>
                  </div>
                  <p className="text-base font-bold text-white">
                    VS Code, Notepad, Explorer, Chrome
                  </p>
                  <p className="text-xs text-slate-400">
                    Tap to manage PC programs & 1-click installer
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setConnectedAppTab('email');
                    setActiveSection('apps');
                  }}
                  className="veto-panel hover:border-sky-500/40 rounded-xl p-4 text-left space-y-1 cursor-pointer gpu-transition min-w-0"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Outlook & Mail Client Bridge</span>
                    <span className="font-mono tabular-nums text-sky-400">
                      {snapshot.emails.filter((e) => e.unread).length} unread
                    </span>
                  </div>
                  <p className="text-base font-bold text-white tabular-nums">
                    {snapshot.emails.filter((e) => e.draftReply).length} Reply Drafts Staged
                  </p>
                  <p className="text-xs text-slate-400">
                    Asks permission before sending or launching Mail
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setConnectedAppTab('filesystem');
                    setActiveSection('apps');
                  }}
                  className="veto-panel hover:border-emerald-500/40 rounded-xl p-4 text-left space-y-1 cursor-pointer gpu-transition min-w-0"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>File Explorer / Finder Bridge</span>
                    <span className="font-mono tabular-nums text-emerald-400">Permission-First</span>
                  </div>
                  <p className="text-base font-bold text-white tabular-nums">
                    {snapshot.files.filter((f) => f.folder.startsWith('Downloads')).length} Files in Downloads
                  </p>
                  <p className="text-xs text-slate-400">
                    {snapshot.files.filter((f) => f.category === 'Unorganized').length} unorganized ·{' '}
                    {snapshot.files.filter((f) => f.category !== 'Unorganized' && f.folder.startsWith('Downloads')).length} categorized
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('tasks')}
                  className="veto-panel hover:border-amber-500/40 rounded-xl p-4 text-left space-y-1 cursor-pointer gpu-transition min-w-0"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Pending Permission Prompts</span>
                    <span className="font-mono tabular-nums text-amber-400">Strict Gate</span>
                  </div>
                  <p className="text-base font-bold text-white tabular-nums">
                    {pendingApprovalsCount} Awaiting Your Permission
                  </p>
                  <p className="text-xs text-slate-400">
                    {snapshot.tasks.filter((t) => t.status === 'completed').length} approved tasks completed
                  </p>
                </button>
              </div>
            )}
          </div>
        )}

        {activeSection === 'tasks' && snapshot && (
          <TasksExecutionView
            tasks={snapshot.tasks}
            onApproveStep={handleApproveStep}
            onTaskControl={handleTaskControl}
          />
        )}

        {activeSection === 'apps' && snapshot && (
          <ConnectedAppsView
            snapshot={snapshot}
            initialTab={connectedAppTab}
            localBridgeOnline={localBridgeOnline}
            onExecuteCommand={(cmd) => {
              setActiveSection('assistant');
              executeCommand(cmd);
            }}
            onApproveStep={handleApproveStep}
            onResetDownloads={handleResetDownloads}
            onUpdateDraft={handleUpdateDraft}
            onUpdateInstalledProgram={handleUpdateInstalledProgram}
            isBusy={isBusy}
          />
        )}

        {activeSection === 'audit' && snapshot && (
          <ActivityAuditView activityLog={snapshot.activityLog} />
        )}

        {activeSection === 'settings' && (
          <MemoryAndSettingsView
            prefs={prefs}
            onUpdatePrefs={handleUpdatePrefs}
            onPlayVoiceSample={(quote) => triggerSpeak(quote)}
            onExecuteWorkflow={(cmd) => {
              setActiveSection('assistant');
              executeCommand(cmd);
            }}
          />
        )}
      </main>

      {/* ANDROID MOBILE BOTTOM TAB BAR (10_mobile_touch_apps.md Pattern 1:
          20px icon stacked vertically above 10px-11px caption, 48x48px min touch hitbox, safe-area bottom inset) */}
      <nav
        aria-label="Android Mobile Primary Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070A11]/95 backdrop-blur-md border-t border-slate-800/90 safe-area-bottom-nav"
      >
        <div className="grid grid-cols-5 items-center h-16 gap-1">
          {[
            { id: 'assistant', label: 'Assistant', icon: Mic },
            {
              id: 'tasks',
              label: pendingApprovalsCount > 0 ? `Allow (${pendingApprovalsCount})` : 'Permissions',
              icon: ShieldCheck,
            },
            { id: 'apps', label: 'Android Apps', icon: Smartphone },
            { id: 'audit', label: 'Audit', icon: Activity },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id as ActiveSection)}
                className={`min-h-[48px] px-1 py-1.5 rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer gpu-transition ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[10px] tracking-tight mt-1 truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
