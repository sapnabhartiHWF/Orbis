import { useState } from "react"
import { TrendingUp, TrendingDown, Zap, Target, AlertCircle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { dummyROICalculations, ROICalculation } from "@/utils/roiCalculations"

export function ImpactMetrics() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  
  const departments = Array.from(new Set(dummyROICalculations.map(calc => calc.department)))
  
  const filteredCalculations = selectedDepartment === "all" 
    ? dummyROICalculations 
    : dummyROICalculations.filter(calc => calc.department === selectedDepartment)

  // Calculate aggregate metrics
  const totalEfficiencyGain = filteredCalculations.reduce((sum, calc) => {
    return sum + (calc.calculatedMetrics?.efficiencyGain || 0)
  }, 0) / filteredCalculations.length

  const totalErrorReduction = filteredCalculations.reduce((sum, calc) => {
    return sum + (calc.calculatedMetrics?.errorReduction || 0)
  }, 0) / filteredCalculations.length

  const totalThroughputImprovement = filteredCalculations.reduce((sum, calc) => {
    return sum + (calc.calculatedMetrics?.throughputImprovement || 0)
  }, 0) / filteredCalculations.length

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  const getImpactLevel = (value: number) => {
    if (value >= 80) return { level: 'High', color: 'success' }
    if (value >= 50) return { level: 'Medium', color: 'warning' }
    return { level: 'Low', color: 'destructive' }
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Impact Metrics Dashboard</h2>
          <p className="text-muted-foreground">Track efficiency gains, error reduction, and throughput improvements</p>
        </div>
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
      </div>

      {/* Key Impact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-success border-success/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-success" />
              </div>
              <Badge variant="secondary" className="bg-success/20 text-success">
                {getImpactLevel(totalEfficiencyGain).level} Impact
              </Badge>
            </div>
            <div>
              <p className="text-success-foreground/80 text-sm font-medium">Efficiency Gain</p>
              <p className="text-3xl font-bold text-success-foreground mb-2">
                {formatPercentage(totalEfficiencyGain)}
              </p>
              <Progress value={totalEfficiencyGain} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-primary border-primary/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {getImpactLevel(totalErrorReduction).level} Impact
              </Badge>
            </div>
            <div>
              <p className="text-primary-foreground/80 text-sm font-medium">Error Reduction</p>
              <p className="text-3xl font-bold text-primary-foreground mb-2">
                {formatPercentage(totalErrorReduction)}
              </p>
              <Progress value={totalErrorReduction} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning border-warning/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
              <Badge variant="secondary" className="bg-warning/20 text-warning">
                {getImpactLevel(totalThroughputImprovement).level} Impact
              </Badge>
            </div>
            <div>
              <p className="text-warning-foreground/80 text-sm font-medium">Throughput Improvement</p>
              <p className="text-3xl font-bold text-warning-foreground mb-2">
                {formatPercentage(totalThroughputImprovement)}
              </p>
              <Progress value={totalThroughputImprovement} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="efficiency" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
          <TabsTrigger value="efficiency">Efficiency Analysis</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="throughput">Throughput Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Efficiency Gains by Process
              </CardTitle>
              <CardDescription>
                Time savings and productivity improvements across all processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCalculations.map((calc) => {
                  const efficiency = calc.calculatedMetrics?.efficiencyGain || 0
                  const timeSavings = calc.calculatedMetrics?.annualTimeSavings || 0
                  return (
                    <div key={calc.id} className="p-4 border border-border rounded-lg bg-gradient-card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{calc.processName}</h4>
                          <p className="text-sm text-muted-foreground">{calc.department}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-success">
                            {formatPercentage(efficiency)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {timeSavings.toFixed(0)} hours/year saved
                          </div>
                        </div>
                      </div>
                      <Progress value={efficiency} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Error Reduction Analysis
              </CardTitle>
              <CardDescription>
                Quality improvements and error rate reductions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCalculations.map((calc) => {
                  const errorReduction = calc.calculatedMetrics?.errorReduction || 0
                  const currentError = calc.currentState.errorRate
                  const proposedError = calc.proposedState.errorRate
                  return (
                    <div key={calc.id} className="p-4 border border-border rounded-lg bg-gradient-card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{calc.processName}</h4>
                          <p className="text-sm text-muted-foreground">{calc.department}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {formatPercentage(errorReduction)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {currentError}% → {proposedError}% error rate
                          </div>
                        </div>
                      </div>
                      <Progress value={errorReduction} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="throughput" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Throughput Improvement Analysis
              </CardTitle>
              <CardDescription>
                Processing speed and volume capacity improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCalculations.map((calc) => {
                  const throughputImprovement = calc.calculatedMetrics?.throughputImprovement || 0
                  const currentTime = calc.currentState.timePerTransaction
                  const proposedTime = calc.proposedState.timePerTransaction
                  return (
                    <div key={calc.id} className="p-4 border border-border rounded-lg bg-gradient-card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{calc.processName}</h4>
                          <p className="text-sm text-muted-foreground">{calc.department}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-warning">
                            {formatPercentage(throughputImprovement)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {currentTime}min → {proposedTime}min per transaction
                          </div>
                        </div>
                      </div>
                      <Progress value={throughputImprovement} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}