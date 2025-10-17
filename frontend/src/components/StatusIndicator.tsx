import { ReactNode } from "react"

interface StatusIndicatorProps {
  status: 'active' | 'idle' | 'error' | 'warning'
  children: ReactNode
  showPulse?: boolean
}

export function StatusIndicator({ status, children, showPulse = true }: StatusIndicatorProps) {
  const getStatusClasses = () => {
    const baseClasses = "w-2 h-2 rounded-full"
    const pulseClasses = showPulse ? "animate-pulse" : ""
    
    switch (status) {
      case 'active':
        return `${baseClasses} bg-bot-active ${pulseClasses}`
      case 'idle':
        return `${baseClasses} bg-bot-idle`
      case 'error':
        return `${baseClasses} bg-bot-error ${pulseClasses}`
      case 'warning':
        return `${baseClasses} bg-warning ${pulseClasses}`
      default:
        return `${baseClasses} bg-muted-foreground`
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className={getStatusClasses()} />
      {children}
    </div>
  )
}