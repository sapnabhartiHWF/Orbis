import { 
  ArrowRight, 
  Calendar,
  Users,
  TrendingUp,
  Target,
  Building,
  Tag,
  AlertTriangle,
  CheckCircle,
  Clock,
  Link2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface Process {
  id: string
  title: string
  description: string
  department: string
  priority: "Low" | "Medium" | "High" | "Critical"
  expectedROI: number
  status: "Submitted" | "Under Review" | "In Development" | "Deployed"
  submittedBy: string
  submittedDate: string
  estimatedSavings: number
  complexity: "Low" | "Medium" | "High"
  dependencies: string[]
  tags: string[]
}

interface ProcessComparisonProps {
  process1: Process
  process2: Process
  similarity: number
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Submitted": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "Under Review": return "bg-warning/20 text-warning-foreground border-warning/30"
    case "In Development": return "bg-primary/20 text-primary-foreground border-primary/30"
    case "Deployed": return "bg-success/20 text-success-foreground border-success/30"
    default: return "bg-muted text-muted-foreground"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Low": return "bg-muted text-muted-foreground"
    case "Medium": return "bg-warning/20 text-warning-foreground border-warning/30"
    case "High": return "bg-destructive/20 text-destructive-foreground border-destructive/30"
    case "Critical": return "bg-gradient-danger text-white border-destructive shadow-glow"
    default: return "bg-muted text-muted-foreground"
  }
}

const getComplexityValue = (complexity: string) => {
  switch (complexity) {
    case "Low": return 33
    case "Medium": return 66
    case "High": return 100
    default: return 0
  }
}

