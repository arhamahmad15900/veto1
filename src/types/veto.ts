export type RiskLevel = 'low' | 'moderate' | 'high';

export type StepStatus =
  | 'planned'
  | 'running'
  | 'completed'
  | 'awaiting_approval'
  | 'failed'
  | 'skipped'
  | 'cancelled';

export type TaskStatus =
  | 'understanding'
  | 'planning'
  | 'executing'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled';

export type AgentVoiceState =
  | 'idle'
  | 'wake_listening'
  | 'command_capturing'
  | 'processing'
  | 'executing'
  | 'speaking'
  | 'awaiting_approval';

export type SupportedLanguage = 'auto' | 'en' | 'hi' | 'hinglish';

export type VetoVoiceName = 'Fenrir' | 'Charon' | 'Puck' | 'Kore' | 'Zephyr';

export interface InstalledPCProgram {
  id: string;
  name: string;
  category: 'IDE & Code' | 'Browser' | 'Communication' | 'System Utility' | 'Media & Design' | 'Office & Docs' | 'Android App';
  windowsCommand: string;
  macCommand: string;
  androidPackage?: string;
  androidIntentUri?: string;
  protocolUri?: string;
  detectedOnHost: boolean;
  permissionPolicy: 'always_ask' | 'blocked';
  description: string;
}

export interface ExecutionStep {
  id: string;
  index: number;
  title: string;
  toolName: string;
  targetApp: string;
  riskLevel: RiskLevel;
  status: StepStatus;
  description: string;
  verificationEvidence?: string;
  startedAt?: string;
  completedAt?: string;
  requiresApproval: boolean;
  approvalPayload?: {
    actionType: string;
    summary: string;
    programName?: string;
    osCommandPreview?: string;
    protocolUri?: string;
    localBridgeCommand?: {
      programId: string;
      action: string;
      args?: string[];
      content?: string;
      filename?: string;
    };
    details: Record<string, string>;
  };
}

export interface AgentTask {
  id: string;
  userInstruction: string;
  detectedLanguage: string;
  intentSummary: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  steps: ExecutionStep[];
  finalReport?: string;
  securityFlag?: {
    detected: boolean;
    reason: string;
    source: string;
  };
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'veto';
  text: string;
  language: string;
  timestamp: string;
  taskId?: string;
  voiceLineQuote?: string;
  audioPlayed?: boolean;
}

export interface EmailMessage {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  receivedAt: string;
  unread: boolean;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  snippet: string;
  body: string;
  requiresReply: boolean;
  containsUntrustedWarning?: boolean;
  draftReply?: {
    id: string;
    to: string;
    subject: string;
    body: string;
    status: 'draft_ready' | 'sent';
    updatedAt: string;
  };
}

export interface WhatsAppThread {
  id: string;
  contactName: string;
  roleOrGroup: string;
  unreadCount: number;
  urgency: 'urgent' | 'normal';
  language: 'English' | 'Hindi' | 'Hinglish';
  lastTimestamp: string;
  messages: {
    id: string;
    sender: string;
    text: string;
    timestamp: string;
    isOutgoing?: boolean;
  }[];
  pendingReplyDraft?: string;
}

export interface InstagramPostDraft {
  id: string;
  images: {
    filename: string;
    captionTag: string;
    aspectRatio: string;
    colorHex: string;
  }[];
  caption: string;
  hashtags: string[];
  status: 'draft_preview' | 'awaiting_approval' | 'published';
  scheduledFor?: string;
  publishedAt?: string;
}

export interface WorkspaceFile {
  name: string;
  path: string;
  folder: string;
  category: 'Documents' | 'Media' | 'Installers' | 'Archives' | 'Code & Specs' | 'Unorganized';
  sizeBytes: number;
  modifiedAt: string;
  sha256Preview: string;
  previewSnippet?: string;
}

export interface SoftwarePackage {
  id: string;
  name: string;
  publisher: string;
  version: string;
  officialUrl: string;
  sha256: string;
  supportedOS: ('Windows 11' | 'macOS Sequoia')[];
  sizeMB: number;
  status: 'available' | 'verified_downloaded' | 'awaiting_admin_approval' | 'installed';
  category: string;
}

export interface ActivityAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  application: string;
  riskLevel: RiskLevel;
  status: 'verified' | 'blocked_security' | 'awaiting_approval' | 'drafted';
  evidence: string;
}

export interface ConnectedIntegration {
  id: string;
  name: string;
  category: 'Email' | 'Messaging' | 'Social' | 'OS & Files' | 'Browser' | 'Productivity';
  status: 'connected' | 'guided_mode' | 'disconnected';
  authMethod: string;
  supportedOperations: string[];
  platformLimitations: string;
  windowsSupport: 'Full' | 'Partial';
  macosSupport: 'Full' | 'Partial';
}

export interface VetoUserPreferences {
  preferredLanguage: SupportedLanguage;
  voiceName: VetoVoiceName;
  speakingRate: number;
  wakeWordEnabled: boolean;
  wakeWordSensitivity: number;
  microphonePrivacyLock: boolean;
  autoReadResponses: boolean;
  reducedMotion: boolean;
  strictPermissionFirst: boolean;
  targetOS: 'Windows 11 Pro 24H2' | 'macOS Sequoia 15.4';
  permissionPolicy: {
    lowRisk: 'always_require_approval' | 'auto_execute';
    moderateRisk: 'always_require_approval' | 'auto_with_audit';
    highRisk: 'always_require_approval';
  };
  savedWorkflows: {
    id: string;
    name: string;
    command: string;
    language: string;
  }[];
  memoryFacts: {
    id: string;
    key: string;
    value: string;
    learnedAt: string;
  }[];
}

export interface WorkspaceSnapshot {
  emails: EmailMessage[];
  whatsappThreads: WhatsAppThread[];
  instagramDraft: InstagramPostDraft;
  files: WorkspaceFile[];
  softwareCatalog: SoftwarePackage[];
  installedPrograms: InstalledPCProgram[];
  integrations: ConnectedIntegration[];
  tasks: AgentTask[];
  activityLog: ActivityAuditEntry[];
}
