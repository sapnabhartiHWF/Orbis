import { useState, useEffect } from "react"
import { 
  Calculator, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Minus,
  Target,
  Zap
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { ROICalculation, calculateROIMetrics, ROIMetrics } from "@/utils/roiCalculations"

interface CostBenefitCalculatorProps {
  onCalculationSave?: (calculation: ROICalculation) => void
}

export function CostBenefitCalculator({ onCalculationSave }: CostBenefitCalculatorProps) {
  const [calculation, setCalculation] = useState<ROICalculation>({
    id: '',
    processName: '',
    department: 'Finance',
    currentState: {
      annualVolume: 10000,
      timePerTransaction: 20,
      errorRate: 5,
      resourceCost: 35,
      annualOperatingCost: 50000
    },
    proposedState: {
      automationLevel: 80,
      timePerTransaction: 5,
      errorRate: 1,
      maintenanceCost: 15000,
      licensingCost: 20000
    },
    implementationCosts: {
      development: 100000,
      training: 20000,
      infrastructure: 30000,
      testing: 15000,
      deployment: 10000
    }
  })

  const [metrics, setMetrics] = useState<ROIMetrics | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsCalculating(true)
      const calculatedMetrics = calculateROIMetrics(calculation)
      setMetrics(calculatedMetrics)
      setIsCalculating(false)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [calculation])

  const updateCurrentState = (field: keyof ROICalculation['currentState'], value: number) => {
    setCalculation(prev => ({
      ...prev,
      currentState: {
        ...prev.currentState,
        [field]: value
      }
    }))
  }

  const updateProposedState = (field: keyof ROICalculation['proposedState'], value: number) => {
    setCalculation(prev => ({
      ...prev,
      proposedState: {
        ...prev.proposedState,
        [field]: value
      }
    }))
  }

  const updateImplementationCost = (field: keyof ROICalculation['implementationCosts'], value: number) => {
    setCalculation(prev => ({
      ...prev,
      implementationCosts: {
        ...prev.implementationCosts,
        [field]: value
      }
    }))
  }

  const handleSaveCalculation = () => {
    if (!calculation.processName.trim()) {
      toast({
        title: "Process name required",
        description: "Please enter a process name before saving.",
        variant: "destructive"
      })
      return
    }

    const savedCalculation = {
      ...calculation,
      id: `roi_${Date.now()}`,
      calculatedMetrics: metrics || undefined
    }

    onCalculationSave?.(savedCalculation)
    toast({
      title: "Calculation saved! 💰",
      description: "Your ROI calculation has been saved successfully.",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(num))
  }

  const getROIColor = (roi: number) => {
    if (roi > 200) return 'text-success'
    if (roi > 100) return 'text-primary'
    if (roi > 0) return 'text-warning'
    return 'text-destructive'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Cost-Benefit Calculator</h3>
          <p className="text-muted-foreground">Calculate ROI for automation investments</p>
        </div>
        
        <Button onClick={handleSaveCalculation} disabled={!calculation.processName.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          Save Calculation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Process Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="processName">Process Name</Label>
                  <Input
                    id="processName"
                    placeholder="e.g., Invoice Processing"
                    value={calculation.processName}
                    onChange={(e) => setCalculation(prev => ({ ...prev, processName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    placeholder="e.g., Finance"
                    value={calculation.department}
                    onChange={(e) => setCalculation(prev => ({ ...prev, department: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current State */}
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                Current State Analysis
              </CardTitle>
              <CardDescription>
                Define the baseline metrics for your current manual process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Annual Transaction Volume</Label>
                  <Input
                    type="number"
                    value={calculation.currentState.annualVolume}
                    onChange={(e) => updateCurrentState('annualVolume', parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">Number of transactions per year</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Time per Transaction (minutes)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={calculation.currentState.timePerTransaction}
                    onChange={(e) => updateCurrentState('timePerTransaction', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">Average processing time</p>
                </div>

                <div className="space-y-2">
                  <Label>Error Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={calculation.currentState.errorRate}
                    onChange={(e) => updateCurrentState('errorRate', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">Current error percentage</p>
                </div>

                <div className="space-y-2">
                  <Label>Hourly Resource Cost ($)</Label>
                  <Input
                    type="number"
                    value={calculation.currentState.resourceCost}
                    onChange={(e) => updateCurrentState('resourceCost', parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">Average hourly wage</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Annual Operating Costs ($)</Label>
                <Input
                  type="number"
                  value={calculation.currentState.annualOperatingCost}
                  onChange={(e) => updateCurrentState('annualOperatingCost', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Additional annual costs (software, overhead, etc.)</p>
              </div>
            </CardContent>
          </Card>

          {/* Proposed State */}
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-success" />
                Proposed Automation State
              </CardTitle>
              <CardDescription>
                Define the expected performance after automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Automation Level</Label>
                    <span className="text-sm font-medium">{calculation.proposedState.automationLevel}%</span>
                  </div>
                  <Slider
                    value={[calculation.proposedState.automationLevel]}
                    onValueChange={(values) => updateProposedState('automationLevel', values[0])}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Percentage of transactions to be automated</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Automated Time per Transaction (minutes)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={calculation.proposedState.timePerTransaction}
                      onChange={(e) => updateProposedState('timePerTransaction', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expected Error Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={calculation.proposedState.errorRate}
                      onChange={(e) => updateProposedState('errorRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Annual Maintenance Cost ($)</Label>
                    <Input
                      type="number"
                      value={calculation.proposedState.maintenanceCost}
                      onChange={(e) => updateProposedState('maintenanceCost', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Annual Licensing Cost ($)</Label>
                    <Input
                      type="number"
                      value={calculation.proposedState.licensingCost}
                      onChange={(e) => updateProposedState('licensingCost', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Implementation Costs */}
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Implementation Investment
              </CardTitle>
              <CardDescription>
                Break down the one-time implementation costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Development Cost ($)</Label>
                  <Input
                    type="number"
                    value={calculation.implementationCosts.development}
                    onChange={(e) => updateImplementationCost('development', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Training Cost ($)</Label>
                  <Input
                    type="number"
                    value={calculation.implementationCosts.training}
                    onChange={(e) => updateImplementationCost('training', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Infrastructure Cost ($)</Label>
                  <Input
                    type="number"
                    value={calculation.implementationCosts.infrastructure}
                    onChange={(e) => updateImplementationCost('infrastructure', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Testing Cost ($)</Label>
                  <Input
                    type="number"
                    value={calculation.implementationCosts.testing}
                    onChange={(e) => updateImplementationCost('testing', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Deployment Cost ($)</Label>
                  <Input
                    type="number"
                    value={calculation.implementationCosts.deployment}
                    onChange={(e) => updateImplementationCost('deployment', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2 flex items-end">
                  <div className="w-full p-3 bg-muted/30 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Investment</div>
                    <div className="text-xl font-bold">
                      {formatCurrency(Object.values(calculation.implementationCosts).reduce((sum, cost) => sum + cost, 0))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* ROI Summary */}
          <Card className="bg-gradient-primary border-primary/30 shadow-glow">
            <CardHeader>
              <CardTitle className="text-primary-foreground">
                ROI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-primary-foreground space-y-4">
              {metrics ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-primary-foreground/80">ROI Percentage</span>
                      <span className={`font-bold text-xl ${metrics.roiPercentage > 0 ? 'text-white' : 'text-red-200'}`}>
                        {metrics.roiPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(Math.max(metrics.roiPercentage, 0), 500)} 
                      max={500}
                      className="h-2"
                    />
                  </div>

                  <Separator className="bg-primary-foreground/20" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-primary-foreground/80">Annual Savings</span>
                      <span className="font-medium">{formatCurrency(metrics.annualCostSavings)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-foreground/80">Implementation Cost</span>
                      <span className="font-medium">{formatCurrency(metrics.implementationCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-foreground/80">Net ROI (Year 1)</span>
                      <span className={`font-bold ${metrics.netROI > 0 ? 'text-white' : 'text-red-200'}`}>
                        {formatCurrency(metrics.netROI)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Calculator className="w-8 h-8 mx-auto mb-2 text-primary-foreground/60" />
                    <p className="text-primary-foreground/80">Calculating ROI...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Metrics */}
          {metrics && (
            <>
              <Card className="bg-card border-border shadow-card">
                <CardHeader>
                  <CardTitle>Payback Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payback Period</span>
                      <Badge variant={metrics.paybackPeriod < 12 ? 'default' : metrics.paybackPeriod < 24 ? 'secondary' : 'destructive'}>
                        {metrics.paybackPeriod.toFixed(1)} months
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">NPV (5 years)</span>
                      <span className={`font-medium ${metrics.npv > 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(metrics.npv)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IRR</span>
                      <span className="font-medium text-primary">
                        {metrics.irr.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-card">
                <CardHeader>
                  <CardTitle>Performance Gains</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Efficiency Gain</span>
                        <span className="font-medium text-success">{metrics.efficiencyGain.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(metrics.efficiencyGain, 100)} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Error Reduction</span>
                        <span className="font-medium text-success">{metrics.errorReduction.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(metrics.errorReduction, 100)} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Throughput Improvement</span>
                        <span className="font-medium text-primary">{metrics.throughputImprovement.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(metrics.throughputImprovement, 100)} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-card">
                <CardHeader>
                  <CardTitle>Time Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-success mb-2">
                      {formatNumber(metrics.annualTimeSavings)}
                    </div>
                    <div className="text-muted-foreground">Hours saved annually</div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Equivalent to {(metrics.annualTimeSavings / 2080).toFixed(1)} FTE positions
                    </div>
                  </div>
                </CardContent>
              </Card>

              {metrics.riskScore > 5 && (
                <Card className="bg-destructive/10 border-destructive/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-5 h-5" />
                      Risk Warning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-destructive text-sm">
                      This project has a high risk score ({metrics.riskScore}/10). 
                      Consider risk mitigation strategies and phased implementation.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}