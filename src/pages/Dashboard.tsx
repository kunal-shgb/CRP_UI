import { motion } from "framer-motion";
import { Ticket as TicketIcon, CheckCircle, Clock, AlertTriangle, ArrowUpRight, Loader2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const PIE_COLORS = ["hsl(221,83%,53%)", "hsl(38,92%,50%)", "hsl(142,71%,45%)", "hsl(25,95%,53%)", "hsl(280,67%,50%)", "hsl(190,80%,42%)"];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Each role gets its own scoped tickets endpoint
  const endpoint =
    user?.role === "BRANCH"           ? "/tickets/branch"
    : user?.role === "REGIONAL_OFFICE" ? "/tickets/regionalOffice"
    : "/tickets/headOffice"; // HEAD_OFFICE and ADMIN both use the head-office view

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets", user?.role],
    queryFn: async () => {
      const res = await api.get(endpoint);
      return res.data;
    },
    enabled: !!user,
  });

  const openTickets = tickets.filter((t: any) => !["Resolved", "Closed"].includes(t.status));
  const closedTickets = tickets.filter((t: any) => ["Resolved", "Closed"].includes(t.status));
  const pendingRegionalOffice = tickets.filter((t: any) => t.status === "Pending at Regional Office").length;
  const pendingHeadOffice = tickets.filter((t: any) => ["Pending at Head Office", "Escalated to Head Office"].includes(t.status)).length;

  const productCounts = tickets.reduce((acc: any, t: any) => {
    acc[t.product] = (acc[t.product] || 0) + 1;
    return acc;
  }, {});

  const productData = Object.keys(productCounts).map(p => ({
    name: p,
    count: productCounts[p],
  }));

  const roCounts = tickets.reduce((acc: any, t: any) => {
    const roName = t.regionalOffice || "Unknown";
    if (!acc[roName]) acc[roName] = { name: roName, open: 0, closed: 0 };
    if (["Resolved", "Closed"].includes(t.status)) {
      acc[roName].closed += 1;
    } else {
      acc[roName].open += 1;
    }
    return acc;
  }, {});

  const roData = Object.values(roCounts);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="px-8 py-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Complaints Dashboard</h1>
      </div>

      {isLoading ? (
        <div className="w-full flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Open" value={openTickets.length} icon={TicketIcon} subtitle={`${tickets.length} total tickets`} />
            <StatCard title="Resolved / Closed" value={closedTickets.length} icon={CheckCircle} />
            <StatCard title="Pending at Regional Office" value={pendingRegionalOffice} icon={Clock} />
            <StatCard title="Pending / Escalated Head Office" value={pendingHeadOffice} icon={AlertTriangle} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="rounded-lg bg-card p-6 shadow-card">
              <h2 className="text-base font-medium mb-4">Product-wise Complaints</h2>
              <div className="h-64">
                {productData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,5.9%,90%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(240,3.8%,46.1%)" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(240,3.8%,46.1%)" allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid hsl(240,5.9%,90%)" }} />
                      <Bar dataKey="count" fill="hsl(221,83%,53%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-card p-6 shadow-card">
              <h2 className="text-base font-medium mb-4">Regional Office-wise Distribution</h2>
              <div className="h-64">
                {roData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,5.9%,90%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(240,3.8%,46.1%)" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(240,3.8%,46.1%)" allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid hsl(240,5.9%,90%)" }} />
                      <Bar dataKey="open" name="Open" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="closed" name="Closed" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="rounded-lg bg-card shadow-card">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-medium">Recent Tickets</h2>
              <button
                onClick={() => navigate("/tickets")}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Ticket ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">UTR/RRN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No tickets found
                      </td>
                    </tr>
                  ) : (
                    tickets.slice(0, 5).map((ticket: any) => (
                      <tr
                        key={ticket.id}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        className="border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/50"
                      >
                        <td className="px-6 py-3 text-sm font-medium text-primary">TKT-{ticket.id.toString().padStart(4, '0')}</td>
                        <td className="px-6 py-3 text-sm font-mono">{ticket.utr_rrn || ticket.utr || "—"}</td>
                        <td className="px-6 py-3 text-sm">{ticket.product_type || ticket.product || "—"}</td>
                        <td className="px-6 py-3 text-sm font-mono">{ticket.account_number || ticket.accountNumber || "—"}</td>
                        <td className="px-6 py-3"><StatusBadge status={ticket.status || "Open"} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
