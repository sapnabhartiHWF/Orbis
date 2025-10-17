import { useState } from "react"
import { 
  Calculator, 
  TrendingUp, 
  Target, 
  Shield, 
  BarChart3,
  DollarSign,
  Zap,
  AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CostBenefitCalculator } from "@/components/CostBenefitCalculator"
import { ROIProjections } from "@/components/ROIProjections"
import { ImpactMetrics } from "@/components/ImpactMetrics"
import { PaybackCalculator } from "@/components/PaybackCalculator"
import { RiskAssessment } from "@/components/RiskAssessment"
import { dummyROICalculations, calculateDepartmentROI, ROICalculation } from "@/utils/roiCalculations"

export default function ROIAssessmentEngine() {
  const [savedCalculations, setSavedCalculations] = useState<ROICalculation[]>(dummyROICalculations)

  // Calculate overview metrics
  const totalROI = savedCalculations.reduce((sum, calc) => {
    if (calc.calculatedMetrics) {
      return sum + calc.calculatedMetrics.roiPercentage
    }
    return sum
  }, 0) / savedCalculations.length

  const totalSavings = savedCalculations.reduce((sum, calc) => {
    if (calc.calculatedMetrics) {
      return sum + calc.calculatedMetrics.annualCostSavings
    }
    return sum
  }, 0)

  const totalInvestment = savedCalculations.reduce((sum, calc) => {
    return sum + Object.values(calc.implementationCosts).reduce((total, cost) => total + cost, 0)
  }, 0)

  const avgPayback = savedCalculations.reduce((sum, calc) => {
    if (calc.calculatedMetrics) {
      return sum + calc.calculatedMetrics.paybackPeriod
    }
    return sum
  }, 0) / savedCalculations.length

  const departmentROI = calculateDepartmentROI(savedCalculations)
  const highRiskProjects = savedCalculations.filter(calc => 
    calc.calculatedMetrics && calc.calculatedMetrics.riskScore > 6
  ).length

  const handleSaveCalculation = (calculation: ROICalculation) => {
    setSavedCalculations(prev => [...prev, calculation])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="flex-1 space-y-8 p-8 bg-background">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary rounded-2xl opacity-10 blur-3xl"></div>
        <div className="relative bg-gradient-card rounded-2xl p-8 border border-border shadow-elevated">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Calculator className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  ROI Assessment Engine
                </h1>
                <p className="text-muted-foreground text-lg">Comprehensive financial analysis & investment tracking</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-success border-success/30 shadow-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-success-foreground/80 text-sm font-medium">Average ROI</p>
                    <p className="text-2xl font-bold text-success-foreground">
                      {totalROI.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success-foreground/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-primary border-primary/30 shadow-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/80 text-sm font-medium">Total Savings</p>
                    <p className="text-2xl font-bold text-primary-foreground">
                      {formatCurrency(totalSavings)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary-foreground/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-warning border-warning/30 shadow-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-warning-foreground/80 text-sm font-medium">Avg Payback</p>
                    <p className="text-2xl font-bold text-warning-foreground">
                      {avgPayback.toFixed(1)} mo
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-warning-foreground/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">High Risk Projects</p>
                    <p className="text-2xl font-bold text-foreground">
                      {highRiskProjects}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Department ROI Overview */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Department ROI Dashboard
          </CardTitle>
          <CardDescription>
            ROI performance breakdown by department and team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departmentROI.map((dept) => (
              <div key={dept.department} className="p-4 bg-gradient-card rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{dept.department}</h4>
                  <div className={`w-3 h-3 rounded-full ${
                    dept.riskLevel === 'low' ? 'bg-success' :
                    dept.riskLevel === 'medium' ? 'bg-warning' : 'bg-destructive'
                  }`} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ROI</span>
                    <span className={`font-medium ${dept.roi > 100 ? 'text-success' : dept.roi > 0 ? 'text-primary' : 'text-destructive'}`}>
                      {dept.roi.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Investment</span>
                    <span className="font-medium">{formatCurrency(dept.totalInvestment)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Savings</span>
                    <span className="font-medium text-success">{formatCurrency(dept.totalSavings)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Projects</span>
                    <span className="font-medium">{dept.processCount}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Payback</span>
                    <span className="font-medium">{dept.averagePayback.toFixed(1)} months</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-card border border-border">
          <TabsTrigger value="calculator" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Cost-Benefit Calculator
          </TabsTrigger>
          <TabsTrigger value="projections" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            ROI Projections
          </TabsTrigger>
          <TabsTrigger value="impact" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Impact Metrics
          </TabsTrigger>
          <TabsTrigger value="payback" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Payback Calculator
          </TabsTrigger>
          <TabsTrigger value="risk" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Risk Assessment
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Portfolio View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <CostBenefitCalculator onCalculationSave={handleSaveCalculation} />
        </TabsContent>

        <TabsContent value="projections" className="space-y-6">
          <ROIProjections />
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          <ImpactMetrics />
        </TabsContent>

        <TabsContent value="payback" className="space-y-6">
          <PaybackCalculator />
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <RiskAssessment />
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Portfolio Overview
              </CardTitle>
              <CardDescription>
                Comprehensive view of all ROI calculations and investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedCalculations.map((calc) => (
                  <div key={calc.id} className="p-4 border border-border rounded-lg bg-gradient-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{calc.processName}</h4>
                        <p className="text-sm text-muted-foreground">{calc.department}</p>
                      </div>
                      {calc.calculatedMetrics && (
                        <div className="text-right">
                          <div className={`text-lg font-bold ${calc.calculatedMetrics.roiPercentage > 0 ? 'text-success' : 'text-destructive'}`}>
                            {calc.calculatedMetrics.roiPercentage.toFixed(1)}% ROI
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(calc.calculatedMetrics.annualCostSavings)} savings/year
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}