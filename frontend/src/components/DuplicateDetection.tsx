import { useState, useEffect } from "react"
import { 
  Copy, 
  AlertTriangle, 
  Eye, 
  Merge, 
  XCircle,
  CheckCircle,
  Users,
  Calendar,
  TrendingUp,
  Zap
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { findDuplicates } from "@/utils/processAnalytics"
import { ProcessComparison } from "./ProcessComparison"
import { toast } from "@/hooks/use-toast"

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

interface DuplicateDetectionProps {
  processes: Process[]
  onProcessUpdate?: (processes: Process[]) => void
}

interface DuplicateMatch {
  process1: Process
  process2: Process
  similarity: number
  reasons: string[]
}

const getSimilarityColor = (similarity: number) => {
  if (similarity >= 0.8) return "text-destructive"
  if (similarity >= 0.6) return "text-warning"
  return "text-primary"
}

const getSimilarityBadgeColor = (similarity: number) => {
  if (similarity >= 0.8) return "bg-destructive/20 text-destructive-foreground border-destructive/30"
  if (similarity >= 0.6) return "bg-warning/20 text-warning-foreground border-warning/30"
  return "bg-primary/20 text-primary-foreground border-primary/30"
}

export function DuplicateDetection({ processes, onProcessUpdate }: DuplicateDetectionProps) {
  const [threshold, setThreshold] = useState([0.6])
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [selectedComparison, setSelectedComparison] = useState<DuplicateMatch | null>(null)
  const [resolvedDuplicates, setResolvedDuplicates] = useState<Set<string>>(new Set())

  useEffect(() => {
    const found = findDuplicates(processes, threshold[0])
    setDuplicates(found.filter(d => !resolvedDuplicates.has(`${d.process1.id}-${d.process2.id}`)))
  }, [processes, threshold, resolvedDuplicates])

  const handleResolveDuplicate = (duplicate: DuplicateMatch, action: 'merge' | 'ignore') => {
    const key = `${duplicate.process1.id}-${duplicate.process2.id}`
    setResolvedDuplicates(prev => new Set([...prev, key]))

    if (action === 'merge') {
      toast({
        title: "Processes Merged",
        description: `${duplicate.process2.title} has been merged into ${duplicate.process1.title}`,
      })
    } else {
      toast({
        title: "Duplicate Ignored",
        description: "These processes have been marked as distinct",
      })
    }
  }

  const duplicatesByDepartment = duplicates.reduce((acc, dup) => {
    const dept = dup.process1.department
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(dup)
    return acc
  }, {} as Record<string, DuplicateMatch[]>)

  const potentialSavings = duplicates.reduce((sum, dup) => {
    return sum + Math.min(dup.process1.expectedROI, dup.process2.expectedROI) * 0.8
  }, 0)

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-warning border-warning/30 shadow-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-foreground/80 text-sm font-medium">Duplicates Found</p>
                <p className="text-2xl font-bold text-warning-foreground">
                  {duplicates.length}
                </p>
              </div>
              <Copy className="w-8 h-8 text-warning-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success border-success/30 shadow-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm font-medium">Potential Savings</p>
                <p className="text-2xl font-bold text-success-foreground">
                  ${(potentialSavings / 1000).toFixed(0)}K
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-success-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-primary border-primary/30 shadow-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Departments</p>
                <p className="text-2xl font-bold text-primary-foreground">
                  {Object.keys(duplicatesByDepartment).length}
                </p>
              </div>
              <Users className="w-8 h-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">High Similarity</p>
                <p className="text-2xl font-bold text-foreground">
                  {duplicates.filter(d => d.similarity >= 0.8).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detection Settings */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Detection Settings
          </CardTitle>
          <CardDescription>
            Adjust the sensitivity of duplicate detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="threshold">Similarity Threshold</Label>
                <span className="text-sm text-muted-foreground">{(threshold[0] * 100).toFixed(0)}%</span>
              </div>
              <Slider
                id="threshold"
                min={0.3}
                max={0.9}
                step={0.05}
                value={threshold}
                onValueChange={setThreshold}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Less Sensitive (30%)</span>
                <span>More Sensitive (90%)</span>
              </div>
            </div>
            
            {duplicates.length === 0 && (
              <Alert className="border-success/50 bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="text-success-foreground">
                  No duplicate processes found at the current similarity threshold.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Duplicate Results */}
      {duplicates.length > 0 && (
        <div className="space-y-6">
          {/* Summary by Department */}
          {Object.keys(duplicatesByDepartment).length > 1 && (
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-warning" />
                  Duplicates by Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(duplicatesByDepartment).map(([dept, dups]) => (
                    <div key={dept} className="flex items-center justify-between p-3 bg-gradient-card rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{dept}</Badge>
                        <span className="text-sm">{dups.length} duplicate pair(s)</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Similarity: {((dups.reduce((sum, d) => sum + d.similarity, 0) / dups.length) * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Duplicate Pairs */}
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-destructive" />
                Duplicate Process Pairs
              </CardTitle>
              <CardDescription>
                Review and resolve potential duplicate processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {duplicates.map((duplicate, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 bg-gradient-card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge className={getSimilarityBadgeColor(duplicate.similarity)}>
                          {(duplicate.similarity * 100).toFixed(0)}% Match
                        </Badge>
                        <div className="flex flex-wrap gap-1">
                          {duplicate.reasons.map(reason => (
                            <Badge key={reason} variant="secondary" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedComparison(duplicate)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Compare
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle>Process Comparison</DialogTitle>
                              <DialogDescription>
                                Compare these potentially duplicate processes
                              </DialogDescription>
                            </DialogHeader>
                            {selectedComparison && (
                              <ProcessComparison
                                process1={selectedComparison.process1}
                                process2={selectedComparison.process2}
                                similarity={selectedComparison.similarity}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleResolveDuplicate(duplicate, 'merge')}
                        >
                          <Merge className="w-4 h-4 mr-1" />
                          Merge
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleResolveDuplicate(duplicate, 'ignore')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Ignore
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Process 1 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{duplicate.process1.id}</Badge>
                          <span className="font-medium">{duplicate.process1.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {duplicate.process1.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {duplicate.process1.submittedBy}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(duplicate.process1.submittedDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            ${(duplicate.process1.expectedROI / 1000).toFixed(0)}K
                          </div>
                        </div>
                      </div>

                      {/* Process 2 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{duplicate.process2.id}</Badge>
                          <span className="font-medium">{duplicate.process2.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {duplicate.process2.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {duplicate.process2.submittedBy}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(duplicate.process2.submittedDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            ${(duplicate.process2.expectedROI / 1000).toFixed(0)}K
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Similarity Progress */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Similarity Score</span>
                        <span className={`font-medium ${getSimilarityColor(duplicate.similarity)}`}>
                          {(duplicate.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={duplicate.similarity * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}