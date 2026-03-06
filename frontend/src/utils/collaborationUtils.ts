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
  isTriggered?: boolean
  triggerStatus?: string
  triggeredAt?: string | null
  notTriggeredReason?: string | null
  reviewStatus?: string | null
  // Morgan Stanley specific fields
  morganStanleyStatus?: string | null
  houseBill?: string | null
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
  processName?: string;
  processDepartment?: string;
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
  status: 'assigned' | 'in-progress' | 'completed' | 'overdue'
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

export function getTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) {
    return ''
  }

  // Parse date string - handle both ISO format and SQL Server datetime format
  let date: Date
  try {
    // Convert to string if needed
    const str = String(dateString).trim()
    if (!str || str === 'null' || str === 'undefined' || str === '') {
      return ''
    }

    // If date already has timezone info (Z or +), use as-is
    if (str.includes('Z') || str.includes('+') || (str.includes('-') && str.length > 10 && str.includes('T'))) {
      date = new Date(str)
      if (isNaN(date.getTime())) {
        return ''
      }
    } else if (str.includes('T') && !str.includes('Z') && !str.includes('+')) {
      // ISO format without timezone - assume UTC (from backend format_datetime_for_json)
      date = new Date(str + 'Z')
      if (isNaN(date.getTime())) {
        return ''
      }
    } else if (str.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
      // SQL Server datetime format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DD HH:MM:SS.mmm)
      // Backend should have converted this to ISO format, but handle it if it hasn't
      // Replace space with T and add Z to treat as UTC (preserving exact time from database)
      const isoStr = str.replace(' ', 'T') + (str.includes('.') ? '' : '.000') + 'Z'
      date = new Date(isoStr)
      if (isNaN(date.getTime())) {
        return ''
      }
    } else {
      // Try parsing as-is (might work for some formats)
      date = new Date(str)
      if (isNaN(date.getTime())) {
        // Try adding Z suffix as last resort
        try {
          date = new Date(str + 'Z')
          if (isNaN(date.getTime())) {
            return ''
          }
        } catch (e) {
          return ''
        }
      }
    }

    // Validate date
    if (isNaN(date.getTime())) {
      return ''
    }
  } catch (e) {
    return ''
  }

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  // Handle negative differences (future dates) - show formatted date
  if (diffInSeconds < 0) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    })
  }

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`

  // For dates older than 30 days, show formatted date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC' // Display in UTC to match database
  })
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