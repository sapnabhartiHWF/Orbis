import { useState } from "react"
import { Shield, AlertTriangle, CheckCircle, XCircle, Info, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { dummyROICalculations, assessRisk, RiskFactor } from "@/utils/roiCalculations"

interface RiskAnalysis {
  id: string
  processName: string
  department: string
  overallRiskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: RiskFactor[]
  complexity: number
  investmentSize: number
  automationLevel: number
  recommendations: string[]
}

export function RiskAssessment() {
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("all")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  
  const departments = Array.from(new Set(dummyROICalculations.map(calc => calc.department)))
  
  // Generate comprehensive risk analyses
  const riskAnalyses: RiskAnalysis[] = dummyROICalculations.map(calc => {
    const investmentSize = Object.values(calc.implementationCosts).reduce((sum, cost) => sum + cost, 0)
    const riskFactors = assessRisk(calc)
    const overallRiskScore = calc.calculatedMetrics?.riskScore || 0
    
    const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
      if (score >= 8) return 'critical'
      if (score >= 6) return 'high'
      if (score >= 4) return 'medium'
      return 'low'
    }
    
    const complexity = investmentSize > 500000 ? 90 : investmentSize > 100000 ? 60 : 30
    
    const recommendations = [
      overallRiskScore > 7 ? "Consider phased implementation approach" : "Standard implementation recommended",
      calc.proposedState.automationLevel > 80 ? "Implement comprehensive change management program" : "Standard training sufficient",
      investmentSize > 300000 ? "Establish detailed project monitoring and contingency planning" : "Regular project reviews adequate",
      riskFactors.some(r => r.impact === 'high') ? "Engage senior stakeholder oversight" : "Standard governance applies"
    ]
    
    return {
      id: calc.id,
      processName: calc.processName,
      department: calc.department,
      overallRiskScore,
      riskLevel: getRiskLevel(overallRiskScore),
      riskFactors,
      complexity,
      investmentSize,
      automationLevel: calc.proposedState.automationLevel,
      recommendations
    }
  })
  
  // Apply filters
  const filteredAnalyses = riskAnalyses.filter(analysis => {
    const deptMatch = selectedDepartment === "all" || analysis.department === selectedDepartment
    const riskMatch = selectedRiskLevel === "all" || analysis.riskLevel === selectedRiskLevel
    return deptMatch && riskMatch
  })
  
  // Calculate aggregate metrics
  const avgRiskScore = filteredAnalyses.reduce((sum, analysis) => sum + analysis.overallRiskScore, 0) / filteredAnalyses.length
  const riskDistribution = {
    low: filteredAnalyses.filter(a => a.riskLevel === 'low').length,
    medium: filteredAnalyses.filter(a => a.riskLevel === 'medium').length,
    high: filteredAnalyses.filter(a => a.riskLevel === 'high').length,
    critical: filteredAnalyses.filter(a => a.riskLevel === 'critical').length
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'destructive'
      case 'critical': return 'destructive'
      default: return 'secondary'
    }
  }
  
  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return CheckCircle
      case 'medium': return Info
      case 'high': return AlertTriangle
      case 'critical': return XCircle
      default: return Shield
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Risk Assessment Matrix</h2>
          <p className="text-muted-foreground">Implementation complexity, risk scoring, and mitigation strategies</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="critical">Critical Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-primary border-primary/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Average Risk Score</p>
                <p className="text-3xl font-bold text-primary-foreground">
                  {avgRiskScore.toFixed(1)}/10
                </p>
              </div>
              <Shield className="w-8 h-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success border-success/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm font-medium">Low Risk Projects</p>
                <p className="text-3xl font-bold text-success-foreground">
                  {riskDistribution.low}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning border-warning/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-foreground/80 text-sm font-medium">Medium-High Risk</p>
                <p className="text-3xl font-bold text-warning-foreground">
                  {riskDistribution.medium + riskDistribution.high}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-destructive/30 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Critical Risk</p>
                <p className="text-3xl font-bold text-destructive">
                  {riskDistribution.critical}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
          <TabsTrigger value="overview">Risk Overview</TabsTrigger>
          <TabsTrigger value="complexity">Complexity Analysis</TabsTrigger>
          <TabsTrigger value="factors">Risk Factors</TabsTrigger>
          <TabsTrigger value="mitigation">Mitigation Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAnalyses.map((analysis) => {
              const RiskIcon = getRiskIcon(analysis.riskLevel)
              return (
                <Card key={analysis.id} className="border border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{analysis.processName}</CardTitle>
                        <CardDescription>{analysis.department}</CardDescription>
                      </div>
                      <Badge variant="secondary" className={`bg-${getRiskColor(analysis.riskLevel)}/20 text-${getRiskColor(analysis.riskLevel)}`}>
                        <RiskIcon className="w-4 h-4 mr-1" />
                        {analysis.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Risk Score</span>
                          <span className="font-medium">{analysis.overallRiskScore}/10</span>
                        </div>
                        <Progress value={analysis.overallRiskScore * 10} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground block">Investment Size</span>
                          <span className="font-medium">{formatCurrency(analysis.investmentSize)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Automation Level</span>
                          <span className="font-medium">{analysis.automationLevel}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground text-sm block mb-2">Key Risk Factors</span>
                        <div className="space-y-1">
                          {analysis.riskFactors.slice(0, 2).map((factor, idx) => (
                            <div key={idx} className="text-sm flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full bg-${getRiskColor(factor.impact)}`} />
                              <span>{factor.factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="complexity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Complexity Analysis</CardTitle>
              <CardDescription>Technical complexity, resource requirements, and implementation challenges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredAnalyses.map((analysis) => (
                  <div key={analysis.id} className="p-4 border border-border rounded-lg bg-gradient-card">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{analysis.processName}</h4>
                        <p className="text-sm text-muted-foreground">{analysis.department}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{analysis.complexity}%</div>
                        <div className="text-sm text-muted-foreground">Complexity Score</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-card rounded-lg">
                        <div className="text-lg font-bold text-primary">{formatCurrency(analysis.investmentSize)}</div>
                        <div className="text-sm text-muted-foreground">Investment</div>
                      </div>
                      <div className="text-center p-3 bg-card rounded-lg">
                        <div className="text-lg font-bold text-warning">{analysis.automationLevel}%</div>
                        <div className="text-sm text-muted-foreground">Automation</div>
                      </div>
                      <div className="text-center p-3 bg-card rounded-lg">
                        <div className="text-lg font-bold text-destructive">{analysis.overallRiskScore}/10</div>
                        <div className="text-sm text-muted-foreground">Risk Score</div>
                      </div>
                    </div>
                    
                    <Progress value={analysis.complexity} className="h-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAnalyses.map((analysis) => (
              <Card key={analysis.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{analysis.processName}</CardTitle>
                  <CardDescription>{analysis.department} • Risk Score: {analysis.overallRiskScore}/10</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.riskFactors.map((factor, idx) => (
                      <div key={idx} className="p-3 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-sm">{factor.factor}</h5>
                          <Badge variant="outline" className={`text-${getRiskColor(factor.impact)}`}>
                            {factor.impact.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                          <span>Impact: {factor.impact}</span>
                          <span>Probability: {factor.probability}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{factor.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mitigation" className="space-y-4">
          <div className="space-y-6">
            {filteredAnalyses.map((analysis) => (
              <Card key={analysis.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{analysis.processName}</CardTitle>
                      <CardDescription>{analysis.department}</CardDescription>
                    </div>
                    <Badge variant="secondary" className={`bg-${getRiskColor(analysis.riskLevel)}/20 text-${getRiskColor(analysis.riskLevel)}`}>
                      {analysis.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Mitigation Strategy:</strong> Based on {analysis.riskLevel} risk classification and complexity analysis.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-3">
                      <h5 className="font-semibold text-sm">Recommended Actions:</h5>
                      {analysis.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gradient-card rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">{idx + 1}</span>
                          </div>
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h5 className="font-semibold text-sm mb-3">Risk Factor Mitigations:</h5>
                      <div className="space-y-2">
                        {analysis.riskFactors.map((factor, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">{factor.category}:</span>
                            <span className="text-muted-foreground ml-2">{factor.mitigation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}