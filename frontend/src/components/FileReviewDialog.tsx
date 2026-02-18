import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader, CheckCircle2, XCircle, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FileReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: number | string;
  fileName: string;
  onReviewComplete?: () => void;
}

export function FileReviewDialog({
  open,
  onOpenChange,
  fileId,
  fileName,
  onReviewComplete,
}: FileReviewDialogProps) {
  const [isRuleBased, setIsRuleBased] = useState(false);
  const [systemAccessible, setSystemAccessible] = useState(false);
  const [exceptionManageable, setExceptionManageable] = useState(false);
  const [complianceRisk, setComplianceRisk] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [rpaEngineers, setRpaEngineers] = useState<Array<{ UserId: number; UserName: string }>>([]);
  const [selectedEngineerIds, setSelectedEngineerIds] = useState<number[]>([]);
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const handleSubmit = async (selectedDecision: "APPROVED" | "REJECTED") => {
    setIsSubmitting(true);
    setSubmittingDecision(selectedDecision);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // For APPROVED: use actual checkbox values
      // For REJECTED: send all checkboxes as false (data will not check)
      const submitData = {
        FileID: fileId,
        IsRuleBased: selectedDecision === "APPROVED" ? isRuleBased : false,
        SystemAccessible: selectedDecision === "APPROVED" ? systemAccessible : false,
        ExceptionManageable: selectedDecision === "APPROVED" ? exceptionManageable : false,
        ComplianceRisk: selectedDecision === "APPROVED" ? complianceRisk : false,
        Decision: selectedDecision,
        Remarks: remarks || undefined,
      };

      const response = await fetch("http://127.0.0.1:8000/api/file-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Review Submitted Successfully",
          description: `File review has been saved. Decision: ${selectedDecision}`,
        });

        // Reset form
        setIsRuleBased(false);
        setSystemAccessible(false);
        setExceptionManageable(false);
        setComplianceRisk(false);
        setRemarks("");

        // If approved, show assignment dialog
        if (selectedDecision === "APPROVED") {
          setShowAssignmentDialog(true);
        } else {
          // Close dialog if rejected
          onOpenChange(false);
          // Notify parent component
          if (onReviewComplete) {
            onReviewComplete();
          }
        }
      } else {
        toast({
          title: "Review Submission Failed",
          description: data.message || "An error occurred while submitting the review.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Review Submission Failed",
        description: error.message || "An error occurred while submitting the review.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setSubmittingDecision(null);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isAssigning) {
      onOpenChange(false);
      setShowAssignmentDialog(false);
    }
  };

  // Fetch RPA Engineers
  useEffect(() => {
    const fetchRpaEngineers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("http://127.0.0.1:8000/api/rpa_users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        if (data.success && data.data) {
          // Map users to expected format (combining FirstName + LastName)
          const engineers = data.data.map((user: any) => ({
            UserId: user.UserId,
            UserName: `${user.FirstName} ${user.LastName}`.trim(),
          }));
          setRpaEngineers(engineers);
        }
      } catch (error: any) {
        console.error("Error fetching RPA engineers:", error);
      }
    };

    if (showAssignmentDialog) {
      fetchRpaEngineers();
    }
  }, [showAssignmentDialog]);

  const handleAssignToEngineers = async () => {
    if (selectedEngineerIds.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one RPA Engineer to assign this file.",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again.",
          variant: "destructive",
        });
        setIsAssigning(false);
        return;
      }

      // Create array of promises for each selected engineer
      const assignmentPromises = selectedEngineerIds.map((engineerId) => {
        const payload = {
          fileId: fileId,
          rpaEngineerId: engineerId,
        };

        return fetch("http://127.0.0.1:8000/api/Rpa_taskAssignment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }).then(async (response) => {
          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.message || `Failed to assign to engineer ${engineerId}`);
          }
          return data;
        });
      });

      await Promise.all(assignmentPromises);

      toast({
        title: "Assignment Created Successfully",
        description: `File has been assigned to ${selectedEngineerIds.length} RPA Engineer(s).`,
      });

      // Reset assignment form
      setSelectedEngineerIds([]);
      setAssignmentDescription("");

      // Close both dialogs
      setShowAssignmentDialog(false);
      onOpenChange(false);

      // Notify parent component
      if (onReviewComplete) {
        onReviewComplete();
      }

    } catch (error: any) {
      console.error("Error assigning to engineers:", error);
      toast({
        title: "Assignment Failed",
        description: error.message || "An error occurred while creating the assignment.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Automation Feasibility Review</DialogTitle>
          <DialogDescription>
            Quick check to see if automation is even possible for: <strong>{fileName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Checks Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Checks:</h3>

            {/* Is it rule-based? */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border border-border bg-card">
              <Checkbox
                id="isRuleBased"
                checked={isRuleBased}
                onCheckedChange={(checked) => setIsRuleBased(checked === true)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="isRuleBased" className="text-sm font-medium cursor-pointer">
                  Is it rule-based?
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  The process follows clear, consistent rules and logic.
                </p>
              </div>
            </div>

            {/* Are systems accessible? */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border border-border bg-card">
              <Checkbox
                id="systemAccessible"
                checked={systemAccessible}
                onCheckedChange={(checked) => setSystemAccessible(checked === true)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="systemAccessible" className="text-sm font-medium cursor-pointer">
                  Are systems accessible?
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Required systems and applications can be accessed for automation.
                </p>
              </div>
            </div>

            {/* Are exceptions manageable? */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border border-border bg-card">
              <Checkbox
                id="exceptionManageable"
                checked={exceptionManageable}
                onCheckedChange={(checked) => setExceptionManageable(checked === true)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="exceptionManageable" className="text-sm font-medium cursor-pointer">
                  Are exceptions manageable?
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Exceptions and edge cases can be handled programmatically.
                </p>
              </div>
            </div>

            {/* Any compliance risks? */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border border-border bg-card">
              <Checkbox
                id="complianceRisk"
                checked={complianceRisk}
                onCheckedChange={(checked) => setComplianceRisk(checked === true)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="complianceRisk" className="text-sm font-medium cursor-pointer">
                  Any compliance risks?
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Check if there are any compliance or regulatory concerns.
                </p>
              </div>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-sm font-semibold">
              Remarks (Optional)
            </Label>
            <Textarea
              id="remarks"
              placeholder="Add any additional comments or notes about this review..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Decision Section */}
          <div className="space-y-2">
            {/* <Label className="text-sm font-semibold">
              Decision: <span className="text-destructive">*</span>
            </Label> */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="default"
                className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit("APPROVED");
                }}
                disabled={isSubmitting}
              >
                {isSubmitting && submittingDecision === "APPROVED" ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="default"
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit("REJECTED");
                }}
                disabled={isSubmitting}
              >
                {isSubmitting && submittingDecision === "REJECTED" ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Assignment Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign to RPA Engineers</DialogTitle>
            <DialogDescription>
              Assign the approved file <strong>{fileName}</strong> to RPA Engineers for automation development.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* RPA Engineers Selection */}
            <div className="space-y-2">
              <Label htmlFor="engineers" className="text-sm font-semibold">
                Select RPA Engineers <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => {
                  const engineerId = parseInt(value);
                  if (!selectedEngineerIds.includes(engineerId)) {
                    setSelectedEngineerIds([...selectedEngineerIds, engineerId]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select RPA Engineers to assign" />
                </SelectTrigger>
                <SelectContent>
                  {rpaEngineers.map((engineer) => (
                    <SelectItem
                      key={engineer.UserId}
                      value={engineer.UserId.toString()}
                      disabled={selectedEngineerIds.includes(engineer.UserId)}
                    >
                      {engineer.UserName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Selected Engineers */}
              {selectedEngineerIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedEngineerIds.map((engineerId) => {
                    const engineer = rpaEngineers.find(
                      (e) => e.UserId === engineerId
                    );
                    return (
                      <div
                        key={engineerId}
                        className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-md text-sm"
                      >
                        <Users className="w-4 h-4" />
                        <span>{engineer?.UserName || `User ${engineerId}`}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEngineerIds(
                              selectedEngineerIds.filter((id) => id !== engineerId)
                            );
                          }}
                          className="ml-2 hover:text-destructive"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assignment Description */}
            <div className="space-y-2">
              <Label htmlFor="assignmentDescription" className="text-sm font-semibold">
                Assignment Description (Optional)
              </Label>
              <Textarea
                id="assignmentDescription"
                placeholder="Add any notes or instructions for the RPA Engineers..."
                value={assignmentDescription}
                onChange={(e) => setAssignmentDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignmentDialog(false);
                onOpenChange(false);
                if (onReviewComplete) {
                  onReviewComplete();
                }
              }}
              disabled={isAssigning}
            >
              Skip
            </Button>
            <Button
              onClick={handleAssignToEngineers}
              disabled={isAssigning || selectedEngineerIds.length === 0}
            >
              {isAssigning ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Assign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
