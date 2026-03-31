import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Loader2, Edit, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { DataTablePagination } from "@/components/DataTablePagination";

export enum ProductType {
  IMPS = 'IMPS',
  AEPS = 'AEPS',
  UPI = 'UPI',
  ATM = 'ATM',
  NEFT = 'NEFT',
  RTGS = 'RTGS',
}

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().optional().or(z.literal('')),
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "HEAD_OFFICE", "REGIONAL_OFFICE", "BRANCH"]),
  branchId: z.string().optional(),
  regionalOfficeId: z.string().optional(),
  productType: z.string().optional(),
}).refine(data => {
  if (data.role === "BRANCH" && !data.branchId) return false;
  if (data.role === "REGIONAL_OFFICE" && !data.regionalOfficeId) return false;
  if (data.role === "HEAD_OFFICE" && !data.productType) return false;
  return true;
}, {
  message: "Branch/Regional Office/Product selection is required for this role",
  path: ["role"], // This is a general error, but we can assign it to role
}).refine(data => {
  if (data.password && data.password.length > 0 && data.password.length < 6) return false;
  return true;
}, {
  message: "Password must be at least 6 characters",
  path: ["password"]
});

type UserFormValues = z.infer<typeof userSchema>;

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [openBranch, setOpenBranch] = useState(false);
  const [openRO, setOpenRO] = useState(false);

  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === "ADMIN";

  const { data: userData, isLoading: loadingUsers } = useQuery({
    queryKey: ["users", page, limit, search],
    queryFn: async () => {
      const res = await api.get("/users", {
        params: { page, limit, search: search || undefined }
      });
      return { users: res.data, meta: res.meta };
    },
    enabled: isAdmin,
  });

  const users = userData?.users || [];
  const meta = userData?.meta;

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await api.get("/branches", { params: { limit: 1000 } });
      return res.data;
    },
    enabled: isAdmin,
  });

  const { data: ros = [] } = useQuery({
    queryKey: ["ros"],
    queryFn: async () => {
      const res = await api.get("/regional-offices", { params: { limit: 1000 } });
      return res.data;
    },
    enabled: isAdmin,
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "BRANCH",
      email: "",
      productType: "",
    },
  });

  const roleWatch = form.watch("role");

  useEffect(() => {
    if (selectedUser && showEdit) {
      form.reset({
        username: selectedUser.username,
        email: selectedUser.email || "",
        role: selectedUser.role as any,
        branchId: selectedUser.branch?.id?.toString() || "",
        regionalOfficeId: selectedUser.regionalOffice?.id?.toString() || "",
        productType: selectedUser.productType || "",
        password: "", // don't populate password
      });
    } else if (!showEdit && !showCreate) {
      form.reset({ username: "", password: "", email: "", role: "BRANCH", branchId: "", regionalOfficeId: "", productType: "" });
    }
  }, [selectedUser, showEdit, showCreate, form.reset]);

  const createMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      if (!data.password) throw new Error("Password is required for new users");
      const payload: any = {
        username: data.username,
        password: data.password,
        email: data.email,
        role: data.role,
      };
      if (data.role === "BRANCH" && data.branchId) payload.branchId = parseInt(data.branchId);
      if (data.role === "REGIONAL_OFFICE" && data.regionalOfficeId) payload.regionalOfficeId = parseInt(data.regionalOfficeId);
      if (data.role === "HEAD_OFFICE" && data.productType) payload.productType = data.productType;

      const res = await api.post("/users", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      setShowCreate(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || error.response?.data?.message || "Failed to create user");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const payload: any = {
        username: data.username,
        email: data.email,
        role: data.role,
      };
      if (data.password) payload.password = data.password;
      if (data.role === "BRANCH" && data.branchId) payload.branchId = parseInt(data.branchId);
      if (data.role === "REGIONAL_OFFICE" && data.regionalOfficeId) payload.regionalOfficeId = parseInt(data.regionalOfficeId);
      if (data.role === "HEAD_OFFICE" && data.productType) payload.productType = data.productType;

      const res = await api.patch(`/users/${selectedUser.id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
      setShowEdit(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update user");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/users/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
      setShowDelete(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  });

  const onSubmit = (data: UserFormValues) => {
    if (showEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Server-side filtering is now used, so we don't need 'filtered'

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
    if (user.role === 'BRANCH') return user.branch?.name || getBranchName(user.branchId) || "—";
    if (user.role === 'REGIONAL_OFFICE') return user.regionalOffice?.name || getRoName(user.regionalOfficeId) || "—";
    if (user.role === 'HEAD_OFFICE') return user.menu || "—";
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Branch / RO / Product</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user.id} className="border-b last:border-b-0 transition-colors hover:bg-muted/50">
                    <td className="px-6 py-3 text-sm font-medium">{user.username}</td>
                    <td className="px-6 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase", getRoleColor(user.role))}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground capitalize">{getLocationText(user)}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEdit(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDelete(true);
                          }}
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
          setSelectedUser(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{showEdit ? "Edit User" : "Create User"}</DialogTitle>
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
                    <FormLabel>Password {showEdit ? "(Leave blank to keep current)" : "*"}</FormLabel>
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
                    <FormItem className="flex flex-col">
                      <FormLabel>Assign Branch *</FormLabel>
                      <Popover open={openBranch} onOpenChange={setOpenBranch}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? branches.find(
                                    (b: any) => b.id.toString() === field.value
                                  )?.name
                                : "Select branch..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search branch..." />
                            <CommandList>
                              <CommandEmpty>No branch found.</CommandEmpty>
                              <CommandGroup>
                                {branches.map((b: any) => (
                                  <CommandItem
                                    value={b.name}
                                    key={b.id}
                                    onSelect={() => {
                                      form.setValue("branchId", b.id.toString());
                                      setOpenBranch(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        b.id.toString() === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {b.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {roleWatch === "REGIONAL_OFFICE" && (
                <FormField
                  control={form.control}
                  name="regionalOfficeId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Assign Regional Office *</FormLabel>
                      <Popover open={openRO} onOpenChange={setOpenRO}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? ros.find(
                                    (r: any) => r.id.toString() === field.value
                                  )?.name
                                : "Select regional office..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search regional office..." />
                            <CommandList>
                              <CommandEmpty>No regional office found.</CommandEmpty>
                              <CommandGroup>
                                {ros.map((r: any) => (
                                  <CommandItem
                                    value={r.name}
                                    key={r.id}
                                    onSelect={() => {
                                      form.setValue("regionalOfficeId", r.id.toString());
                                      setOpenRO(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        r.id.toString() === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {r.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {roleWatch === "HEAD_OFFICE" && (
                <FormField
                  control={form.control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Product Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ProductType).map((pt) => (
                            <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowCreate(false);
                  setShowEdit(false);
                  setSelectedUser(null);
                }}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {showEdit ? "Save Changes" : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user "{selectedUser?.username}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDelete(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
