import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, Edit, Trash2, ArrowLeft, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams, useNavigate } from "react-router-dom";

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
import { DataTablePagination } from "@/components/DataTablePagination";

const branchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  regionalOfficeId: z.string().min(1, "Regional Office is required"),
});

export default function AdminBranches() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roIdParam = searchParams.get("roId");
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: ros = [] } = useQuery({
    queryKey: ["ros-all"],
    queryFn: async () => {
      // Fetch all ROs for the dropdown
      const res = await api.get("/regional-offices", { params: { limit: 1000 } });
      return res.data;
    }
  });

  const { data: branchData, isLoading } = useQuery({
    queryKey: ["branches", page, limit, search, roIdParam],
    queryFn: async () => {
      const res = await api.get("/branches", {
        params: { 
          page, 
          limit, 
          search: search || undefined,
          regionalOfficeId: roIdParam || undefined 
        }
      });
      return { branches: res.data, meta: res.meta };
    }
  });

  const branches = branchData?.branches || [];
  const meta = branchData?.meta;

  const selectedRoName = roIdParam ? ros.find((r: any) => r.id.toString() === roIdParam)?.name : null;

  const form = useForm<z.infer<typeof branchSchema>>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: "", code: "", regionalOfficeId: roIdParam || "" },
  });

  useEffect(() => {
    if (showEdit && selectedBranch) {
      form.reset({ 
        name: selectedBranch.name, 
        code: selectedBranch.code, 
        regionalOfficeId: selectedBranch.regionalOffice?.id?.toString() || "" 
      });
    } else if (!showEdit && !showCreate) {
      form.reset({ name: "", code: "", regionalOfficeId: roIdParam || "" });
    }
  }, [selectedBranch, showEdit, showCreate, roIdParam, form.reset]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof branchSchema>) => {
      const res = await api.post("/branches", {
        ...data,
        regionalOfficeId: parseInt(data.regionalOfficeId),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch created successfully");
      setShowCreate(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create Branch");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof branchSchema>) => {
      const res = await api.patch(`/branches/${selectedBranch.id}`, {
        ...data,
        regionalOfficeId: parseInt(data.regionalOfficeId),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch updated successfully");
      setShowEdit(false);
      setSelectedBranch(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update Branch");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/branches/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch deleted successfully");
      setShowDelete(false);
      setSelectedBranch(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete Branch");
    }
  });

  const onSubmit = (data: z.infer<typeof branchSchema>) => {
    if (showEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="px-8 py-6"
    >
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2">
          {roIdParam && (
             <Button variant="ghost" size="icon" onClick={() => navigate("/admin/regional-offices")}>
               <ArrowLeft className="h-4 w-4" />
             </Button>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">
            {selectedRoName ? `Branches - ${selectedRoName}` : "All Branches"}
          </h1>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {roIdParam ? `Showing branches mapped to ${selectedRoName}` : "Manage all bank branches and their mappings"}
          </p>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Branch
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search branches by name or code..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            className="pl-9 h-9" 
          />
        </div>
      </div>

      <div className="rounded-lg bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Branch Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Branch Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Regional Office</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading branches...</p>
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-sm">
                    No branches found.
                  </td>
                </tr>
              ) : (
                branches.map((branch: any) => (
                  <tr key={branch.id} className="border-b last:border-b-0 transition-colors hover:bg-muted/50">
                    <td className="px-6 py-3 text-sm font-medium">{branch.name}</td>
                    <td className="px-6 py-3 text-sm font-mono">{branch.code}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {branch.regionalOffice?.name || "—"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => { setSelectedBranch(branch); setShowEdit(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => { setSelectedBranch(branch); setShowDelete(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

      <Dialog open={showCreate || showEdit} onOpenChange={(open) => {
        if (!open) {
          setShowCreate(false);
          setShowEdit(false);
          setSelectedBranch(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{showEdit ? "Edit Branch" : "Create Branch"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
                name="regionalOfficeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regional Office *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                  setShowCreate(false);
                  setShowEdit(false);
                  setSelectedBranch(null);
                }}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {showEdit ? "Save Changes" : "Create Branch"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete branch "{selectedBranch?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedBranch && deleteMutation.mutate(selectedBranch.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
