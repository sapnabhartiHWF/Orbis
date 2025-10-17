import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, TrendingUp, Target, Clock } from "lucide-react"

export const TeamLeaderboard = () => {
  const leaderboardData = [
    { 
      name: "Emma Thompson", 
      department: "Operations", 
      processes: 12, 
      savings: 1200000, 
      rank: 1,
      avatar: "/placeholder.svg",
      efficiency: 94,
      completionTime: "2.3 days avg"
    },
    { 
      name: "Marcus Chen", 
      department: "IT", 
      processes: 10, 
      savings: 980000, 
      rank: 2,
      avatar: "/placeholder.svg",
      efficiency: 91,
      completionTime: "2.8 days avg"
    },
    { 
      name: "Sarah Rodriguez", 
      department: "Finance", 
      processes: 8, 
      savings: 750000, 
      rank: 3,
      avatar: "/placeholder.svg",
      efficiency: 88,
      completionTime: "3.1 days avg"
    },
    { 
      name: "David Park", 
      department: "HR", 
      processes: 7, 
      savings: 650000, 
      rank: 4,
      avatar: "/placeholder.svg",
      efficiency: 85,
      completionTime: "3.5 days avg"
    },
    { 
      name: "Lisa Wang", 
      department: "Marketing", 
      processes: 6, 
      savings: 520000, 
      rank: 5,
      avatar: "/placeholder.svg",
      efficiency: 82,
      completionTime: "3.8 days avg"
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRankColor = (rank: number) => {
    switch(rank) {
      case 1: return "text-yellow-500"
      case 2: return "text-primary"  
      case 3: return "text-amber-600"
      default: return "text-muted-foreground"
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Trophy className={`w-5 h-5 ${getRankColor(rank)}`} />
    }
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">43</p>
                <p className="text-sm text-muted-foreground">Total Processes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">$4.1M</p>
                <p className="text-sm text-muted-foreground">Total Savings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-info/10 rounded-lg">
                <Target className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">89%</p>
                <p className="text-sm text-muted-foreground">Avg Efficiency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            Automation Excellence Leaderboard
          </CardTitle>
          <CardDescription>
            Top performers in process automation and innovation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboardData.map((person) => (
              <div 
                key={person.name}
                className="flex items-center justify-between p-4 bg-gradient-subtle rounded-lg border border-border hover:shadow-elevated transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {getRankIcon(person.rank)}
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={person.avatar} alt={person.name} />
                      <AvatarFallback>{person.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-foreground">{person.name}</h3>
                    <p className="text-sm text-muted-foreground">{person.department}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{person.processes}</p>
                    <p className="text-xs text-muted-foreground">Processes</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-semibold text-success">{formatCurrency(person.savings)}</p>
                    <p className="text-xs text-muted-foreground">Savings</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-primary" />
                      <span className="font-semibold text-foreground">{person.efficiency}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Efficiency</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-info" />
                      <span className="font-semibold text-foreground">{person.completionTime}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Time</p>
                  </div>

                  <Badge variant={person.rank <= 3 ? "default" : "secondary"}>
                    Rank #{person.rank}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}