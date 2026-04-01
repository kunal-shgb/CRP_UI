import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Loader2, Download, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { NewQrCodeDialog } from "@/components/NewQrCodeDialog";
import { QrCodeUploadDialog } from "@/components/QrCodeUploadDialog";
import type { QrCodeStatus } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { DataTablePagination } from "@/components/DataTablePagination";

const STATUSES: QrCodeStatus[] = ["PENDING_QR_GENERATION", "AVAILABLE_FOR_DOWNLOAD"];

export default function QrCodes() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewQrCode, setShowNewQrCode] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // HO are the only ones who can export and upload
  const isHO = user?.role === "HEAD_OFFICE" || user?.role === "ADMIN";
  const canCreate = user?.role === "BRANCH" || user?.role === "REGIONAL_OFFICE";

  const { data: qrcodesQuery, isLoading } = useQuery({
    queryKey: ["qr-codes", page, limit, search, statusFilter],
    queryFn: async () => {
      const res = await api.get("/qr-codes", {
        params: { 
          page, 
          limit, 
          search: search || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        }
      });
      return { qrcodes: res.data, meta: res.meta };
    },
    enabled: !!user,
  });

  const qrcodes = qrcodesQuery?.qrcodes ?? [];
  const meta = qrcodesQuery?.meta;

  const handleExportPending = async () => {
    try {
      const res = await api.get("/qr-codes/export/pending");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Pending_QR_Codes_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed:", e);
    }
  };

  const downloadPdf = async (id: number, filename: string) => {
    try {
      const res = await api.get(`/qr-codes/download/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `QR_Code_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="px-8 py-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">QR Codes</h1>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={() => setShowNewQrCode(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Request QR Code
            </Button>
          )}
          {isHO && (
            <>
              <Button variant="outline" onClick={handleExportPending} className="gap-1.5">
                <Download className="h-4 w-4" /> Export Pending
              </Button>
              <Button onClick={() => setShowUploadDialog(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <UploadCloud className="h-4 w-4" /> Upload QR ZIP
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by Account, Mobile, Merchant..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[250px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Merchant</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Account / Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading QR Codes...</p>
                  </td>
                </tr>
              ) : qrcodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm text-muted-foreground">No QR Codes found.</p>
                  </td>
                </tr>
              ) : (
                qrcodes.map((qr: any) => (
                  <tr key={qr.id} className="border-b last:border-b-0 transition-colors duration-150 hover:bg-muted/50">
                    <td className="px-6 py-3 text-sm font-medium text-primary">QR-{qr.id?.toString().padStart(4, '0') || qr.id}</td>
                    <td className="px-6 py-3 text-sm">{qr.merchant_name}</td>
                    <td className="px-6 py-3 text-sm">
                      <div className="font-mono text-xs">{qr.account_number}</div>
                      <div className="font-mono text-xs text-muted-foreground">{qr.mobile_number}</div>
                    </td>
                    <td className="px-6 py-3 text-sm">{qr.branch?.name || "—"}</td>
                    <td className="px-6 py-3"><StatusBadge status={qr.status} /></td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {new Date(qr.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {qr.status === "AVAILABLE_FOR_DOWNLOAD" && (
                        <Button variant="ghost" size="sm" onClick={() => downloadPdf(qr.id, qr.qr_pdf_filename)}>
                          Download PDF
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          meta={meta as any}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      </div>

      <NewQrCodeDialog open={showNewQrCode} onOpenChange={setShowNewQrCode} />
      <QrCodeUploadDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} />
    </motion.div>
  );
}
