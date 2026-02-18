import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileManager } from "./FileManager"
import { CommentSystem } from "./CommentSystem"
// import { ApprovalWorkflow } from "./ApprovalWorkflow"

interface CollaborationHubProps {
  processId?: string,
  onFileCountsChange?: (counts: Record<string, number>) => void;
}

export function CollaborationHub({ processId, onFileCountsChange }: CollaborationHubProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="files" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-card border border-border">
          <TabsTrigger value="files" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            File Management
          </TabsTrigger>
          <TabsTrigger value="comments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Discussion
          </TabsTrigger>
          {/* <TabsTrigger value="workflows" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Approval Workflows
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="files" className="space-y-6">
          {/* 👇 ADD onFileCountsChange HERE */}
          <FileManager processId={processId} onFileCountsChange={onFileCountsChange} />
        </TabsContent>

        <TabsContent value="comments" className="space-y-6">
          <CommentSystem processId={processId} />
        </TabsContent>

        {/* <TabsContent value="workflows" className="space-y-6">
          <ApprovalWorkflow processId={processId} />
        </TabsContent> */}
      </Tabs>
    </div>
  )
}