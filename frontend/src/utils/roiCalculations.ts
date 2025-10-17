export interface ROICalculation {
  id: string
  processName: string
  department: string
  currentState: {
    annualVolume: number
    timePerTransaction: number // in minutes
    errorRate: number // percentage
    resourceCost: number // hourly rate
    annualOperatingCost: number
  }
  proposedState: {
    automationLevel: number // percentage
    timePerTransaction: number
    errorRate: number
    maintenanceCost: number
    licensingCost: number
  }
  implementationCosts: {
    development: number
    training: number
    infrastructure: number
    testing: number
    deployment: number
  }
  calculatedMetrics?: ROIMetrics
}

export interface ROIMetrics {
  annualTimeSavings: number // hours
  annualCostSavings: number
  implementationCost: number
  netROI: number
  roiPercentage: number
  paybackPeriod: number // months
  npv: number // Net Present Value
  irr: number // Internal Rate of Return
  efficiencyGain: number // percentage
  errorReduction: number // percentage
  throughputImprovement: number // percentage
  riskScore: number // 1-10 scale
}

export interface DepartmentROI {
  department: string
  totalInvestment: number
  totalSavings: number
  roi: number
  processCount: number
  averagePayback: number
  riskLevel: 'low' | 'medium' | 'high'
}

export interface RiskFactor {
  category: string
  factor: string
  impact: 'low' | 'medium' | 'high'
  probability: 'low' | 'medium' | 'high'
  mitigation: string
  score: number
}

// ROI Calculation Functions
export function calculateROIMetrics(calculation: ROICalculation): ROIMetrics {
  const { currentState, proposedState, implementationCosts } = calculation

  // Calculate current annual costs
  const currentAnnualHours = (currentState.annualVolume * currentState.timePerTransaction) / 60
  const currentAnnualCost = currentAnnualHours * currentState.resourceCost + currentState.annualOperatingCost

  // Calculate proposed annual costs
  const automatedVolume = currentState.annualVolume * (proposedState.automationLevel / 100)
  const manualVolume = currentState.annualVolume * (1 - proposedState.automationLevel / 100)
  
  const proposedAnnualHours = (automatedVolume * proposedState.timePerTransaction + manualVolume * currentState.timePerTransaction) / 60
  const proposedAnnualCost = proposedAnnualHours * currentState.resourceCost + proposedState.maintenanceCost + proposedState.licensingCost

  // Calculate savings and metrics
  const annualTimeSavings = currentAnnualHours - proposedAnnualHours
  const annualCostSavings = currentAnnualCost - proposedAnnualCost
  
  const totalImplementationCost = Object.values(implementationCosts).reduce((sum, cost) => sum + cost, 0)
  
  const netROI = annualCostSavings - totalImplementationCost
  const roiPercentage = totalImplementationCost > 0 ? (netROI / totalImplementationCost) * 100 : 0
  const paybackPeriod = annualCostSavings > 0 ? totalImplementationCost / annualCostSavings * 12 : 0

  // Calculate NPV (assuming 10% discount rate for 5 years)
  const discountRate = 0.1
  const years = 5
  let npv = -totalImplementationCost
  for (let year = 1; year <= years; year++) {
    npv += annualCostSavings / Math.pow(1 + discountRate, year)
  }

  // Calculate efficiency gains
  const efficiencyGain = ((currentAnnualHours - proposedAnnualHours) / currentAnnualHours) * 100
  const errorReduction = ((currentState.errorRate - proposedState.errorRate) / currentState.errorRate) * 100
  const throughputImprovement = (proposedState.automationLevel / 100) * 
    ((currentState.timePerTransaction - proposedState.timePerTransaction) / currentState.timePerTransaction) * 100

  // Calculate risk score (simplified)
  const complexityRisk = totalImplementationCost > 500000 ? 3 : totalImplementationCost > 100000 ? 2 : 1
  const automationRisk = proposedState.automationLevel > 80 ? 3 : proposedState.automationLevel > 50 ? 2 : 1
  const riskScore = Math.min(10, complexityRisk + automationRisk + (paybackPeriod > 24 ? 2 : paybackPeriod > 12 ? 1 : 0))

  return {
    annualTimeSavings,
    annualCostSavings,
    implementationCost: totalImplementationCost,
    netROI,
    roiPercentage,
    paybackPeriod,
    npv,
    irr: calculateIRR([-totalImplementationCost, ...Array(5).fill(annualCostSavings)]),
    efficiencyGain,
    errorReduction,
    throughputImprovement,
    riskScore
  }
}

export function calculateIRR(cashflows: number[]): number {
  // Simplified IRR calculation using iterative method
  let rate = 0.1
  const maxIterations = 100
  const tolerance = 0.0001

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0
    let derivative = 0

    for (let j = 0; j < cashflows.length; j++) {
      npv += cashflows[j] / Math.pow(1 + rate, j)
      if (j > 0) {
        derivative -= j * cashflows[j] / Math.pow(1 + rate, j + 1)
      }
    }

    if (Math.abs(npv) < tolerance) break
    if (Math.abs(derivative) < tolerance) break

    rate = rate - npv / derivative
  }

  return rate * 100 // Return as percentage
}

