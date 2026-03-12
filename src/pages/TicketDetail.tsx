import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Paperclip, Send, ArrowUpRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { MOCK_TICKETS, getRoleColor } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");

  const ticket = MOCK_TICKETS.find(t => t.id === id);

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Ticket not found</p>
          <Button variant="outline" className="mt-3" onClick={() => navigate("/tickets")}>Back to Tickets</Button>
        </div>
      </div>
    );
  }

  const isOpen = !["Resolved", "Closed"].includes(ticket.status);

  const handleAddComment = () => {
    if (!comment.trim()) return;
    toast.success("Comment added successfully.");
    setComment("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="px-8 py-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/tickets")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ticket.id}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Created by {ticket.createdBy} on {new Date(ticket.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left: Details + Audit Trail */}
        <div className="space-y-6">
          {/* Description */}
          <div className="rounded-lg bg-card shadow-card p-6">
            <h2 className="text-base font-medium mb-3">Complaint Details</h2>
            <p className="text-sm leading-relaxed" style={{ textWrap: "pretty" }}>{ticket.description}</p>
          </div>

          {/* Audit Trail */}
          <div className="rounded-lg bg-card shadow-card p-6">
            <h2 className="text-base font-medium mb-4">Audit Trail</h2>
            <div className="space-y-0">
              {ticket.auditTrail.map((entry, i) => (
                <div key={entry.id} className="flex gap-3 relative">
                  {/* Timeline line */}
                  {i < ticket.auditTrail.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
                  )}
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card z-10">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div className="pb-6 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{entry.user}</span>
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", getRoleColor(entry.role))}>
                        {entry.role}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(entry.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {new Date(entry.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground/80 mt-0.5">{entry.action}</p>
                    {entry.note && <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Comment */}
          {isOpen && (
            <div className="rounded-lg bg-card shadow-card p-6">
              <h2 className="text-base font-medium mb-3">Add Comment</h2>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Add a note or resolution comment..." className="resize-none mb-3" />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" /> Attach File
                </Button>
                <Button size="sm" onClick={handleAddComment} className="gap-1.5 ml-auto">
                  <Send className="h-3.5 w-3.5" /> Add Comment
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Metadata + Actions */}
        <div className="space-y-6">
          {/* Status & Meta */}
          <div className="rounded-lg bg-card shadow-card p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Status</p>
                <StatusBadge status={ticket.status} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Product</p>
                  <p className="text-sm font-medium">{ticket.product}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Amount</p>
                  <p className="text-sm font-medium font-mono">₹{ticket.amount.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">UTR/RRN</p>
                  <p className="text-sm font-medium font-mono">{ticket.utr}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Account</p>
                  <p className="text-sm font-medium font-mono">{ticket.accountNumber}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Branch</p>
                  <p className="text-sm">{ticket.branch}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Regional Office</p>
                  <p className="text-sm">{ticket.regionalOffice}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Assigned To</p>
                  <p className="text-sm">{ticket.assignedTo}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Created By</p>
                  <p className="text-sm">{ticket.createdBy}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Created</p>
                  <p className="text-sm">{new Date(ticket.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm">{new Date(ticket.updatedAt).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isOpen && (
            <div className="rounded-lg bg-card shadow-card p-6">
              <h2 className="text-base font-medium mb-3">Actions</h2>
              <div className="space-y-2">
                {ticket.status !== "Escalated to HO" && ticket.status !== "Pending at HO" && (
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => toast.success("Ticket escalated to Head Office.")}>
                    <ArrowUpRight className="h-4 w-4" /> Escalate to Head Office
                  </Button>
                )}
                <Button className="w-full justify-start gap-2" onClick={() => toast.success(`Ticket ${ticket.id} resolved and closed.`)}>
                  <CheckCircle className="h-4 w-4" /> Resolve & Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
