// Utility functions for ticket and exception integration

export interface TicketCreationData {
  title: string
  description: string
  type: 'Error' | 'Feedback' | 'New Process'
  priority: 'high' | 'medium' | 'low'
  linkedExceptions?: string[]
  source?: 'exception' | 'manual'
}

export interface ExceptionReference {
  id: string
  type: string
  severity: string
  status: string
  process: string
}

// Create ticket from exception
export const createTicketFromException = (exception: any): TicketCreationData => {
  return {
    title: `${exception.exceptionType}: ${exception.process}`,
    description: `Exception Details:
- ID: ${exception.id}
- Root Cause: ${exception.rootCause}
- Impact: ${exception.impact}
- Frequency: ${exception.frequency} occurrences in last 30 days

${exception.description}`,
    type: 'Error',
    priority: exception.severity as 'high' | 'medium' | 'low',
    linkedExceptions: [exception.id],
    source: 'exception'
  }
}

// Get exception summary for ticket display
export const getExceptionSummary = (exceptionId: string): ExceptionReference | null => {
  // Mock data - in real app this would fetch from actual exception data
  const exceptionMap: Record<string, ExceptionReference> = {
    'EXC-001': {
      id: 'EXC-001',
      type: 'Validation Error',
      severity: 'high',
      status: 'open',
      process: 'Invoice Processing'
    },
    'EXC-002': {
      id: 'EXC-002',
      type: 'Data Missing',
      severity: 'medium',
      status: 'investigating',
      process: 'Customer Onboarding'
    },
    'EXC-003': {
      id: 'EXC-003',
      type: 'System Error',
      severity: 'low',
      status: 'resolved',
      process: 'Report Generation'
    },
    'EXC-004': {
      id: 'EXC-004',
      type: 'Business Rule',
      severity: 'medium',
      status: 'open',
      process: 'Email Automation'
    }
  }
  
  return exceptionMap[exceptionId] || null
}

// Search across both tickets and exceptions
export const unifiedSearch = (query: string, tickets: any[], exceptions: any[]) => {
  const ticketResults = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(query.toLowerCase()) ||
    ticket.description.toLowerCase().includes(query.toLowerCase()) ||
    ticket.tags.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))
  )
  
  const exceptionResults = exceptions.filter(exception =>
    exception.exceptionType.toLowerCase().includes(query.toLowerCase()) ||
    exception.process.toLowerCase().includes(query.toLowerCase()) ||
    exception.rootCause.toLowerCase().includes(query.toLowerCase()) ||
    exception.description.toLowerCase().includes(query.toLowerCase())
  )
  
  return {
    tickets: ticketResults,
    exceptions: exceptionResults,
    totalResults: ticketResults.length + exceptionResults.length
  }
}