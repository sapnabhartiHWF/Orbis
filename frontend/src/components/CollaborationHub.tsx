import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileManager } from "./FileManager"
import { CommentSystem } from "./CommentSystem"
import { ApprovalWorkflow } from "./ApprovalWorkflow"
import { TeamAssignments } from "./TeamAssignments"

interface CollaborationHubProps {
  processId?: string
}

export function CollaborationHub({ processId }: CollaborationHubProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="files" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
          <TabsTrigger value="files" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            File Management
          </TabsTrigger>
          <TabsTrigger value="comments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Discussion
          </TabsTrigger>
          <TabsTrigger value="workflows" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Approval Workflows
          </TabsTrigger>
          <TabsTrigger value="assignments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Team Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-6">
          <FileManager processId={processId} />
        </TabsContent>

        <TabsContent value="comments" className="space-y-6">
          <CommentSystem processId={processId} />
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <ApprovalWorkflow processId={processId} />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <TeamAssignments processId={processId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}