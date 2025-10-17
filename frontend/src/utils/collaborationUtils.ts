export interface FileUpload {
  id: string
  name: string
  type: 'document' | 'video' | 'flowchart' | 'image'
  format: string
  size: number
  uploadedBy: string
  uploadedAt: string
  version: number
  processId?: string
  processName?: string
  url?: string
  description?: string
  tags: string[]
  status: 'uploading' | 'processing' | 'ready' | 'error'
}

export interface Comment {
  id: string
  content: string
  author: string
  authorRole: string
  createdAt: string
  updatedAt?: string
  parentId?: string
  mentions: string[]
  attachments: string[]
  reactions: { emoji: string; users: string[] }[]
  isEdited: boolean
  processId?: string
  fileId?: string
}

export interface ApprovalStage {
  id: string
  name: string
  description: string
  approvers: string[]
  requiredApprovals: number
  currentApprovals: string[]
  status: 'pending' | 'approved' | 'rejected' | 'skipped'
  dueDate?: string
  completedAt?: string
  comments?: string
}

export interface ApprovalWorkflow {
  id: string
  processId: string
  name: string
  description: string
  initiatedBy: string
  initiatedAt: string
  currentStage: number
  status: 'draft' | 'in-progress' | 'approved' | 'rejected' | 'cancelled'
  stages: ApprovalStage[]
  completedAt?: string
  finalDecision?: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  department: string
  avatar?: string
  skills: string[]
  availability: 'available' | 'busy' | 'away'
  workload: number
}

export interface Assignment {
  id: string
  processId: string
  assignedTo: string[]
  assignedBy: string
  assignedAt: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'assigned' | 'in-progress' | 'completed' | 'overdue'
  description: string
  estimatedHours?: number
  actualHours?: number
  milestones: Milestone[]
}

export interface Milestone {
  id: string
  title: string
  description: string
  dueDate: string
  status: 'pending' | 'in-progress' | 'completed' | 'overdue'
  completedAt?: string
  completedBy?: string
}

export interface Notification {
  id: string
  type: 'mention' | 'assignment' | 'approval' | 'comment' | 'milestone' | 'file-upload'
  title: string
  message: string
  recipient: string
  sender: string
  createdAt: string
  read: boolean
  actionUrl?: string
  metadata?: Record<string, any>
}

// Utility functions
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1])
  }

  return [...new Set(mentions)] // Remove duplicates
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileTypeIcon(format: string): string {
  const formatLower = format.toLowerCase()
  
  if (['pdf'].includes(formatLower)) return '📄'
  if (['doc', 'docx'].includes(formatLower)) return '📝'
  if (['xls', 'xlsx', 'csv'].includes(formatLower)) return '📊'
  if (['ppt', 'pptx'].includes(formatLower)) return '📊'
  if (['mp4', 'avi', 'mov', 'wmv'].includes(formatLower)) return '🎥'
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(formatLower)) return '🖼️'
  if (['zip', 'rar', '7z'].includes(formatLower)) return '📦'
  
  return '📎'
}

export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return date.toLocaleDateString()
}

export function generateNotification(
  type: Notification['type'],
  data: {
    recipient: string
    sender: string
    title?: string
    message?: string
    actionUrl?: string
    metadata?: Record<string, any>
  }
): Notification {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: data.title || getDefaultNotificationTitle(type),
    message: data.message || '',
    recipient: data.recipient,
    sender: data.sender,
    createdAt: new Date().toISOString(),
    read: false,
    actionUrl: data.actionUrl,
    metadata: data.metadata
  }
}

function getDefaultNotificationTitle(type: Notification['type']): string {
  switch (type) {
    case 'mention': return 'You were mentioned'
    case 'assignment': return 'New assignment'
    case 'approval': return 'Approval required'
    case 'comment': return 'New comment'
    case 'milestone': return 'Milestone update'
    case 'file-upload': return 'New file uploaded'
    default: return 'Notification'
  }
}

export function validateWorkflowStage(stage: ApprovalStage): boolean {
  return (
    stage.name.length > 0 &&
    stage.approvers.length > 0 &&
    stage.requiredApprovals > 0 &&
    stage.requiredApprovals <= stage.approvers.length
  )
}

export function calculateWorkflowProgress(workflow: ApprovalWorkflow): number {
  if (workflow.stages.length === 0) return 0
  
  const completedStages = workflow.stages.filter(stage => 
    stage.status === 'approved' || stage.status === 'skipped'
  ).length
  
  return (completedStages / workflow.stages.length) * 100
}

export function getNextApprovers(workflow: ApprovalWorkflow): string[] {
  if (workflow.status !== 'in-progress') return []
  
  const currentStage = workflow.stages[workflow.currentStage]
  if (!currentStage || currentStage.status !== 'pending') return []
  
  return currentStage.approvers.filter(approver => 
    !currentStage.currentApprovals.includes(approver)
  )
}

export function canUserApprove(workflow: ApprovalWorkflow, userId: string): boolean {
  if (workflow.status !== 'in-progress') return false
  
  const currentStage = workflow.stages[workflow.currentStage]
  if (!currentStage || currentStage.status !== 'pending') return false
  
  return currentStage.approvers.includes(userId) && 
         !currentStage.currentApprovals.includes(userId)
}

export const mockTeamMembers: TeamMember[] = [
  {
    id: 'tm1',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    role: 'RPA Developer',
    department: 'Finance',
    skills: ['UiPath', 'Blue Prism', 'Python'],
    availability: 'available',
    workload: 75
  },
  {
    id: 'tm2',
    name: 'Michael Rodriguez',
    email: 'michael.rodriguez@company.com',
    role: 'Business Analyst',
    department: 'HR',
    skills: ['Process Analysis', 'Requirements Gathering', 'Stakeholder Management'],
    availability: 'busy',
    workload: 90
  },
  {
    id: 'tm3',
    name: 'Emma Thompson',
    email: 'emma.thompson@company.com',
    role: 'Solution Architect',
    department: 'Operations',
    skills: ['System Design', 'Integration', 'Cloud Architecture'],
    availability: 'available',
    workload: 60
  },
  {
    id: 'tm4',
    name: 'David Park',
    email: 'david.park@company.com',
    role: 'QA Engineer',
    department: 'Quality',
    skills: ['Test Automation', 'Performance Testing', 'UAT'],
    availability: 'available',
    workload: 45
  },
  {
    id: 'tm5',
    name: 'Lisa Wang',
    email: 'lisa.wang@company.com',
    role: 'Project Manager',
    department: 'PMO',
    skills: ['Project Management', 'Agile', 'Risk Management'],
    availability: 'away',
    workload: 85
  }
]