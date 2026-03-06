import { useState, useEffect } from "react"
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
  const [totalFiles, setTotalFiles] = useState(0);
  const [discussionCount, setDiscussionCount] = useState(0);

  // Fetch discussion count on mount
  useEffect(() => {
    const fetchDiscussionCount = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch('https://basic-vivyan-vivek1902-64809d2b.koyeb.app/api/get-comment-count', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        if (data.success) {
          setDiscussionCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching discussion count:', error);
      }
    };

    fetchDiscussionCount();
  }, []);

  // Handler to receive file counts from FileManager
  const handleFileCountsChange = (counts: Record<string, number>) => {
    // Sum all file counts from all processes
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    setTotalFiles(total);
    console.log("📊 File counts updated:", counts, "Total:", total); // Debug log
  };

  // Stats for the overview
  const collaborationStats = {
    totalFiles: totalFiles,
    openDiscussions: discussionCount,
    successFiles: 0,
    fileInProgress: 0
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-violet-500 to-violet-700 border-violet-400/30 shadow-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/80 text-sm font-medium">Total Files</p>
                    <p className="text-2xl font-bold text-primary-foreground">
                      {collaborationStats.totalFiles}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-primary-foreground/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-primary border-primary/30 shadow-glow">
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
          </div>
        </div>
      </div>

      {/* Pass the handler to CollaborationHubComponent */}
      <CollaborationHubComponent onFileCountsChange={handleFileCountsChange} />
    </div>
  )
}