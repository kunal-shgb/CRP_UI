import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { NewTicketDialog } from "@/components/NewTicketDialog";
import { PRODUCTS, type TicketStatus } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const STATUSES: TicketStatus[] = ["PENDING_AT_RO", "ESCALATED_TO_HEAD_OFFICE", "CLOSED"];

export default function Tickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [roFilter, setRoFilter] = useState<string>("all");
  const [showNewTicket, setShowNewTicket] = useState(false);

  const isAdminOrHO = user?.role === "ADMIN" || user?.role === "HEAD_OFFICE";

  const { data: ros = [], isLoading: loadingRos } = useQuery({
    queryKey: ["ros"],
    queryFn: async () => {
      const res = await api.get("/regional-offices");
      return res.data;
    },
    enabled: isAdminOrHO,
  });
  
  const { data: ticketsQuery, isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const res = await api.get("/tickets");
      return { tickets: res.data, meta: res.meta };
    },
    enabled: !!user,
  });
  const tickets = ticketsQuery?.tickets ?? [];
  const ticketsMeta = ticketsQuery?.meta;

  const filtered = useMemo(() => {
    return tickets.filter((t: any) => {
      const ticketIdStr = t.id?.toString() || "";
      const utrStr = t.utr_rrn || t.utr || "";
      const accountStr = t.account_number || t.accountNumber || "";
      const productStr = t.product_type || t.product || "";

      const searchLower = search.toLowerCase();
      const matchSearch = !search ||
        ticketIdStr.toLowerCase().includes(searchLower) ||
        utrStr.toLowerCase().includes(searchLower) ||
        accountStr.toLowerCase().includes(searchLower);

      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchProduct = productFilter === "all" || productStr === productFilter;
      // Regional office can be a string or a nested object from the API
      const roName = typeof t.assigned_regionalOffice === "object"
        ? t.assigned_regionalOffice?.name
        : (t.regionalOffice || "");
      const matchRegionalOffice = roFilter === "all" || roName === roFilter;

      return matchSearch && matchStatus && matchProduct && matchRegionalOffice;
    });
  }, [tickets, search, statusFilter, productFilter, roFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="px-8 py-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">All Tickets</h1>
        {(user?.role === "BRANCH" || user?.role === "REGIONAL_OFFICE") && (
          <Button onClick={() => setShowNewTicket(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Ticket
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by Ticket ID, UTR, or Account..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Product" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {PRODUCTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        {isAdminOrHO && (
          <Select value={roFilter} onValueChange={setRoFilter}>
            <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Regional Office" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regional Offices</SelectItem>
              {loadingRos ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : (
                ros.map((r: any) => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Ticket ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">UTR/RRN</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Regional Office</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading tickets...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm text-muted-foreground">No tickets found.</p>
                    {(user?.role === "BRANCH" || user?.role === "REGIONAL_OFFICE") && (
                      <Button variant="outline" className="mt-3" onClick={() => setShowNewTicket(true)}>Create New Ticket</Button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((ticket: any) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="border-b last:border-b-0 cursor-pointer transition-colors duration-150 hover:bg-muted/50"
                  >
                    <td className="px-6 py-3 text-sm font-medium text-primary">TKT-{ticket.id?.toString().padStart(4, '0') || ticket.id}</td>
                    <td className="px-6 py-3 text-sm font-mono">{ticket.utr_rrn || "—"}</td>
                    <td className="px-6 py-3 text-sm">{ticket.product_type || "—"}</td>
                    <td className="px-6 py-3 text-sm">{ticket.branch?.name || ticket.branch || "—"}</td>
                    <td className="px-6 py-3 text-sm">{ticket.assigned_regionalOffice?.name || ticket.regionalOffice || "—"}</td>
                    <td className="px-6 py-3 text-sm font-mono">{ticket.transaction_amount ? `₹${ticket.transaction_amount.toLocaleString("en-IN")}` : "—"}</td>
                    <td className="px-6 py-3"><StatusBadge status={ticket.status || "Open"} /></td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleString("en-IN", {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewTicketDialog open={showNewTicket} onOpenChange={setShowNewTicket} />
    </motion.div>
  );
}
