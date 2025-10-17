import { useState } from "react"
import { Link, ArrowRight, CheckCircle2, Clock, Plus, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

interface ProcessToProjectMapping {
  processId: string
  processTitle: string
  processDepartment: string
  processStatus: "Submitted" | "Under Review" | "In Development" | "Deployed"
  processROI: number
  linkedProjects: {
    projectId: string
    projectTitle: string
    projectStatus: "backlog" | "in-progress" | "testing" | "live"
    progress: number
    assignee: string
  }[]
  automationComplexity: "Low" | "Medium" | "High"
  estimatedDevEffort: number
}

const mockMappings: ProcessToProjectMapping[] = [
  {
    processId: "P001",
    processTitle: "Invoice Processing Automation",
    processDepartment: "Finance",
    processStatus: "In Development",
    processROI: 340000,
    automationComplexity: "Medium",
    estimatedDevEffort: 21,
    linkedProjects: [
      {
        projectId: "PROJ-002",
        projectTitle: "Invoice Validation Enhancement",
        projectStatus: "in-progress",
        progress: 45,
        assignee: "David Liu"
      },
      {
        projectId: "PROJ-007",
        projectTitle: "OCR Integration Module",
        projectStatus: "backlog",
        progress: 0,
        assignee: "Sarah Chen"
      }
    ]
  },
  {
    processId: "P002",
    processTitle: "Employee Onboarding Bot",
    processDepartment: "HR",
    processStatus: "Under Review",
    processROI: 180000,
    automationComplexity: "High",
    estimatedDevEffort: 34,
    linkedProjects: []
  },
  {
    processId: "P003",
    processTitle: "Customer Data Reconciliation",
    processDepartment: "Operations",
    processStatus: "Deployed",
    processROI: 520000,
    automationComplexity: "High",
    estimatedDevEffort: 55,
    linkedProjects: [
      {
        projectId: "PROJ-004",
        projectTitle: "Report Generation Performance",
        projectStatus: "live",
        progress: 100,
        assignee: "Mike Johnson"
      }
    ]
  }
]

export function ProcessToProjectLinker() {
  const { toast } = useToast()

  const getProcessStatusColor = (status: string) => {
    switch (status) {
      case "Submitted": return "text-blue-400 bg-blue-500/10 border-blue-500/20"
      case "Under Review": return "text-warning bg-warning/10 border-warning/20"
      case "In Development": return "text-primary bg-primary/10 border-primary/20"
      case "Deployed": return "text-success bg-success/10 border-success/20"
      default: return "text-muted-foreground bg-muted/10 border-border"
    }
  }

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case "backlog": return "text-muted-foreground bg-muted/10 border-border"
      case "in-progress": return "text-warning bg-warning/10 border-warning/20"
      case "testing": return "text-primary bg-primary/10 border-primary/20"
      case "live": return "text-success bg-success/10 border-success/20"
      default: return "text-muted-foreground bg-muted/10 border-border"
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Low": return "text-success bg-success/10 border-success/20"
      case "Medium": return "text-warning bg-warning/10 border-warning/20"
      case "High": return "text-destructive bg-destructive/10 border-destructive/20"
      default: return "text-muted-foreground bg-muted/10 border-border"
    }
  }

  const handleGenerateProject = (processId: string) => {
    toast({
      title: "Development Project Generated",
      description: "New development project created from business process requirements."
    })
  }

  const handleLinkExistingProject = (processId: string) => {
    toast({
      title: "Project Linked",
      description: "Existing development project linked to business process."
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-semibold">Process-to-Project Mapper</h2>
          <p className="text-muted-foreground">Link business processes to development projects</p>
        </div>
      </div>

      <div className="space-y-6">
        {mockMappings.map((mapping) => (
          <Card key={mapping.processId} className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{mapping.processTitle}</CardTitle>
                    <Badge className={getProcessStatusColor(mapping.processStatus)}>
                      {mapping.processStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{mapping.processDepartment}</span>
                    <span>•</span>
                    <span>ROI: ${mapping.processROI.toLocaleString()}</span>
                    <span>•</span>
                    <Badge className={getComplexityColor(mapping.automationComplexity)}>
                      {mapping.automationComplexity} Complexity
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {mapping.linkedProjects.length === 0 && (
                    <Button 
                      size="sm" 
                      className="bg-gradient-primary gap-2"
                      onClick={() => handleGenerateProject(mapping.processId)}
                    >
                      <Plus className="w-4 h-4" />
                      Generate Project
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => handleLinkExistingProject(mapping.processId)}
                  >
                    <Link className="w-4 h-4" />
                    Link Project
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Development Effort</span>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{mapping.estimatedDevEffort} story points</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Linked Projects</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="font-semibold">{mapping.linkedProjects.length} projects</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Overall Progress</span>
                  <div className="space-y-1">
                    <span className="font-semibold">
                      {mapping.linkedProjects.length > 0 
                        ? Math.round(mapping.linkedProjects.reduce((sum, p) => sum + p.progress, 0) / mapping.linkedProjects.length)
                        : 0}%
                    </span>
                    <Progress 
                      value={mapping.linkedProjects.length > 0 
                        ? mapping.linkedProjects.reduce((sum, p) => sum + p.progress, 0) / mapping.linkedProjects.length
                        : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </div>

              {mapping.linkedProjects.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" />
                      Linked Development Projects
                    </h4>
                    
                    <div className="grid gap-3">
                      {mapping.linkedProjects.map((project) => (
                        <div key={project.projectId} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h5 className="font-medium">{project.projectTitle}</h5>
                              <Badge className={getProjectStatusColor(project.projectStatus)}>
                                {project.projectStatus.replace("-", " ")}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Assigned to: {project.assignee}</span>
                              <span>•</span>
                              <span>Progress: {project.progress}%</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Progress value={project.progress} className="w-24 h-2" />
                            <Button size="sm" variant="ghost">
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {mapping.linkedProjects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No development projects linked yet</p>
                  <p className="text-sm">Generate or link projects to start development tracking</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}