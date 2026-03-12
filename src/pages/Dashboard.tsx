import { motion } from "framer-motion";
import { Ticket, CheckCircle, Clock, AlertTriangle, ArrowUpRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { MOCK_TICKETS, PRODUCTS, type ProductType } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const openTickets = MOCK_TICKETS.filter(t => !["Resolved", "Closed"].includes(t.status));
const closedTickets = MOCK_TICKETS.filter(t => ["Resolved", "Closed"].includes(t.status));
const pendingRO = MOCK_TICKETS.filter(t => t.status === "Pending at RO").length;
const pendingHO = MOCK_TICKETS.filter(t => ["Pending at HO", "Escalated to HO"].includes(t.status)).length;

const productData = PRODUCTS.map(p => ({
  name: p,
  count: MOCK_TICKETS.filter(t => t.product === p).length,
})).filter(d => d.count > 0);

const PIE_COLORS = ["hsl(221,83%,53%)", "hsl(38,92%,50%)", "hsl(142,71%,45%)", "hsl(25,95%,53%)", "hsl(280,67%,50%)", "hsl(190,80%,42%)"];

const roData = [
  { name: "RO Mumbai", open: 1, closed: 1 },
  { name: "RO Delhi", open: 2, closed: 0 },
  { name: "RO Bangalore", open: 1, closed: 1 },
  { name: "RO Chennai", open: 1, closed: 0 },
];

export default function Dashboard() {
  const navigate = useNavigate();

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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Open" value={openTickets.length} icon={Ticket} subtitle={`${MOCK_TICKETS.length} total tickets`} />
        <StatCard title="Resolved / Closed" value={closedTickets.length} icon={CheckCircle} trend={{ value: "12% this week", positive: true }} />
        <StatCard title="Pending at RO" value={pendingRO} icon={Clock} />
        <StatCard title="Pending / Escalated HO" value={pendingHO} icon={AlertTriangle} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-lg bg-card p-6 shadow-card">
          <h2 className="text-base font-medium mb-4">Product-wise Complaints</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,5.9%,90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(240,3.8%,46.1%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(240,3.8%,46.1%)" allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid hsl(240,5.9%,90%)" }} />
                <Bar dataKey="count" fill="hsl(221,83%,53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg bg-card p-6 shadow-card">
          <h2 className="text-base font-medium mb-4">RO-wise Distribution</h2>
          <div className="h-64">
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">UTR</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TICKETS.slice(0, 5).map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <td className="px-6 py-3 text-sm font-medium text-primary">{ticket.id}</td>
                  <td className="px-6 py-3 text-sm font-mono">{ticket.utr}</td>
                  <td className="px-6 py-3 text-sm">{ticket.product}</td>
                  <td className="px-6 py-3 text-sm">{ticket.branch}</td>
                  <td className="px-6 py-3 text-sm font-mono">₹{ticket.amount.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-3"><StatusBadge status={ticket.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
