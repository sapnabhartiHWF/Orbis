import { useState, useEffect } from "react"
import { 
  Network, 
  AlertCircle, 
  Target, 
  ArrowRight, 
  GitBranch,
  Zap,
  Info,
  RotateCcw
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { buildDependencyGraph, detectCircularDependencies, analyzeDependencyImpact } from "@/utils/processAnalytics"

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

interface ProcessDependencyMapProps {
  processes: Process[]
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

export function ProcessDependencyMap({ processes }: ProcessDependencyMapProps) {
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null)
  const [dependencyGraph, setDependencyGraph] = useState<any>(null)
  const [circularDeps, setCircularDeps] = useState<string[][]>([])

  useEffect(() => {
    const graph = buildDependencyGraph(processes)
    setDependencyGraph(graph)
    
    const cycles = detectCircularDependencies(processes)
    setCircularDeps(cycles)
  }, [processes])

  const selectedProcessData = selectedProcess ? processes.find(p => p.id === selectedProcess) : null
  const impactAnalysis = selectedProcess ? analyzeDependencyImpact(selectedProcess, processes) : null

  if (!dependencyGraph) {
    return <div className="flex items-center justify-center h-64">Loading dependency analysis...</div>
  }

  return (
    <div className="space-y-6">
      {/* Circular Dependencies Warning */}
      {circularDeps.length > 0 && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive-foreground">
            <strong>Circular Dependencies Detected:</strong> {circularDeps.length} circular dependency chain(s) found. 
            This may cause implementation delays and should be resolved.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="visual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
          <TabsTrigger value="visual" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Visual Map
          </TabsTrigger>
          <TabsTrigger value="matrix" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Dependency Matrix
          </TabsTrigger>
          <TabsTrigger value="impact" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Impact Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Dependency Map */}
            <Card className="lg:col-span-2 bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-primary" />
                  Dependency Flow Chart
                </CardTitle>
                <CardDescription>
                  Interactive visualization of process dependencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative bg-muted/20 rounded-lg p-8 min-h-96 overflow-auto">
                  <svg 
                    width="100%" 
                    height="400" 
                    viewBox="-400 -50 800 500"
                    className="border border-border/30 rounded-lg bg-background/50"
                  >
                    {/* Draw edges first */}
                    {dependencyGraph.edges.map((edge: any, index: number) => {
                      const fromNode = dependencyGraph.nodes.find((n: any) => n.id === edge.from)
                      const toNode = dependencyGraph.nodes.find((n: any) => n.id === edge.to)
                      
                      if (!fromNode || !toNode) return null
                      
                      return (
                        <g key={index}>
                          <defs>
                            <marker
                              id={`arrowhead-${index}`}
                              markerWidth="10"
                              markerHeight="7"
                              refX="9"
                              refY="3.5"
                              orient="auto"
                            >
                              <polygon
                                points="0 0, 10 3.5, 0 7"
                                fill="hsl(var(--primary))"
                              />
                            </marker>
                          </defs>
                          <line
                            x1={fromNode.x}
                            y1={fromNode.y}
                            x2={toNode.x}
                            y2={toNode.y}
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            markerEnd={`url(#arrowhead-${index})`}
                            opacity="0.7"
                          />
                        </g>
                      )
                    })}
                    
                    {/* Draw nodes */}
                    {dependencyGraph.nodes.map((node: any) => (
                      <g 
                        key={node.id}
                        onClick={() => setSelectedProcess(node.id)}
                        className="cursor-pointer group"
                      >
                        <rect
                          x={node.x - 80}
                          y={node.y - 20}
                          width="160"
                          height="40"
                          rx="8"
                          fill={selectedProcess === node.id ? "hsl(var(--primary))" : "hsl(var(--card))"}
                          stroke={selectedProcess === node.id ? "hsl(var(--primary))" : "hsl(var(--border))"}
                          strokeWidth="2"
                          className="group-hover:stroke-primary transition-colors"
                        />
                        <text
                          x={node.x}
                          y={node.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={selectedProcess === node.id ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"}
                          fontSize="12"
                          className="font-medium pointer-events-none"
                        >
                          {node.title.length > 18 ? `${node.title.substring(0, 15)}...` : node.title}
                        </text>
                        
                        {/* Status indicator */}
                        <circle
                          cx={node.x + 70}
                          cy={node.y - 15}
                          r="4"
                          fill={
                            node.status === "Deployed" ? "hsl(var(--success))" :
                            node.status === "In Development" ? "hsl(var(--primary))" :
                            node.status === "Under Review" ? "hsl(var(--warning))" :
                            "hsl(var(--muted-foreground))"
                          }
                        />
                      </g>
                    ))}
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Process Details Panel */}
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-success" />
                  Process Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProcessData ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedProcessData.title}</h3>
                      <Badge className={getStatusColor(selectedProcessData.status)}>
                        {selectedProcessData.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {selectedProcessData.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Department</span>
                        <span>{selectedProcessData.department}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Priority</span>
                        <Badge variant="outline">{selectedProcessData.priority}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expected ROI</span>
                        <span className="font-medium text-success">
                          ${(selectedProcessData.expectedROI / 1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>

                    {impactAnalysis && (
                      <div className="space-y-3 pt-4 border-t border-border">
                        <h4 className="font-medium flex items-center gap-2">
                          <Zap className="w-4 h-4 text-warning" />
                          Impact Analysis
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dependencies</span>
                            <span>{impactAnalysis.directDependencies.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dependents</span>
                            <span>{impactAnalysis.dependents.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Impact Score</span>
                            <span className="font-medium">{Math.round(impactAnalysis.impactScore)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Click on a process node to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary" />
                Dependency Matrix
              </CardTitle>
              <CardDescription>
                Complete dependency relationships between all processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 font-medium">Process</th>
                      {processes.map(p => (
                        <th key={p.id} className="text-center p-2 font-medium min-w-12">
                          <div className="transform -rotate-45 text-xs">
                            {p.id}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {processes.map(process => (
                      <tr key={process.id} className="border-b border-border/50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{process.id}</Badge>
                            <span className="text-sm truncate max-w-48">{process.title}</span>
                          </div>
                        </td>
                        {processes.map(targetProcess => {
                          const hasDependency = process.dependencies.some(dep =>
                            targetProcess.title.toLowerCase().includes(dep.toLowerCase()) ||
                            targetProcess.tags.some(tag => tag.toLowerCase().includes(dep.toLowerCase()))
                          )
                          return (
                            <td key={targetProcess.id} className="text-center p-2">
                              {process.id === targetProcess.id ? (
                                <span className="text-muted-foreground">-</span>
                              ) : hasDependency ? (
                                <div className="w-4 h-4 bg-primary rounded-full mx-auto"></div>
                              ) : (
                                <span className="text-muted-foreground/30">○</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* High Impact Processes */}
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-destructive" />
                  High Impact Processes
                </CardTitle>
                <CardDescription>
                  Processes with the most dependencies and dependents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processes
                    .map(p => ({ 
                      ...p, 
                      impact: analyzeDependencyImpact(p.id, processes).impactScore 
                    }))
                    .sort((a, b) => b.impact - a.impact)
                    .slice(0, 5)
                    .map(process => (
                      <div key={process.id} className="flex items-center justify-between p-3 bg-gradient-card rounded-lg border border-border">
                        <div>
                          <h4 className="font-medium">{process.title}</h4>
                          <p className="text-xs text-muted-foreground">{process.department}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{Math.round(process.impact)}</p>
                          <p className="text-xs text-muted-foreground">Impact Score</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Circular Dependencies */}
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-warning" />
                  Circular Dependencies
                </CardTitle>
                <CardDescription>
                  Dependency loops that need resolution
                </CardDescription>
              </CardHeader>
              <CardContent>
                {circularDeps.length > 0 ? (
                  <div className="space-y-3">
                    {circularDeps.map((cycle, index) => (
                      <div key={index} className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-warning" />
                          <span className="font-medium text-warning-foreground">Cycle {index + 1}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {cycle.map((processId, i) => {
                            const process = processes.find(p => p.id === processId)
                            return (
                              <div key={i} className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {process?.title.substring(0, 15) || processId}
                                </Badge>
                                {i < cycle.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No circular dependencies detected</p>
                    <p className="text-xs">All process dependencies are properly structured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}