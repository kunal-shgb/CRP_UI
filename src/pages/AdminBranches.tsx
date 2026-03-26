import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";

const roSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
});

const branchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  regionalOfficeId: z.string().min(1, "Regional Office is required"),
});

export default function AdminBranches() {
  const [showRoCreate, setShowRoCreate] = useState(false);
  const [showBranchCreate, setShowBranchCreate] = useState(false);
  const [showRoEdit, setShowRoEdit] = useState(false);
  const [showRoDelete, setShowRoDelete] = useState(false);
  const [showBranchEdit, setShowBranchEdit] = useState(false);
  const [showBranchDelete, setShowBranchDelete] = useState(false);
  const [selectedRo, setSelectedRo] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: ros = [], isLoading: loadingRos } = useQuery({
    queryKey: ["ros"],
    queryFn: async () => {
      const res = await api.get("/regional-offices");
      return res.data;
    }
  });

  const { data: branches = [], isLoading: loadingBranches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await api.get("/branches");
      return res.data;
    }
  });

  const roForm = useForm<z.infer<typeof roSchema>>({
    resolver: zodResolver(roSchema),
    defaultValues: { name: "", code: "" },
  });

  const branchForm = useForm<z.infer<typeof branchSchema>>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: "", code: "", regionalOfficeId: "" },
  });

  useEffect(() => {
    if (showRoEdit && selectedRo) {
      roForm.reset({ name: selectedRo.name, code: selectedRo.code });
    } else if (!showRoEdit && !showRoCreate) {
      roForm.reset({ name: "", code: "" });
    }
    if (showBranchEdit && selectedBranch) {
      branchForm.reset({ name: selectedBranch.name, code: selectedBranch.code, regionalOfficeId: selectedBranch.regionalOfficeId?.toString() || selectedBranch.regionalOffice?.id?.toString() || "" });
    } else if (!showBranchEdit && !showBranchCreate) {
      branchForm.reset({ name: "", code: "", regionalOfficeId: "" });
    }
  }, [selectedRo, showRoEdit, showRoCreate, selectedBranch, showBranchEdit, showBranchCreate, roForm.reset, branchForm.reset]);

  const createRoMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roSchema>) => {
      const res = await api.post("/regional-offices", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ros"] });
      toast.success("Regional Office created successfully");
      setShowRoCreate(false);
      roForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create Regional Office");
    }
  });

  const updateRoMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roSchema>) => {
      const res = await api.patch(`/regional-offices/${selectedRo.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ros"] });
      toast.success("Regional Office updated successfully");
      setShowRoEdit(false);
      setSelectedRo(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update Regional Office");
    }
  });

  const deleteRoMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/regional-offices/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ros", "branches"] });
      toast.success("Regional Office deleted successfully");
      setShowRoDelete(false);
      setSelectedRo(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete Regional Office");
    }
  });

  const createBranchMutation = useMutation({
    mutationFn: async (data: z.infer<typeof branchSchema>) => {
      const res = await api.post("/branches", {
        name: data.name,
        code: data.code,
        regionalOfficeId: parseInt(data.regionalOfficeId),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch created successfully");
      setShowBranchCreate(false);
      branchForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create Branch");
    }
  });

  const updateBranchMutation = useMutation({
    mutationFn: async (data: z.infer<typeof branchSchema>) => {
      const res = await api.patch(`/branches/${selectedBranch.id}`, {
        name: data.name,
        code: data.code,
        regionalOfficeId: parseInt(data.regionalOfficeId),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch updated successfully");
      setShowBranchEdit(false);
      setSelectedBranch(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update Branch");
    }
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/branches/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch deleted successfully");
      setShowBranchDelete(false);
      setSelectedBranch(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete Branch");
    }
  });

  const onSubmitRo = (data: z.infer<typeof roSchema>) => {
    if (showRoEdit) updateRoMutation.mutate(data);
    else createRoMutation.mutate(data);
  };
  const onSubmitBranch = (data: z.infer<typeof branchSchema>) => {
    if (showBranchEdit) updateBranchMutation.mutate(data);
    else createBranchMutation.mutate(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="px-8 py-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Branch Mapping</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowRoCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Regional Office
          </Button>
          <Button onClick={() => setShowBranchCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Branch
          </Button>
        </div>
      </div>

      {(loadingRos || loadingBranches) ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ros.map((regionalOffice: any) => {
            const roBranches = branches.filter((b: any) => b.regionalOffice?.id === regionalOffice.id || b.regionalOfficeId === regionalOffice.id);
            return (
              <div key={regionalOffice.id} className="rounded-lg bg-card shadow-card p-6 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium">{regionalOffice.name}</h2>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{regionalOffice.code}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => { setSelectedRo(regionalOffice); setShowRoEdit(true); }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => { setSelectedRo(regionalOffice); setShowRoDelete(true); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{roBranches.length} branches mapped</p>
                <div className="space-y-2">
                  {roBranches.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No branches</p>
                  ) : (
                    roBranches.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{b.name}</span>
                          <span className="text-xs font-mono text-muted-foreground">{b.code}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-30 hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => { setSelectedBranch(b); setShowBranchEdit(true); }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={() => { setSelectedBranch(b); setShowBranchDelete(true); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
          {ros.length === 0 && (
            <div className="col-span-1 lg:col-span-2 text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              No Regional Offices found. Create one to get started.
            </div>
          )}
        </div>
      )}

      {/* Regional Office Create Dialog */}
      <Dialog open={showRoCreate || showRoEdit} onOpenChange={(open) => {
        if (!open) {
          setShowRoCreate(false);
          setShowRoEdit(false);
          setSelectedRo(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{showRoEdit ? "Edit Regional Office" : "Create Regional Office"}</DialogTitle>
          </DialogHeader>
          <Form {...roForm}>
            <form onSubmit={roForm.handleSubmit(onSubmitRo)} className="space-y-4 py-4">
              <FormField
                control={roForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regional Office Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mumbai Regional Office" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={roForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regional Office Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. RO001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowRoCreate(false);
                  setShowRoEdit(false);
                  setSelectedRo(null);
                }}>Cancel</Button>
                <Button type="submit" disabled={createRoMutation.isPending || updateRoMutation.isPending}>
                  {(createRoMutation.isPending || updateRoMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {showRoEdit ? "Save Changes" : "Create Regional Office"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Branch Create Dialog */}
      <Dialog open={showBranchCreate || showBranchEdit} onOpenChange={(open) => {
        if (!open) {
          setShowBranchCreate(false);
          setShowBranchEdit(false);
          setSelectedBranch(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{showBranchEdit ? "Edit Branch" : "Create Branch"}</DialogTitle>
          </DialogHeader>
          <Form {...branchForm}>
            <form onSubmit={branchForm.handleSubmit(onSubmitBranch)} className="space-y-4 py-4">
              <FormField
                control={branchForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Andheri Branch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={branchForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. BR001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={branchForm.control}
                name="regionalOfficeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regional Office *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Regional Office" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ros.map((r: any) => (
                          <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowBranchCreate(false);
                  setShowBranchEdit(false);
                  setSelectedBranch(null);
                }}>Cancel</Button>
                <Button type="submit" disabled={createBranchMutation.isPending || updateBranchMutation.isPending}>
                  {(createBranchMutation.isPending || updateBranchMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {showBranchEdit ? "Save Changes" : "Create Branch"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Regional Office Confirm Dialog */}
      <Dialog open={showRoDelete} onOpenChange={setShowRoDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Regional Office</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Regional Office "{selectedRo?.name}"? Make sure no users or active tickets are tied to this office. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setShowRoDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRo && deleteRoMutation.mutate(selectedRo.id)}
              disabled={deleteRoMutation.isPending}
            >
              {deleteRoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Regional Office
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Confirm Dialog */}
      <Dialog open={showBranchDelete} onOpenChange={setShowBranchDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete branch "{selectedBranch?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setShowBranchDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedBranch && deleteBranchMutation.mutate(selectedBranch.id)}
              disabled={deleteBranchMutation.isPending}
            >
              {deleteBranchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
