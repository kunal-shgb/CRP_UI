import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { NewTicketDialog } from "@/components/NewTicketDialog";
import { MOCK_TICKETS, PRODUCTS, REGIONAL_OFFICES, type TicketStatus } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";

const STATUSES: TicketStatus[] = ["Pending at RO", "Pending at HO", "Escalated to HO", "Resolved", "Closed"];

export default function Tickets() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [roFilter, setRoFilter] = useState<string>("all");
  const [showNewTicket, setShowNewTicket] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_TICKETS.filter(t => {
      const matchSearch = !search || t.id.toLowerCase().includes(search.toLowerCase()) || t.utr.toLowerCase().includes(search.toLowerCase()) || t.accountNumber.includes(search);
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchProduct = productFilter === "all" || t.product === productFilter;
      const matchRO = roFilter === "all" || t.regionalOffice === roFilter;
      return matchSearch && matchStatus && matchProduct && matchRO;
    });
  }, [search, statusFilter, productFilter, roFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="px-8 py-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">All Tickets</h1>
        <Button onClick={() => setShowNewTicket(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
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
        <Select value={roFilter} onValueChange={setRoFilter}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Regional Office" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ROs</SelectItem>
            {REGIONAL_OFFICES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">RO</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm text-muted-foreground">No tickets found.</p>
                    <Button variant="outline" className="mt-3" onClick={() => setShowNewTicket(true)}>Create New Ticket</Button>
                  </td>
                </tr>
              ) : (
                filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="border-b last:border-b-0 cursor-pointer transition-colors duration-150 hover:bg-muted/50"
                  >
                    <td className="px-6 py-3 text-sm font-medium text-primary">{ticket.id}</td>
                    <td className="px-6 py-3 text-sm font-mono">{ticket.utr}</td>
                    <td className="px-6 py-3 text-sm">{ticket.product}</td>
                    <td className="px-6 py-3 text-sm">{ticket.branch}</td>
                    <td className="px-6 py-3 text-sm">{ticket.regionalOffice}</td>
                    <td className="px-6 py-3 text-sm font-mono">₹{ticket.amount.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-3"><StatusBadge status={ticket.status} /></td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString("en-IN")}</td>
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
