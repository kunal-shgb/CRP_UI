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
import { useRef } from "react";

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
   const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    commentMutation.mutate(comment, {
      onSuccess: async (data) => {
        if (commentFiles && commentFiles.length > 0) {
          const commentId = data.id;
          for (let i = 0; i < commentFiles.length; i++) {
            const formData = new FormData();
            formData.append('file', commentFiles[i]);
            formData.append('commentId', String(commentId));
            try {
              await api.post(`/tickets/${id}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
            } catch (error) {
              console.error("Failed to upload comment file:", commentFiles[i].name, error);
            }
          }
        }
        setCommentFiles(null);
        queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      }
    });
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const filename = fileUrl.split(/[\\/]/).pop();
      // Use api instance to include the Authorization header
      const response = await api.get(`/tickets/download/${filename}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download file. Please check your permissions.");
      console.error("Download error:", error);
    }
  };

  // Safe accessors for API payload
  const ticketIdStr = ticket.id?.toString().padStart(4, '0') || ticket.id;
  const auditLogs = ticket.comments || [];

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
            Created by {ticket.created_by.username || "System"} on {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
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
            
            {/* Ticket Level Attachments */}
            {ticket.attachments?.filter((a: any) => !a.comment).length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Attached Documents</h3>
                <div className="flex flex-wrap gap-2">
                  {ticket.attachments.filter((a: any) => !a.comment).map((attachment: any) => (
                    <Button 
                      key={attachment.id} 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => handleDownload(attachment.file_url, attachment.file_name)}
                    >
                      <Paperclip className="h-3 w-3" />
                      {attachment.file_name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
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
                        <span className="text-sm font-medium">{entry.user.username}</span>
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", getRoleColor(entry.user.role))}>
                          {entry.user.role}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {entry.created_at ? (
                            <>
                              {new Date(entry.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {new Date(entry.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </>
                          ) : "Recently"}
                        </span>
                      </div>
                      {/* <p className="text-sm font-medium text-foreground/80 mt-0.5">{entry.action || "Comment Added"}</p> */}
                      {(entry.comment) && <p className="text-sm text-muted-foreground mt-1 /30 p-2 rounded-md border border-border/50 mt-2">{entry.comment}</p>}
                      {/* text-sm leading-relaxed whitespace-pre-wrap */}
                      {entry.attachments && entry.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {entry.attachments.map((attachment: any) => (
                            <button
                              key={attachment.id}
                              onClick={() => handleDownload(attachment.file_url, attachment.file_name)}
                              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline bg-primary/5 px-2 py-1 rounded"
                            >
                              <Paperclip className="h-3 w-3" />
                              {attachment.file_name}
                            </button>
                          ))}
                        </div>
                      )}
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
              {commentFiles && commentFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {Array.from(commentFiles).map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded text-xs text-muted-foreground">
                      <Paperclip className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{f.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => setCommentFiles(e.target.files)}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={commentMutation.isPending}
                >
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
                  <p className="text-sm font-medium">{ticket.product_type || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Amount</p>
                  <p className="text-sm font-medium font-mono">{ticket.transaction_amount ? `₹${ticket.transaction_amount.toLocaleString("en-IN")}` : "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">UTR / RRN</p>
                  <p className="text-sm font-medium font-mono bg-muted/50 p-1.5 rounded inline-block">{ticket.utr_rrn || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Account Number</p>
                  <p className="text-sm font-medium font-mono">{ticket.account_number || "—"}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-3">
                {(ticket.created_by?.username) && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Created By</p>
                    <p className="text-sm">{ticket.created_by?.username}</p>
                  </div>
                )}
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Created</p>
                  <p className="text-sm">{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString("en-IN") : "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Auto-assigned to</p>
                  <p className="text-sm">{ticket.assigned_regionalOffice?.name || "System Routing"}</p>
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
