import { useState } from "react"
import { Calculator, TrendingUp, Clock, DollarSign, Target, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { dummyROICalculations, ROICalculation } from "@/utils/roiCalculations"

interface PaybackAnalysis {
  id: string
  processName: string
  department: string
  investmentCost: number
  annualSavings: number
  paybackPeriod: number
  npv: number
  irr: number
  breakEvenDate: Date
  cumulativeSavings: Array<{ month: number; value: number }>
}

export function PaybackCalculator() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("60") // months
  
  const departments = Array.from(new Set(dummyROICalculations.map(calc => calc.department)))
  
  const filteredCalculations = selectedDepartment === "all" 
    ? dummyROICalculations 
    : dummyROICalculations.filter(calc => calc.department === selectedDepartment)

  // Generate payback analyses
  const paybackAnalyses: PaybackAnalysis[] = filteredCalculations.map(calc => {
    const investmentCost = Object.values(calc.implementationCosts).reduce((sum, cost) => sum + cost, 0)
    const annualSavings = calc.calculatedMetrics?.annualCostSavings || 0
    const paybackPeriod = calc.calculatedMetrics?.paybackPeriod || 0
    const npv = calc.calculatedMetrics?.npv || 0
    const irr = calc.calculatedMetrics?.irr || 0
    
    const breakEvenDate = new Date()
    breakEvenDate.setMonth(breakEvenDate.getMonth() + paybackPeriod)
    
    // Generate cumulative savings over time
    const monthlySavings = annualSavings / 12
    const cumulativeSavings = []
    let cumulative = -investmentCost
    
    for (let month = 0; month <= parseInt(selectedTimeframe); month++) {
      if (month > 0) {
        cumulative += monthlySavings
      }
      cumulativeSavings.push({ month, value: cumulative })
    }
    
    return {
      id: calc.id,
      processName: calc.processName,
      department: calc.department,
      investmentCost,
      annualSavings,
      paybackPeriod,
      npv,
      irr,
      breakEvenDate,
      cumulativeSavings
    }
  })

  // Calculate aggregate metrics
  const avgPaybackPeriod = paybackAnalyses.reduce((sum, analysis) => sum + analysis.paybackPeriod, 0) / paybackAnalyses.length
  const totalInvestment = paybackAnalyses.reduce((sum, analysis) => sum + analysis.investmentCost, 0)
  const totalAnnualSavings = paybackAnalyses.reduce((sum, analysis) => sum + analysis.annualSavings, 0)
  const avgNPV = paybackAnalyses.reduce((sum, analysis) => sum + analysis.npv, 0) / paybackAnalyses.length
  const avgIRR = paybackAnalyses.reduce((sum, analysis) => sum + analysis.irr, 0) / paybackAnalyses.length

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short',
      day: 'numeric'
    })
  }

  const getPaybackStatus = (months: number) => {
    if (months <= 12) return { status: 'Excellent', color: 'success' }
    if (months <= 24) return { status: 'Good', color: 'primary' }
    if (months <= 36) return { status: 'Fair', color: 'warning' }
    return { status: 'Poor', color: 'destructive' }
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payback Period Calculator</h2>
          <p className="text-muted-foreground">Break-even analysis, NPV and IRR calculations with timeline projections</p>
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
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="36">3 Years</SelectItem>
              <SelectItem value="60">5 Years</SelectItem>
              <SelectItem value="84">7 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-primary border-primary/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Avg Payback Period</p>
                <p className="text-2xl font-bold text-primary-foreground">
                  {avgPaybackPeriod.toFixed(1)} months
                </p>
              </div>
              <Clock className="w-8 h-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success border-success/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm font-medium">Average NPV</p>
                <p className="text-2xl font-bold text-success-foreground">
                  {formatCurrency(avgNPV)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-success-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning border-warning/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-foreground/80 text-sm font-medium">Average IRR</p>
                <p className="text-2xl font-bold text-warning-foreground">
                  {avgIRR.toFixed(1)}%
                </p>
              </div>
              <Calculator className="w-8 h-8 text-warning-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Investment</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(totalInvestment)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payback Analysis Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Break-even Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Break-even Timeline
            </CardTitle>
            <CardDescription>
              When each project reaches profitability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paybackAnalyses
                .sort((a, b) => a.paybackPeriod - b.paybackPeriod)
                .map((analysis) => {
                  const status = getPaybackStatus(analysis.paybackPeriod)
                  return (
                    <div key={analysis.id} className="p-4 border border-border rounded-lg bg-gradient-card">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{analysis.processName}</h4>
                          <p className="text-sm text-muted-foreground">{analysis.department}</p>
                        </div>
                        <Badge variant="secondary" className={`bg-${status.color}/20 text-${status.color}`}>
                          {status.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Break-even Date:</span>
                          <div className="font-medium">{formatDate(analysis.breakEvenDate)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Payback Period:</span>
                          <div className="font-medium">{analysis.paybackPeriod.toFixed(1)} months</div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Progress value={(analysis.paybackPeriod / 48) * 100} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0 months</span>
                          <span>48 months</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>

        {/* Financial Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Financial Analysis
            </CardTitle>
            <CardDescription>
              NPV, IRR, and investment returns by project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paybackAnalyses
                .sort((a, b) => b.npv - a.npv)
                .map((analysis) => (
                  <div key={analysis.id} className="p-4 border border-border rounded-lg bg-gradient-card">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{analysis.processName}</h4>
                        <p className="text-sm text-muted-foreground">{analysis.department}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${analysis.npv > 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(analysis.npv)}
                        </div>
                        <div className="text-sm text-muted-foreground">NPV</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block">Investment</span>
                        <span className="font-medium">{formatCurrency(analysis.investmentCost)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Annual Savings</span>
                        <span className="font-medium text-success">{formatCurrency(analysis.annualSavings)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">IRR</span>
                        <span className="font-medium">{analysis.irr.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cumulative Savings Projection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Cumulative Savings Projection
          </CardTitle>
          <CardDescription>
            Portfolio-level cash flow and break-even analysis over {selectedTimeframe} months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-gradient-card rounded-lg border">
                <div className="text-2xl font-bold text-primary">{formatCurrency(totalInvestment)}</div>
                <div className="text-sm text-muted-foreground">Initial Investment</div>
              </div>
              <div className="p-4 bg-gradient-card rounded-lg border">
                <div className="text-2xl font-bold text-success">{formatCurrency(totalAnnualSavings)}</div>
                <div className="text-sm text-muted-foreground">Annual Savings</div>
              </div>
              <div className="p-4 bg-gradient-card rounded-lg border">
                <div className="text-2xl font-bold text-warning">{avgPaybackPeriod.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Avg Payback (months)</div>
              </div>
              <div className="p-4 bg-gradient-card rounded-lg border">
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency((totalAnnualSavings * parseInt(selectedTimeframe) / 12) - totalInvestment)}
                </div>
                <div className="text-sm text-muted-foreground">Net Benefit ({selectedTimeframe}mo)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}