export function assessRisk(calculation: ROICalculation): RiskFactor[] {
  const { proposedState, implementationCosts } = calculation
  const totalCost = Object.values(implementationCosts).reduce((sum, cost) => sum + cost, 0)
  
  const risks: RiskFactor[] = [
    {
      category: "Technical",
      factor: "Implementation Complexity",
      impact: totalCost > 500000 ? 'high' : totalCost > 100000 ? 'medium' : 'low',
      probability: proposedState.automationLevel > 80 ? 'high' : proposedState.automationLevel > 50 ? 'medium' : 'low',
      mitigation: "Phased implementation approach with pilot testing",
      score: totalCost > 500000 ? 8 : totalCost > 100000 ? 5 : 3
    },
    {
      category: "Operational",
      factor: "Change Management",
      impact: proposedState.automationLevel > 70 ? 'high' : 'medium',
      probability: 'medium',
      mitigation: "Comprehensive training and communication plan",
      score: proposedState.automationLevel > 70 ? 6 : 4
    },
    {
      category: "Financial",
      factor: "Cost Overrun Risk",
      impact: totalCost > 300000 ? 'high' : 'medium',
      probability: 'medium',
      mitigation: "Detailed project planning with contingency budget",
      score: totalCost > 300000 ? 7 : 4
    },
    {
      category: "Strategic",
      factor: "Technology Obsolescence",
      impact: 'medium',
      probability: 'low',
      mitigation: "Regular technology roadmap reviews and updates",
      score: 3
    }
  ]

  return risks
}

export function calculateDepartmentROI(calculations: ROICalculation[]): DepartmentROI[] {
  const departmentGroups = calculations.reduce((groups, calc) => {
    const dept = calc.department
    if (!groups[dept]) {
      groups[dept] = []
    }
    groups[dept].push(calc)
    return groups
  }, {} as Record<string, ROICalculation[]>)

  return Object.entries(departmentGroups).map(([department, calcs]) => {
    const totalInvestment = calcs.reduce((sum, calc) => {
      return sum + Object.values(calc.implementationCosts).reduce((total, cost) => total + cost, 0)
    }, 0)

    const totalSavings = calcs.reduce((sum, calc) => {
      const metrics = calculateROIMetrics(calc)
      return sum + metrics.annualCostSavings
    }, 0)

    const roi = totalInvestment > 0 ? ((totalSavings - totalInvestment) / totalInvestment) * 100 : 0

    const paybackPeriods = calcs.map(calc => calculateROIMetrics(calc).paybackPeriod)
    const averagePayback = paybackPeriods.reduce((sum, period) => sum + period, 0) / paybackPeriods.length

    const averageRisk = calcs.reduce((sum, calc) => sum + calculateROIMetrics(calc).riskScore, 0) / calcs.length
    const riskLevel: 'low' | 'medium' | 'high' = averageRisk < 4 ? 'low' : averageRisk < 7 ? 'medium' : 'high'

    return {
      department,
      totalInvestment,
      totalSavings,
      roi,
      processCount: calcs.length,
      averagePayback,
      riskLevel
    }
  })
}

export const dummyROICalculations: ROICalculation[] = [
  {
    id: 'roi1',
    processName: 'Invoice Processing Automation',
    department: 'Finance',
    currentState: {
      annualVolume: 24000,
      timePerTransaction: 15,
      errorRate: 5,
      resourceCost: 35,
      annualOperatingCost: 50000
    },
    proposedState: {
      automationLevel: 85,
      timePerTransaction: 3,
      errorRate: 0.5,
      maintenanceCost: 15000,
      licensingCost: 25000
    },
    implementationCosts: {
      development: 150000,
      training: 25000,
      infrastructure: 40000,
      testing: 20000,
      deployment: 15000
    }
  },
  {
    id: 'roi2',
    processName: 'Employee Onboarding System',
    department: 'HR',
    currentState: {
      annualVolume: 500,
      timePerTransaction: 240,
      errorRate: 8,
      resourceCost: 45,
      annualOperatingCost: 30000
    },
    proposedState: {
      automationLevel: 70,
      timePerTransaction: 60,
      errorRate: 1,
      maintenanceCost: 8000,
      licensingCost: 12000
    },
    implementationCosts: {
      development: 80000,
      training: 15000,
      infrastructure: 20000,
      testing: 10000,
      deployment: 8000
    }
  },
  {
    id: 'roi3',
    processName: 'Customer Data Reconciliation',
    department: 'Operations',
    currentState: {
      annualVolume: 12000,
      timePerTransaction: 45,
      errorRate: 12,
      resourceCost: 40,
      annualOperatingCost: 35000
    },
    proposedState: {
      automationLevel: 90,
      timePerTransaction: 8,
      errorRate: 1.5,
      maintenanceCost: 20000,
      licensingCost: 30000
    },
    implementationCosts: {
      development: 200000,
      training: 30000,
      infrastructure: 50000,
      testing: 25000,
      deployment: 20000
    }
  },
  {
    id: 'roi4',
    processName: 'IT Ticket Classification',
    department: 'IT',
    currentState: {
      annualVolume: 8000,
      timePerTransaction: 10,
      errorRate: 15,
      resourceCost: 50,
      annualOperatingCost: 25000
    },
    proposedState: {
      automationLevel: 95,
      timePerTransaction: 2,
      errorRate: 2,
      maintenanceCost: 12000,
      licensingCost: 18000
    },
    implementationCosts: {
      development: 120000,
      training: 20000,
      infrastructure: 35000,
      testing: 15000,
      deployment: 10000
    }
  },
  {
    id: 'roi5',
    processName: 'Purchase Order Processing',
    department: 'Procurement',
    currentState: {
      annualVolume: 6000,
      timePerTransaction: 30,
      errorRate: 6,
      resourceCost: 38,
      annualOperatingCost: 28000
    },
    proposedState: {
      automationLevel: 75,
      timePerTransaction: 8,
      errorRate: 1,
      maintenanceCost: 10000,
      licensingCost: 15000
    },
    implementationCosts: {
      development: 100000,
      training: 18000,
      infrastructure: 25000,
      testing: 12000,
      deployment: 8000
    }
  }
]

// Add calculated metrics to dummy data
dummyROICalculations.forEach(calc => {
  calc.calculatedMetrics = calculateROIMetrics(calc)
})