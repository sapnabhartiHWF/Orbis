import { useState } from "react"
import { Calculator, TrendingUp, DollarSign, Clock, Users, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function BusinessROICalculator() {
  const [inputs, setInputs] = useState({
    currentCost: 50000,
    timeSpent: 40,
    employeeCount: 5,
    automationCost: 25000,
    efficiencyGain: 80,
    errorReduction: 90
  })

  const calculations = {
    annualSavings: inputs.currentCost * (inputs.efficiencyGain / 100),
    paybackPeriod: inputs.automationCost / (inputs.currentCost * (inputs.efficiencyGain / 100) / 12),
    roi: ((inputs.currentCost * (inputs.efficiencyGain / 100) - inputs.automationCost) / inputs.automationCost) * 100,
    fiveYearValue: (inputs.currentCost * (inputs.efficiencyGain / 100) * 5) - inputs.automationCost
  }

  const getRoiColor = (roi: number) => {
    if (roi >= 200) return "text-success bg-success/10 border-success/20"
    if (roi >= 100) return "text-warning bg-warning/10 border-warning/20"
    return "text-destructive bg-destructive/10 border-destructive/20"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-semibold">Business ROI Calculator</h2>
          <p className="text-muted-foreground">Calculate the expected return on investment for process automation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Process Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Annual Process Cost ($)</Label>
              <Input
                type="number"
                value={inputs.currentCost}
                onChange={(e) => setInputs({...inputs, currentCost: Number(e.target.value)})}
                className="text-lg font-semibold"
              />
              <p className="text-xs text-muted-foreground">Total cost of current manual process per year</p>
            </div>

            <div className="space-y-2">
              <Label>Weekly Hours Spent: {inputs.timeSpent}h</Label>
              <Slider
                value={[inputs.timeSpent]}
                onValueChange={(value) => setInputs({...inputs, timeSpent: value[0]})}
                max={100}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>People Involved</Label>
              <Input
                type="number"
                value={inputs.employeeCount}
                onChange={(e) => setInputs({...inputs, employeeCount: Number(e.target.value)})}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Automation Investment ($)</Label>
              <Input
                type="number"
                value={inputs.automationCost}
                onChange={(e) => setInputs({...inputs, automationCost: Number(e.target.value)})}
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label>Expected Efficiency Gain: {inputs.efficiencyGain}%</Label>
              <Slider
                value={[inputs.efficiencyGain]}
                onValueChange={(value) => setInputs({...inputs, efficiencyGain: value[0]})}
                max={95}
                min={10}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Error Reduction: {inputs.errorReduction}%</Label>
              <Slider
                value={[inputs.errorReduction]}
                onValueChange={(value) => setInputs({...inputs, errorReduction: value[0]})}
                max={99}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              ROI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">Annual Savings</span>
                </div>
                <p className="text-2xl font-bold text-success">
                  ${calculations.annualSavings.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Payback Period</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {calculations.paybackPeriod.toFixed(1)} months
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Return on Investment</p>
                <Badge className={`${getRoiColor(calculations.roi)} text-2xl font-bold px-4 py-2`}>
                  {calculations.roi.toFixed(0)}%
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">5-Year Net Value</span>
                  <span className="font-semibold text-success">
                    ${calculations.fiveYearValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Break-even</span>
                  <span className="font-semibold">
                    {new Date(Date.now() + calculations.paybackPeriod * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Business Impact Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Free up {Math.round(inputs.timeSpent * inputs.employeeCount * (inputs.efficiencyGain / 100))} hours/week</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span>Reduce errors by {inputs.errorReduction}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span>Process efficiency improved by {inputs.efficiencyGain}%</span>
                </div>
              </div>
            </div>

            <Button className="w-full bg-gradient-primary">
              Generate Business Case
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}