export function ProcessComparison({ process1, process2, similarity }: ProcessComparisonProps) {
  // Calculate differences for highlighting
  const roiDifference = Math.abs(process1.expectedROI - process2.expectedROI)
  const savingsDifference = Math.abs(process1.estimatedSavings - process2.estimatedSavings)
  
  // Find common and unique tags
  const commonTags = process1.tags.filter(tag => process2.tags.includes(tag))
  const uniqueTags1 = process1.tags.filter(tag => !process2.tags.includes(tag))
  const uniqueTags2 = process2.tags.filter(tag => !process1.tags.includes(tag))

  // Find common and unique dependencies
  const commonDeps = process1.dependencies.filter(dep => process2.dependencies.includes(dep))
  const uniqueDeps1 = process1.dependencies.filter(dep => !process2.dependencies.includes(dep))
  const uniqueDeps2 = process2.dependencies.filter(dep => !process1.dependencies.includes(dep))

  return (
    <div className="space-y-6">
      {/* Similarity Header */}
      <Card className="bg-gradient-primary border-primary/30 shadow-glow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary-foreground">Similarity Analysis</h3>
              <p className="text-primary-foreground/80">Overall match score between processes</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-foreground">
                {(similarity * 100).toFixed(1)}%
              </div>
              <Progress value={similarity * 100} className="w-32 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Process 1 */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="font-mono">{process1.id}</Badge>
              <Badge className={getStatusColor(process1.status)}>
                {process1.status}
              </Badge>
            </div>
            <CardTitle className="text-xl">{process1.title}</CardTitle>
            <CardDescription>{process1.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Department</span>
                </div>
                <Badge variant="outline">{process1.department}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Priority</span>
                </div>
                <Badge className={getPriorityColor(process1.priority)}>{process1.priority}</Badge>
              </div>
            </div>

            {/* Financial Metrics */}
            <Separator />
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Expected ROI</span>
                <span className="font-medium text-success">
                  ${(process1.expectedROI / 1000).toFixed(0)}K
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Est. Savings</span>
                <span className="font-medium text-primary">
                  ${(process1.estimatedSavings / 1000).toFixed(0)}K
                </span>
              </div>
            </div>

            {/* Complexity */}
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Complexity</span>
                <span>{process1.complexity}</span>
              </div>
              <Progress value={getComplexityValue(process1.complexity)} className="h-2" />
            </div>

            {/* Submission Info */}
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Submitted by</span>
                <span>{process1.submittedBy}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Date</span>
                <span>{new Date(process1.submittedDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Tags */}
            {process1.tags.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {process1.tags.map(tag => (
                      <Badge 
                        key={tag} 
                        variant={commonTags.includes(tag) ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {tag}
                        {commonTags.includes(tag) && <CheckCircle className="w-2 h-2 ml-1" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Dependencies */}
            {process1.dependencies.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Link2 className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Dependencies</span>
                  </div>
                  <div className="space-y-1">
                    {process1.dependencies.map(dep => (
                      <Badge 
                        key={dep} 
                        variant={commonDeps.includes(dep) ? "default" : "secondary"}
                        className="text-xs mr-1 mb-1"
                      >
                        {dep}
                        {commonDeps.includes(dep) && <CheckCircle className="w-2 h-2 ml-1" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Process 2 */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="font-mono">{process2.id}</Badge>
              <Badge className={getStatusColor(process2.status)}>
                {process2.status}
              </Badge>
            </div>
            <CardTitle className="text-xl">{process2.title}</CardTitle>
            <CardDescription>{process2.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Department</span>
                </div>
                <Badge 
                  variant={process1.department === process2.department ? "default" : "outline"}
                >
                  {process2.department}
                  {process1.department === process2.department && <CheckCircle className="w-2 h-2 ml-1" />}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Priority</span>
                </div>
                <Badge className={getPriorityColor(process2.priority)}>{process2.priority}</Badge>
              </div>
            </div>

            {/* Financial Metrics */}
            <Separator />
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Expected ROI</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-success">
                    ${(process2.expectedROI / 1000).toFixed(0)}K
                  </span>
                  {roiDifference > 50000 && (
                    <AlertTriangle className="w-3 h-3 text-warning" />
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Est. Savings</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-primary">
                    ${(process2.estimatedSavings / 1000).toFixed(0)}K
                  </span>
                  {savingsDifference > 50000 && (
                    <AlertTriangle className="w-3 h-3 text-warning" />
                  )}
                </div>
              </div>
            </div>

            {/* Complexity */}
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Complexity</span>
                <div className="flex items-center gap-2">
                  <span>{process2.complexity}</span>
                  {process1.complexity !== process2.complexity && (
                    <AlertTriangle className="w-3 h-3 text-warning" />
                  )}
                </div>
              </div>
              <Progress value={getComplexityValue(process2.complexity)} className="h-2" />
            </div>

            {/* Submission Info */}
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Submitted by</span>
                <span>{process2.submittedBy}</span>
                {process1.submittedBy === process2.submittedBy && (
                  <CheckCircle className="w-3 h-3 text-success" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Date</span>
                <span>{new Date(process2.submittedDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Tags */}
            {process2.tags.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {process2.tags.map(tag => (
                      <Badge 
                        key={tag} 
                        variant={commonTags.includes(tag) ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {tag}
                        {commonTags.includes(tag) && <CheckCircle className="w-2 h-2 ml-1" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Dependencies */}
            {process2.dependencies.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Link2 className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Dependencies</span>
                  </div>
                  <div className="space-y-1">
                    {process2.dependencies.map(dep => (
                      <Badge 
                        key={dep} 
                        variant={commonDeps.includes(dep) ? "default" : "secondary"}
                        className="text-xs mr-1 mb-1"
                      >
                        {dep}
                        {commonDeps.includes(dep) && <CheckCircle className="w-2 h-2 ml-1" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Summary */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            Similarity Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Commonalities */}
            <div className="space-y-3">
              <h4 className="font-medium text-success flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Common Elements
              </h4>
              <div className="space-y-2">
                {process1.department === process2.department && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs">Department</Badge>
                    <span className="text-muted-foreground">{process1.department}</span>
                  </div>
                )}
                {commonTags.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Common Tags:</span>
                    <div className="flex flex-wrap gap-1">
                      {commonTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {commonDeps.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Common Dependencies:</span>
                    <div className="flex flex-wrap gap-1">
                      {commonDeps.map(dep => (
                        <Badge key={dep} variant="secondary" className="text-xs">{dep}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Key Differences */}
            <div className="space-y-3">
              <h4 className="font-medium text-warning flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Key Differences
              </h4>
              <div className="space-y-2 text-sm">
                {roiDifference > 50000 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ROI Gap</span>
                    <span className="text-warning">${(roiDifference / 1000).toFixed(0)}K</span>
                  </div>
                )}
                {process1.complexity !== process2.complexity && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Complexity</span>
                    <span className="text-warning">{process1.complexity} vs {process2.complexity}</span>
                  </div>
                )}
                {process1.status !== process2.status && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-warning">{process1.status} vs {process2.status}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h4 className="font-medium text-primary flex items-center gap-2">
                <Target className="w-4 h-4" />
                Recommendations
              </h4>
              <div className="space-y-2 text-sm">
                {similarity >= 0.8 && (
                  <div className="p-2 bg-destructive/10 rounded border border-destructive/30">
                    <span className="text-destructive font-medium">High Similarity:</span>
                    <p className="text-destructive-foreground">Consider merging these processes to avoid duplication of effort.</p>
                  </div>
                )}
                {commonDeps.length > 0 && (
                  <div className="p-2 bg-primary/10 rounded border border-primary/30">
                    <span className="text-primary font-medium">Shared Dependencies:</span>
                    <p className="text-primary-foreground">Coordinate implementation to maximize efficiency.</p>
                  </div>
                )}
                {process1.department === process2.department && (
                  <div className="p-2 bg-success/10 rounded border border-success/30">
                    <span className="text-success font-medium">Same Department:</span>
                    <p className="text-success-foreground">Potential for collaboration and resource sharing.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}