import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "HEAD_OFFICE", "REGIONAL_OFFICE", "BRANCH"]),
  branchId: z.string().optional(),
  roId: z.string().optional(),
}).refine(data => {
  if (data.role === "BRANCH" && !data.branchId) return false;
  if (data.role === "REGIONAL_OFFICE" && !data.roId) return false;
  return true;
}, {
  message: "Branch/Regional Office selection is required for this role",
  path: ["role"], // This is a general error, but we can assign it to role
});

type UserFormValues = z.infer<typeof userSchema>;

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/admin/user");
      return res.data;
    }
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await api.get("/admin/branch");
      return res.data;
    }
  });

  const { data: ros = [] } = useQuery({
    queryKey: ["ros"],
    queryFn: async () => {
      const res = await api.get("/admin/regionalOffice");
      return res.data;
    }
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "BRANCH",
    },
  });

  const roleWatch = form.watch("role");

  const createMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const payload: any = {
        username: data.username,
        password: data.password,
        email: data.email,
        role: data.role,
      };
      if (data.role === "BRANCH" && data.branchId) payload.branchId = parseInt(data.branchId);
      if (data.role === "REGIONAL_OFFICE" && data.roId) payload.roId = parseInt(data.roId);

      const res = await api.post("/admin/user", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      setShowCreate(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create user");
    }
  });

  const onSubmit = (data: UserFormValues) => {
    createMutation.mutate(data);
  };

  const filtered = users.filter((u: any) =>
    !search || u.username.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "BRANCH": return "bg-blue-100 text-blue-800";
      case "REGIONAL_OFFICE": return "bg-amber-100 text-amber-800";
      case "HEAD_OFFICE": return "bg-emerald-100 text-emerald-800";
      case "ADMIN": return "bg-purple-100 text-purple-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getBranchName = (id: number) => branches.find((b: any) => b.id === id)?.name || id;
  const getRoName = (id: number) => ros.find((r: any) => r.id === id)?.name || id;

  const getLocationText = (user: any) => {
    if (user.role === 'branch' && user.branchId) return getBranchName(user.branchId);
    if (user.role === 'regionalOffice' && user.roId) return getRoName(user.roId);
    return "—";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="px-8 py-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Create User
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users by username..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      <div className="rounded-lg bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Branch / Regional Office</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((user: any) => (
                  <tr key={user.id} className="border-b last:border-b-0 transition-colors hover:bg-muted/50">
                    <td className="px-6 py-3 text-sm font-medium">{user.username}</td>
                    <td className="px-6 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase", getRoleColor(user.role))}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground capitalize">{getLocationText(user)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. jdoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Min 6 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. jdoe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BRANCH">Branch</SelectItem>
                        <SelectItem value="REGIONAL_OFFICE">Regional Office</SelectItem>
                        <SelectItem value="HEAD_OFFICE">Head Office</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {roleWatch === "BRANCH" && (
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Branch *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.map((b: any) => (
                            <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {roleWatch === "REGIONAL_OFFICE" && (
                <FormField
                  control={form.control}
                  name="roId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Regional Office *</FormLabel>
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
              )}

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
