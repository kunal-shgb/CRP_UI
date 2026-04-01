import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface NewQrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewQrCodeDialog({ open, onOpenChange }: NewQrCodeDialogProps) {
  const [formData, setFormData] = useState({
    merchantName: "", mobileNumber: "", accountNumber: "", ifscCode: "",
    mccCode: "", emailId: "", transactionType: "", addressLine1: "",
    addressLine2: "", city: "", state: "", pincode: "", solId: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const resetForm = () => {
    setFormData({
      merchantName: "", mobileNumber: "", accountNumber: "", ifscCode: "",
      mccCode: "", emailId: "", transactionType: "", addressLine1: "",
      addressLine2: "", city: "", state: "", pincode: "", solId: ""
    });
    setErrors({});
  };

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/qr-codes", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("QR Code generation requested successfully.");
      queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create QR Code request.");
    }
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.merchantName.trim()) e.merchantName = "Required";
    
    if (!formData.mobileNumber.trim()) e.mobileNumber = "Required";
    else if (!/^\d{10}$/.test(formData.mobileNumber)) e.mobileNumber = "Must be 10 digits";

    if (!formData.accountNumber.trim()) e.accountNumber = "Required";
    if (!formData.ifscCode.trim()) e.ifscCode = "Required";
    if (!formData.mccCode.trim()) e.mccCode = "Required";

    if (formData.emailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
      e.emailId = "Invalid email";
    }

    if (!formData.transactionType) e.transactionType = "Required";
    if (!formData.addressLine1.trim()) e.addressLine1 = "Required";
    if (!formData.city.trim()) e.city = "Required";
    if (!formData.state.trim()) e.state = "Required";
    
    if (!formData.pincode.trim()) e.pincode = "Required";
    else if (!/^\d{6}$/.test(formData.pincode)) e.pincode = "Must be 6 digits";

    if (!formData.solId.trim()) e.solId = "Required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    createMutation.mutate({
      merchant_name: formData.merchantName.trim(),
      mobile_number: formData.mobileNumber.trim(),
      account_number: formData.accountNumber.trim(),
      ifsc_code: formData.ifscCode.trim(),
      mcc_code: formData.mccCode.trim(),
      email_id: formData.emailId.trim() || undefined,
      transaction_type: formData.transactionType,
      address_line1: formData.addressLine1.trim(),
      address_line2: formData.addressLine2.trim() || undefined,
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      sol_id: formData.solId.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Request QR Code Generation</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Merchant Name *</Label>
            <Input value={formData.merchantName} onChange={(e) => handleChange("merchantName", e.target.value)} />
            {errors.merchantName && <p className="text-xs text-destructive">{errors.merchantName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Mobile Number *</Label>
            <Input value={formData.mobileNumber} maxLength={10} onChange={(e) => handleChange("mobileNumber", e.target.value.replace(/\D/g, ''))} />
            {errors.mobileNumber && <p className="text-xs text-destructive">{errors.mobileNumber}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Account Number *</Label>
            <Input value={formData.accountNumber} onChange={(e) => handleChange("accountNumber", e.target.value)} />
            {errors.accountNumber && <p className="text-xs text-destructive">{errors.accountNumber}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">IFSC Code *</Label>
            <Input value={formData.ifscCode} onChange={(e) => handleChange("ifscCode", e.target.value)} />
            {errors.ifscCode && <p className="text-xs text-destructive">{errors.ifscCode}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">MCC Code *</Label>
            <Input value={formData.mccCode} onChange={(e) => handleChange("mccCode", e.target.value)} />
            {errors.mccCode && <p className="text-xs text-destructive">{errors.mccCode}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Email ID</Label>
            <Input type="email" value={formData.emailId} onChange={(e) => handleChange("emailId", e.target.value)} />
            {errors.emailId && <p className="text-xs text-destructive">{errors.emailId}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Transaction Type *</Label>
            <Select value={formData.transactionType} onValueChange={(v) => handleChange("transactionType", v)}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="IMPS">IMPS</SelectItem>
                <SelectItem value="AEPS">AEPS</SelectItem>
              </SelectContent>
            </Select>
            {errors.transactionType && <p className="text-xs text-destructive">{errors.transactionType}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Sol ID *</Label>
            <Input value={formData.solId} onChange={(e) => handleChange("solId", e.target.value)} />
            {errors.solId && <p className="text-xs text-destructive">{errors.solId}</p>}
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-medium">Address Line 1 *</Label>
            <Input value={formData.addressLine1} onChange={(e) => handleChange("addressLine1", e.target.value)} />
            {errors.addressLine1 && <p className="text-xs text-destructive">{errors.addressLine1}</p>}
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-medium">Address Line 2</Label>
            <Input value={formData.addressLine2} onChange={(e) => handleChange("addressLine2", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">City *</Label>
            <Input value={formData.city} onChange={(e) => handleChange("city", e.target.value)} />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">State *</Label>
            <Input value={formData.state} onChange={(e) => handleChange("state", e.target.value)} />
            {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Pincode *</Label>
            <Input value={formData.pincode} maxLength={6} onChange={(e) => handleChange("pincode", e.target.value.replace(/\D/g, ''))} />
            {errors.pincode && <p className="text-xs text-destructive">{errors.pincode}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
