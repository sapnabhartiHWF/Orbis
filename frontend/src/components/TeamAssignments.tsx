import { useState } from "react"
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Clock, 
  Target, 
  Bell, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Zap,
  Badge as BadgeIcon,
  Settings,
  MoreHorizontal,
  Plus,
  Filter
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { Assignment, Milestone, TeamMember, Notification, mockTeamMembers, generateNotification } from "@/utils/collaborationUtils"

interface TeamAssignmentsProps {
  processId?: string
}

const dummyAssignments: Assignment[] = [
  {
    id: 'a1',
    processId: 'P001',
    assignedTo: ['Sarah Chen', 'David Park'],
    assignedBy: 'Lisa Wang',
    assignedAt: '2024-01-20T09:00:00Z',
    dueDate: '2024-02-15T17:00:00Z',
    priority: 'high',
    status: 'in-progress',
    description: 'Develop and test the invoice processing automation bot using UiPath',
    estimatedHours: 120,
    actualHours: 45,
    milestones: [
      {
        id: 'm1',
        title: 'Requirements Analysis',
        description: 'Complete detailed analysis of current process',
        dueDate: '2024-01-28T17:00:00Z',
        status: 'completed',
        completedAt: '2024-01-26T14:30:00Z',
        completedBy: 'Sarah Chen'
      },
      {
        id: 'm2',
        title: 'Bot Development',
        description: 'Build the core automation workflow',
        dueDate: '2024-02-08T17:00:00Z',
        status: 'in-progress'
      },
      {
        id: 'm3',
        title: 'Testing & QA',
        description: 'End-to-end testing and quality assurance',
        dueDate: '2024-02-12T17:00:00Z',
        status: 'pending'
      }
    ]
  },
  {
    id: 'a2',
    processId: 'P002',
    assignedTo: ['Michael Rodriguez', 'Emma Thompson'],
    assignedBy: 'John Smith',
    assignedAt: '2024-01-22T11:30:00Z',
    dueDate: '2024-02-20T17:00:00Z',
    priority: 'medium',
    status: 'assigned',
    description: 'Design and implement HR onboarding automation system',
    estimatedHours: 80,
    milestones: [
      {
        id: 'm4',
        title: 'System Integration Design',
        description: 'Design integration points with HR systems',
        dueDate: '2024-02-01T17:00:00Z',
        status: 'in-progress'
      },
      {
        id: 'm5',
        title: 'Workflow Development',
        description: 'Build onboarding workflow automation',
        dueDate: '2024-02-15T17:00:00Z',
        status: 'pending'
      }
    ]
  },
  {
    id: 'a3',
    processId: 'P003',
    assignedTo: ['Emma Thompson'],
    assignedBy: 'Sarah Chen',
    assignedAt: '2024-01-25T14:15:00Z',
    dueDate: '2024-02-10T17:00:00Z',
    priority: 'urgent',
    status: 'overdue',
    description: 'Fix critical data reconciliation issues in production environment',
    estimatedHours: 40,
    actualHours: 35,
    milestones: [
      {
        id: 'm6',
        title: 'Root Cause Analysis',
        description: 'Identify the source of data inconsistencies',
        dueDate: '2024-01-30T17:00:00Z',
        status: 'overdue'
      }
    ]
  }
]

const dummyNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'assignment',
    title: 'New Assignment',
    message: 'You have been assigned to work on Invoice Processing Automation',
    recipient: 'Sarah Chen',
    sender: 'Lisa Wang',
    createdAt: '2024-01-20T09:00:00Z',
    read: false,
    actionUrl: '/center-of-excellence'
  },
  {
    id: 'n2',
    type: 'milestone',
    title: 'Milestone Completed',
    message: 'Requirements Analysis milestone has been completed',
    recipient: 'Lisa Wang',
    sender: 'Sarah Chen',
    createdAt: '2024-01-26T14:30:00Z',
    read: true
  },
  {
    id: 'n3',
    type: 'assignment',
    title: 'Assignment Overdue',
    message: 'Data reconciliation fix is overdue and needs immediate attention',
    recipient: 'Emma Thompson',
    sender: 'System',
    createdAt: '2024-02-01T09:00:00Z',
    read: false
  }
]

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'bg-muted text-muted-foreground'
    case 'medium': return 'bg-warning/20 text-warning-foreground border-warning/30'
    case 'high': return 'bg-destructive/20 text-destructive-foreground border-destructive/30'
    case 'urgent': return 'bg-gradient-danger text-white border-destructive shadow-glow'
    default: return 'bg-muted text-muted-foreground'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'assigned': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'in-progress': return 'bg-primary/20 text-primary-foreground border-primary/30'
    case 'completed': return 'bg-success/20 text-success-foreground border-success/30'
    case 'overdue': return 'bg-destructive/20 text-destructive-foreground border-destructive/30'
    default: return 'bg-muted text-muted-foreground'
  }
}

