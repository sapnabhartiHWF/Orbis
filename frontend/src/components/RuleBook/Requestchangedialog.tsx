import React, { useState } from "react";
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
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Rule } from "@/components/RuleBook/RulesApi";

interface RequestChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: Rule | null;
  onSubmit: (data: {
    rule_id: number;
    proposed_subject: string;
    proposed_description: string;
    proposed_rule_logic: string;
    proposed_bot_id: number;
    change_summary: string;
  }) => Promise<void>;
}

export default function RequestChangeDialog({
  open,
  onOpenChange,
  rule,
  onSubmit,
}: RequestChangeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    proposed_subject: "",
    proposed_description: "",
    proposed_rule_logic: "",
    change_summary: "",
  });

  // Reset form when dialog opens with new rule
  React.useEffect(() => {
    if (open && rule) {
      setFormData({
        proposed_subject: rule.Subject || "",
        proposed_description: rule.Description || "",
        proposed_rule_logic: rule.RuleLogic || "",
        change_summary: "",
      });
      setError(null);
    }
  }, [open, rule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rule) {
      setError("No rule selected");
      return;
    }

    if (!formData.change_summary.trim()) {
      setError("Please provide a summary of changes");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        rule_id: parseInt(rule.RuleId),
        proposed_subject: formData.proposed_subject,
        proposed_description: formData.proposed_description,
        proposed_rule_logic: formData.proposed_rule_logic,
        proposed_bot_id: parseInt(rule.BotId),
        change_summary: formData.change_summary,
      });

      // Close dialog on success
      onOpenChange(false);
      
      // Reset form
      setFormData({
        proposed_subject: "",
        proposed_description: "",
        proposed_rule_logic: "",
        change_summary: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit change request");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Rule Change</DialogTitle>
          <DialogDescription>
            Submit a change request for <strong>{rule?.Subject}</strong>. All
            changes require approval before being applied.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="proposed_subject">Proposed Subject</Label>
            <Input
              id="proposed_subject"
              value={formData.proposed_subject}
              onChange={(e) =>
                handleInputChange("proposed_subject", e.target.value)
              }
              placeholder="Enter the new subject"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposed_description">Proposed Description</Label>
            <Textarea
              id="proposed_description"
              value={formData.proposed_description}
              onChange={(e) =>
                handleInputChange("proposed_description", e.target.value)
              }
              placeholder="Enter the new description"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposed_rule_logic">Proposed Rule Logic</Label>
            <Textarea
              id="proposed_rule_logic"
              value={formData.proposed_rule_logic}
              onChange={(e) =>
                handleInputChange("proposed_rule_logic", e.target.value)
              }
              placeholder="Enter the new rule logic"
              rows={5}
              className="font-mono text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="change_summary">
              Change Summary <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="change_summary"
              value={formData.change_summary}
              onChange={(e) =>
                handleInputChange("change_summary", e.target.value)
              }
              placeholder="Explain why these changes are needed and what impact they will have"
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              This summary will be reviewed by the approval team
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}