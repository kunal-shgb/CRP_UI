import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  roId: z.string().min(1, "Regional Office is required"),
});

export default function AdminBranches() {
  const [showRoCreate, setShowRoCreate] = useState(false);
  const [showBranchCreate, setShowBranchCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: ros = [], isLoading: loadingRos } = useQuery({
    queryKey: ["ros"],
    queryFn: async () => {
      const res = await api.get("/admin/ro");
      return res.data;
    }
  });

  const { data: branches = [], isLoading: loadingBranches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await api.get("/admin/branch");
      return res.data;
    }
  });

  const roForm = useForm<z.infer<typeof roSchema>>({
    resolver: zodResolver(roSchema),
    defaultValues: { name: "", code: "" },
  });

  const branchForm = useForm<z.infer<typeof branchSchema>>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: "", code: "", roId: "" },
  });

  const createRoMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roSchema>) => {
      const res = await api.post("/admin/ro", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ros"] });
      toast.success("Regional Office created successfully");
      setShowRoCreate(false);
      roForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create RO");
    }
  });

  const createBranchMutation = useMutation({
    mutationFn: async (data: z.infer<typeof branchSchema>) => {
      const res = await api.post("/admin/branch", {
        name: data.name,
        code: data.code,
        roId: parseInt(data.roId),
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

  const onSubmitRo = (data: z.infer<typeof roSchema>) => createRoMutation.mutate(data);
  const onSubmitBranch = (data: z.infer<typeof branchSchema>) => createBranchMutation.mutate(data);

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
            <Plus className="h-4 w-4" /> Add RO
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
          {ros.map((ro: any) => {
            const roBranches = branches.filter((b: any) => b.ro?.id === ro.id || b.roId === ro.id);
            return (
              <div key={ro.id} className="rounded-lg bg-card shadow-card p-6 border border-border/50">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-medium">{ro.name}</h2>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{ro.code}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{roBranches.length} branches mapped</p>
                <div className="space-y-2">
                  {roBranches.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No branches</p>
                  ) : (
                    roBranches.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
                        <span className="text-sm font-medium">{b.name}</span>
                        <span className="text-xs font-mono text-muted-foreground">{b.code}</span>
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

      {/* RO Create Dialog */}
      <Dialog open={showRoCreate} onOpenChange={setShowRoCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Regional Office</DialogTitle>
          </DialogHeader>
          <Form {...roForm}>
            <form onSubmit={roForm.handleSubmit(onSubmitRo)} className="space-y-4 py-4">
              <FormField
                control={roForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RO Name *</FormLabel>
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
                    <FormLabel>RO Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. RO001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowRoCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={createRoMutation.isPending}>
                  {createRoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create RO
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Branch Create Dialog */}
      <Dialog open={showBranchCreate} onOpenChange={setShowBranchCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Branch</DialogTitle>
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
                name="roId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regional Office *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select RO" />
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
                <Button type="button" variant="outline" onClick={() => setShowBranchCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={createBranchMutation.isPending}>
                  {createBranchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Branch
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
