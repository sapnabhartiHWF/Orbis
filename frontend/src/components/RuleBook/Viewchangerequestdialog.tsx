import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, FileText, Code, Check, X } from "lucide-react";
import { ChangeRequest } from "@/components/RuleBook/RulesApi";

interface ViewChangeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changeRequest: ChangeRequest | null;
  onApprove?: () => void;
  onReject?: () => void;
}

export default function ViewChangeRequestDialog({
  open,
  onOpenChange,
  changeRequest,
  onApprove,
  onReject,
}: ViewChangeRequestDialogProps) {
  if (!changeRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">
                {changeRequest.ProposedSubject || "Change Request Details"}
              </DialogTitle>
              <DialogDescription>
                Review the proposed changes to this rule
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className={
                changeRequest.Status === "Pending"
                  ? "bg-warning/10 text-warning border-warning/30"
                  : changeRequest.Status === "Approved"
                  ? "bg-success/10 text-success border-success/30"
                  : "bg-destructive/10 text-destructive border-destructive/30"
              }
            >
              {changeRequest.Status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Request Information */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Request Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Requested by:</span>
                <span className="font-medium">{changeRequest.RequestedByName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {new Date(changeRequest.RequestedOn).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Change Summary */}
          {changeRequest.ChangeSummary && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Change Summary</h3>
              <p className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-4">
                {changeRequest.ChangeSummary}
              </p>
            </div>
          )}

          <Separator />

          {/* Proposed Changes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Proposed Changes</h3>

            {changeRequest.ProposedSubject && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                  Subject
                </label>
                <p className="text-sm bg-primary/5 border border-primary/20 rounded-lg p-3">
                  {changeRequest.ProposedSubject}
                </p>
              </div>
            )}

            {changeRequest.ProposedDescription && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                  Description
                </label>
                <p className="text-sm bg-primary/5 border border-primary/20 rounded-lg p-3">
                  {changeRequest.ProposedDescription}
                </p>
              </div>
            )}

            {changeRequest.ProposedRuleLogic && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Code className="w-3.5 h-3.5" />
                  Proposed Rule Logic
                </label>
                <div className="bg-slate-950 text-slate-50 rounded-lg p-4 border border-slate-800">
                  <pre className="text-xs font-mono overflow-x-auto">
                    {changeRequest.ProposedRuleLogic}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {changeRequest.Status === "Pending" && (onApprove || onReject) && (
            <>
              <Separator />
              <div className="flex items-center gap-3 pt-2">
                {onReject && (
                  <Button
                    variant="outline"
                    className="flex-1 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => {
                      onReject();
                      onOpenChange(false);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Request
                  </Button>
                )}
                {onApprove && (
                  <Button
                    className="flex-1 bg-success hover:bg-success/90 text-white"
                    onClick={() => {
                      onApprove();
                      onOpenChange(false);
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve Request
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}