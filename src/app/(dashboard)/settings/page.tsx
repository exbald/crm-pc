"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { Plus, Pencil, Trash2, Users, Settings } from "lucide-react";

const roleLabel: Record<string, string> = {
  admin: "Admin",
  project_manager: "Project Manager",
  team_member: "Team Member",
};

const roleVariant: Record<string, "danger" | "info" | "default"> = {
  admin: "danger",
  project_manager: "info",
  team_member: "default",
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Record<string, unknown> | null>(null);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "team_member" as string,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<Array<Record<string, unknown>>>("/api/users"),
  });

  const inviteMutation = useMutation({
    mutationFn: (body: typeof inviteForm) => api.post("/api/users", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowInviteModal(false);
      setInviteForm({ name: "", email: "", password: "", role: "team_member" });
      addToast({ title: "User invited" });
    },
    onError: (err) => addToast({ title: "Error", description: err.message, variant: "danger" }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/api/users/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowEditUserModal(false);
      setEditingUser(null);
      addToast({ title: "User updated" });
    },
    onError: (err) => addToast({ title: "Error", description: err.message, variant: "danger" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowDeleteConfirm(null);
      addToast({ title: "User removed" });
    },
    onError: (err) => addToast({ title: "Error", description: err.message, variant: "danger" }),
  });

  const openEditUser = (user: Record<string, unknown>) => {
    setEditForm({
      name: String(user.name),
      email: String(user.email),
      role: String(user.role),
      password: "",
    });
    setEditingUser(user);
    setShowEditUserModal(true);
  };

  const userList = users || [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Settings className="h-6 w-6 text-neutral-400" />
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="mt-4 max-w-lg rounded-lg border border-neutral-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-neutral-900">Company Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input defaultValue="Ridgeline" />
              </div>
              <div className="space-y-2">
                <Label>Default Timezone</Label>
                <Select defaultValue="America/New_York">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="America/Chicago">America/Chicago</SelectItem>
                    <SelectItem value="America/Denver">America/Denver</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end pt-2">
                <Button size="sm">Save Changes</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="mt-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-neutral-400" />
                <h3 className="text-base font-semibold text-neutral-900">Users</h3>
              </div>
              <Button size="sm" onClick={() => setShowInviteModal(true)}>
                <Plus className="h-4 w-4" />
                Invite User
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-neutral-100 bg-white shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Role</th>
                      <th className="w-24 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {userList.map((user) => (
                      <tr key={String(user.id)} className="border-b border-neutral-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar size="sm">
                              <AvatarFallback name={String(user.name)} />
                            </Avatar>
                            <span className="text-sm font-medium text-neutral-900">{String(user.name)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">{String(user.email)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={roleVariant[String(user.role)] || "default"}>
                            {roleLabel[String(user.role)] || String(user.role)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openEditUser(user)}
                              className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(String(user.id))}
                              className="rounded p-1 text-neutral-400 hover:bg-danger-50 hover:text-danger-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>Add a new user to the system.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              inviteMutation.mutate(inviteForm);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input type="password" value={inviteForm.password} onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })} required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="project_manager">Project Manager</SelectItem>
                  <SelectItem value="team_member">Team Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? "Inviting..." : "Invite User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const body: Record<string, unknown> = { name: editForm.name, email: editForm.email, role: editForm.role };
                if (editForm.password) body.password = editForm.password;
                updateUserMutation.mutate({ id: String(editingUser.id), body });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                    <SelectItem value="team_member">Team Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>New Password (leave blank to keep current)</Label>
                <Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} minLength={8} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowEditUserModal(false)}>Cancel</Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this user? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => showDeleteConfirm && deleteUserMutation.mutate(showDeleteConfirm)}>
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
