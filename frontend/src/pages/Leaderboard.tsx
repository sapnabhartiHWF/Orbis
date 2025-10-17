import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Trophy, 
  Medal, 
  Target, 
  TrendingUp, 
  Users, 
  Clock, 
  Star,
  Award,
  Crown,
  Zap,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  Gift
} from "lucide-react"

export default function Leaderboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly")
  const [selectedDepartment, setSelectedDepartment] = useState("all")

  // Mock data for leaderboard
  const topContributors = [
    {
      id: 1,
      name: "Emma Thompson",
      department: "Operations",
      avatar: "/placeholder.svg",
      totalPoints: 2850,
      processSubmissions: 15,
      successfulImplementations: 12,
      costSavings: 1200000,
      efficiencyImprovement: 34,
      badges: ["Process Pioneer", "ROI Champion", "Collaboration Master"],
      trend: "up",
      monthlyRank: 1,
      previousRank: 2
    },
    {
      id: 2,
      name: "Marcus Chen",
      department: "IT",
      avatar: "/placeholder.svg",
      totalPoints: 2680,
      processSubmissions: 18,
      successfulImplementations: 14,
      costSavings: 980000,
      efficiencyImprovement: 28,
      badges: ["Innovation Leader", "Tech Excellence"],
      trend: "down",
      monthlyRank: 2,
      previousRank: 1
    },
    {
      id: 3,
      name: "Sarah Rodriguez",
      department: "Finance",
      avatar: "/placeholder.svg",
      totalPoints: 2420,
      processSubmissions: 12,
      successfulImplementations: 11,
      costSavings: 750000,
      efficiencyImprovement: 31,
      badges: ["ROI Champion", "Quality Assurance"],
      trend: "up",
      monthlyRank: 3,
      previousRank: 5
    },
    {
      id: 4,
      name: "David Park",
      department: "HR",
      avatar: "/placeholder.svg",
      totalPoints: 2180,
      processSubmissions: 10,
      successfulImplementations: 9,
      costSavings: 650000,
      efficiencyImprovement: 25,
      badges: ["People Champion", "Process Pioneer"],
      trend: "same",
      monthlyRank: 4,
      previousRank: 4
    },
    {
      id: 5,
      name: "Lisa Wang",
      department: "Marketing",
      avatar: "/placeholder.svg",
      totalPoints: 1920,
      processSubmissions: 8,
      successfulImplementations: 7,
      costSavings: 520000,
      efficiencyImprovement: 22,
      badges: ["Creative Innovator", "Collaboration Master"],
      trend: "up",
      monthlyRank: 5,
      previousRank: 7
    }
  ]

  const departmentRankings = [
    {
      name: "Operations",
      totalPoints: 8450,
      members: 24,
      avgContribution: 352,
      topContributor: "Emma Thompson",
      savings: 3200000,
      rank: 1
    },
    {
      name: "IT",
      totalPoints: 7820,
      members: 18,
      avgContribution: 434,
      topContributor: "Marcus Chen",
      savings: 2800000,
      rank: 2
    },
    {
      name: "Finance",
      totalPoints: 6950,
      members: 15,
      avgContribution: 463,
      topContributor: "Sarah Rodriguez",
      savings: 2100000,
      rank: 3
    },
    {
      name: "HR",
      totalPoints: 5670,
      members: 12,
      avgContribution: 472,
      topContributor: "David Park",
      savings: 1850000,
      rank: 4
    },
    {
      name: "Marketing",
      totalPoints: 4320,
      members: 9,
      avgContribution: 480,
      topContributor: "Lisa Wang",
      savings: 1200000,
      rank: 5
    }
  ]

  const achievementBadges = [
    {
      name: "Process Pioneer",
      description: "First to submit 10 automation processes",
      icon: "🚀",
      rarity: "Epic",
      earned: 12,
      total: 156
    },
    {
      name: "ROI Champion",
      description: "Achieved over $1M in cost savings",
      icon: "💰",
      rarity: "Legendary",
      earned: 8,
      total: 156
    },
    {
      name: "Collaboration Master",
      description: "Helped 20+ team members with processes",
      icon: "🤝",
      rarity: "Rare",
      earned: 23,
      total: 156
    },
    {
      name: "Innovation Leader",
      description: "Created 5 breakthrough automation solutions",
      icon: "💡",
      rarity: "Epic",
      earned: 15,
      total: 156
    },
    {
      name: "Speed Demon",
      description: "Completed process in record time (< 24h)",
      icon: "⚡",
      rarity: "Common",
      earned: 45,
      total: 156
    },
    {
      name: "Quality Assurance",
      description: "Zero defects in last 10 implementations",
      icon: "🎯",
      rarity: "Rare",
      earned: 18,
      total: 156
    }
  ]

  const monthlyAwards = [
    {
      category: "Top Contributor",
      winner: "Emma Thompson",
      department: "Operations",
      achievement: "2,850 points earned",
      reward: "Premium automation training + $500 bonus"
    },
    {
      category: "Biggest Impact",
      winner: "Marcus Chen", 
      department: "IT",
      achievement: "$980K cost savings generated",
      reward: "Innovation conference ticket + recognition ceremony"
    },
    {
      category: "Team Player",
      winner: "Sarah Rodriguez",
      department: "Finance", 
      achievement: "Collaborated on 15 cross-department projects",
      reward: "Team lunch + professional development budget"
    },
    {
      category: "Rising Star",
      winner: "Lisa Wang",
      department: "Marketing",
      achievement: "Jumped 2 positions in leaderboard",
      reward: "Mentorship program + skill certification"
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

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />
      case 2: return <Medal className="w-5 h-5 text-foreground" />
      case 3: return <Award className="w-5 h-5 text-amber-600" />
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case "up": return <ArrowUp className="w-4 h-4 text-success" />
      case "down": return <ArrowDown className="w-4 h-4 text-destructive" />
      case "same": return <Minus className="w-4 h-4 text-muted-foreground" />
      default: return null
    }
  }

  const getBadgeRarityColor = (rarity: string) => {
    switch(rarity) {
      case "Common": return "bg-primary"
      case "Rare": return "bg-blue-500"
      case "Epic": return "bg-purple-500"
      case "Legendary": return "bg-orange-500"
      default: return "bg-primary"
    }
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Leaderboard & Gamification</h1>
          <p className="text-muted-foreground">
            Track contributions, compete with peers, and celebrate achievements in automation excellence
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-card border border-border">
          <TabsTrigger value="leaderboard">Individual Rankings</TabsTrigger>
          <TabsTrigger value="departments">Department Rankings</TabsTrigger>
          <TabsTrigger value="badges">Achievement Badges</TabsTrigger>
          <TabsTrigger value="awards">Monthly Awards</TabsTrigger>
          <TabsTrigger value="history">Contribution History</TabsTrigger>
          <TabsTrigger value="scoring">Scoring System</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-6">
          {/* Top 3 Podium */}
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Top Contributors - {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {topContributors.slice(0, 3).map((contributor, index) => (
                  <div 
                    key={contributor.id}
                    className={`text-center p-6 rounded-lg border ${
                      index === 0 ? "bg-gradient-warning border-warning/30" :
                      index === 1 ? "bg-gradient-primary border-primary/30" :
                      "bg-gradient-success border-success/30"
                    }`}
                  >
                    <div className="mb-4">
                      {getRankIcon(contributor.monthlyRank)}
                    </div>
                    <Avatar className="w-16 h-16 mx-auto mb-4">
                      <AvatarImage src={contributor.avatar} alt={contributor.name} />
                      <AvatarFallback>{contributor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-white mb-1">{contributor.name}</h3>
                    <p className="text-white/80 text-sm mb-3">{contributor.department}</p>
                    <div className="text-white">
                      <div className="text-2xl font-bold mb-1">{contributor.totalPoints.toLocaleString()}</div>
                      <div className="text-xs opacity-90">Total Points</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Full Rankings */}
              <div className="space-y-3">
                {topContributors.map((contributor) => (
                  <div 
                    key={contributor.id}
                    className="flex items-center justify-between p-4 bg-gradient-subtle rounded-lg border border-border hover:shadow-elevated transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        {getRankIcon(contributor.monthlyRank)}
                        {getTrendIcon(contributor.trend)}
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={contributor.avatar} alt={contributor.name} />
                          <AvatarFallback>{contributor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-foreground">{contributor.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{contributor.department}</Badge>
                          <div className="flex gap-1">
                            {contributor.badges.slice(0, 2).map((badge) => (
                              <Badge key={badge} variant="outline" className="text-xs">
                                {badge}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-foreground">{contributor.totalPoints.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Points</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-semibold text-success">{formatCurrency(contributor.costSavings)}</div>
                        <div className="text-xs text-muted-foreground">Savings</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-semibold text-primary">{contributor.successfulImplementations}/{contributor.processSubmissions}</div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-semibold text-info">{contributor.efficiencyImprovement}%</div>
                        <div className="text-xs text-muted-foreground">Efficiency</div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Department Competition Rankings
              </CardTitle>
              <CardDescription>
                Cross-department leaderboard based on collective contributions and impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentRankings.map((dept) => (
                  <div 
                    key={dept.name}
                    className="flex items-center justify-between p-6 bg-gradient-subtle rounded-lg border border-border hover:shadow-elevated transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      {getRankIcon(dept.rank)}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{dept.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {dept.members} members • Top: {dept.topContributor}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{dept.totalPoints.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Total Points</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-primary">{dept.avgContribution}</div>
                        <div className="text-xs text-muted-foreground">Avg/Member</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-success">{formatCurrency(dept.savings)}</div>
                        <div className="text-xs text-muted-foreground">Total Savings</div>
                      </div>
                      
                      <Badge variant={dept.rank <= 3 ? "default" : "secondary"} className="text-sm">
                        Rank #{dept.rank}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-warning" />
                Achievement Badge System
              </CardTitle>
              <CardDescription>
                Earn badges by completing specific automation milestones and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievementBadges.map((badge) => (
                  <Card key={badge.name} className="bg-gradient-card border-border shadow-card hover:shadow-elevated transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-3xl">{badge.icon}</div>
                        <Badge 
                          variant="outline" 
                          className={`text-white ${getBadgeRarityColor(badge.rarity)}`}
                        >
                          {badge.rarity}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-foreground mb-2">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{badge.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-foreground">{badge.earned}/{badge.total}</span>
                        </div>
                        <Progress value={(badge.earned / badge.total) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="awards" className="space-y-6">
          <Card className="bg-gradient-primary border-primary/30 shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary-foreground">
                <Gift className="w-5 h-5" />
                Monthly Excellence Awards - October 2024
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Recognizing outstanding contributions and achievements this month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-primary-foreground">
              {monthlyAwards.map((award, index) => (
                <div 
                  key={award.category}
                  className="p-6 bg-black/20 rounded-lg border border-primary-foreground/20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{award.category}</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-warning" />
                          <span className="font-medium">{award.winner}</span>
                        </div>
                        <Badge variant="outline" className="text-primary-foreground border-primary-foreground/30">
                          {award.department}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">#{index + 1}</div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm opacity-90 mb-2">Achievement:</p>
                    <p className="font-medium">{award.achievement}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm opacity-90 mb-2">Reward:</p>
                    <p className="font-medium">{award.reward}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-info" />
                Individual Impact Tracking
              </CardTitle>
              <CardDescription>
                Track your contribution history and performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Select a team member to view their contribution history</p>
                <p className="text-sm">Track individual performance, milestones, and growth over time</p>
                <Button variant="outline" className="mt-4">
                  Select Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-success" />
                Contribution Scoring System
              </CardTitle>
              <CardDescription>
                How points are calculated and awarded for different activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground mb-3">Process Activities</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gradient-subtle rounded-lg border border-border">
                      <span className="text-sm text-foreground">Process Submission</span>
                      <Badge variant="secondary">+50 points</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gradient-subtle rounded-lg border border-border">
                      <span className="text-sm text-foreground">Successful Implementation</span>
                      <Badge variant="secondary">+200 points</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gradient-subtle rounded-lg border border-border">
                      <span className="text-sm text-foreground">Process Optimization</span>
                      <Badge variant="secondary">+150 points</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gradient-subtle rounded-lg border border-border">
                      <span className="text-sm text-foreground">Knowledge Sharing</span>
                      <Badge variant="secondary">+75 points</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground mb-3">Impact Multipliers</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gradient-subtle rounded-lg border border-border">
                      <span className="text-sm text-foreground">High ROI (&gt;$100K savings)</span>
                      <Badge variant="secondary">2x multiplier</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gradient-subtle rounded-lg border border-border">
                      <span className="text-sm text-foreground">Cross-department collaboration</span>
                      <Badge variant="secondary">1.5x multiplier</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gradient-subtle rounded-lg border border-border">
                      <span className="text-sm text-foreground">Zero-defect implementation</span>
                      <Badge variant="secondary">1.3x multiplier</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gradient-subtle rounded-lg border border-border">
                      <span className="text-sm text-foreground">First-time implementation</span>
                      <Badge variant="secondary">1.2x multiplier</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-primary rounded-lg border border-primary/30">
                <h4 className="font-semibold text-primary-foreground mb-3">Bonus Opportunities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-primary-foreground">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">Monthly top performer: +500 bonus points</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary-foreground">
                    <Star className="w-4 h-4" />
                    <span className="text-sm">Badge achievements: +100-1000 points</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Mentor contribution: +25 points per session</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Innovation breakthroughs: +1000 points</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}