export function TeamAssignments({ processId }: TeamAssignmentsProps) {
  const [assignments, setAssignments] = useState<Assignment[]>(dummyAssignments)
  const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications)
  const [isNewAssignmentOpen, setIsNewAssignmentOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState("assignments")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [newAssignment, setNewAssignment] = useState({
    assignedTo: [] as string[],
    description: '',
    priority: 'medium' as Assignment['priority'],
    dueDate: '',
    estimatedHours: 0,
    milestones: [] as Partial<Milestone>[]
  })

  const filteredAssignments = assignments.filter(assignment => {
    const matchesProcess = !processId || assignment.processId === processId
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter
    const matchesPriority = priorityFilter === "all" || assignment.priority === priorityFilter
    return matchesProcess && matchesStatus && matchesPriority
  })

  const handleCreateAssignment = () => {
    const assignment: Assignment = {
      id: `a${Date.now()}`,
      processId: processId || 'P000',
      assignedTo: newAssignment.assignedTo,
      assignedBy: 'Current User',
      assignedAt: new Date().toISOString(),
      dueDate: newAssignment.dueDate,
      priority: newAssignment.priority,
      status: 'assigned',
      description: newAssignment.description,
      estimatedHours: newAssignment.estimatedHours,
      milestones: newAssignment.milestones.map((milestone, index) => ({
        id: `m${Date.now()}_${index}`,
        title: milestone.title || '',
        description: milestone.description || '',
        dueDate: milestone.dueDate || '',
        status: 'pending'
      })) as Milestone[]
    }

    setAssignments(prev => [...prev, assignment])
    
    // Generate notifications for assigned team members
    newAssignment.assignedTo.forEach(member => {
      const notification = generateNotification('assignment', {
        recipient: member,
        sender: 'Current User',
        title: 'New Assignment',
        message: `You have been assigned to work on: ${assignment.description}`,
        actionUrl: '/center-of-excellence'
      })
      setNotifications(prev => [...prev, notification])
    })

    setIsNewAssignmentOpen(false)
    setNewAssignment({
      assignedTo: [],
      description: '',
      priority: 'medium',
      dueDate: '',
      estimatedHours: 0,
      milestones: []
    })
    
    toast({
      title: "Assignment created! 👥",
      description: `${newAssignment.assignedTo.length} team member(s) have been notified of their new assignment.`,
    })
  }

  const handleMilestoneComplete = (assignmentId: string, milestoneId: string) => {
    setAssignments(prev => prev.map(assignment => {
      if (assignment.id === assignmentId) {
        const updatedMilestones = assignment.milestones.map(milestone => {
          if (milestone.id === milestoneId) {
            return {
              ...milestone,
              status: 'completed' as const,
              completedAt: new Date().toISOString(),
              completedBy: 'Current User'
            }
          }
          return milestone
        })
        
        // Check if all milestones are completed
        const allCompleted = updatedMilestones.every(m => m.status === 'completed')
        const newStatus = allCompleted ? 'completed' : 'in-progress'
        
        return {
          ...assignment,
          milestones: updatedMilestones,
          status: newStatus as Assignment['status']
        }
      }
      return assignment
    }))
    
    toast({
      title: "Milestone completed! ✅",
      description: "Great progress! The milestone has been marked as complete.",
    })
  }

  const addMilestone = () => {
    setNewAssignment(prev => ({
      ...prev,
      milestones: [...prev.milestones, {
        title: '',
        description: '',
        dueDate: '',
        status: 'pending'
      }]
    }))
  }

  const updateMilestone = (index: number, field: string, value: any) => {
    setNewAssignment(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }))
  }

  const removeMilestone = (index: number) => {
    setNewAssignment(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }))
  }

  const unreadNotifications = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Team Assignments</h3>
          <p className="text-muted-foreground">Manage team assignments and track progress</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="relative">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
            {unreadNotifications > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground min-w-5 h-5 text-xs flex items-center justify-center p-0">
                {unreadNotifications}
              </Badge>
            )}
          </Button>
          
          <Dialog open={isNewAssignmentOpen} onOpenChange={setIsNewAssignmentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground hover:shadow-glow">
                <UserPlus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Create Team Assignment</DialogTitle>
                <DialogDescription>
                  Assign team members to work on automation tasks and milestones
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Assignment Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Assignment Description</Label>
                    <Textarea 
                      placeholder="Describe what needs to be done..."
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select 
                        value={newAssignment.priority}
                        onValueChange={(value: Assignment['priority']) => 
                          setNewAssignment(prev => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input 
                        type="date"
                        value={newAssignment.dueDate}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Estimated Hours</Label>
                      <Input 
                        type="number"
                        placeholder="40"
                        value={newAssignment.estimatedHours}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  
                  {/* Team Members Selection */}
                  <div className="space-y-2">
                    <Label>Assign to Team Members</Label>
                    <Select onValueChange={(value) => {
                      if (!newAssignment.assignedTo.includes(value)) {
                        setNewAssignment(prev => ({
                          ...prev,
                          assignedTo: [...prev.assignedTo, value]
                        }))
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team members..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTeamMembers.map(member => (
                          <SelectItem key={member.id} value={member.name}>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback className="text-xs">
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.name} - {member.role}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {newAssignment.assignedTo.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newAssignment.assignedTo.map(member => (
                          <Badge key={member} variant="secondary" className="text-sm">
                            {member}
                            <button 
                              className="ml-1 hover:text-destructive"
                              onClick={() => setNewAssignment(prev => ({
                                ...prev,
                                assignedTo: prev.assignedTo.filter(m => m !== member)
                              }))}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Milestones */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Milestones</Label>
                    <Button size="sm" onClick={addMilestone}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Milestone
                    </Button>
                  </div>
                  
                  {newAssignment.milestones.map((milestone, index) => (
                    <Card key={index} className="bg-muted/20 border-border">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Milestone {index + 1}</h4>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => removeMilestone(index)}
                          >
                            ×
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input 
                              placeholder="e.g., Requirements Analysis"
                              value={milestone.title || ''}
                              onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input 
                              type="date"
                              value={milestone.dueDate || ''}
                              onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input 
                            placeholder="What needs to be accomplished in this milestone?"
                            value={milestone.description || ''}
                            onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {newAssignment.milestones.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Add milestones to track progress</p>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewAssignmentOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAssignment}
                  disabled={!newAssignment.description || newAssignment.assignedTo.length === 0}
                >
                  Create Assignment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-2">No assignments found</h4>
            <p className="text-muted-foreground mb-4">
              Create your first team assignment to get started
            </p>
            <Button onClick={() => setIsNewAssignmentOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Assignment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredAssignments.map(assignment => {
            const completedMilestones = assignment.milestones.filter(m => m.status === 'completed').length
            const progressPercentage = assignment.milestones.length > 0 
              ? (completedMilestones / assignment.milestones.length) * 100 
              : 0

            return (
              <Card key={assignment.id} className="bg-gradient-card border-border shadow-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPriorityColor(assignment.priority)}>
                          {assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)}
                        </Badge>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status === 'in-progress' ? 'In Progress' : 
                           assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <CardTitle className="text-lg mb-2">{assignment.description}</CardTitle>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {assignment.assignedTo.length} member(s)
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {new Date(assignment.dueDate || '').toLocaleDateString()}
                        </div>
                        {assignment.estimatedHours && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {assignment.estimatedHours}h estimated
                            {assignment.actualHours && ` (${assignment.actualHours}h actual)`}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Progress</div>
                      <div className="text-2xl font-bold">
                        {Math.round(progressPercentage)}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{completedMilestones} of {assignment.milestones.length} milestones completed</span>
                      <span>Assigned by {assignment.assignedBy}</span>
                    </div>
                  </div>
                  
                  {/* Team Members */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Assigned Team</Label>
                    <div className="flex items-center gap-2">
                      {assignment.assignedTo.map(member => {
                        const memberData = mockTeamMembers.find(m => m.name === member)
                        return (
                          <div key={member} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {member.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">{member}</div>
                              <div className="text-xs text-muted-foreground">{memberData?.role}</div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${
                              memberData?.availability === 'available' ? 'bg-success' :
                              memberData?.availability === 'busy' ? 'bg-warning' : 'bg-muted'
                            }`} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Milestones */}
                  {assignment.milestones.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Milestones</Label>
                      <div className="space-y-2">
                        {assignment.milestones.map(milestone => (
                          <div key={milestone.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Button
                                size="sm"
                                variant={milestone.status === 'completed' ? 'default' : 'outline'}
                                onClick={() => milestone.status !== 'completed' && handleMilestoneComplete(assignment.id, milestone.id)}
                                disabled={milestone.status === 'completed'}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </Button>
                              
                              <div>
                                <h4 className={`font-medium ${milestone.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                  {milestone.title}
                                </h4>
                                <p className="text-xs text-muted-foreground">{milestone.description}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Calendar className="w-3 h-3" />
                                  Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                  {milestone.status === 'completed' && milestone.completedBy && (
                                    <>
                                      • Completed by {milestone.completedBy}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <Badge className={getStatusColor(milestone.status)}>
                              {milestone.status === 'in-progress' ? 'In Progress' : 
                               milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}