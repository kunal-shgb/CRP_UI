import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCTS } from "@/lib/mock-data";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTicketDialog({ open, onOpenChange }: NewTicketDialogProps) {
  const { user } = useAuth();
  const isBranch = user?.role === "BRANCH";
  const isRO = user?.role === "REGIONAL_OFFICE";

  const [utr, setUtr] = useState("");
  const [account, setAccount] = useState("");
  const [product, setProduct] = useState("");
  // BRANCH users use their own branchId automatically; only RO users pick a branch
  const [branch, setBranch] = useState(isBranch ? String((user as any)?.branchId ?? "") : "");
  const [ticketType, setTicketType] = useState("Transactional");
  const [transactionDate, setTransactionDate] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync branch state when dialog opens or user data becomes available
  useEffect(() => {
    if (open) {
      console.log("userE", user);
      if (isBranch && (user as any)?.branchId) {
        setBranch(String((user as any).branchId));
      } else if (!isBranch && !branch) {
        setBranch("");
      }
    }
  }, [open, isBranch, user?.branch]);

  const queryClient = useQueryClient();

  // Fetch branches only when dialog is open AND user is REGIONAL_OFFICE
  // BRANCH users use their own branchId from the auth token — no API needed
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await api.get("/branches");
      return res.data;
    },
    enabled: isRO && open,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/tickets", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Ticket created successfully.");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create ticket.");
    }
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (ticketType !== "Others") {
      if (!utr.trim()) {
        e.utr = "UTR/RRN is required for Transactional tickets";
      } else if (product) {
        const utrValue = utr.trim();
        const utrLength = utrValue.length;
        const isNumeric = /^\d+$/.test(utrValue);

        if (["UPI", "IMPS", "ATM", "AEPS"].includes(product)) {
          if (utrLength !== 12 || !isNumeric) {
            e.utr = `UTR/RRN must be exactly 12 numeric digits for ${product}`;
          }
        } else if (product === "RTGS") {
          if (utrLength !== 12) {
            e.utr = "UTR/RRN must be exactly 12 characters for RTGS";
          }
        } else if (product === "NEFT") {
          if (utrLength !== 16) {
            e.utr = "UTR/RRN must be exactly 16 characters for NEFT";
          }
        }
      }
      if (!transactionDate) {
        e.transactionDate = "Transaction date is required";
      } else if (transactionDate > new Date().toISOString().split("T")[0]) {
        e.transactionDate = "Future dates are not allowed";
      }
      if (!transactionAmount.trim()) e.transactionAmount = "Transaction amount is required";
    }

    if (!account.trim()) e.account = "Account number is required";
    if (!product) e.product = "Product type is required";
    // if (!branch) e.branch = "Branch is required";
    if (!description.trim()) e.description = "Description is required";

    setErrors(e);
    if (Object.keys(e).length > 0) {
      console.warn("Ticket validation errors:", e);
    }
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    const isValid = validate();
    console.log("User during submit:", user);
    console.log("Validation result:", isValid);
    if (!isValid) return;

    const payload: any = {
      account_number: account.trim(),
      product_type: product,
      ticket_type: ticketType,
      description: description.trim(),
      branchId: parseInt(branch),
    };
    if (ticketType !== "Others") {
      if (utr.trim()) payload.utr_rrn = utr.trim();
      payload.transaction_date = new Date(transactionDate).toISOString();
      payload.transaction_amount = Number(transactionAmount);
    }

    createTicketMutation.mutate(payload);
  };

  const resetForm = () => {
    setUtr(""); setAccount(""); setProduct("");
    // Reset branch: BRANCH users keep their fixed branchId, RO users reset to empty
    setBranch(isBranch ? String((user as any)?.branchId ?? "") : "");
    setDescription("");
    setTicketType("Transactional"); setTransactionDate(""); setTransactionAmount("");
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
            <Label className="text-xs font-medium">Ticket Type *</Label>
            <Select value={ticketType} onValueChange={setTicketType}>
              <SelectTrigger><SelectValue placeholder="Select ticket type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Transactional">Transactional</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
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
          {ticketType !== "Others" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="utr" className="text-xs font-medium">
                  Unique Transaction Number (UTR/RRN){ticketType !== "Others" && " *"}
                </Label>
                <Input 
                  id="utr" 
                  value={utr} 
                  onChange={(e) => setUtr(e.target.value)} 
                  placeholder="e.g. 422069019371" 
                  maxLength={product === "NEFT" ? 16 : (product ? 12 : undefined)}
                />
                {errors.utr && <p className="text-xs text-destructive">{errors.utr}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tdate" className="text-xs font-medium">Transaction Date *</Label>
                <Input id="tdate" type="date" value={transactionDate} max={new Date().toISOString().split("T")[0]} onChange={(e) => setTransactionDate(e.target.value)} />
                {errors.transactionDate && <p className="text-xs text-destructive">{errors.transactionDate}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tamount" className="text-xs font-medium">Transaction Amount *</Label>
                <Input id="tamount" type="number" step="0.01" value={transactionAmount} onChange={(e) => setTransactionAmount(e.target.value)} placeholder="e.g. 5000" />
                {errors.transactionAmount && <p className="text-xs text-destructive">{errors.transactionAmount}</p>}
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="account" className="text-xs font-medium">Customer Account Number *</Label>
            <Input id="account" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="e.g. 1234567890" />
            {errors.account && <p className="text-xs text-destructive">{errors.account}</p>}
          </div>
          {!isBranch && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Branch *</Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b: any) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.branch && <p className="text-xs text-destructive">{errors.branch}</p>}
            </div>
          )}
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
          <Button onClick={handleSubmit} disabled={createTicketMutation.isPending}>
            {createTicketMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
