import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, Edit, Trash2, Building2, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";

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
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DataTablePagination } from "@/components/DataTablePagination";

const roSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
});

export default function AdminRegionalOffices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedRo, setSelectedRo] = useState<any>(null);

  const { data: roData, isLoading } = useQuery({
    queryKey: ["ros", page, limit, search],
    queryFn: async () => {
      const res = await api.get("/regional-offices", {
        params: { page, limit, search: search || undefined }
      });
      return { ros: res.data, meta: res.meta };
    }
  });

  const ros = roData?.ros || [];
  const meta = roData?.meta;

  const form = useForm<z.infer<typeof roSchema>>({
    resolver: zodResolver(roSchema),
    defaultValues: { name: "", code: "" },
  });

  useEffect(() => {
    if (showEdit && selectedRo) {
      form.reset({ name: selectedRo.name, code: selectedRo.code });
    } else if (!showEdit && !showCreate) {
      form.reset({ name: "", code: "" });
    }
  }, [selectedRo, showEdit, showCreate, form.reset]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roSchema>) => {
      const res = await api.post("/regional-offices", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ros"] });
      toast.success("Regional Office created successfully");
      setShowCreate(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create Regional Office");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roSchema>) => {
      const res = await api.patch(`/regional-offices/${selectedRo.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ros"] });
      toast.success("Regional Office updated successfully");
      setShowEdit(false);
      setSelectedRo(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update Regional Office");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/regional-offices/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ros"] });
      toast.success("Regional Office deleted successfully");
      setShowDelete(false);
      setSelectedRo(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete Regional Office");
    }
  });

  const onSubmit = (data: z.infer<typeof roSchema>) => {
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Regional Offices</h1>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Regional Office
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search regional offices by name or code..." 
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Branches</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading regional offices...</p>
                  </td>
                </tr>
              ) : ros.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-sm">
                    No regional offices found.
                  </td>
                </tr>
              ) : (
                ros.map((ro: any) => (
                  <tr key={ro.id} className="border-b last:border-b-0 transition-colors hover:bg-muted/50">
                    <td className="px-6 py-3 text-sm font-medium">{ro.name}</td>
                    <td className="px-6 py-3 text-sm font-mono">{ro.code}</td>
                    <td className="px-6 py-3 text-sm">
                      <Button
                        variant="link"
                        className="h-auto p-0 gap-1.5"
                        onClick={() => navigate(`/admin/branches?roId=${ro.id}`)}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        {ro.branches?.length || 0} branches mapped
                      </Button>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => { setSelectedRo(ro); setShowEdit(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => { setSelectedRo(ro); setShowDelete(true); }}
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
          setSelectedRo(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{showEdit ? "Edit Regional Office" : "Create Regional Office"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                  setShowCreate(false);
                  setShowEdit(false);
                  setSelectedRo(null);
                }}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {showEdit ? "Save Changes" : "Create Regional Office"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Regional Office</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Regional Office "{selectedRo?.name}"? Make sure no users or active tickets are tied to this office. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRo && deleteMutation.mutate(selectedRo.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Regional Office
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
