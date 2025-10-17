import { useState } from "react"
import { 
  Users, 
  FileText, 
  MessageSquare, 
  GitBranch, 
  UserPlus,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CollaborationHub as CollaborationHubComponent } from "@/components/CollaborationHub"

export default function CollaborationHub() {
  // Stats for the overview
  const collaborationStats = {
    activeFiles: 24,
    openDiscussions: 12,
    pendingApprovals: 8,
    teamMembers: 15
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
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Collaboration Hub
                </h1>
                <p className="text-muted-foreground text-lg">Team collaboration & project management</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-primary border-primary/30 shadow-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/80 text-sm font-medium">Active Files</p>
                    <p className="text-2xl font-bold text-primary-foreground">
                      {collaborationStats.activeFiles}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-primary-foreground/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-success border-success/30 shadow-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-success-foreground/80 text-sm font-medium">Discussions</p>
                    <p className="text-2xl font-bold text-success-foreground">
                      {collaborationStats.openDiscussions}
                    </p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-success-foreground/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-warning border-warning/30 shadow-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-warning-foreground/80 text-sm font-medium">Pending Approvals</p>
                    <p className="text-2xl font-bold text-warning-foreground">
                      {collaborationStats.pendingApprovals}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-warning-foreground/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Team Members</p>
                    <p className="text-2xl font-bold text-foreground">
                      {collaborationStats.teamMembers}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Collaboration Hub Component */}
      <CollaborationHubComponent />
    </div>
  )
}