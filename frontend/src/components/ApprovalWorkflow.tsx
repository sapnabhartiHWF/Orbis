import { useState } from "react"
import { 
  GitBranch, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  MessageSquare,
  AlertCircle,
  Target
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
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { type ApprovalWorkflow, ApprovalStage, calculateWorkflowProgress, canUserApprove, getNextApprovers, mockTeamMembers } from "@/utils/collaborationUtils"

interface ApprovalWorkflowProps {
  processId?: string
}

const dummyWorkflows: ApprovalWorkflow[] = [
  {
    id: 'wf1',
    processId: 'P001',
    name: 'Invoice Processing Approval',
    description: 'Multi-stage approval workflow for invoice processing automation requirements',
    initiatedBy: 'Sarah Chen',
    initiatedAt: '2024-01-20T09:00:00Z',
    currentStage: 1,
    status: 'in-progress',
    stages: [
      {
        id: 'st1',
        name: 'Technical Review',
        description: 'Review technical feasibility and architecture',
        approvers: ['Emma Thompson', 'David Park'],
        requiredApprovals: 2,
        currentApprovals: ['Emma Thompson', 'David Park'],
        status: 'approved',
        completedAt: '2024-01-22T14:30:00Z'
      },
      {
        id: 'st2',
        name: 'Business Approval',
        description: 'Business stakeholder approval for implementation',
        approvers: ['Michael Rodriguez', 'Lisa Wang'],
        requiredApprovals: 1,
        currentApprovals: ['Michael Rodriguez'],
        status: 'approved',
        completedAt: '2024-01-23T10:15:00Z'
      },
      {
        id: 'st3',
        name: 'Executive Sign-off',
        description: 'Final executive approval for budget and go-live',
        approvers: ['John Smith', 'Jane Doe'],
        requiredApprovals: 1,
        currentApprovals: [],
        status: 'pending',
        dueDate: '2024-02-05T17:00:00Z'
      }
    ]
  },
  {
    id: 'wf2',
    processId: 'P002',
    name: 'HR Onboarding Workflow',
    description: 'Approval process for employee onboarding automation',
    initiatedBy: 'Michael Rodriguez',
    initiatedAt: '2024-01-25T11:30:00Z',
    currentStage: 0,
    status: 'in-progress',
    stages: [
      {
        id: 'st4',
        name: 'Requirements Review',
        description: 'Review and validate HR requirements',
        approvers: ['Sarah Chen', 'Emma Thompson'],
        requiredApprovals: 2,
        currentApprovals: ['Sarah Chen'],
        status: 'pending',
        dueDate: '2024-02-01T17:00:00Z'
      },
      {
        id: 'st5',
        name: 'Security Assessment',
        description: 'Security and compliance review',
        approvers: ['David Park'],
        requiredApprovals: 1,
        currentApprovals: [],
        status: 'pending'
      }
    ]
  },
  {
    id: 'wf3',
    processId: 'P005',
    name: 'IT Ticket Routing Approval',
    description: 'Workflow for IT support automation approval',
    initiatedBy: 'Lisa Wang',
    initiatedAt: '2024-01-28T08:45:00Z',
    currentStage: 0,
    status: 'rejected',
    stages: [
      {
        id: 'st6',
        name: 'Architecture Review',
        description: 'Technical architecture and integration review',
        approvers: ['Emma Thompson'],
        requiredApprovals: 1,
        currentApprovals: [],
        status: 'rejected',
        completedAt: '2024-01-30T16:20:00Z',
        comments: 'Current architecture needs revision for scalability concerns'
      }
    ]
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-success/20 text-success-foreground border-success/30'
    case 'rejected': return 'bg-destructive/20 text-destructive-foreground border-destructive/30'
    case 'pending': return 'bg-warning/20 text-warning-foreground border-warning/30'
    case 'in-progress': return 'bg-primary/20 text-primary-foreground border-primary/30'
    case 'cancelled': return 'bg-muted text-muted-foreground'
    default: return 'bg-muted text-muted-foreground'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved': return <CheckCircle className="w-4 h-4" />
    case 'rejected': return <XCircle className="w-4 h-4" />
    case 'pending': return <Clock className="w-4 h-4" />
    case 'in-progress': return <Play className="w-4 h-4" />
    case 'cancelled': return <Pause className="w-4 h-4" />
    default: return <Clock className="w-4 h-4" />
  }
}

export function ApprovalWorkflow({ processId }: ApprovalWorkflowProps) {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(dummyWorkflows)
  const [isNewWorkflowOpen, setIsNewWorkflowOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    stages: [] as Partial<ApprovalStage>[]
  })
  const currentUser = 'John Smith' // This would come from auth context

  const filteredWorkflows = processId 
    ? workflows.filter(wf => wf.processId === processId)
    : workflows

  const handleCreateWorkflow = () => {
    const workflow: ApprovalWorkflow = {
      id: `wf${Date.now()}`,
      processId: processId || 'P000',
      name: newWorkflow.name,
      description: newWorkflow.description,
      initiatedBy: currentUser,
      initiatedAt: new Date().toISOString(),
      currentStage: 0,
      status: 'draft',
      stages: newWorkflow.stages.map((stage, index) => ({
        id: `st${Date.now()}_${index}`,
        name: stage.name || '',
        description: stage.description || '',
        approvers: stage.approvers || [],
        requiredApprovals: stage.requiredApprovals || 1,
        currentApprovals: [],
        status: 'pending'
      })) as ApprovalStage[]
    }

    setWorkflows(prev => [...prev, workflow])
    setIsNewWorkflowOpen(false)
    setNewWorkflow({ name: '', description: '', stages: [] })
    
    toast({
      title: "Workflow created! 🎯",
      description: "Your approval workflow has been set up and is ready to start.",
    })
  }

  const handleApprove = (workflowId: string, stageId: string) => {
    setWorkflows(prev => prev.map(wf => {
      if (wf.id === workflowId) {
        const updatedStages = wf.stages.map(stage => {
          if (stage.id === stageId) {
            const updatedApprovals = [...stage.currentApprovals, currentUser]
            const status: ApprovalStage['status'] = updatedApprovals.length >= stage.requiredApprovals ? 'approved' : 'pending'
            
            return {
              ...stage,
              currentApprovals: updatedApprovals,
              status,
              completedAt: status === 'approved' ? new Date().toISOString() : undefined
            }
          }
          return stage
        })

        // Check if we should move to next stage or complete workflow
        const currentStage = updatedStages[wf.currentStage]
        let newCurrentStage = wf.currentStage
        let newStatus = wf.status

        if (currentStage.status === 'approved' && wf.currentStage < updatedStages.length - 1) {
          newCurrentStage = wf.currentStage + 1
        } else if (currentStage.status === 'approved' && wf.currentStage === updatedStages.length - 1) {
          newStatus = 'approved'
        }

        return {
          ...wf,
          stages: updatedStages,
          currentStage: newCurrentStage,
          status: newStatus,
          completedAt: newStatus === 'approved' ? new Date().toISOString() : undefined
        }
      }
      return wf
    }))

    toast({
      title: "Approval submitted! ✅",
      description: "Your approval has been recorded and the workflow updated.",
    })
  }

  const handleReject = (workflowId: string, stageId: string, reason: string) => {
    setWorkflows(prev => prev.map(wf => {
      if (wf.id === workflowId) {
        const updatedStages = wf.stages.map(stage => {
          if (stage.id === stageId) {
            return {
              ...stage,
              status: 'rejected' as ApprovalStage['status'],
              completedAt: new Date().toISOString(),
              comments: reason
            }
          }
          return stage
        })

        return {
          ...wf,
          stages: updatedStages,
          status: 'rejected' as ApprovalWorkflow['status'],
          completedAt: new Date().toISOString(),
          finalDecision: reason
        }
      }
      return wf
    }))

    toast({
      title: "Workflow rejected",
      description: "The workflow has been rejected and stakeholders will be notified.",
    })
  }

  const addNewStage = () => {
    setNewWorkflow(prev => ({
      ...prev,
      stages: [...prev.stages, {
        name: '',
        description: '',
        approvers: [],
        requiredApprovals: 1
      }]
    }))
  }

  const updateStage = (index: number, field: string, value: any) => {
    setNewWorkflow(prev => ({
      ...prev,
      stages: prev.stages.map((stage, i) => 
        i === index ? { ...stage, [field]: value } : stage
      )
    }))
  }

  const removeStage = (index: number) => {
    setNewWorkflow(prev => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Approval Workflows</h3>
          <p className="text-muted-foreground">Manage multi-stage approval processes</p>
        </div>
        
        <Dialog open={isNewWorkflowOpen} onOpenChange={setIsNewWorkflowOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground hover:shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Create Approval Workflow</DialogTitle>
              <DialogDescription>
                Set up a multi-stage approval process for your automation project
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Workflow Name</Label>
                  <Input 
                    placeholder="e.g., Technical Review Process"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Process</Label>
                  <Select value={processId || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select process" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P001">Invoice Processing</SelectItem>
                      <SelectItem value="P002">Employee Onboarding</SelectItem>
                      <SelectItem value="P003">Data Reconciliation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Describe the purpose and scope of this approval workflow..."
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              {/* Stages */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Approval Stages</Label>
                  <Button size="sm" onClick={addNewStage}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Stage
                  </Button>
                </div>
                
                {newWorkflow.stages.map((stage, index) => (
                  <Card key={index} className="bg-muted/20 border-border">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Stage {index + 1}</h4>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => removeStage(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Stage Name</Label>
                          <Input 
                            placeholder="e.g., Technical Review"
                            value={stage.name || ''}
                            onChange={(e) => updateStage(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Required Approvals</Label>
                          <Select 
                            value={stage.requiredApprovals?.toString() || '1'}
                            onValueChange={(value) => updateStage(index, 'requiredApprovals', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Approval</SelectItem>
                              <SelectItem value="2">2 Approvals</SelectItem>
                              <SelectItem value="3">3 Approvals</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input 
                          placeholder="What needs to be reviewed in this stage?"
                          value={stage.description || ''}
                          onChange={(e) => updateStage(index, 'description', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Approvers</Label>
                        <Select onValueChange={(value) => {
                          const currentApprovers = stage.approvers || []
                          if (!currentApprovers.includes(value)) {
                            updateStage(index, 'approvers', [...currentApprovers, value])
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Add approvers..." />
                          </SelectTrigger>
                          <SelectContent>
                            {mockTeamMembers.map(member => (
                              <SelectItem key={member.id} value={member.name}>
                                {member.name} - {member.role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {stage.approvers && stage.approvers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {stage.approvers.map(approver => (
                              <Badge key={approver} variant="secondary" className="text-xs">
                                {approver}
                                <button 
                                  className="ml-1 hover:text-destructive"
                                  onClick={() => updateStage(index, 'approvers', stage.approvers?.filter(a => a !== approver))}
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {newWorkflow.stages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Add approval stages to create your workflow</p>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewWorkflowOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateWorkflow}
                disabled={!newWorkflow.name || newWorkflow.stages.length === 0}
              >
                Create Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflows List */}
      {filteredWorkflows.length === 0 ? (
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-12 text-center">
            <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-2">No workflows found</h4>
            <p className="text-muted-foreground mb-4">
              Create your first approval workflow to get started
            </p>
            <Button onClick={() => setIsNewWorkflowOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredWorkflows.map(workflow => (
            <Card key={workflow.id} className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {workflow.name}
                      <Badge className={getStatusColor(workflow.status)}>
                        {getStatusIcon(workflow.status)}
                        <span className="ml-1 capitalize">{workflow.status}</span>
                      </Badge>
                    </CardTitle>
                    <CardDescription>{workflow.description}</CardDescription>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Progress</div>
                    <div className="text-2xl font-bold">
                      {Math.round(calculateWorkflowProgress(workflow))}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <Progress value={calculateWorkflowProgress(workflow)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Started {new Date(workflow.initiatedAt).toLocaleDateString()}</span>
                    <span>{workflow.stages.filter(s => s.status === 'approved').length} of {workflow.stages.length} stages completed</span>
                  </div>
                </div>
                
                {/* Stages */}
                <div className="space-y-4">
                  {workflow.stages.map((stage, index) => (
                    <div key={stage.id} className="flex gap-4">
                      {/* Stage Number */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          stage.status === 'approved' ? 'bg-success text-success-foreground' :
                          stage.status === 'rejected' ? 'bg-destructive text-destructive-foreground' :
                          index === workflow.currentStage && workflow.status === 'in-progress' ? 'bg-primary text-primary-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        {index < workflow.stages.length - 1 && (
                          <div className={`w-0.5 h-12 mt-2 ${
                            stage.status === 'approved' ? 'bg-success' : 'bg-border'
                          }`} />
                        )}
                      </div>
                      
                      {/* Stage Details */}
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{stage.name}</h4>
                          <Badge className={getStatusColor(stage.status)}>
                            {getStatusIcon(stage.status)}
                            <span className="ml-1 capitalize">{stage.status}</span>
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{stage.description}</p>
                        
                        {/* Approvers */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Approvers ({stage.currentApprovals.length}/{stage.requiredApprovals})
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {stage.approvers.map(approver => {
                              const hasApproved = stage.currentApprovals.includes(approver)
                              const canApprove = canUserApprove(workflow, approver) && approver === currentUser
                              
                              return (
                                <div key={approver} className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs">
                                      {approver.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className={`text-sm ${hasApproved ? 'text-success font-medium' : ''}`}>
                                    {approver}
                                  </span>
                                  {hasApproved && <CheckCircle className="w-3 h-3 text-success" />}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        {canUserApprove(workflow, currentUser) && index === workflow.currentStage && (
                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm" 
                              className="bg-success text-success-foreground hover:bg-success/90"
                              onClick={() => handleApprove(workflow.id, stage.id)}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Workflow</DialogTitle>
                                  <DialogDescription>
                                    Please provide a reason for rejecting this stage
                                  </DialogDescription>
                                </DialogHeader>
                                <Textarea placeholder="Reason for rejection..." />
                                <DialogFooter>
                                  <Button variant="outline">Cancel</Button>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => handleReject(workflow.id, stage.id, "Rejection reason placeholder")}
                                  >
                                    Reject
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                        
                        {/* Stage Comments */}
                        {stage.comments && (
                          <div className="mt-3 p-2 bg-muted/30 rounded text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                              <MessageSquare className="w-3 h-3" />
                              Comment
                            </div>
                            <p>{stage.comments}</p>
                          </div>
                        )}
                        
                        {/* Due Date */}
                        {stage.dueDate && stage.status === 'pending' && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            Due: {new Date(stage.dueDate).toLocaleDateString()}
                            {new Date(stage.dueDate) < new Date() && (
                              <Badge variant="destructive" className="text-xs">Overdue</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Workflow Actions */}
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Initiated by {workflow.initiatedBy} on {new Date(workflow.initiatedAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    {workflow.status === 'in-progress' && (
                      <Button size="sm" variant="outline">
                        <Pause className="w-3 h-3 mr-1" />
                        Pause
                      </Button>
                    )}
                    
                    {workflow.status === 'rejected' && (
                      <Button size="sm" variant="outline">
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Restart
                      </Button>
                    )}
                    
                    <Button size="sm" variant="outline">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Comment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}