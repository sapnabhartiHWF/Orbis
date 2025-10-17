import { ReactNode } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    label: string
  }
  icon?: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function DashboardMetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  size = 'md'
}: DashboardMetricCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'border-success/20 bg-gradient-to-br from-success/5 to-success/10'
      case 'warning':
        return 'border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10'
      case 'danger':
        return 'border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10'
      default:
        return 'border-border bg-gradient-card'
    }
  }

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) return <TrendingUp className="w-3 h-3" />
    if (trend.value < 0) return <TrendingDown className="w-3 h-3" />
    return <Minus className="w-3 h-3" />
  }

  const getTrendColor = () => {
    if (!trend) return ''
    if (trend.value > 0) return 'text-success'
    if (trend.value < 0) return 'text-destructive'
    return 'text-muted-foreground'
  }

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <Card className={`${getVariantClasses()} shadow-card hover:shadow-elevated transition-all duration-300`}>
      <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${sizeClasses[size]}`}>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="w-4 h-4 text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className={`${sizeClasses[size]} pt-0`}>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold text-foreground">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>
                {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}