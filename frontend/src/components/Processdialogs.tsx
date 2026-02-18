// components/ProcessDialogs.tsx
// This file contains both NewProcessDialog and ProcessDetailsDialog
// Extract these from your original CenterOfExcellence.tsx

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

// ============================================================================
// NEW PROCESS DIALOG
// ============================================================================

interface NewProcessDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: any, dataSamplesFile: File | null, sopDocFile: File | null) => Promise<void>;
}

export function NewProcessDialog({ open, onClose, onSubmit }: NewProcessDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    description: "",
    priority: "",
    expectedROI: "",
    stakeholders: [],
    tags: [],
  });
  
  const [dataSamplesFile, setDataSamplesFile] = useState<File | null>(null);
  const [sopDocumentFile, setSopDocumentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title || !formData.department || !formData.description || !formData.priority) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData, dataSamplesFile, sopDocumentFile);
      
      // Reset form
      setFormData({
        title: "",
        department: "",
        description: "",
        priority: "",
        expectedROI: "",
        stakeholders: [],
        tags: [],
      });
      setDataSamplesFile(null);
      setSopDocumentFile(null);
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit New Process for Automation</DialogTitle>
          <DialogDescription>
            Fill in the details below to submit a new process
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Process Title *</Label>
            <Input
              id="title"
              placeholder="Enter process name"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label>Department *</Label>
            <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the process"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority *</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expected ROI */}
          <div className="space-y-2">
            <Label htmlFor="roi">Expected ROI (USD)</Label>
            <Input
              id="roi"
              type="number"
              placeholder="Enter expected ROI"
              value={formData.expectedROI}
              onChange={(e) => setFormData({ ...formData, expectedROI: e.target.value })}
            />
          </div>

          {/* File Uploads */}
          <div className="space-y-2">
            <Label>Data Samples</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
              onChange={(e) => setDataSamplesFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="space-y-2">
            <Label>SOP Document</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setSopDocumentFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Process"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// PROCESS DETAILS DIALOG
// ============================================================================

interface ProcessDetailsDialogProps {
  open: boolean;
  process: any;
  onClose: () => void;
  onUpdate: () => void;
}

export function ProcessDetailsDialog({ open, process, onClose, onUpdate }: ProcessDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!process) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{process.title}</DialogTitle>
            <div className="flex gap-2">
              <Badge>{process.priority}</Badge>
              <Badge variant="secondary">{process.status}</Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="triage">Triage</TabsTrigger>
            <TabsTrigger value="sit">SIT</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="overview">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{process.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted By</p>
                    <p className="font-medium">{process.submittedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected ROI</p>
                    <p className="font-medium">${process.expectedROI?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>{process.status}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{process.description}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="triage">
              {/* TODO: Copy your triage tab content from original file */}
              <p className="text-muted-foreground">Triage information will appear here</p>
            </TabsContent>

            <TabsContent value="sit">
              {/* TODO: Copy your SIT tab content from original file */}
              <p className="text-muted-foreground">SIT information will appear here</p>
            </TabsContent>

            <TabsContent value="design">
              {/* TODO: Copy your TO-BE Design tab content from original file */}
              <p className="text-muted-foreground">Design information will appear here</p>
            </TabsContent>

            <TabsContent value="approvals">
              {/* TODO: Copy your Approvals tab content from original file */}
              <p className="text-muted-foreground">Approval information will appear here</p>
            </TabsContent>

            <TabsContent value="development">
              {/* TODO: Copy your Development tab content from original file */}
              <p className="text-muted-foreground">Development information will appear here</p>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onUpdate}>Move to Next Stage</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}