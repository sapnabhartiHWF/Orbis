import { useState } from "react";

const STAGES = [
  { id: 1, key: "registration", label: "Process Registration", icon: "📋", color: "#4F8EF7" },
  { id: 2, key: "feasibility", label: "Feasibility Check", icon: "🔍", color: "#7C6AF7" },
  { id: 3, key: "analysis", label: "Detailed Analysis", icon: "📊", color: "#A855F7" },
  { id: 4, key: "technical", label: "Technical Assessment", icon: "⚙️", color: "#EC4899" },
  { id: 5, key: "business", label: "Business Case", icon: "💼", color: "#F97316" },
  { id: 6, key: "development", label: "Development", icon: "💻", color: "#EAB308" },
  { id: 7, key: "qa", label: "QA Testing", icon: "🧪", color: "#22C55E" },
  { id: 8, key: "uat", label: "UAT", icon: "✅", color: "#14B8A6" },
  { id: 9, key: "golive", label: "Go-Live", icon: "🚀", color: "#06B6D4" },
  { id: 10, key: "hypercare", label: "Hypercare", icon: "🛡️", color: "#3B82F6" },
  { id: 11, key: "handover", label: "Handover", icon: "🤝", color: "#6366F1" },
];

const DUMMY = {
  processName: "Invoice Processing Automation",
  processId: "RPA-2024-0047",
  department: "Finance & Accounts",
  owner: "Sarah Mitchell",
  developer: "Raj Patel",
  tl: "Arjun Mehta",
  priority: "High",
  tool: "UiPath",
  devStart: "2024-03-01",
  devEnd: "2024-03-21",
  qaStart: "2024-03-22",
  qaEnd: "2024-03-28",
};

// ─── SHARED COMPONENTS ──────────────────────────────────────────────────────

function Badge({ label, color = "#4F8EF7" }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600, letterSpacing: 0.3
    }}>{label}</span>
  );
}

function Field({ label, value, full = false }) {
  return (
    <div style={{ gridColumn: full ? "1/-1" : undefined }}>
      <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#E2E8F0", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function SectionCard({ title, children, accent = "#4F8EF7" }) {
  return (
    <div style={{
      background: "#0F172A", border: `1px solid #1E293B`, borderRadius: 14,
      padding: "20px 24px", marginBottom: 16,
      borderLeft: `3px solid ${accent}`
    }}>
      {title && <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>{title}</div>}
      {children}
    </div>
  );
}

function Grid({ children, cols = 3 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "14px 24px" }}>
      {children}
    </div>
  );
}

