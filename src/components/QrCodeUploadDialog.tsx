import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, UploadCloud } from "lucide-react";

interface QrCodeUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QrCodeUploadDialog({ open, onOpenChange }: QrCodeUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<{ processed: number; updated: string[]; failed: any[] } | null>(null);

  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (zipFile: File) => {
      const formData = new FormData();
      formData.append("file", zipFile);
      const res = await api.post("/qr-codes/upload/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("ZIP uploaded successfully.");
      setReport(data);
      queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload ZIP.");
    }
  });

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate(file);
  };

  const reset = () => {
    setFile(null);
    setReport(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Bulk Upload QR PDFs</DialogTitle>
          <DialogDescription>
            Upload a ZIP file containing the generated QR Code PDFs. <br />
            Expected filename inside ZIP: <code className="text-xs bg-muted px-1 rounded">accountNumber_mobileNumber.pdf</code>
          </DialogDescription>
        </DialogHeader>

        {!report ? (
          <div className="py-6">
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 border-muted-foreground/20 hover:bg-muted/40 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-foreground font-medium">
                    {file ? file.name : "Click to select or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">ZIP file only</p>
                </div>
                <Input 
                  id="dropzone-file" 
                  type="file" 
                  accept=".zip,application/zip" 
                  className="hidden" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={!file || uploadMutation.isPending}>
                {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload ZIP
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="rounded-md bg-muted p-4 space-y-2 text-sm">
              <p><strong>Processed files:</strong> {report.processed}</p>
              <p className="text-emerald-600 dark:text-emerald-400"><strong>Successfully updated:</strong> {report.updated?.length || 0}</p>
              <p className="text-destructive"><strong>Failed:</strong> {report.failed?.length || 0}</p>
            </div>
            
            {report.failed && report.failed.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Failed Files:</h4>
                <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-md max-h-40 overflow-y-auto space-y-1">
                  {report.failed.map((f, i) => (
                    <div key={i}>
                      <span className="font-semibold">{f.filename}:</span> {f.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
