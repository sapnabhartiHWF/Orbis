import { useState } from "react"
import { Users, Trophy, Target, TrendingUp, Clock, BarChart3, Award, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from "recharts"

interface TeamMember {
  id: string
  name: string
  role: string
  department: string
  avatar?: string
  projectsCompleted: number
  totalROI: number
  avgCycleTime: number
  successRate: number
  innovationScore: number
  collaborationRating: number
  skills: string[]
  achievements: string[]
  currentProjects: number
  performanceRating: number
}

interface Team {
  id: string
  name: string
  department: string
  lead: string
  members: TeamMember[]
  totalProjects: number
  avgPerformance: number
  totalROI: number
  completionRate: number
}

const teamMembers: TeamMember[] = [
  {
    id: "TM001",
    name: "Sarah Chen",
    role: "Senior Automation Developer",
    department: "IT",
    avatar: "/api/placeholder/40/40",
    projectsCompleted: 12,
    totalROI: 2400000,
    avgCycleTime: 18.5,
    successRate: 97.2,
    innovationScore: 92,
    collaborationRating: 4.8,
    skills: ["Python", "RPA", "Process Analysis", "AI/ML"],
    achievements: ["Top Performer Q1 2024", "Innovation Award", "Mentor of the Year"],
    currentProjects: 3,
    performanceRating: 4.9
  },
  {
    id: "TM002", 
    name: "Michael Rodriguez",
    role: "Business Analyst",
    department: "Operations",
    avatar: "/api/placeholder/40/40",
    projectsCompleted: 8,
    totalROI: 1800000,
    avgCycleTime: 22.3,
    successRate: 94.7,
    innovationScore: 87,
    collaborationRating: 4.6,
    skills: ["Process Mapping", "Requirements Analysis", "Stakeholder Management"],
    achievements: ["Process Excellence Award", "Team Player Award"],
    currentProjects: 2,
    performanceRating: 4.7
  },
  {
    id: "TM003",
    name: "Emma Thompson",
    role: "Automation Architect", 
    department: "IT",
    avatar: "/api/placeholder/40/40",
    projectsCompleted: 15,
    totalROI: 3200000,
    avgCycleTime: 16.8,
    successRate: 98.1,
    innovationScore: 95,
    collaborationRating: 4.9,
    skills: ["Solution Architecture", "Enterprise Integration", "Cloud Platforms"],
    achievements: ["Technical Excellence Award", "Innovation Leader", "Top ROI Contributor"],
    currentProjects: 4,
    performanceRating: 4.95
  },
  {
    id: "TM004",
    name: "David Park",
    role: "Process Optimization Specialist",
    department: "Finance",
    avatar: "/api/placeholder/40/40",
    projectsCompleted: 10,
    totalROI: 2100000,
    avgCycleTime: 20.1,
    successRate: 95.8,
    innovationScore: 89,
    collaborationRating: 4.5,
    skills: ["Financial Modeling", "Process Improvement", "Data Analysis"],
    achievements: ["Cost Savings Champion", "Efficiency Expert"],
    currentProjects: 2,
    performanceRating: 4.6
  },
  {
    id: "TM005",
    name: "Lisa Wang",
    role: "UX Automation Designer",
    department: "Design",
    avatar: "/api/placeholder/40/40",
    projectsCompleted: 6,
    totalROI: 1200000,
    avgCycleTime: 25.7,
    successRate: 92.4,
    innovationScore: 91,
    collaborationRating: 4.7,
    skills: ["UI/UX Design", "User Research", "Prototyping"],
    achievements: ["Design Innovation Award", "User Experience Champion"],
    currentProjects: 2,
    performanceRating: 4.5
  }
]

const teams: Team[] = [
  {
    id: "T001",
    name: "Core Automation Team",
    department: "IT",
    lead: "Emma Thompson",
    members: teamMembers.filter(m => m.department === "IT"),
    totalProjects: 27,
    avgPerformance: 4.83,
    totalROI: 5600000,
    completionRate: 97.6
  },
  {
    id: "T002",
    name: "Business Process Team", 
    department: "Operations",
    lead: "Michael Rodriguez",
    members: teamMembers.filter(m => m.department === "Operations"),
    totalProjects: 8,
    avgPerformance: 4.7,
    totalROI: 1800000,
    completionRate: 94.7
  },
  {
    id: "T003",
    name: "Finance Automation Team",
    department: "Finance", 
    lead: "David Park",
    members: teamMembers.filter(m => m.department === "Finance"),
    totalProjects: 10,
    avgPerformance: 4.6,
    totalROI: 2100000,
    completionRate: 95.8
  }
]

const performanceTrendData = [
  { month: "Jan", performance: 4.2, projects: 8, roi: 1800000 },
  { month: "Feb", performance: 4.4, projects: 10, roi: 2100000 },
  { month: "Mar", performance: 4.5, projects: 12, roi: 2400000 },
  { month: "Apr", performance: 4.6, projects: 14, roi: 2800000 },
  { month: "May", performance: 4.7, projects: 16, roi: 3200000 },
  { month: "Jun", performance: 4.8, projects: 18, roi: 3600000 }
]

const skillsRadarData = [
  { skill: "Technical", A: 95, B: 87, C: 92 },
  { skill: "Process", A: 88, B: 94, C: 85 },
  { skill: "Communication", A: 92, B: 89, C: 96 },
  { skill: "Innovation", A: 95, B: 87, C: 91 },
  { skill: "Leadership", A: 89, B: 85, C: 94 },
  { skill: "Collaboration", A: 96, B: 92, C: 89 }
]

const chartConfig = {
  performance: { label: "Performance Rating", color: "hsl(var(--primary))" },
  projects: { label: "Projects Completed", color: "hsl(var(--success))" },
  roi: { label: "ROI Generated", color: "hsl(var(--warning))" },
  A: { label: "Emma Thompson", color: "hsl(var(--primary))" },
  B: { label: "Sarah Chen", color: "hsl(var(--success))" },
  C: { label: "Michael Rodriguez", color: "hsl(var(--warning))" }
}

export function TeamPerformance() {
  const [selectedTeam, setSelectedTeam] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("6months")
  const [sortBy, setSortBy] = useState("performance")

  const filteredMembers = selectedTeam === "all" 
    ? teamMembers 
    : teamMembers.filter(member => {
        const team = teams.find(t => t.department === selectedTeam)
        return team?.members.some(m => m.id === member.id)
      })

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    switch (sortBy) {
      case "performance": return b.performanceRating - a.performanceRating
      case "roi": return b.totalROI - a.totalROI
      case "projects": return b.projectsCompleted - a.projectsCompleted
      case "success": return b.successRate - a.successRate
      default: return 0
    }
  })

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return "text-success"
    if (rating >= 4.0) return "text-warning"
    return "text-destructive"
  }

  const getPerformanceBadge = (rating: number) => {
    if (rating >= 4.5) return "bg-success/20 text-success border-success/30"
    if (rating >= 4.0) return "bg-warning/20 text-warning border-warning/30"
    return "bg-destructive/20 text-destructive border-destructive/30"
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Performance</h2>
          <p className="text-muted-foreground">Individual and team contribution analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="IT">Core Automation Team</SelectItem>
              <SelectItem value="Operations">Business Process Team</SelectItem>
              <SelectItem value="Finance">Finance Automation Team</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="roi">ROI Impact</SelectItem>
              <SelectItem value="projects">Projects</SelectItem>
              <SelectItem value="success">Success Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary border-primary/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Team Members</p>
                <p className="text-2xl font-bold text-primary-foreground">
                  {filteredMembers.length}
                </p>
                <p className="text-xs text-primary-foreground/80">Active contributors</p>
              </div>
              <Users className="w-8 h-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success border-success/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm font-medium">Avg Performance</p>
                <p className="text-2xl font-bold text-success-foreground">
                  {(filteredMembers.reduce((sum, m) => sum + m.performanceRating, 0) / filteredMembers.length).toFixed(1)}
                </p>
                <p className="text-xs text-success-foreground/80">Out of 5.0</p>
              </div>
              <Star className="w-8 h-8 text-success-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning border-warning/30 shadow-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-foreground/80 text-sm font-medium">Total ROI</p>
                <p className="text-2xl font-bold text-warning-foreground">
                  ${(filteredMembers.reduce((sum, m) => sum + m.totalROI, 0) / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-warning-foreground/80">Generated this year</p>
              </div>
              <TrendingUp className="w-8 h-8 text-warning-foreground/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Projects</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredMembers.reduce((sum, m) => sum + m.projectsCompleted, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
          <TabsTrigger value="individual">Individual Performance</TabsTrigger>
          <TabsTrigger value="teams">Team Analytics</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sortedMembers.map((member, index) => (
              <Card key={member.id} className="bg-card border-border shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <CardDescription>{member.role} • {member.department}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {index < 3 && (
                        <Trophy className={`w-5 h-5 ${
                          index === 0 ? 'text-yellow-500' : 
                          index === 1 ? 'text-primary' : 'text-orange-500'
                        }`} />
                      )}
                      <Badge className={getPerformanceBadge(member.performanceRating)}>
                        {member.performanceRating.toFixed(1)}★
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Projects Completed</p>
                      <p className="text-xl font-bold">{member.projectsCompleted}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ROI Generated</p>
                      <p className="text-xl font-bold text-success">
                        ${(member.totalROI / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span>{member.successRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={member.successRate} className="h-2" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Innovation Score</span>
                        <span>{member.innovationScore}/100</span>
                      </div>
                      <Progress value={member.innovationScore} className="h-2" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Collaboration Rating</span>
                        <span>{member.collaborationRating.toFixed(1)}/5.0</span>
                      </div>
                      <Progress value={member.collaborationRating * 20} className="h-2" />
                    </div>
                  </div>

                  {/* Skills and Achievements */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Key Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {member.skills.slice(0, 3).map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {member.skills.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{member.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {member.achievements.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Recent Achievements</p>
                        <div className="space-y-1">
                          {member.achievements.slice(0, 2).map((achievement, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Award className="w-3 h-3 text-warning" />
                              <span className="text-xs text-muted-foreground">{achievement}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Current Workload */}
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span>Current Projects: {member.currentProjects}</span>
                      <span>Avg Cycle Time: {member.avgCycleTime.toFixed(1)} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <div className="space-y-4">
            {teams.map((team, index) => (
              <Card key={team.id} className="bg-card border-border shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{team.name}</CardTitle>
                      <CardDescription>Led by {team.lead} • {team.members.length} members</CardDescription>
                    </div>
                    <Badge className={getPerformanceBadge(team.avgPerformance)}>
                      {team.avgPerformance.toFixed(1)}★ Team Rating
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Projects</p>
                      <p className="text-2xl font-bold">{team.totalProjects}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Team ROI</p>
                      <p className="text-2xl font-bold text-success">
                        ${(team.totalROI / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-muted-foreground">Generated</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <p className="text-2xl font-bold">{team.completionRate.toFixed(1)}%</p>
                      <Progress value={team.completionRate} className="h-2 mt-1" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Avg Performance</p>
                      <p className="text-2xl font-bold text-primary">{team.avgPerformance.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Out of 5.0</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-medium mb-3">Team Members</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {team.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {member.performanceRating.toFixed(1)}★
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle>Skills Radar - Top Performers</CardTitle>
                <CardDescription>Comparative skills analysis of top team members</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={skillsRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar name="Emma Thompson" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                      <Radar name="Sarah Chen" dataKey="B" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.6} />
                      <Radar name="Michael Rodriguez" dataKey="C" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.6} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle>Skill Distribution</CardTitle>
                <CardDescription>Team capabilities across key skill areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Technical Skills", "Process Analysis", "Communication", "Innovation", "Leadership", "Collaboration"].map((skill, index) => {
                    const avgScore = Math.floor(Math.random() * 20) + 80; // Mock data
                    return (
                      <div key={skill} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{skill}</span>
                          <span>{avgScore}/100</span>
                        </div>
                        <Progress value={avgScore} className="h-3" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Team Average</span>
                          <span>{Math.floor(Math.random() * 3) + 3} members proficient</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Team Performance Trends
              </CardTitle>
              <CardDescription>Monthly performance and productivity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="performance" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="projects" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}