function Checkbox({ label, checked = false }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: "#CBD5E1", fontSize: 13 }}>
      <div style={{
        width: 18, height: 18, borderRadius: 5,
        background: checked ? "#4F8EF7" : "transparent",
        border: `2px solid ${checked ? "#4F8EF7" : "#334155"}`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>
        {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </div>
      {label}
    </label>
  );
}

function StatusPill({ status }) {
  const map = {
    "Approved": "#22C55E", "Rejected": "#EF4444", "Pending": "#EAB308",
    "In Progress": "#4F8EF7", "Passed": "#22C55E", "Failed": "#EF4444",
    "On Hold": "#F97316", "Completed": "#14B8A6"
  };
  const c = map[status] || "#64748B";
  return <Badge label={status} color={c} />;
}

function ApprovalBar({ approvers = [] }) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {approvers.map((a, i) => (
        <div key={i} style={{
          background: "#1E293B", borderRadius: 10, padding: "12px 18px",
          display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 200
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: a.color + "33",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
          }}>{a.avatar}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>{a.name}</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>{a.role}</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <StatusPill status={a.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationTag({ text }) {
  return (
    <div style={{
      background: "#FEF3C733", border: "1px solid #FEF3C744", borderRadius: 8,
      padding: "8px 14px", fontSize: 12, color: "#FDE68A",
      display: "flex", alignItems: "center", gap: 8, marginBottom: 14
    }}>
      <span>🔔</span> {text}
    </div>
  );
}

function Timeline({ items }) {
  return (
    <div style={{ position: "relative", paddingLeft: 20 }}>
      <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: "#1E293B" }} />
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16, position: "relative" }}>
          <div style={{
            width: 14, height: 14, borderRadius: "50%", flexShrink: 0, marginTop: 2,
            background: item.done ? "#4F8EF7" : "#1E293B",
            border: `2px solid ${item.done ? "#4F8EF7" : "#334155"}`
          }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: item.done ? "#E2E8F0" : "#64748B" }}>{item.label}</div>
            {item.sub && <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{item.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatBox({ label, value, color = "#4F8EF7" }) {
  return (
    <div style={{
      background: "#0F172A", border: "1px solid #1E293B", borderRadius: 12,
      padding: "16px 20px", textAlign: "center"
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'DM Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748B", marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function ActionButtons({ primary, secondary, danger = undefined }) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
      {danger && (
        <button style={{
          background: "#EF444422", border: "1px solid #EF444444", color: "#F87171",
          borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer"
        }}>{danger}</button>
      )}
      {secondary && (
        <button style={{
          background: "transparent", border: "1px solid #334155", color: "#94A3B8",
          borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer"
        }}>{secondary}</button>
      )}
      {primary && (
        <button style={{
          background: "linear-gradient(135deg, #4F8EF7, #7C6AF7)", border: "none", color: "#fff",
          borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer"
        }}>{primary}</button>
      )}
    </div>
  );
}

// ─── STAGE SCREENS ───────────────────────────────────────────────────────────

function Stage1() {
  return (
    <div>
      <NotificationTag text="Notification sent to Developer (Raj Patel) and TL (Arjun Mehta) upon submission" />
      <SectionCard title="Process Information" accent="#4F8EF7">
        <Grid>
          <Field label="Process Name" value={DUMMY.processName} />
          <Field label="Process ID" value={DUMMY.processId} />
          <Field label="Department" value={DUMMY.department} />
          <Field label="Business Owner" value={DUMMY.owner} />
          <Field label="Assigned Developer" value={DUMMY.developer} />
          <Field label="Priority" value={<Badge label={DUMMY.priority} color="#F97316" />} />
          <Field label="Submission Date" value="Feb 10, 2024" />
          <Field label="Expected Go-Live" value="Apr 30, 2024" />
          <Field label="Process Description" value="Automate end-to-end invoice extraction, validation, and ERP entry from email attachments." full />
        </Grid>
      </SectionCard>
      <SectionCard title="Uploaded Documents" accent="#4F8EF7">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { name: "Invoice_SOP_v2.pdf", size: "1.2 MB", type: "SOP" },
            { name: "Sample_Invoices_50.zip", size: "4.8 MB", type: "Data Sample" },
          ].map((f, i) => (
            <div key={i} style={{
              background: "#1E293B", borderRadius: 10, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 14
            }}>
              <span style={{ fontSize: 22 }}>📄</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 600 }}>{f.name}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>{f.size} · {f.type}</div>
              </div>
              <Badge label={f.type} color="#4F8EF7" />
            </div>
          ))}
          <div style={{
            border: "2px dashed #334155", borderRadius: 10, padding: "20px",
            textAlign: "center", color: "#475569", fontSize: 13, cursor: "pointer"
          }}>
            + Upload SOP / Data Sample
          </div>
        </div>
      </SectionCard>
      <ActionButtons primary="Submit for Feasibility" secondary="Save Draft" />
    </div>
  );
}

function Stage2() {
  return (
    <div>
      <NotificationTag text="Business Owner notified on Approve/Reject decision" />
      <SectionCard title="Feasibility Criteria" accent="#7C6AF7">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Checkbox label="Process is rule-based with no ambiguous decisions" checked />
          <Checkbox label="Input data is structured or semi-structured (Excel, PDF, Email)" checked />
          <Checkbox label="Process has high volume / repetition (>50 transactions/day)" checked />
          <Checkbox label="Stable process — minimal changes expected in next 12 months" checked />
          <Checkbox label="Digital input available (no physical paper-only steps)" />
          <Checkbox label="Process is cross-system (automation adds clear value)" checked />
          <Checkbox label="Exceptions are <20% of total volume" />
          <Checkbox label="No real-time human judgement required" checked />
        </div>
      </SectionCard>
      <SectionCard title="Complexity Estimate" accent="#7C6AF7">
        <Grid>
          <Field label="Estimated Complexity" value={<Badge label="Medium" color="#EAB308" />} />
          <Field label="Applications Involved" value="SAP, Outlook, SharePoint" />
          <Field label="Estimated Dev Effort" value="15–20 Days" />
          <Field label="FTE Savings (Annual)" value="~820 hrs" />
          <Field label="Exception Rate" value="~12%" />
          <Field label="Automation Potential" value="87%" />
        </Grid>
      </SectionCard>
      <SectionCard title="TL Decision" accent="#7C6AF7">
        <ApprovalBar approvers={[
          { name: DUMMY.tl, role: "Technical Lead", avatar: "👨‍💼", color: "#7C6AF7", status: "Approved" },
        ]} />
        <div style={{ marginTop: 12, background: "#1E293B", borderRadius: 8, padding: 14, fontSize: 13, color: "#94A3B8" }}>
          <span style={{ color: "#64748B", fontWeight: 600 }}>TL Remarks: </span>
          Process qualifies for automation. Stable rule-based logic confirmed. Approved to proceed.
        </div>
      </SectionCard>
      <ActionButtons primary="Approve → Detailed Analysis" danger="Reject Process" secondary="Request More Info" />
    </div>
  );
}

function Stage3() {
  return (
    <div>
      <NotificationTag text="Owner and TL notified to review the uploaded PDD document" />
      <SectionCard title="Process Design Document (PDD)" accent="#A855F7">
        <div style={{ background: "#1E293B", borderRadius: 10, padding: "16px", display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <span style={{ fontSize: 30 }}>📑</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: "#E2E8F0", fontWeight: 700 }}>Invoice_Processing_PDD_v1.3.docx</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>Uploaded by Raj Patel · Feb 14, 2024 · 2.4 MB</div>
          </div>
          <button style={{ background: "#4F8EF722", border: "1px solid #4F8EF744", color: "#4F8EF7", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Preview
          </button>
        </div>
        <div style={{
          border: "2px dashed #334155", borderRadius: 10, padding: "20px",
          textAlign: "center", color: "#475569", fontSize: 13, cursor: "pointer"
        }}>
          + Upload New Version of PDD
        </div>
      </SectionCard>
      <SectionCard title="PDD Review & Approval" accent="#A855F7">
        <ApprovalBar approvers={[
          { name: DUMMY.tl, role: "Technical Lead", avatar: "👨‍💼", color: "#A855F7", status: "Approved" },
          { name: DUMMY.owner, role: "Business Owner", avatar: "👩‍💼", color: "#EC4899", status: "Pending" },
        ]} />
        <div style={{ marginTop: 14, background: "#1E293B", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8, fontWeight: 600 }}>Owner / TL Remarks</div>
          <textarea readOnly value="TL: PDD looks comprehensive. Waiting for Owner sign-off." style={{
            width: "100%", background: "transparent", border: "none", color: "#94A3B8",
            fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit"
          }} rows={2} />
        </div>
      </SectionCard>
      <ActionButtons primary="Approve → Technical Assessment" danger="Reject PDD" secondary="Request Revision" />
    </div>
  );
}

function Stage4() {
  return (
    <div>
      <NotificationTag text="Owner and TL notified — this stage is read-only for them" />
      <SectionCard title="Technical Readiness Checklist" accent="#EC4899">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Checkbox label="Bot infrastructure (VM / Orchestrator) provisioned" checked />
          <Checkbox label="Application credentials and service accounts created" checked />
          <Checkbox label="Network and firewall access confirmed for all target applications" checked />
          <Checkbox label="Test environment available and mirrors production" />
          <Checkbox label="Input folder/email inbox configured for bot access" checked />
          <Checkbox label="Exception handling and logging framework defined" checked />
          <Checkbox label="Version control repository created (Git / SVN)" checked />
          <Checkbox label="Code review process agreed with TL" />
        </div>
      </SectionCard>
      <SectionCard title="Tool & Environment Details" accent="#EC4899">
        <Grid>
          <Field label="RPA Tool" value={DUMMY.tool} />
          <Field label="Bot Type" value="Attended / Unattended" />
          <Field label="Target Environment" value="Windows Server 2019" />
          <Field label="Orchestrator URL" value="https://cloud.uipath.com/org" />
          <Field label="Target Applications" value="SAP ECC 6.0, MS Outlook, SharePoint" full />
        </Grid>
      </SectionCard>
      <SectionCard title="Assessment Summary" accent="#EC4899">
        <Grid cols={4}>
          <StatBox label="Checks Passed" value="6/8" color="#22C55E" />
          <StatBox label="Pending Items" value="2" color="#EAB308" />
          <StatBox label="Blockers" value="0" color="#EF4444" />
          <StatBox label="Risk Level" value="Low" color="#4F8EF7" />
        </Grid>
      </SectionCard>
      <ActionButtons primary="Mark Complete → Business Case" secondary="Save Progress" />
    </div>
  );
}

function Stage5() {
  return (
    <div>
      <NotificationTag text="Owner and TL notified to review and approve the Business Case" />
      <SectionCard title="Business Case Summary" accent="#F97316">
        <Grid>
          <Field label="Annual FTE Savings" value="~820 hours" />
          <Field label="FTE Cost Saved (Est.)" value="₹12.3 Lakhs/year" />
          <Field label="Development Cost" value="₹3.8 Lakhs" />
          <Field label="ROI Period" value="~4 months" />
          <Field label="3-Year ROI" value="270%" />
          <Field label="Error Reduction" value="~95%" />
        </Grid>
      </SectionCard>
      <SectionCard title="Business Case Document" accent="#F97316">
        <div style={{ background: "#1E293B", borderRadius: 10, padding: "16px", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 30 }}>📊</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: "#E2E8F0", fontWeight: 700 }}>Invoice_Automation_BusinessCase_v1.pptx</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>Uploaded by Raj Patel · Feb 16, 2024 · 3.1 MB</div>
          </div>
          <button style={{ background: "#F9731622", border: "1px solid #F9731644", color: "#F97316", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Preview</button>
        </div>
      </SectionCard>
      <SectionCard title="Approval" accent="#F97316">
        <ApprovalBar approvers={[
          { name: DUMMY.tl, role: "Technical Lead", avatar: "👨‍💼", color: "#F97316", status: "Approved" },
          { name: DUMMY.owner, role: "Business Owner", avatar: "👩‍💼", color: "#EC4899", status: "Approved" },
        ]} />
      </SectionCard>
      <ActionButtons primary="Approve → Move to Development" danger="Reject Business Case" secondary="Request Changes" />
    </div>
  );
}

function Stage6() {
  return (
    <div>
      <NotificationTag text="Owner and TL notified — process has moved to Development phase" />
      <SectionCard title="Development Assignment" accent="#EAB308">
        <Grid>
          <Field label="Assigned Developer" value={DUMMY.developer} />
          <Field label="Development Start" value={DUMMY.devStart} />
          <Field label="Estimated End" value={DUMMY.devEnd} />
          <Field label="RPA Tool" value={DUMMY.tool} />
          <Field label="Repository" value="github.com/rpa-team/invoice-proc" />
          <Field label="Bot Version" value="v0.3-alpha" />
        </Grid>
      </SectionCard>
      <SectionCard title="Development Progress" accent="#EAB308">
        <Timeline items={[
          { label: "Environment Setup", sub: "Mar 1, 2024", done: true },
          { label: "Main Flow — Email Reading & Attachment Extraction", sub: "Mar 4–8, 2024", done: true },
          { label: "Invoice Data Extraction (OCR + Validation)", sub: "Mar 9–13, 2024", done: true },
          { label: "SAP Entry Automation", sub: "Mar 14–18, 2024", done: false },
          { label: "Exception Handling & Logging", sub: "Mar 19–20, 2024", done: false },
          { label: "Internal Code Review", sub: "Mar 21, 2024", done: false },
        ]} />
      </SectionCard>
      <SectionCard title="Time Tracker" accent="#EAB308">
        <Grid cols={4}>
          <StatBox label="Days Elapsed" value="13" color="#EAB308" />
          <StatBox label="Days Remaining" value="8" color="#4F8EF7" />
          <StatBox label="Progress" value="55%" color="#22C55E" />
          <StatBox label="Status" value="On Track" color="#22C55E" />
        </Grid>
      </SectionCard>
      <ActionButtons primary="Mark Bot as Developed → QA" secondary="Update Progress" />
    </div>
  );
}

function Stage7() {
  return (
    <div>
      <NotificationTag text="Owner and TL notified — process has entered QA Testing phase" />
      <SectionCard title="QA Test Execution" accent="#22C55E">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { tc: "TC-001", name: "Standard invoice — correct extraction and SAP entry", result: "Passed" },
            { tc: "TC-002", name: "Invoice with missing fields — exception handled correctly", result: "Passed" },
            { tc: "TC-003", name: "Duplicate invoice detection", result: "Failed" },
            { tc: "TC-004", name: "Multi-currency invoice processing", result: "Passed" },
            { tc: "TC-005", name: "Large volume batch (100 invoices)", result: "Pending" },
            { tc: "TC-006", name: "Email attachment with password-protected PDF", result: "Pending" },
          ].map((t, i) => (
            <div key={i} style={{
              background: "#1E293B", borderRadius: 10, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 16
            }}>
              <div style={{ fontSize: 11, color: "#64748B", fontFamily: "'DM Mono', monospace", width: 60 }}>{t.tc}</div>
              <div style={{ flex: 1, fontSize: 13, color: "#CBD5E1" }}>{t.name}</div>
              <StatusPill status={t.result} />
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="QA Summary" accent="#22C55E">
        <Grid cols={4}>
          <StatBox label="Total TCs" value="6" color="#4F8EF7" />
          <StatBox label="Passed" value="3" color="#22C55E" />
          <StatBox label="Failed" value="1" color="#EF4444" />
          <StatBox label="Pending" value="2" color="#EAB308" />
        </Grid>
      </SectionCard>
      <SectionCard title="QA Time Tracker" accent="#22C55E">
        <Grid>
          <Field label="QA Start Date" value={DUMMY.qaStart} />
          <Field label="Target End Date" value={DUMMY.qaEnd} />
          <Field label="Days in QA" value="4 days" />
        </Grid>
      </SectionCard>
      <ActionButtons primary="Mark QA Passed → UAT" danger="Send Back to Development" secondary="Add Test Cases" />
    </div>
  );
}

function Stage8() {
  return (
    <div>
      <NotificationTag text="Business Owner (Sarah Mitchell) notified to perform UAT and review the bot" />
      <SectionCard title="What is UAT?" accent="#14B8A6">
        <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.7 }}>
          User Acceptance Testing (UAT) is your final review before the bot goes live. You will run the bot on real business scenarios and confirm it meets your expectations. Your approval here is the final gate before deployment.
        </div>
      </SectionCard>
      <SectionCard title="UAT Checklist (Filled by Business Owner)" accent="#14B8A6">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Checkbox label="Bot processes standard invoices correctly end-to-end" checked />
          <Checkbox label="Output in SAP matches what I would do manually" checked />
          <Checkbox label="Exception emails received when bot cannot process an invoice" checked />
          <Checkbox label="Bot handles all invoice formats we use (PDF, scanned, email body)" />
          <Checkbox label="Volume tested — bot handles peak day volume without failure" checked />
          <Checkbox label="I am satisfied the bot is ready for production use" />
        </div>
      </SectionCard>
      <SectionCard title="UAT Test Scenarios" accent="#14B8A6">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { scenario: "Run 10 live invoices from today's email", result: "Passed" },
            { scenario: "Check 3 scanned/handwritten invoices", result: "Failed" },
            { scenario: "Verify SAP entries match invoice values", result: "Passed" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#1E293B", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ flex: 1, fontSize: 13, color: "#CBD5E1" }}>{s.scenario}</div>
              <StatusPill status={s.result} />
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Owner Remarks" accent="#14B8A6">
        <div style={{ background: "#1E293B", borderRadius: 8, padding: 14 }}>
          <textarea readOnly value="Scanned invoice handling needs improvement. Sending back to QA for this specific scenario. Rest of the flows are working perfectly." style={{
            width: "100%", background: "transparent", border: "none", color: "#94A3B8",
            fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit"
          }} rows={3} />
        </div>
      </SectionCard>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button style={{ background: "#EF444422", border: "1px solid #EF444444", color: "#F87171", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Fail → Send back to QA
        </button>
        <button style={{ background: "linear-gradient(135deg, #14B8A6, #22C55E)", border: "none", color: "#fff", borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          UAT Passed → Go-Live ✓
        </button>
      </div>
    </div>
  );
}

function Stage9() {
  return (
    <div>
      <NotificationTag text="TL and Business Owner notified — bot is being deployed to production" />
      <SectionCard title="Deployment Details" accent="#06B6D4">
        <Grid>
          <Field label="Deployment Date" value="Mar 31, 2024" />
          <Field label="Environment" value="Production" />
          <Field label="Orchestrator Queue" value="InvoiceProcessing_PROD" />
          <Field label="Bot Version" value="v1.0.0" />
          <Field label="Schedule" value="Mon–Fri, 09:00 AM daily" />
          <Field label="Deployed By" value={DUMMY.developer} />
        </Grid>
      </SectionCard>
      <SectionCard title="Go-Live Checklist" accent="#06B6D4">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Checkbox label="Production credentials configured in Orchestrator" checked />
          <Checkbox label="Monitoring and alerting set up (email on failure)" checked />
          <Checkbox label="Exception queue configured and tested" checked />
          <Checkbox label="Rollback plan documented and shared with TL" checked />
          <Checkbox label="First run completed successfully in production" checked />
        </div>
      </SectionCard>
      <SectionCard title="Initial Run Stats" accent="#06B6D4">
        <Grid cols={4}>
          <StatBox label="Invoices Processed" value="47" color="#06B6D4" />
          <StatBox label="Success Rate" value="96%" color="#22C55E" />
          <StatBox label="Exceptions" value="2" color="#EAB308" />
          <StatBox label="Avg. Time/Invoice" value="43s" color="#4F8EF7" />
        </Grid>
      </SectionCard>
      <ActionButtons primary="Proceed to Hypercare" secondary="View Orchestrator Logs" />
    </div>
  );
}

function Stage10() {
  return (
    <div>
      <NotificationTag text="Hypercare period active — bot is being monitored for 4 weeks post go-live" />
      <SectionCard title="Hypercare Overview" accent="#3B82F6">
        <Grid>
          <Field label="Hypercare Start" value="Apr 1, 2024" />
          <Field label="Hypercare End" value="Apr 28, 2024" />
          <Field label="Monitoring By" value={DUMMY.developer} />
          <Field label="Days Remaining" value="12 days" />
          <Field label="Issue SLA" value="Resolve within 24 hrs" />
          <Field label="Status" value={<Badge label="Active" color="#22C55E" />} />
        </Grid>
      </SectionCard>
      <SectionCard title="Daily Run Summary (Last 7 Days)" accent="#3B82F6">
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { day: "Apr 15", success: 98 }, { day: "Apr 16", success: 100 },
            { day: "Apr 17", success: 95 }, { day: "Apr 18", success: 100 },
            { day: "Apr 19", success: 100 }, { day: "Apr 22", success: 97 },
            { day: "Apr 23", success: 100 },
          ].map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                height: 60, background: "#1E293B", borderRadius: 6, marginBottom: 6,
                display: "flex", alignItems: "flex-end", overflow: "hidden"
              }}>
                <div style={{ width: "100%", height: `${d.success}%`, background: d.success === 100 ? "#22C55E" : d.success >= 97 ? "#EAB308" : "#EF4444", borderRadius: "4px 4px 0 0" }} />
              </div>
              <div style={{ fontSize: 10, color: "#475569" }}>{d.day}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>{d.success}%</div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Issues Raised" accent="#3B82F6">
        {[
          { id: "ISS-001", desc: "Bot failed on invoices with 2-page PDF layout", severity: "Medium", status: "Resolved" },
          { id: "ISS-002", desc: "Occasional timeout on SAP slow-load days", severity: "Low", status: "In Progress" },
        ].map((iss, i) => (
          <div key={i} style={{ background: "#1E293B", borderRadius: 10, padding: "12px 16px", marginBottom: 10, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ fontSize: 11, color: "#64748B", fontFamily: "'DM Mono', monospace", width: 70 }}>{iss.id}</div>
            <div style={{ flex: 1, fontSize: 13, color: "#CBD5E1" }}>{iss.desc}</div>
            <Badge label={iss.severity} color={iss.severity === "Medium" ? "#F97316" : "#EAB308"} />
            <StatusPill status={iss.status} />
          </div>
        ))}
      </SectionCard>
      <ActionButtons primary="Complete Hypercare → Handover" secondary="Extend Hypercare Period" />
    </div>
  );
}

function Stage11() {
  return (
    <div>
      <SectionCard title="Handover Summary" accent="#6366F1">
        <Grid>
          <Field label="Process" value={DUMMY.processName} />
          <Field label="Process ID" value={DUMMY.processId} />
          <Field label="Developed By" value={DUMMY.developer} />
          <Field label="Handover Date" value="Apr 29, 2024" />
          <Field label="Support Owner" value="CoE Support Team" />
          <Field label="Bot Version" value="v1.0.0" />
        </Grid>
      </SectionCard>
      <SectionCard title="Handover Documents" accent="#6366F1">
        {[
          { name: "Invoice_Automation_SDD_v1.docx", type: "Solution Design" },
          { name: "Operations_Runbook_v1.pdf", type: "Runbook" },
          { name: "Troubleshooting_Guide.pdf", type: "Support Guide" },
          { name: "Orchestrator_Config_Export.json", type: "Config" },
        ].map((f, i) => (
          <div key={i} style={{
            background: "#1E293B", borderRadius: 10, padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 14, marginBottom: 8
          }}>
            <span style={{ fontSize: 20 }}>📄</span>
            <div style={{ flex: 1, fontSize: 13, color: "#E2E8F0", fontWeight: 600 }}>{f.name}</div>
            <Badge label={f.type} color="#6366F1" />
          </div>
        ))}
      </SectionCard>
      <SectionCard title="Final Sign-Off" accent="#6366F1">
        <ApprovalBar approvers={[
          { name: DUMMY.developer, role: "Developer", avatar: "👨‍💻", color: "#6366F1", status: "Approved" },
          { name: DUMMY.tl, role: "Technical Lead", avatar: "👨‍💼", color: "#4F8EF7", status: "Approved" },
          { name: DUMMY.owner, role: "Business Owner", avatar: "👩‍💼", color: "#EC4899", status: "Approved" },
        ]} />
      </SectionCard>
      <SectionCard title="Process Lifecycle Stats" accent="#6366F1">
        <Grid cols={4}>
          <StatBox label="Total Duration" value="78d" color="#6366F1" />
          <StatBox label="Dev Time" value="21d" color="#EAB308" />
          <StatBox label="QA Cycles" value="2" color="#EC4899" />
          <StatBox label="UAT Cycles" value="1" color="#14B8A6" />
        </Grid>
      </SectionCard>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#E2E8F0" }}>Process Successfully Automated</div>
        <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Bot is live and handed over to support. Lifecycle complete.</div>
      </div>
    </div>
  );
}

const STAGE_COMPONENTS = [Stage1, Stage2, Stage3, Stage4, Stage5, Stage6, Stage7, Stage8, Stage9, Stage10, Stage11];

// ─── TL DASHBOARD ────────────────────────────────────────────────────────────

function TLDashboard() {
  const stageData = [
    { stage: "Registration", count: 12, color: "#4F8EF7" },
    { stage: "Feasibility", count: 8, color: "#7C6AF7" },
    { stage: "Analysis", count: 5, color: "#A855F7" },
    { stage: "Tech Assessment", count: 4, color: "#EC4899" },
    { stage: "Business Case", count: 3, color: "#F97316" },
    { stage: "Development", count: 18, color: "#EAB308" },
    { stage: "QA", count: 7, color: "#22C55E" },
    { stage: "UAT", count: 4, color: "#14B8A6" },
    { stage: "Go-Live", count: 2, color: "#06B6D4" },
    { stage: "Hypercare", count: 6, color: "#3B82F6" },
    { stage: "Handover", count: 31, color: "#6366F1" },
  ];
  const total = stageData.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#64748B", marginBottom: 4 }}>TL View — Read-only pipeline overview. Intervene only when needed.</div>
      </div>
      <Grid cols={4}>
        <StatBox label="Total Processes" value={total} color="#4F8EF7" />
        <StatBox label="In Development" value="18" color="#EAB308" />
        <StatBox label="Live & Hypercare" value="8" color="#22C55E" />
        <StatBox label="Completed" value="31" color="#6366F1" />
      </Grid>
      <div style={{ height: 16 }} />
      <SectionCard title="Pipeline — Processes by Stage" accent="#4F8EF7">
        {stageData.map((s, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#94A3B8" }}>{s.stage}</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{s.count}</span>
            </div>
            <div style={{ height: 6, background: "#1E293B", borderRadius: 4 }}>
              <div style={{ height: "100%", width: `${(s.count / total) * 100 * 3}%`, maxWidth: "100%", background: s.color, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </SectionCard>
      <SectionCard title="SLA Breaches — Attention Needed" accent="#EF4444">
        {[
          { process: "Payroll Reconciliation Bot", stage: "Feasibility", stuckFor: "8 days", dev: "Priya S." },
          { process: "PO Creation Automation", stage: "UAT", stuckFor: "6 days", dev: "Raj P." },
        ].map((p, i) => (
          <div key={i} style={{ background: "#EF444411", border: "1px solid #EF444433", borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 600 }}>{p.process}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>Stuck in <b style={{ color: "#94A3B8" }}>{p.stage}</b> for {p.stuckFor} · Dev: {p.dev}</div>
            </div>
            <button style={{ background: "#EF444422", border: "1px solid #EF444444", color: "#F87171", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Review
            </button>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeStage, setActiveStage] = useState(0); // 0 = TL Dashboard
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const StageContent = activeStage === 0 ? null : STAGE_COMPONENTS[activeStage - 1];
  const currentStage = activeStage > 0 ? STAGES[activeStage - 1] : null;

  return (
    <div style={{
      display: "flex", height: "100vh", background: "#020817",
      fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif", overflow: "hidden",
      color: "#E2E8F0"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0F172A; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 4px; }
        * { box-sizing: border-box; }
      `}</style>

      {/* SIDEBAR */}
      <div style={{
        width: sidebarOpen ? 260 : 64, transition: "width 0.3s ease",
        background: "#0A1020", borderRight: "1px solid #0F1F35",
        display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden"
      }}>
        {/* Logo */}
        <div style={{
          padding: sidebarOpen ? "20px 20px" : "20px 14px",
          borderBottom: "1px solid #0F1F35",
          display: "flex", alignItems: "center", gap: 10
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #4F8EF7, #7C6AF7)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
          }}>⚡</div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0", letterSpacing: -0.3 }}>RPA Lifecycle</div>
              <div style={{ fontSize: 10, color: "#334155", fontWeight: 600, letterSpacing: 0.5 }}>AUTOMATION PLATFORM</div>
            </div>
          )}
        </div>

        {/* Process Info */}
        {sidebarOpen && (
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #0F1F35" }}>
            <div style={{ fontSize: 10, color: "#334155", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Active Process</div>
            <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600, lineHeight: 1.4 }}>{DUMMY.processName}</div>
            <div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>{DUMMY.processId}</div>
          </div>
        )}

        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
          {/* TL Dashboard */}
          <button onClick={() => setActiveStage(0)} style={{
            width: "100%", background: activeStage === 0 ? "#4F8EF722" : "transparent",
            border: activeStage === 0 ? "1px solid #4F8EF744" : "1px solid transparent",
            borderRadius: 10, padding: sidebarOpen ? "10px 12px" : "10px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10, marginBottom: 8
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>📈</span>
            {sidebarOpen && <span style={{ fontSize: 12, fontWeight: 600, color: activeStage === 0 ? "#4F8EF7" : "#64748B" }}>TL Dashboard</span>}
          </button>

          <div style={{ fontSize: 10, color: "#1E3A5F", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, padding: "4px 4px 8px", display: sidebarOpen ? "block" : "none" }}>
            Workflow Stages
          </div>

          {STAGES.map((s, i) => {
            const isActive = activeStage === i + 1;
            const isDone = i + 1 < (activeStage || 1);
            return (
              <button key={s.id} onClick={() => setActiveStage(i + 1)} style={{
                width: "100%", background: isActive ? s.color + "22" : "transparent",
                border: isActive ? `1px solid ${s.color}44` : "1px solid transparent",
                borderRadius: 10, padding: sidebarOpen ? "9px 12px" : "10px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                marginBottom: 4
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: isActive ? s.color + "33" : isDone ? "#1E293B" : "#0F172A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, border: isDone ? "1px solid #22C55E44" : "none"
                }}>
                  {isDone ? "✓" : s.icon}
                </div>
                {sidebarOpen && (
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#334155", fontFamily: "'DM Mono', monospace" }}>Stage {s.id}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? s.color : isDone ? "#22C55E" : "#475569", lineHeight: 1.2 }}>{s.label}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Collapse Button */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          background: "transparent", border: "none", color: "#334155",
          cursor: "pointer", padding: "14px", fontSize: 18,
          borderTop: "1px solid #0F1F35", textAlign: "center"
        }}>
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          padding: "18px 28px", borderBottom: "1px solid #0F1F35",
          background: "#0A1020", display: "flex", alignItems: "center", gap: 16
        }}>
          {currentStage ? (
            <>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: currentStage.color + "22", border: `1px solid ${currentStage.color}44`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
              }}>{currentStage.icon}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#E2E8F0" }}>{currentStage.label}</div>
                <div style={{ fontSize: 12, color: "#475569" }}>Stage {currentStage.id} of 11 · {DUMMY.processId}</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                <StatusPill status="In Progress" />
                <Badge label={DUMMY.priority + " Priority"} color="#F97316" />
              </div>
            </>
          ) : (
            <>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#4F8EF722", border: "1px solid #4F8EF744", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📈</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#E2E8F0" }}>TL Dashboard</div>
                <div style={{ fontSize: 12, color: "#475569" }}>Pipeline overview — all processes across stages</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <Badge label="Read-Only Oversight" color="#4F8EF7" />
              </div>
            </>
          )}
        </div>

        {/* Stage Progress Bar */}
        {activeStage > 0 && (
          <div style={{ padding: "12px 28px", borderBottom: "1px solid #0A1628", background: "#060E1A" }}>
            <div style={{ display: "flex", gap: 3 }}>
              {STAGES.map((s, i) => (
                <div key={s.id} onClick={() => setActiveStage(i + 1)} style={{
                  flex: 1, height: 4, borderRadius: 4, cursor: "pointer",
                  background: i + 1 === activeStage ? s.color : i + 1 < activeStage ? "#22C55E44" : "#0F1F35"
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {activeStage === 0 ? <TLDashboard /> : StageContent ? <StageContent /> : null}
        </div>
      </div>
    </div>
  );
}
