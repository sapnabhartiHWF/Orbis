import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AlertBannerProps {
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  onDismiss?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

export function AlertBanner({ type, title, message, onDismiss, action }: AlertBannerProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          containerClass: 'bg-gradient-success border-success/20',
          iconClass: 'text-success-foreground',
          textClass: 'text-success-foreground',
          icon: CheckCircle
        }
      case 'warning':
        return {
          containerClass: 'bg-gradient-warning border-warning/20',
          iconClass: 'text-warning-foreground',
          textClass: 'text-warning-foreground',
          icon: AlertTriangle
        }
      case 'error':
        return {
          containerClass: 'bg-gradient-danger border-destructive/20',
          iconClass: 'text-destructive-foreground',
          textClass: 'text-destructive-foreground',
          icon: AlertCircle
        }
      default:
        return {
          containerClass: 'bg-gradient-primary border-primary/20',
          iconClass: 'text-primary-foreground',
          textClass: 'text-primary-foreground',
          icon: Info
        }
    }
  }

  const { containerClass, iconClass, textClass, icon: Icon } = getTypeStyles()

  return (
    <div className={`${containerClass} border rounded-lg p-4 flex items-start gap-3 shadow-card`}>
      <Icon className={`w-5 h-5 ${iconClass} flex-shrink-0 mt-0.5`} />
      
      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold text-sm ${textClass}`}>
          {title}
        </h4>
        <p className={`text-sm ${textClass} opacity-90 mt-1`}>
          {message}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {action && (
          <Button
            size="sm"
            variant="outline"
            onClick={action.onClick}
            className={`${textClass} border-current hover:bg-current/10`}
          >
            {action.label}
          </Button>
        )}
        
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className={`${textClass} hover:bg-current/10 p-1 h-auto`}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}