import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Paperclip, Send, ArrowUpRight, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [comment, setComment] = useState("");

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      // Real API call for fetching ticket by ID
      const res = await api.get(`/tickets/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const commentMutation = useMutation({
    mutationFn: async (note: string) => {
      const res = await api.post(`/tickets/${id}/comments`, { comment: note });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Comment added successfully.");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add comment.");
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/tickets/${id}/resolve`, { notes: "Resolved via portal" });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Ticket resolved successfully.");
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to resolve ticket.");
    }
  });

  const escalateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/tickets/${id}/escalate`, { notes: "Escalated for further review" });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Ticket escalated successfully.");
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to escalate ticket.");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
        <p className="text-lg font-medium text-foreground">Loading ticket details...</p>
      </div>
    );
  }

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

  const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case "BRANCH": return "bg-blue-100 text-blue-800";
      case "REGIONAL_OFFICE": return "bg-amber-100 text-amber-800";
      case "HEAD_OFFICE": return "bg-emerald-100 text-emerald-800";
      case "ADMIN": return "bg-purple-100 text-purple-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const isOpen = !["Resolved", "Closed"].includes(ticket.status);

  const handleAddComment = () => {
    if (!comment.trim()) return;
    commentMutation.mutate(comment);
  };

  // Safe accessors for API payload
  const ticketIdStr = ticket.id?.toString().padStart(4, '0') || ticket.id;
  const auditLogs = ticket.auditTrail || ticket.comments || [];

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
          <h1 className="text-2xl font-semibold tracking-tight">TKT-{ticketIdStr}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Created by {ticket.createdBy || ticket.author?.username || "System"} on {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left: Details + Audit Trail */}
        <div className="space-y-6">
          {/* Description */}
          <div className="rounded-lg bg-card shadow-card p-6 border border-border/50">
            <h2 className="text-base font-medium mb-3">Complaint Details</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Audit Trail / Comments */}
          <div className="rounded-lg bg-card shadow-card p-6 border border-border/50">
            <h2 className="text-base font-medium mb-4">Activity Timeline</h2>
            <div className="space-y-0">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No activity recorded yet.</p>
              ) : (
                auditLogs.map((entry: any, i: number) => (
                  <div key={entry.id || i} className="flex gap-3 relative">
                    {/* Timeline line */}
                    {i < auditLogs.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
                    )}
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card z-10">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <div className="pb-6 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{entry.user || entry.author?.username || "System"}</span>
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", getRoleColor(entry.role || entry.author?.role))}>
                          {entry.role || entry.author?.role || "System"}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {entry.timestamp || entry.createdAt ? (
                            <>
                              {new Date(entry.timestamp || entry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {new Date(entry.timestamp || entry.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </>
                          ) : "Recently"}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground/80 mt-0.5">{entry.action || "Comment Added"}</p>
                      {(entry.note || entry.comment) && <p className="text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded-md border border-border/50 mt-2">{entry.note || entry.comment}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Comment */}
          {isOpen && (
            <div className="rounded-lg bg-card shadow-card p-6 border border-border/50">
              <h2 className="text-base font-medium mb-3">Add Note</h2>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Add an internal note or update..."
                className="resize-none mb-3"
                disabled={commentMutation.isPending}
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" disabled={true} title="Attachment feature coming soon">
                  <Paperclip className="h-3.5 w-3.5" /> Attach File
                </Button>
                <Button size="sm" onClick={handleAddComment} className="gap-1.5 ml-auto" disabled={commentMutation.isPending || !comment.trim()}>
                  {commentMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {commentMutation.isPending ? "Adding..." : "Add Note"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Metadata + Actions */}
        <div className="space-y-6">
          {/* Status & Meta */}
          <div className="rounded-lg bg-card shadow-card p-6 border border-border/50">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Current Status</p>
                <StatusBadge status={ticket.status || "Open"} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Product</p>
                  <p className="text-sm font-medium">{ticket.product_type || ticket.product || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Amount</p>
                  <p className="text-sm font-medium font-mono">{ticket.amount ? `₹${ticket.amount.toLocaleString("en-IN")}` : "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">UTR / RRN</p>
                  <p className="text-sm font-medium font-mono bg-muted/50 p-1.5 rounded inline-block">{ticket.utr_rrn || ticket.utr || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Account Number</p>
                  <p className="text-sm font-medium font-mono">{ticket.account_number || ticket.accountNumber || "—"}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-3">
                {ticket.branch && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Originating Branch</p>
                    <p className="text-sm">{ticket.branch}</p>
                  </div>
                )}
                {ticket.regionalOffice && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Regional Office</p>
                    <p className="text-sm">{ticket.regionalOffice}</p>
                  </div>
                )}
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Created</p>
                  <p className="text-sm">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("en-IN") : "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Auto-assigned to</p>
                  <p className="text-sm">{ticket.assignedTo || "System Routing"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isOpen && (
            <div className="rounded-lg bg-card shadow-card p-6 border border-border/50">
              <h2 className="text-base font-medium mb-3">Workflow Actions</h2>
              <div className="space-y-2">
                {ticket.status !== "Escalated to Head Office" && ticket.status !== "Pending at Head Office" && user?.role === "REGIONAL_OFFICE" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 border-orange-200 hover:bg-orange-50 hover:text-orange-700 text-orange-600 transition-colors"
                    onClick={() => escalateMutation.mutate()}
                    disabled={escalateMutation.isPending}
                  >
                    {escalateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                    Escalate to Head Office
                  </Button>
                )}
                {(user?.role === "HEAD_OFFICE" || user?.role === "ADMIN" || user?.role === "REGIONAL_OFFICE") && (
                  <Button
                    className="w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => resolveMutation.mutate()}
                    disabled={resolveMutation.isPending}
                  >
                    {resolveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Mark as Resolved
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
