import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCTS, BRANCHES, BRANCH_RO_MAP, MOCK_TICKETS } from "@/lib/mock-data";
import { toast } from "sonner";

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTicketDialog({ open, onOpenChange }: NewTicketDialogProps) {
  const [utr, setUtr] = useState("");
  const [account, setAccount] = useState("");
  const [product, setProduct] = useState("");
  const [branch, setBranch] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!utr.trim()) e.utr = "UTR/RRN is required";
    else if (MOCK_TICKETS.some(t => t.utr === utr.trim() && !["Resolved", "Closed"].includes(t.status))) {
      e.utr = "An open ticket already exists for this UTR";
    }
    if (!account.trim()) e.account = "Account number is required";
    if (!product) e.product = "Product type is required";
    if (!branch) e.branch = "Branch is required";
    if (!description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const ticketId = `T2024-08-${String(MOCK_TICKETS.length + 1).padStart(3, "0")}`;
    toast.success(`Ticket ${ticketId} created successfully.`);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setUtr(""); setAccount(""); setProduct(""); setBranch(""); setDescription("");
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Create New Ticket</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="utr" className="text-xs font-medium">Unique Transaction Number (UTR/RRN) *</Label>
            <Input id="utr" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 422069019371" />
            {errors.utr && <p className="text-xs text-destructive">{errors.utr}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account" className="text-xs font-medium">Customer Account Number *</Label>
            <Input id="account" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="e.g. 1234567890" />
            {errors.account && <p className="text-xs text-destructive">{errors.account}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Product Type *</Label>
            <Select value={product} onValueChange={setProduct}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {PRODUCTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.product && <p className="text-xs text-destructive">{errors.product}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Branch *</Label>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.branch && <p className="text-xs text-destructive">{errors.branch}</p>}
            {branch && <p className="text-[11px] text-muted-foreground">Assigned to: {BRANCH_RO_MAP[branch]}</p>}
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="desc" className="text-xs font-medium">Description of Issue *</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the transaction complaint..." className="resize-none" />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-medium">Supporting Documents</Label>
            <Input type="file" multiple className="text-sm" />
            <p className="text-[11px] text-muted-foreground">Upload screenshots or documents (max 10MB each)</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Ticket</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
