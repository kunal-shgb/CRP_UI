import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface NewQrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewQrCodeDialog({ open, onOpenChange }: NewQrCodeDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    merchantName: "", mobileNumber: "", accountNumber: "", ifscCode: "PUNB0HGB001",
    mccCode: "", emailId: `bo${user.branch?.code}shgb@shgb.bank.in`, transactionType: "ALL", addressLine1: "",
    addressLine2: "", city: "", state: "HARYANA", pincode: "", solId: user.branch?.code
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openMcc, setOpenMcc] = useState(false);
  const [mccSearch, setMccSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: mccCodes = [], isLoading: isMccLoading } = useQuery({
    queryKey: ["mcc-codes", mccSearch],
    queryFn: async () => {
      const res = await api.get("/mcc-codes", { params: { search: mccSearch } });
      return res.data;
    },
  });

  const resetForm = () => {
    setFormData({
      merchantName: "", mobileNumber: "", accountNumber: "", ifscCode: "PUNB0HGB001",
      mccCode: "", emailId: `bo${user.branch?.code}shgb@shgb.bank.in`, transactionType: "ALL", addressLine1: "",
      addressLine2: "", city: "", state: "HARYANA", pincode: "", solId: user.branch?.code
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
    else if (!/^\d{14}$/.test(formData.accountNumber)) e.accountNumber = "Must be 14 digits";

    if (!formData.ifscCode.trim()) e.ifscCode = "Required";


    if (!formData.mccCode.trim()) e.mccCode = "Required";

    if (formData.emailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
      e.emailId = "Invalid email";
    }

    if (!formData.transactionType) e.transactionType = "Required";
    if (!formData.addressLine1.trim()) e.addressLine1 = "Required";
    if (!formData.addressLine2.trim()) e.addressLine2 = "Required";
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
            <Input value={formData.accountNumber} maxLength={14} onChange={(e) => handleChange("accountNumber", e.target.value.replace(/\D/g, ''))} />
            {errors.accountNumber && <p className="text-xs text-destructive">{errors.accountNumber}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">IFSC Code *</Label>
            <Input value={formData.ifscCode} maxLength={11} onChange={(e) => handleChange("ifscCode", e.target.value)} />
            {errors.ifscCode && <p className="text-xs text-destructive">{errors.ifscCode}</p>}
          </div>
          <div className="space-y-1.5 flex flex-col">
            <Label className="text-xs font-medium">MCC Code *</Label>
            <Popover open={openMcc} onOpenChange={setOpenMcc}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openMcc}
                  className="justify-between"
                >
                  {formData.mccCode
                    ? mccCodes.find((mcc: any) => mcc.mcc_code === formData.mccCode)?.mcc_code
                    : "Select MCC code..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search MCC code or name..."
                    value={mccSearch}
                    onValueChange={setMccSearch}
                  />
                  <CommandList>
                    <CommandEmpty>{isMccLoading ? "Loading..." : "No MCC code found."}</CommandEmpty>
                    <CommandGroup>
                      {mccCodes.map((mcc: any) => (
                        <CommandItem
                          key={mcc.id}
                          value={mcc.mcc_code}
                          onSelect={(currentValue) => {
                            handleChange("mccCode", currentValue);
                            setOpenMcc(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.mccCode === mcc.mcc_code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {mcc.mcc_code} - {mcc.mcc_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.mccCode && <p className="text-xs text-destructive">{errors.mccCode}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Email ID</Label>
            <Input type="email" value={formData.emailId} onChange={(e) => handleChange("emailId", e.target.value)} />
            {errors.emailId && <p className="text-xs text-destructive">{errors.emailId}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Transaction Type *</Label>
            <Input value={formData.transactionType} onChange={(e) => handleChange("transactionType", e.target.value)} />
            {errors.transactionType && <p className="text-xs text-destructive">{errors.transactionType}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Sol ID *</Label>
            <Input value={formData.solId} maxLength={4} onChange={(e) => handleChange("solId", e.target.value.replace(/\D/g, ''))} />
            {errors.solId && <p className="text-xs text-destructive">{errors.solId}</p>}
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-medium">Address Line 1 *</Label>
            <Input value={formData.addressLine1} onChange={(e) => handleChange("addressLine1", e.target.value)} />
            {errors.addressLine1 && <p className="text-xs text-destructive">{errors.addressLine1}</p>}
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-medium">Address Line 2 *</Label>
            <Input value={formData.addressLine2} onChange={(e) => handleChange("addressLine2", e.target.value)} />
            {errors.addressLine2 && <p className="text-xs text-destructive">{errors.addressLine2}</p>}
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
